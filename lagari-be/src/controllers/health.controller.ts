import type { Request, Response } from "express";
import { isEmailConfigured, isSmtpConfigured } from "../config/env";

export async function getHealth(_req: Request, res: Response) {
  res.json({ status: "ok", service: "lagari-be" });
}

/** Safe SMTP readiness check — booleans only, no secrets or addresses. */
export async function getEmailHealth(_req: Request, res: Response) {
  const smtp = isSmtpConfigured();
  const admin = isEmailConfigured();

  res.json({
    smtp,
    admin,
    /** Admin order/status emails can send. */
    adminReady: admin,
    /** Customer transactional emails can send (checkout email still required). */
    customerReady: smtp,
  });
}
