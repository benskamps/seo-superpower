# auditing-technical-seo

A [Claude Code](https://claude.com/claude-code) skill that runs a prioritized technical SEO audit and opens a low-risk fix PR. Lifecycle-aware (pre-launch / growth / mature) and built for the 2026 surface — both Google's Core Web Vitals and the new tier of AI-search crawlers.

## What it does

Checks crawlability, indexability, rendering (SSR/SSG vs CSR-only), Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1 at p75), schema validity, AI-search readiness (GPTBot, ClaudeBot, PerplexityBot, Google-Extended), mobile, security, and meta basics — then ranks findings by traffic-impact × fix-effort.

## When to use

- Running a technical audit or debugging Core Web Vitals regressions
- Checking indexability or validating schema and sitemaps
- Diagnosing why a site isn't ranking
- Preparing a site for AI-search visibility

## How it's invoked

Auto-triggers on "audit my site", "Core Web Vitals", "why isn't my site ranking", or "AI-search readiness." Works with `lighthouse-mcp` and `gsc-mcp` when configured, and has a no-OAuth fallback (curl-only) that finishes in under 60 seconds and flags missing data instead of fabricating it.

## What you get

A `SEO_AUDIT.md` at repo root — impact/effort quadrant plus findings tagged `[P0]`/`[P1]` with severity, effort, confidence, and a one-line fix each — and **one** PR carrying only the highest-confidence, low-risk fixes (viewport meta, missing descriptions, `Sitemap:` line, an explicit AI-bot stanza). Architectural calls (CSR → SSR, image pipeline) stay in the doc for human decision.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
