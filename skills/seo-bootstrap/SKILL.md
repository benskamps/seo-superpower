---
name: seo-bootstrap
description: Use on day 1 of a project to ship sitemap, robots.txt, OG image, and JSON-LD schema in a single PR. Auto-detects Next.js, Astro, or SvelteKit, audits what's already there, and only generates what's missing. Triggers on "set up SEO", "SEO bootstrap", "configure SEO", "add sitemap", "add robots.txt", "make my site SEO-ready", or "I just shipped a site, help me with SEO."
---

# SEO Bootstrap

## Overview

Most solo founders ship a marketing site without a sitemap, without `robots.txt`, with no Open Graph image, and zero structured data. Google can crawl the site but doesn't know what it is. AI search engines (ChatGPT, Perplexity, Google AI Overviews) skip it entirely because there's nothing structured to cite [1][2].

This skill ships the four files that move a site from "invisible" to "indexable" in **one commit**: `sitemap.xml`, `robots.txt`, a default 1200×630 OG image, and `Organization` + `WebSite` JSON-LD in the root layout.

**Activation moment:** "It opened a PR that fixed sitemap, robots, and schema in one commit."

## When to Use

- New site just deployed, never had SEO touched
- Lighthouse SEO score < 100 with "Document doesn't have a meta description" or "no robots.txt"
- Site shows up in `site:domain.com` but no rich result, no favicon in SERP, no OG card on Twitter/iMessage
- Builder said "I just shipped, what's the bare minimum?"

**Don't use for:** sites that already have all four pieces (run `auditing-technical-seo` instead), or staging environments that should stay `noindex`.

---

## Step 1 — Detect framework

Read `package.json` and check folder structure:

| Signal | Framework |
|---|---|
| `"next"` in deps + `app/` folder | **Next.js App Router** (default 2026 path) |
| `"next"` in deps + `pages/` folder only | **Next.js Pages Router** |
| `"astro"` in deps | **Astro** |
| `"@sveltejs/kit"` in deps | **SvelteKit** |
| `"react-router-dom"` only | Vite + RR — fall back to static `public/` files |

Also note: `"site"` field in `astro.config.*`, `kit.paths` in `svelte.config.js`, `metadataBase` in `next.config.*`. You need the canonical site URL for every template — if missing, **ask the user once** before generating.

## Step 2 — Audit current state

Check for each of these. Report present vs missing as a table before writing anything:

| Asset | Next.js (App) | Astro | SvelteKit |
|---|---|---|---|
| Sitemap | `app/sitemap.ts` or `app/sitemap.xml` | `@astrojs/sitemap` in config or `src/pages/sitemap.xml.ts` | `src/routes/sitemap.xml/+server.ts` |
| Robots | `app/robots.ts` or `public/robots.txt` | `public/robots.txt` | `static/robots.txt` |
| OG image | `app/opengraph-image.{tsx,png}` | `public/og.png` | `static/og.png` |
| JSON-LD | `<script type="application/ld+json">` in root layout | same in `Layout.astro` | same in `+layout.svelte` |
| `<title>` + meta description | `metadata` export or `<Head>` | frontmatter or layout | `<svelte:head>` |

Also confirm `metadataBase` (Next), `site` (Astro), or canonical URL (SvelteKit) is set. Without it, sitemap URLs will be relative and Google will reject the file.

## Step 3 — Generate missing pieces

Use the framework templates in `templates/{nextjs,astro,sveltekit}/`. Rules:

- Only write files the audit flagged missing. Never overwrite.
- Wire imports: for Next, the metadata files are zero-config. For Astro, add `@astrojs/sitemap` to `astro.config.*` and run `npm install`. For SvelteKit, the `+server.ts` is auto-routed.
- JSON-LD goes in the root layout, **not per-page** at this stage. Per-page `Article`/`Product` schema is the next skill's job.
- Ship as one commit: `feat(seo): bootstrap sitemap, robots, OG, and JSON-LD`. Then open one PR.

## Step 4 — Verify

After deploy (or `npm run build && npm run preview`):

```bash
curl -sI https://site.com/sitemap.xml | head -1   # expect 200
curl -s  https://site.com/robots.txt              # expect Sitemap: line
curl -sI https://site.com/og.png                  # expect 200, < 1MB
```

Then:
- Paste any page URL into Google's Rich Results Test [3] — confirm `Organization` + `WebSite` parse with zero errors.
- Run Lighthouse → SEO category → expect 100.
- Drop the URL into iMessage or Slack to eyeball the OG card.

## Common Mistakes

- **Sitemap includes private routes** (`/admin`, `/api`, draft slugs). Filter explicitly in the generator.
- **`robots.txt` blocks `/_next/` or `/assets/`** — breaks rendering for Googlebot. Default-allow, only disallow `/api/` and `/admin/`.
- **OG image > 1MB or wrong dimensions.** Google and Twitter both want 1200×630, < 1MB, JPG or PNG. The `next/og` `ImageResponse` template stays well under.
- **`@type: "Website"` (capital W) instead of `"WebSite"`.** schema.org is case-sensitive. Validators silently drop the wrong one.
- **Leaving `noindex` from a staging template.** Search the codebase for `noindex` after generation.
- **Forgetting `metadataBase` / `site`.** Sitemap URLs will be `/about` instead of `https://site.com/about` — Google rejects.

## Quick Reference

| File | What it does | Why for Google | Why for AI search (GEO) |
|---|---|---|---|
| `sitemap.xml` | Lists every indexable URL + lastmod | Faster, more complete crawl | LLM crawlers (GPTBot, PerplexityBot) use it the same way |
| `robots.txt` | Crawler rules + sitemap pointer | Avoid wasted crawl budget on `/api/` | Tells AI crawlers where the sitemap lives |
| OG image | Social card preview | Indirect (CTR signal from social) | LLMs surface the image in answers when present |
| JSON-LD `Organization` + `WebSite` | Knowledge-graph entity, sitelinks search box | Eligible for rich results | LLMs cite structured entities ~2× more than unstructured text |

## What next

After bootstrap merges:
1. **`auditing-technical-seo`** — deeper checks: canonical tags, hreflang, internal linking, Core Web Vitals.
2. **`setting-up-seo-measurement`** — verify Google Search Console, submit the sitemap, wire up GA4/Plausible.
3. **`finding-underserved-keywords`** — the growth-phase loop, after ~90 days of GSC data.

## Sources

- [Next.js sitemap metadata file](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js robots metadata file](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js opengraph-image metadata file](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [@astrojs/sitemap docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [SvelteKit routing — +server endpoints](https://kit.svelte.dev/docs/routing#server)
- [Google Search Central — Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
