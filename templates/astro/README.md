# Astro templates

Used by `skills/seo-bootstrap` Step 3 after `scripts/detect-framework.js` reports
`framework: "astro"`. Only write the files the audit flagged missing; never overwrite.

| Template | Destination | Notes |
|---|---|---|
| `astro.config.sitemap.mjs` | merge into existing `astro.config.*` | Needs `npx astro add sitemap`. `site:` is mandatory. |
| `robots.txt` | `public/robots.txt` | Replace the `Sitemap:` origin. |
| `SeoHead.astro` | `src/components/SeoHead.astro` | Render inside `<head>` of `src/layouts/Layout.astro`. |

OG image: Astro has no `ImageResponse` equivalent — generate or hand off a static
1200x630 PNG under 1MB to `public/og.png`.

Every `REPLACE-WITH-*` token must be substituted before commit. `Astro.site` is
populated from `site:` in `astro.config.*`; if that is unset, every canonical and
OG URL renders relative and the bootstrap is worse than useless.

Verify: `npm run build && npm run preview`, then `curl -sI localhost:4321/sitemap-index.xml`.
