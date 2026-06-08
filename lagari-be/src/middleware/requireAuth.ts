import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./errorHandler";

interface AccessPayload {
  sub: string;
  type: "access";
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Unauthorized"));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AccessPayload;
    if (payload.type !== "access") {
      next(new AppError(401, "Invalid token type"));
      return;
    }
    req.adminId = payload.sub;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}
