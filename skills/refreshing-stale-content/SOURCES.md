# Knowledge Base — refreshing-stale-content

Generated: 2026-04-27
Sources: 9 documents cross-referenced (4 reused from `finding-underserved-keywords`, 5 new)
Verification: 8 Supported / 1 Partially Supported

This file is the enrichment artifact for the SKILL.md. Every numbered citation in SKILL.md resolves here. Authority tiers: **A** = primary/standards, **B** = established references, **C** = empirical/applied, **D** = unverified.

## Source Registry

| ID  | Source | Authority | Date | Domain |
|-----|--------|-----------|------|--------|
| [1] | [ALM Corp — Content Decay Guide](https://almcorp.com/blog/content-decay/) | B | 2025–2026 | Half-life, refresh cadence, QDF (reused from finding-underserved-keywords [7]) |
| [2] | [Stackmatix — Content Refresh Strategy](https://www.stackmatix.com/blog/content-refresh-strategy) | C | 2026 | Preserve URL, 3–5× ROI vs. new content |
| [3] | [Ahrefs — What Is Content Decay](https://ahrefs.com/blog/content-decay/) | B | 2025 | 20–30% drop threshold, 4–8 week sustained decline |
| [4] | [Ahrefs — AI Assistants Prefer Fresher Content (17M Citations)](https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/) | B | 2025 | LLM citations 25.7% fresher than Google organic |
| [5] | [Rank-and-Convert — The 13-Week Rule](https://rank-and-convert.ghost.io/the-13-week-rule-how-content-freshness-drives-ai-search-citations/) | C | 2026 | ChatGPT 76.4% / Perplexity 82% citation rates for <30d content |
| [6] | [AI Magicx — GEO: Getting Cited in ChatGPT, Claude, and Perplexity](https://www.aimagicx.com/blog/generative-engine-optimization-chatgpt-perplexity-2026) | C | 2026 | FAQ density, stat-with-source preference (reused from finding-underserved-keywords [10]) |
| [7] | [Google Search Central — General Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) | A | 2026 | "Don't deceive or mislead users" — fake-update policy |
| [8] | [Schema Pilot — JSON-LD Complete Guide 2026](https://www.schemapilot.app/blog/json-ld-guide/) | C | 2026 | dateModified ISO 8601 format, "3.2× more AI citations within 30 days" |
| [9] | [IndexNow.org — Official Protocol Site](https://www.indexnow.org/) | A | 2026 | IndexNow protocol, supported engines, 5B+ daily URLs |

## Verified Claims

### Decay detection thresholds
- **>20% YoY impression decline sustained 4–8 weeks = canonical refresh trigger** [3] — **Supported**.
- **Impressions falling faster than clicks is an early-stage decay signal** [3] — **Supported**.
- **Position drift of 3+ spots on previously stable queries** [3] — **Supported** (directional).
- **CTR drop ≥25% with flat position indicates snippet/title rot** [3] — **Supported**.

### Refresh strategy mechanics
- **Refreshing existing content yields 3–5× more return than writing new** [2] — **Supported**.
- **Preserve URL to preserve link equity, index history, brand trust** [2] — **Supported**.
- **Don't delete old content — refresh in place** [2] — **Supported**.
- **Date bumps without material change are detected and discounted** [7][8] — **Supported**.

### dateModified semantics
- **ISO 8601 with timezone offset is the canonical format** [8] — **Supported**.
- **Pages with dateModified within 30 days get 3.2× more AI citations** [8] — **Partially Supported** (single-source claim).
- **dateModified must reflect substantive update, not cosmetic edit** [7] — **Supported**.

### LLM citation freshness
- **AI assistants cite content 25.7% fresher than Google organic** (1,064 days vs 1,432 days, 17M citations analyzed) [4] — **Supported**.
- **ChatGPT: 76.4% of most-cited pages updated within 30 days** [5] — **Supported**.
- **Perplexity: 82% citation rate for content <30 days, drops to 37% past 6 months** [5] — **Supported**.
- **~50% of AI citations come from content <13 weeks old** [5] — **Supported**.
- **FAQ sections and stat-with-source lines drive citation density** [6] — **Supported**.

### IndexNow
- **IndexNow is push-based; pings recrawl within minutes vs. days/weeks of organic discovery** [9] — **Supported**.
- **Supported engines: Bing, Yandex, Naver, Seznam, Yep. Google does NOT consume IndexNow as of 2026** [9] — **Supported**.
- **5B+ URLs submitted daily as of 2026** [9] — **Supported**.

## Contradictions Resolved

**YoY threshold: 20% vs 30%.** Ahrefs uses 20–30% as a band [3]; ALM Corp uses 20% [1]; some sources use 25%. SKILL.md uses **>20% sustained 4–8 weeks** as the primary trigger because it catches earlier and the false-positive cost (one extra refresh) is low.

**Position drift: 2 vs 3 spots.** Sources split. SKILL.md uses **3+ spots** to reduce noise from normal SERP volatility.

## Gaps and Estimates

- **No primary academic study on the "14-day citation decay" claim** — derived from the 13-week rule [5] interpreted at the steepest-drop edge. Treated as directional.
- **The 3.2× AI citation lift for <30-day dateModified** [8] is single-sourced — flagged Partially Supported.

## Methodology Note

Built using the `enrichment` skill: 4 parallel WebSearch queries (decay thresholds, IndexNow, dateModified semantics, LLM citation freshness) plus reuse of relevant sources from the parent `finding-underserved-keywords/SOURCES.md`.

## Changelog

- **2026-04-27**: Initial knowledge base from 9 sources (5 new + 4 reused), 4 parallel research queries.
