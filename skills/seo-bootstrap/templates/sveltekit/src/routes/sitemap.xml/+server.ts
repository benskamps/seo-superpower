// src/routes/sitemap.xml/+server.ts
// Note: `sitemap.xml` is a *folder* containing +server.ts, not a file.
// SvelteKit serves the response at /sitemap.xml.
// Docs: https://kit.svelte.dev/docs/routing#server

import type { RequestHandler } from './$types';

const SITE = 'https://example.com';

// Static routes. Append dynamic routes (CMS posts, products) by fetching
// inside the handler.
const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about', changefreq: 'monthly', priority: 0.7 },
];

export const GET: RequestHandler = async () => {
  const now = new Date().toISOString();

  // Example dynamic source:
  // const posts = await db.post.findMany({ where: { published: true } });
  // const dynamicRoutes = posts.map(p => ({
  //   path: `/blog/${p.slug}`,
  //   lastmod: p.updatedAt.toISOString(),
  //   changefreq: 'monthly',
  //   priority: 0.6,
  // }));

  const all = [...staticRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      // Cache at the edge for 1 hour, allow stale for a day.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
