import { ApiError } from "./client";
import { adminApiFetch, adminAuthorizedFetch } from "./admin-client";

export type MediaCapabilities = {
  cloudinaryUpload: boolean;
};

export async function fetchMediaCapabilities(
  accessToken: string,
): Promise<MediaCapabilities> {
  return adminApiFetch<MediaCapabilities>(
    "/admin/media/capabilities",
    { accessToken },
  );
}

export async function uploadProductImage(
  accessToken: string,
  file: File,
): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await adminAuthorizedFetch(
    "/admin/media/upload",
    { method: "POST", body: form },
    accessToken,
  );

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
