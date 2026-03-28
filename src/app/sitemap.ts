import type { MetadataRoute } from "next";
import { getPopularRoutes } from "@/lib/data-loader";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://paraliyol.netlify.app";
  const routes = getPopularRoutes();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/otoyol-ucretleri`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/kopru-ucretleri`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tunel-ucretleri`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/feribot-ucretleri`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/hakkimizda`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/gizlilik-politikasi`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/cerez-politikasi`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  const routePages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}/${route.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...routePages];
}
