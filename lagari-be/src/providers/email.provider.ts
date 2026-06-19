import nodemailer from "nodemailer";
import { Resend } from "resend";
import {
  env,
  getEmailProvider,
  isEmailConfigured,
  isResendConfigured,
  isSmtpConfigured,
} from "../config/env";
import { withRetry } from "../utils/retry";
import { logger } from "../utils/logger";

let transporter: nodemailer.Transporter | null = null;
let resendClient: Resend | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: {
        user: env.email.user,
        pass: env.email.appPassword,
      },
    });
  }
  return transporter;
}

function getResend(): Resend | null {
  if (!isResendConfigured()) return null;
  if (!resendClient) {
    resendClient = new Resend(env.resend.apiKey);
  }
  return resendClient;
}

export type EmailVerifyResult =
  | { ok: true; provider: "resend" | "smtp" }
  | { ok: false; provider: "resend" | "smtp" | "none"; code?: string; message: string };

/** Live connection test — Resend API or SMTP handshake. */
export async function verifyEmailTransport(): Promise<EmailVerifyResult> {
  const provider = getEmailProvider();
  if (provider === "none") {
    return { ok: false, provider: "none", message: "No email provider configured" };
  }

  if (provider === "resend") {
    const client = getResend();
    if (!client) {
      return { ok: false, provider: "resend", message: "Resend not configured" };
    }
    try {
      const { error } = await client.domains.list();
      if (error) {
        logger.error({ err: error }, "email.resend_verify_failed");
        return { ok: false, provider: "resend", message: error.message };
      }
      return { ok: true, provider: "resend" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Resend verify failed";
      logger.error({ err }, "email.resend_verify_failed");
      return { ok: false, provider: "resend", message };
    }
  }

  const transport = getTransporter();
  if (!transport) {
    return { ok: false, provider: "smtp", message: "SMTP not configured" };
  }
  try {
    await transport.verify();
    return { ok: true, provider: "smtp" };
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : undefined;
    const message = err instanceof Error ? err.message : "SMTP verify failed";
    logger.error({ err, code }, "email.smtp_verify_failed");
    return { ok: false, provider: "smtp", code, message };
  }
}

async function deliverEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  label: string;
  replyTo?: string;
}): Promise<void> {
  const provider = getEmailProvider();
  const to = input.to.trim();
  if (!to) return;

  if (provider === "resend") {
    const client = getResend();
    if (!client) return;

    const replyTo = input.replyTo?.trim();
    await withRetry(async () => {
      const { error } = await client.emails.send({
        from: env.resend.from,
        to: [to],
        ...(replyTo ? { replyTo } : {}),
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      if (error) {
        throw new Error(error.message);
      }
    }, { label: input.label });
    return;
  }

  if (provider === "smtp") {
    const transport = getTransporter();
    if (!transport) return;

    const replyTo = input.replyTo?.trim();
    await withRetry(
      () =>
        transport.sendMail({
          from: env.email.from,
          to,
          ...(replyTo ? { replyTo } : {}),
          subject: input.subject,
          text: input.text,
          html: input.html,
        }),
      { label: input.label },
    );
  }
}

export async function sendAdminEmail(input: {
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  await deliverEmail({
    to: env.email.adminTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
    label: "email.admin",
  });
  logger.info({ provider: getEmailProvider(), label: "email.admin" }, "Admin email sent");
}

export async function sendCustomerEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!getEmailProvider()) return;

  await deliverEmail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    label: "email.customer",
    replyTo: env.email.replyTo,
  });
  logger.info({ provider: getEmailProvider(), label: "email.customer" }, "Customer email sent");
}
