import type { MetadataRoute } from "next";
import { projects } from "@/content/content";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, priority: 1 },
    { url: `${BASE}/portfolio`, lastModified: now, priority: 0.8 },
    { url: `${BASE}/resume`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/research`, lastModified: now, priority: 0.7 },
    { url: `${BASE}/chess`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/bother`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/ml`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, priority: 0.7 },
    { url: `${BASE}/terminal`, lastModified: now, priority: 0.4 },
    ...projects
      .filter((p) => p.caseStudy)
      .map((p) => ({
        url: `${BASE}/projects/${p.slug}`,
        lastModified: now,
        priority: 0.6,
      })),
  ];
}
