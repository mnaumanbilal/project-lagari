import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { AdminUser } from "../db/models";
import { AppError } from "../middleware/errorHandler";

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

function signTokens(adminId: string) {
  const accessToken = jwt.sign(
    { sub: adminId, type: "access" },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires as jwt.SignOptions["expiresIn"] },
  );
  const refreshToken = jwt.sign(
    { sub: adminId, type: "refresh" },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires as jwt.SignOptions["expiresIn"] },
  );
  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await AdminUser.findOne({ where: { email } });
  if (!admin) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new AppError(401, "Invalid credentials");

  res.json(signTokens(admin.id));
}

const refreshSchema = z.object({ refreshToken: z.string() });

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken: token } = refreshSchema.parse(req.body);
  const payload = jwt.verify(token, env.jwt.refreshSecret) as {
    sub: string;
    type: string;
  };
  if (payload.type !== "refresh") throw new AppError(401, "Invalid token");
  res.json(signTokens(payload.sub));
}
