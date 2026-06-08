import type { Request, Response } from "express";

export async function getHealth(_req: Request, res: Response) {
  res.json({ status: "ok", service: "lagari-be" });
}
