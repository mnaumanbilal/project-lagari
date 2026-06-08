/** Delivery URL transforms — upload credentials stay in media.service only. */

export type DeliveryOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "scale";
};

function buildTransform(options: DeliveryOptions): string {
  const parts = ["f_auto", "q_auto"];
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

export function optimizeDeliveryUrl(
  url: string | undefined | null,
  options: DeliveryOptions = {},
): string | undefined {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com")) return url;

  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const prefix = url.slice(0, index + marker.length);
  const suffix = stripExistingTransforms(url.slice(index + marker.length));
  return `${prefix}${buildTransform(options)}/${suffix}`;
}
