# setting-up-seo-measurement

A [Claude Code](https://claude.com/claude-code) skill that stands up the SEO measurement stack on a new or existing site — so every other skill in this plugin has data to work from.

## What it does

You can't optimize what you don't measure. This skill is the foundation: it verifies Google Search Console (always Domain property, via a DNS TXT record), submits the sitemap, wires GA4 or a privacy-friendly analytics tool (Plausible / Vercel Analytics / Fathom), optionally enables Bing Webmaster Tools and IndexNow, and lays the groundwork for AI-citation (GEO) tracking. It includes per-provider DNS TXT setup (Vercel, Cloudflare, Squarespace) and a `gsc-mcp` ping test to confirm the property is live. Run it once per site.

## When to use

- Bootstrapping SEO measurement on a new or existing site
- Verifying Google Search Console or connecting `gsc-mcp`
- Submitting a sitemap, wiring GA4 or Plausible, or enabling Bing Webmaster Tools
- Laying a baseline for AI-citation (GEO) tracking

Initial phase only — re-run it only on domain changes, migrations, or an analytics platform swap. Every other skill in this plugin assumes GSC is already streaming data.

## How it's invoked

Pairs with `/seo-setup` (credentials). Auto-triggers on "set up Google Search Console", "verify domain", "submit sitemap", "GA4 setup", "measure SEO", "track AI citations", or "connect GSC." Or invoke it directly:

> Set up SEO measurement for example.com.

## What you get

A verified GSC Domain property with the sitemap submitted, analytics wired across both `www` and apex, optional Bing + IndexNow coverage, and a saved baseline list of 20 commercial keywords (`seo/geo-keywords.txt`) for GEO tracking once the `geo-check` MCP ships. The skill also flags the cadence — wait ~7 days before `auditing-technical-seo`, 90+ days before `finding-underserved-keywords`.

## See also

Full skill: [`SKILL.md`](SKILL.md). Where it sits in a site's lifecycle: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
