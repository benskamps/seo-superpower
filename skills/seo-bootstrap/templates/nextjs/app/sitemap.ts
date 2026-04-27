// app/sitemap.ts — Next.js 15 App Router metadata file convention.
// Next serializes this to /sitemap.xml automatically. Requires `metadataBase`
// in app/layout.tsx OR an absolute URL in `url` below.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import type { MetadataRoute } from 'next';

// TODO: replace with your canonical URL or read from process.env.NEXT_PUBLIC_SITE_URL
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static, always-indexable routes. Add or remove as your app grows.
  // Do NOT include /api/*, /admin/*, drafts, or auth-gated pages.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Example: append dynamic routes (blog posts, products) here.
  // const posts = await getAllPosts();
  // const dynamicRoutes = posts.map((p) => ({
  //   url: `${SITE}/blog/${p.slug}`,
  //   lastModified: p.updatedAt,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }));
  // return [...staticRoutes, ...dynamicRoutes];

  return staticRoutes;
}

// For sites > 50,000 URLs, split via `generateSitemaps`:
// https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
