import nodemailer from "nodemailer";
import { env, isEmailConfigured, isSmtpConfigured } from "../config/env";
import { withRetry } from "../utils/retry";

let transporter: nodemailer.Transporter | null = null;

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

export async function sendAdminEmail(input: {
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const transport = getTransporter();
  if (!transport) return;

  await withRetry(
    () =>
      transport.sendMail({
        from: env.email.from,
        to: env.email.adminTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    { label: "email.admin" },
  );
}

export async function sendCustomerEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const transport = getTransporter();
  if (!transport) return;

  const to = input.to.trim();
  if (!to) return;

  await withRetry(
    () =>
      transport.sendMail({
        from: env.email.from,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    { label: "email.customer" },
  );
}
