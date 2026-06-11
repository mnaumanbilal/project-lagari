import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isEmailConfigured()) return null;
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
  const transport = getTransporter();
  if (!transport) return;

  await transport.sendMail({
    from: env.email.from,
    to: env.email.adminTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
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

  await transport.sendMail({
    from: env.email.from,
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
