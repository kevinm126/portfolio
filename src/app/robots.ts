import type { MetadataRoute } from "next";

// TODO: replace with your deployed domain
const BASE = "https://your-portfolio.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
