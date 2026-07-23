// templates/nextjs/robots.ts -> copy to app/robots.ts  (App Router)
//
// Served at /robots.txt. Default-allow: disallowing /_next/ breaks rendering
// for Googlebot, which is one of the most common self-inflicted SEO wounds.

import type { MetadataRoute } from "next";

const SITE = "https://REPLACE-WITH-CANONICAL-ORIGIN";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
