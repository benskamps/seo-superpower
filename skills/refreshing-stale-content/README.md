# refreshing-stale-content

A [Claude Code](https://claude.com/claude-code) skill for the mature-phase decay defense: it detects content decay in Google Search Console and opens a single, focused refresh PR per affected page. Core principle — preserve the URL, change the substance.

## What it does

Refreshing live content returns 3–5× more than writing from scratch — you keep the URL, the backlinks, the index history, and the brand trust. This skill pairs with `gsc-mcp` to spot decay, then refreshes the intro hook, stale stats and dates, adds an H2/FAQ for the biggest competitive gap, bumps `dateModified`, and fixes internal links.

## When to use

A page is a refresh candidate when **any** signal fires:

- GSC impressions down >20% YoY, sustained 4–8 weeks
- Position drifting 3+ spots on stable queries
- CTR rotting ≥25% while position holds (title/snippet aging)
- LLM citations dropping, or a "best [X] [old-year]" QDF mismatch

Mature-phase only — the page needs >6 months of GSC data. For newer pages, use [`finding-underserved-keywords`](../finding-underserved-keywords/SKILL.md).

## How it's invoked

Auto-triggers on "traffic is dropping", "content decay", "refresh old post", or "impressions down on /blog/X." Or invoke it directly on a slug.

## What you get

One PR per page, titled `refresh: <slug> (YoY −X% impressions)`: refreshed copy, current stat-with-source lines, a new FAQ/H2 covering the top SERP gap, an ISO-8601 `dateModified` bump (only on substantive change), pruned/added internal links — plus an IndexNow ping after merge so Bing, Yandex, and friends recrawl within minutes.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
