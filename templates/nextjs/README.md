# Next.js templates

Used by `skills/seo-bootstrap` Step 3 after `scripts/detect-framework.js` reports
`framework: "nextjs-app"` or `"nextjs-pages"`. Only write the files the audit
flagged missing; never overwrite.

## App Router (default)

| Template | Destination | Notes |
|---|---|---|
| `sitemap.ts` | `app/sitemap.ts` | Zero-config, served at `/sitemap.xml`. |
| `robots.ts` | `app/robots.ts` | Zero-config, served at `/robots.txt`. |
| `opengraph-image.tsx` | `app/opengraph-image.tsx` | Rendered by `next/og` at build time. |
| `layout.metadata.tsx` | merge into `app/layout.tsx` | Carries `metadataBase` + the JSON-LD graph. |

## Pages Router

See `pages-router-notes.md` — the metadata-file convention does not exist there.

## Rules

Every `REPLACE-WITH-*` token must be substituted before commit. If `metadataBase`
is unset, every canonical and OG URL renders relative and Google rejects the sitemap.

Verify: `npm run build && npm run start`, then `curl -sI localhost:3000/sitemap.xml`.
