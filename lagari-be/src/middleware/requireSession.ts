import { NextFunction, Request, Response } from "express";
import { touchSession } from "../services/session.service";
import { AppError } from "./errorHandler";

export async function requireSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = req.header("x-session-id");
  if (!sessionId) {
    next(new AppError(400, "X-Session-Id header required"));
    return;
  }

  const active = await touchSession(sessionId);
  if (!active) {
    next(new AppError(401, "Session expired or invalid"));
    return;
  }

  req.sessionId = sessionId;
  next();
}

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      adminId?: string;
    }
  }
}
