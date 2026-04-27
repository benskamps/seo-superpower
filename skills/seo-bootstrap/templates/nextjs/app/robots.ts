// app/robots.ts — programmatic robots.txt at /robots.txt.
// Default-allow strategy: open by default, deny only sensitive paths.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

export default function robots(): MetadataRoute.Robots {
  // Block everything in non-production environments to avoid leaking
  // staging/preview URLs into Google's index.
  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  if (!isProd) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/static/chunks/'],
      },
      // Optional: explicitly welcome AI crawlers (or block them by setting disallow: '/')
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
