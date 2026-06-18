import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productRoutes = slugs.map((slug) => ({
      url: `${base}/product/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* catalog unavailable during build */
  }

  return [...staticRoutes, ...productRoutes];
}
