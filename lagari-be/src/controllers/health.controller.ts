import type { Request, Response } from "express";
import {
  getEmailProvider,
  isEmailConfigured,
  isEmailDeliveryConfigured,
  isResendConfigured,
  isSmtpConfigured,
} from "../config/env";
import { verifyEmailTransport } from "../providers/email.provider";

export async function getHealth(_req: Request, res: Response) {
  res.json({ status: "ok", service: "lagari-be" });
}

/** Safe email readiness — booleans only, no secrets or addresses. */
export async function getEmailHealth(req: Request, res: Response) {
  const provider = getEmailProvider();
  const runVerify =
    req.query.verify === "1" ||
    req.query.verify === "true" ||
    req.query.verify === "yes";

  const body: Record<string, unknown> = {
    provider,
    resend: isResendConfigured(),
    smtp: isSmtpConfigured(),
    deliveryReady: isEmailDeliveryConfigured(),
    adminReady: isEmailConfigured(),
    customerReady: isEmailDeliveryConfigured(),
  };

  if (provider === "smtp") {
    body.note =
      "SMTP may fail on Render free tier (ports 25/465/587 blocked). Set RESEND_API_KEY for production.";
  }

  if (runVerify) {
    const result = await verifyEmailTransport();
    body.verify = result.ok ? "ok" : "failed";
    body.verifyProvider = result.provider;
    if (!result.ok) {
      if (result.code) body.verifyCode = result.code;
      body.verifyMessage = result.message;
    }
  } else {
    body.hint =
      "Add ?verify=1 to test the live email connection (Resend API or SMTP).";
  }

  res.json(body);
}
