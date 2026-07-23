// templates/nextjs/sitemap.ts -> copy to app/sitemap.ts  (App Router)
//
// Zero-config: Next serves this at /sitemap.xml. Absolute URLs are required,
// so `metadataBase` must be set in app/layout.tsx (see layout.metadata.tsx).

import type { MetadataRoute } from "next";

const SITE = "https://REPLACE-WITH-CANONICAL-ORIGIN";

export default function sitemap(): MetadataRoute.Sitemap {
  // Replace with the real route source. Never emit /admin, /api or drafts.
  const staticRoutes = ["", "/about", "/pricing"];

  return staticRoutes.map((route) => ({
    url: `${SITE}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
