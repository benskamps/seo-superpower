# seo-superpower (meta-router)

A [Claude Code](https://claude.com/claude-code) skill that triages a vague SEO request, diagnoses the site's state, and routes to the right child skill plus MCP tools. It's the one that fires on "improve my SEO" and hands off — it diagnoses and routes, it doesn't do the work itself.

## What it does

Runs a diagnostic flow: is a live URL provided? Is GSC connected? Do `robots.txt` and `sitemap.xml` exist? Then a 10-point baseline health check on the homepage. If ≥8/10 pass, the site is past bootstrap and gets routed to growth work; if not, it routes to bootstrap or a technical audit. It asks **at most one** clarifying question.

## When to use

- Vague asks: "improve my SEO", "audit my site", "help my site rank"
- "Traffic is dropping" or "AI isn't citing us" with no specific skill named
- You're not sure which of the 13 child skills you need

Loses ties on purpose: name a specific territory ("striking-distance keywords", "schema markup", "sitemap") and that skill wins instead.

## How it's invoked

Auto-triggers on vague SEO phrasing. Or invoke it directly:

> Improve my SEO: https://example.com

## What you get

A short routing report — **what I found** (site phase, blocking issues, opportunity), **what I'm doing next** (which child skill + MCP, why), **what you'll get** (a PR, a ranked list, a fix) — and then the chosen child skill takes over. The persona is a technical founder who wants PRs and ranked lists, not strategy decks.

## See also

Full skill: [`SKILL.md`](SKILL.md). The full routing table and all 14 skills: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
