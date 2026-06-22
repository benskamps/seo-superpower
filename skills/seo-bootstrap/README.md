# seo-bootstrap

A [Claude Code](https://claude.com/claude-code) skill that takes a freshly shipped site from "invisible" to "indexable" in a single commit. It auto-detects Next.js, Astro, or SvelteKit, audits what's already there, and only generates the pieces that are missing.

## What it does

When you've just deployed a marketing site and Google can crawl it but doesn't know what it is, this skill ships the four files that fix that: `sitemap.xml`, `robots.txt`, a default 1200×630 Open Graph image, and `Organization` + `WebSite` JSON-LD in the root layout.

## When to use

- A new site just deployed and SEO has never been touched
- Lighthouse SEO < 100 with "no robots.txt" or "no meta description"
- `site:domain.com` returns pages but no rich result, no OG card on Twitter/iMessage
- "I just shipped — what's the bare minimum?"

Don't use it on a site that already has all four pieces (run [`auditing-technical-seo`](../auditing-technical-seo/SKILL.md) instead), or on a staging environment that should stay `noindex`.

## How it's invoked

Auto-triggers on phrases like "set up SEO", "add sitemap", "add robots.txt", or "I just shipped a site." Or invoke it directly:

> Set up SEO for this site — sitemap, robots, OG, schema.

## What you get

One PR titled `feat(seo): bootstrap sitemap, robots, OG, and JSON-LD` — only the missing files, never overwriting yours, with framework-correct wiring (e.g. `@astrojs/sitemap` added to config, or Next.js zero-config metadata files). Verified with `curl -sI /sitemap.xml` (expect 200), a `Sitemap:` line in `robots.txt`, and a clean Google Rich Results Test.

## See also

Full skill: [`SKILL.md`](SKILL.md). Where it sits in a site's lifecycle: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
