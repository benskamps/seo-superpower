---
name: optimizing-for-generative-engines
description: Use when optimizing content for AI search ("GEO"), getting cited in ChatGPT, Claude, Perplexity, or Gemini, ranking in Google AI Overviews, making a page LLM-citable, defending against AI-citation decay, or running an "AI SEO" pass on existing content. Triggers on phrases like "optimize for AI search", "GEO", "get cited in ChatGPT", "Perplexity ranking", "AI Overview optimization", "make this LLM-citable", "AI SEO". Cross-cuts the content lifecycle — fires per-page on growth content, becomes critical on mature pages for citation defense.
---

# Optimizing for Generative Engines (GEO)

## Overview

Generative Engine Optimization is on-page work for the AI-search era. Same craft as classic SEO — read the page, find the gaps, fix them in place — but the priorities shift: LLMs reward **quotable claims**, **structured answers**, **author credibility**, and **freshness** far more than they reward classic keyword density [1][6][8].

Why now: AI platforms now take **15–20% of informational query volume** away from traditional search [3], non-branded informational traffic is down **15–30%** across content sites [3], and only **11% of websites earn citations from both ChatGPT and Perplexity** [4] — meaning per-platform tuning is real, not cosmetic.

This is the skill that makes a page citable. Pair it with `auditing-technical-seo` (crawler access) and `adding-schema-markup` (structured data) for the full stack.

## The 7 high-impact GEO patterns

Audit the page for each. Gaps are the edit list.

1. **Quotable claims with sources.** LLMs preferentially lift stat-with-citation lines. "X grew 47% YoY according to [source]" beats "X grew significantly" every time [1][6].
2. **Definitive opening sentence.** First sentence must answer the page's implied question — front-loaded answer capsules are extracted directly into AI answers [2][6].
3. **FAQ blocks with literal Q&A.** Question-shaped H2s + concise answers drive disproportionately high citation density on Perplexity and ChatGPT [1][2]. Pair with `FAQPage` schema.
4. **Comparison tables.** LLMs lift comparison tables whole into answers. Structured Top-N / scorecard formats account for **74% of AI citations** in some verticals [2].
5. **Listicles with numbered entries.** Each entry gets cited as an enumerated point. Pair with `ItemList` schema; `Article + ItemList + FAQPage` "triple-stack" is a measured citation booster [2].
6. **Author bios + Organization schema.** Named, credentialed author with linked bio and `Person` schema is table stakes — content from authors with visible credentials receives **40% more citations** [8]. **96% of AI Overview citations** come from sources with strong E-E-A-T signals [8]. **45% of most-cited pages use `Person` schema; 47% use `BreadcrumbList`** [4].
7. **Recency markers.** Explicit "as of [date]" in body copy + recent `dateModified` in schema. Content updated within 12 months earns **3.2× more citations** than content older than 24 months [4]; pages refreshed within the last 3 months get cited ~2× more often [9]. Citations decay fast — fresh-content topics churn citation choices on a ~14-day window.

## Per-platform tuning

Each engine surfaces different sources. Don't optimize for one and assume coverage.

- **ChatGPT** — Wikipedia-heavy (47.9% of top-10 citations) [4]; Reddit-heavy in conversational answers [9]. Implication: encyclopedic, factual phrasing wins; presence on Reddit/Wikipedia matters as much as on-site work. Cites 2–4 sources per answer [4].
- **Perplexity** — Live web search, **4–8 citations per answer**, high link visibility [4]. Rewards real-time freshness, clear claims with citations, Reddit + LinkedIn + G2 presence [9].
- **Claude** — Cites only when web search is active; favors **fewer, higher-authority** references [4]. Rewards structured data, reasoning chains, and identifiable authorship.
- **Gemini / Google AI Overviews** — Google's classic signals still win. Your `Google-Extended` robots policy is load-bearing (covered in `auditing-technical-seo`). Only **38% of AI Overview citations** come from top-10 ranked pages [2] — meaning AI Overviews surface long-tail and structured content classic SEO underrates.

## The optimization flow

1. **Audit the page** for the 7 patterns. Write a gap list (no FAQ, no quotable stats, no recency marker, no author bio, no comparison table, etc.).
2. **Baseline poll** — if `geo-check` MCP is available, run a citation poll across ChatGPT / Claude / Perplexity for the page's target queries **before** edits. Capture the snapshot.
3. **Propose targeted edits** — front-load the answer, add 2–3 stat-with-source lines, add a 4–6 question FAQ block, add a comparison table where applicable, add author byline + bio, add explicit "as of [date]" line.
4. **Update schema** — `dateModified` to today, ensure `Article` + `Person` (author) + `Organization` (publisher) are present; add `FAQPage` and `ItemList` where the content shape supports them. See `adding-schema-markup`.
5. **Ship as a PR** with the diff scoped to the single page.
6. **Re-poll at +14 days** via `geo-check` to measure citation lift. Brands following structured GEO see citation rates climb from near-zero to double-digit % within 60 days [2].

## Common mistakes

- **Keyword-stuffing for AI.** LLMs don't care about keyword density — they care about extractable claims. Synonym variation > repetition.
- **Faking citations.** Made-up "studies" or stats get exposed when readers (and LLMs) cross-reference. Cite real sources or don't make the claim.
- **Blocking AI crawlers in robots.txt by accident.** A site-wide `Disallow: /` against `User-agent: *` blocks ClaudeBot too. Cross-reference `auditing-technical-seo` for the correct stanza.
- **`llms.txt` as a silver bullet.** Adoption is ~10% of domains and citation correlation is unproven; flag as suggestion only, not a fix.
- **Only optimizing your own site.** ChatGPT cites Reddit and Wikipedia disproportionately. If you're never present there, on-page work alone has a citation ceiling.
- **One-and-done.** Citation choices update within days; without recency markers and re-polling, gains decay.

## Quick reference

| If your goal is... | Do this |
|---|---|
| Get cited in **ChatGPT** | FAQ block + Wikipedia/Reddit presence + encyclopedic phrasing |
| Get cited in **Perplexity** | Fresh `dateModified` + clear stat-with-source claims + 4–8 distinct citable points |
| Get cited by **Claude** | Author bio + `Person`/`Organization` schema + reasoning structure |
| Rank in **Google AI Overviews** | `Article + ItemList + FAQPage` triple-stack + recency + E-E-A-T signals |
| Defend a mature page from citation decay | Quarterly recency refresh + re-poll cadence + decay-watch on `geo-check` |

## Lifecycle

Cross-cutting. Fires **per-page** on growth content (3–12 months) once GEO patterns are worth measuring; becomes **critical** on mature content (12+ months) where citation defense replaces traffic growth as the dominant value driver. Pair with `refreshing-stale-content` for the recurring cadence.

## What's next

- **`geo-check` MCP** (when enabled) — citation tracking poller for ChatGPT / Claude / Perplexity. Run before/after every GEO pass.
- **`refreshing-stale-content`** — citation-decay defense on a quarterly cadence.
- **`adding-schema-markup`** — the structured-data layer that the 7 patterns depend on.

Citations and verification tags in [SOURCES.md](SOURCES.md).
