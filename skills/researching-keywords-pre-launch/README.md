# researching-keywords-pre-launch

A [Claude Code](https://claude.com/claude-code) skill for cold-start keyword research — finding what to write about for a brand-new site that has no Google Search Console history yet.

## What it does

Before a site has 90+ days of GSC data, the striking-distance loop in `finding-underserved-keywords` has no impressions to listen to. This skill listens to public demand signals instead, mining five free sources — Google autocomplete (a–z) + People Also Ask + related searches, Google Trends rising breakouts, Reddit/HN/Indie Hackers complaints with weak top answers, competitor SERP overlap (positions 8–30), and conversational LLM query patterns — then clusters candidates by intent (informational / commercial / transactional / navigational) and ranks them by attainability × intent-fit. No paid Ahrefs/Semrush seat needed.

## When to use

- Pre-launch or just-launched site (no GSC verification, or <90 days of data)
- Considering a new content vertical with no historical signal
- "What should the first 10 posts be?"

Don't use it on sites with 90+ days of GSC data — hand off to `finding-underserved-keywords`, which is always the better source once it has signal.

## How it's invoked

Auto-triggers on "what should I write about", "keyword research from scratch", "no GSC data yet", "cold start SEO", "what keywords should I target", or "pre-launch keyword research." Or invoke it directly:

> Do pre-launch keyword research for vibecrafting.ai.

## What you get

A clustered `KEYWORD_MAP.md` — 30–100 candidates grouped by cluster and intent, each cluster annotated with the signal that surfaced it, and the low-volume/high-intent "first targets" called out. Every keyword in the map is validated by at least two of the five signals.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
