/** Cloudinary delivery transforms — cloud name is public; never put API secrets on the FE. */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? "";

export type CloudinaryTransformOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "scale";
  quality?: "auto";
  format?: "auto";
};

function buildTransformString(options: CloudinaryTransformOptions): string {
  const parts: string[] = [];
  if (options.format !== undefined) parts.push("f_auto");
  else parts.push("f_auto");
  if (options.quality !== undefined) parts.push("q_auto");
  else parts.push("q_auto");
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  return parts.join(",");
}

function stripExistingTransforms(pathAfterUpload: string): string {
  const segments = pathAfterUpload.split("/");
  while (segments.length > 0) {
    const head = segments[0] ?? "";
    if (/^v\d+$/.test(head)) {
      segments.shift();
      continue;
    }
    if (head.includes(",") || /^[a-z]{1,2}_/.test(head)) {
      segments.shift();
      continue;
    }
    break;
  }
  return segments.join("/");
}

/**
 * Apply f_auto,q_auto (+ optional size) to Cloudinary URLs.
 * Remote URLs can be proxied through Cloudinary fetch when cloud name is configured.
 */
export function cloudinaryImageUrl(
  src: string | undefined | null,
  options: CloudinaryTransformOptions = {},
): string {
  if (!src) return "";

  const transform = buildTransformString(options);

  if (src.includes("res.cloudinary.com")) {
    const marker = "/upload/";
    const index = src.indexOf(marker);
    if (index === -1) return src;
    const prefix = src.slice(0, index + marker.length);
    const suffix = stripExistingTransforms(src.slice(index + marker.length));
    return `${prefix}${transform}/${suffix}`;
  }

  if (
    CLOUD_NAME &&
    (src.startsWith("https://") || src.startsWith("http://"))
  ) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${encodeURIComponent(src)}`;
  }

  return src;
}

/** Presets for common storefront surfaces */
export const cloudinaryPresets = {
  productCard: (src: string | undefined | null) =>
    cloudinaryImageUrl(src, { width: 640, crop: "fill" }),
  productGalleryMain: (src: string | undefined | null) =>
    cloudinaryImageUrl(src, { width: 1200, crop: "limit" }),
  productGalleryThumb: (src: string | undefined | null) =>
    cloudinaryImageUrl(src, { width: 144, height: 160, crop: "fill" }),
  ogShare: (src: string | undefined | null) =>
    cloudinaryImageUrl(src, { width: 1200, height: 630, crop: "fill" }),
  heroBanner: (src: string | undefined | null) =>
    cloudinaryImageUrl(src, { width: 1920, crop: "limit" }),
};
