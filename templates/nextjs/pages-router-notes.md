# Next.js Pages Router — deltas

`scripts/detect-framework.js` reports `framework: "nextjs-pages"` when `next` is a
dependency and only `pages/` exists. The App Router metadata-file convention
(`app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`) does **not** apply
there — those files are inert under the Pages Router.

| Asset | Pages Router path | How |
|---|---|---|
| Sitemap | `pages/sitemap.xml.ts` | `getServerSideProps` writes XML to `res` and returns `{ props: {} }`. |
| Robots | `public/robots.txt` | Static file. Copy `templates/astro/robots.txt` and fix the origin. |
| OG image | `public/og.png` | No `ImageResponse` on this route type — ship a static 1200x630 PNG. |
| Meta + JSON-LD | `pages/_app.tsx` or `pages/_document.tsx` | `next/head` `<Head>`; JSON-LD as a `<script type="application/ld+json">`. |

Sitemap sketch:

```ts
// pages/sitemap.xml.ts
import type { GetServerSideProps } from "next";

const SITE = "https://REPLACE-WITH-CANONICAL-ORIGIN";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const routes = ["", "/about"];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE}${r}</loc></url>`).join("\n")}
</urlset>`;
  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
```

If the project is mid-migration (both `app/` and `pages/` present), the detector
reports `nextjs-app` and the App Router templates win — that is the intended
direction of travel, and the App Router files coexist with legacy `pages/` routes.
