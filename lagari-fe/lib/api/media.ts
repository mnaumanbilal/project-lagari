import { API_BASE_URL } from "./config";
import { ApiError } from "./client";

export type MediaCapabilities = {
  cloudinaryUpload: boolean;
};

export async function fetchMediaCapabilities(
  accessToken: string,
): Promise<MediaCapabilities> {
  const res = await fetch(`${API_BASE_URL}/admin/media/capabilities`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.json() as Promise<MediaCapabilities>;
}

export async function uploadProductImage(
  accessToken: string,
  file: File,
): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/admin/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<{ url: string; publicId: string }>;
}
