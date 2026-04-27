# finding-underserved-keywords

A [Claude Code](https://claude.com/claude-code) skill for finding "striking distance" SEO keywords — queries your page already gets impressions for but doesn't actually mention — and weaving them into existing content. Covers the full content lifecycle (initial → growth → mature) and integrates Generative Engine Optimization (GEO) for AI-search visibility.

Distilled from a thread by [@seo_wins](https://x.com/seo_wins) on X, then research-enriched with industry data on striking-distance methodology, content decay, AI Overview impact, and GEO citation tactics. Every claim is cited and verification-tagged in [SOURCES.md](SOURCES.md).

## What it does

When you (or Claude) start working on SEO optimization, content refreshes, or asking why a page gets impressions but no clicks, this skill auto-loads and walks Claude through:

1. Identifying which **lifecycle phase** the page is in (initial / growth / mature) — different phases need different work.
2. Pulling per-page query data from Google Search Console.
3. Analyzing a CSV export for **underserved keywords** — queries the page ranks for but doesn't mention.
4. Integrating those keywords naturally into existing content (no stuffing).
5. Setting up a **decay watch** and **refresh cadence** appropriate to the content type.
6. Adding **GEO signals** (FAQ blocks, stat-with-source lines, citation-friendly structure) so the page also gets cited by ChatGPT, Perplexity, and Claude.

## Install

Drop it into your personal skills directory:

```bash
# Claude Code (Mac/Linux)
git clone https://github.com/benskamps/finding-underserved-keywords \
  ~/.claude/skills/finding-underserved-keywords

# Claude Code (Windows, Git Bash)
git clone https://github.com/benskamps/finding-underserved-keywords \
  ~/.claude/skills/finding-underserved-keywords
```

Restart Claude Code (or start a new conversation). The skill will auto-trigger on relevant SEO tasks.

To trigger it manually, ask Claude something like:

> Analyze why this page is getting impressions but no clicks: <URL>

Or hand it a GSC CSV export and ask for an underserved-keyword analysis.

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | The skill itself — auto-loaded by Claude Code |
| `SOURCES.md` | Enrichment knowledge base with all citations + verification tags |
| `README.md` | This file |
| `LICENSE` | MIT |

## Why the lifecycle framing

Most SEO advice on the internet — including the Twitter thread this is built on — assumes a single workflow. But a page 4 weeks old has no GSC data to work with, and a page 18 months old is fighting decay, not just missing keywords. The same playbook doesn't fit. This skill makes the phase explicit so Claude picks the right move.

## Acknowledgements

- Original 7-step workflow: [@seo_wins](https://x.com/seo_wins)
- Striking-distance methodology: [Clearscope](https://www.clearscope.io/blog/what-are-striking-distance-keywords), [SEOTesting](https://seotesting.com/blog/striking-distance-keywords/)
- Content decay & refresh research: [ALM Corp](https://almcorp.com/blog/content-decay/), Semrush 2025
- AI Overview CTR data: [GrowthSRC 200K-keyword study](https://growthsrc.com/google-organic-ctr-study/), [Dataslayer](https://www.dataslayer.ai/blog/google-ai-overviews-the-end-of-traditional-ctr-and-how-to-adapt-in-2025)
- GEO tactics: [LLMrefs](https://llmrefs.com/generative-engine-optimization), [AI Magicx](https://www.aimagicx.com/blog/generative-engine-optimization-chatgpt-perplexity-2026)

Full source list with authority tiers and verification tags: [SOURCES.md](SOURCES.md).

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, improve it.
