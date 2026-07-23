// templates/sveltekit/sitemap.xml.server.ts
//   -> copy to src/routes/sitemap.xml/+server.ts
//
// SvelteKit has no sitemap primitive: the idiomatic path is a +server endpoint
// that returns XML. It is auto-routed, so no config wiring is needed.

import type { RequestHandler } from "./$types";

// Canonical origin. Prefer an env var so preview and prod do not diverge.
const SITE = "https://REPLACE-WITH-CANONICAL-ORIGIN";

// Replace with your real route source (a content collection, a DB query, or
// import.meta.glob over src/routes). Keep /admin, /api and drafts out.
const routes: Array<{ path: string; lastmod?: string }> = [
  { path: "/" },
  { path: "/about" },
];

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: RequestHandler = async () => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url>\n    <loc>${xmlEscape(SITE + r.path)}</loc>` +
      (r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : "") +
      `\n  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "max-age=0, s-maxage=3600",
    },
  });
};
