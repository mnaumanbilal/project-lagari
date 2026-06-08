import type { Request, Response } from "express";
import * as media from "../services/media.service";

export async function getMediaCapabilities(_req: Request, res: Response) {
  res.json(media.getMediaCapabilities());
}

export async function uploadProductImage(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const uploaded = await media.uploadProductImage(file.buffer, file.originalname);
  res.status(201).json(uploaded);
}
