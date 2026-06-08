import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "../config/env";
import { AppError } from "../middleware/errorHandler";

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export function getMediaCapabilities() {
  return { cloudinaryUpload: isCloudinaryConfigured() };
}

export async function uploadProductImage(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      "Cloudinary is not configured. Set CLOUDINARY_* in lagari-be/.env or paste image URLs.",
    );
  }

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        filename_override: filename.replace(/[^\w.-]/g, "_"),
      },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("Upload failed"));
        else resolve(res);
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}
