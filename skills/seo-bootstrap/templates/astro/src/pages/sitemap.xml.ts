// src/pages/sitemap.xml.ts — manual fallback ONLY if you can't install @astrojs/sitemap
// (e.g. you're on a fully static export with custom build flow). Prefer the integration.
// Astro endpoint docs: https://docs.astro.build/en/guides/endpoints/

import type { APIRoute } from 'astro';

const SITE = 'https://example.com';

const routes = [
  { url: '/', lastmod: new Date().toISOString() },
  { url: '/about', lastmod: new Date().toISOString() },
  // Add dynamic content here:
  // ...(await Astro.glob('./blog/*.md')).map(p => ({ url: p.url, lastmod: p.frontmatter.updated }))
];

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE}${r.url}</loc>
    <lastmod>${r.lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
