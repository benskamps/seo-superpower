# optimizing-for-generative-engines

A [Claude Code](https://claude.com/claude-code) skill for Generative Engine Optimization (GEO) — making a page citable in ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews, then defending those citations as they decay.

## What it does

On-page work for the AI-search era. Same craft as classic SEO — read the page, find the gaps, fix them in place — but the priorities shift toward what LLMs reward: quotable claims, structured answers, author credibility, and freshness. The skill audits a page against 7 high-impact patterns (quotable stat-with-source lines, a definitive opening sentence, literal Q&A FAQ blocks, comparison tables, numbered listicles, author bios + `Person`/`Organization` schema, and explicit recency markers), then tunes per platform — ChatGPT leans Wikipedia/Reddit, Perplexity rewards live freshness and 4–8 distinct citable points, Claude favors fewer high-authority sources, and AI Overviews reward the `Article + ItemList + FAQPage` triple-stack.

## When to use

- Getting a page cited in ChatGPT, Claude, Perplexity, or Gemini
- Ranking in Google AI Overviews
- Making existing content LLM-citable, or running an "AI SEO" pass
- Defending a mature page against AI-citation decay

Cross-cutting across the content lifecycle: it fires per-page on growth content (3–12 months) and becomes critical on mature pages (12+ months) where citation defense replaces traffic growth.

## How it's invoked

Auto-triggers on "optimize for AI search", "GEO", "get cited in ChatGPT", "Perplexity ranking", "AI Overview optimization", "make this LLM-citable", or "AI SEO." Or invoke it directly:

> Run a GEO pass on /blog/best-crm-for-agencies.

## What you get

A single-page PR with the targeted edits — front-loaded answer, 2–3 stat-with-source lines, a 4–6 question FAQ block, a comparison table where applicable, an author byline + bio, an explicit "as of [date]" line, and `dateModified` + `Person`/`Organization` schema updates. When the `geo-check` MCP is enabled, it captures a citation baseline across ChatGPT/Claude/Perplexity before the edits and re-polls at +14 days to measure lift.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
