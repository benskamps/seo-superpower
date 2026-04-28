---
name: analyzing-content-gaps
description: Use when running a competitor SERP diff, asking why a competitor outranks you, building a content brief, or auditing what top-3 ranking pages cover that yours doesn't. Auto-triggers on "content gap analysis", "competitor SERP", "why does X outrank us", "what are competitors covering that we aren't", "content brief", "SERP analysis". Takes a target query + your URL, scrapes top-3 via Firecrawl, diffs entities/H2s/schema/depth/freshness/AIO presence, and ships `CONTENT_BRIEF.md` with gaps ranked by impact. Pairs with `optimizing-on-page` (fills the gaps) and `planning-topic-clusters` (when gaps span sub-topics).
---

# Analyzing Content Gaps

## Overview

The top 3 pages already won the editorial battle for a query — Google watched users vote with dwell, scroll, and pogo-sticks for months and decided those pages best serve the intent. Your job isn't to imagine what the page should cover. It's to **diff what they cover that you don't**, then decide which gaps deserve a response.

**Core principle:** SERP-proven coverage beats imagination. Entities and sub-questions present across all top-3 are table stakes — if they're missing on your page, fix those first.

## Why this matters in 2026

- **AI Overviews appear on 50–60% of US Google searches**, average 157 words, and cite 8–13 sources [3]. AIO citations skew toward pages with deep entity coverage on the specific sub-question — 92% of citations come from top-10 pages, but 2 in 3 come from pages a normal SERP search wouldn't surface [4].
- **Topic Gaps replaced keyword gaps as the unit of analysis** [1]. Modern search treats keywords as surface representations of underlying entities.
- **Featured snippets and AIO citations correlate strongly** — the answer-first patterns that win snippets win citations [3].
- **Skyscraper 1.0 is dead.** "Make it longer" no longer works; the 2026 evolution is better entities, sharper examples, tighter intent — not word count [5].

## When to use

- A competitor consistently outranks you for a query you care about
- You're refreshing a page and need to know what to add
- You need a content brief before writing new
- A page sits at position 5–15 and `finding-underserved-keywords` shows the gap is structural, not striking-distance
- You want to know why your competitor is in the AIO and you aren't

**Don't use for:** brand-new sites with no SERP presence (use `researching-keywords-pre-launch`), pages whose problem is decay (use `refreshing-stale-content`), or queries where SERP intent doesn't match your page type — fix intent first.

## What to compare — the diff axes

| Axis | Extract | Why |
|---|---|---|
| **Entities** | People, products, places, concepts, standards | Modern ranking signal; entities all 3 cover and you don't = priority [1] |
| **H2/H3 structure** | Sub-questions answered | Each H2 is a sub-intent the SERP rewards |
| **Schema** | JSON-LD types (Article, FAQPage, HowTo, Product, Review) | Rich-result + AIO citation surface |
| **Word count + depth** | Median competitor count | Floor: within ±20% of median [5] |
| **Freshness** | `dateModified`, "as of [year]" lines | Pages updated <3 mo cited ~2× more by AI engines [3] |
| **Internal links** | Count + anchor patterns | Reveals topical authority structure |
| **AI Overview presence** | Are competitors cited in AIO? | If yes-them-no-you, gap is citation-shaped, not ranking-shaped |

## The analysis flow

1. **Inputs.** Target query + your URL. Confirm the query has a SERP and your intent matches the live top-3.
2. **Scrape top-3.** Use `firecrawl` MCP — `firecrawl_search` for the SERP, then `firecrawl_scrape` per result with `formats: ["markdown", "links"]` and `onlyMainContent: true`. Skip ads/sponsored/aggregators unless they *are* the intent. Firecrawl respects robots.txt by default [2].
3. **Extract entities** per page. Two options:
   - **Higher accuracy:** Google Cloud NLP `analyzeEntities` (~$1/1k requests) — named entities with salience scores [7].
   - **Free / good enough:** noun-phrase frequency via spaCy or compromise.js, deduped by lowercased lemma. Gets ~85% of the signal [7].
4. **Extract structure** — H2/H3 tree, schema types, word count, `dateModified`, internal-link count.
5. **Build the diff matrix.** For each axis, list each competitor vs. you. Highlight: entities all 3 have but you don't, H2s 2+ share, schema overlap, depth/freshness deltas.
6. **Rank gaps:**
   - **Tier 1:** Entity or H2 in all 3 competitors, absent on your page.
   - **Tier 2:** Schema gaps with rich-result or AIO upside.
   - **Tier 3:** Depth/freshness — your page <80% of median word count, or `dateModified` >9 months stale.
   - **Tier 4:** Single-competitor entities — usually noise, unless that competitor is the AIO-cited one.
7. **Output `CONTENT_BRIEF.md`** with: query, your URL, top-3 URLs, diff matrix, ranked gaps, expand-vs-write-new call.

## Expand vs. write new — decision tree

- Gaps are **entity-level within existing scope** → **expand** the page. Hand off to `optimizing-on-page`.
- Gaps span **2 or fewer sub-topics** that fit the page's intent → **expand** with new H2 sections.
- Gaps span **3+ sub-topics or shift intent** (informational ↔ transactional) → **write new spokes**. Hand off to `planning-topic-clusters`.
- Gaps are **schema-only** → hand off to `adding-schema-markup`.

## Concrete example: vibecrafting.ai for "capsule wardrobe formula"

Top-3 are NYT, Vogue, a Substack. Diff reveals:

- All 3 cover entities `seasonal palette`, `core 4 silhouettes`, `70/20/10 ratio` — your page mentions zero. **Tier 1.**
- 2 of 3 have an H2 "How many pieces should a capsule wardrobe have?" — yours doesn't. **Tier 1.**
- All 3 have FAQPage schema; you have only Article. **Tier 2.**
- Median word count 2,400; yours is 1,100. Depth gap, but only act *after* Tier 1 — adding words without adding entities is the skyscraper trap [5].
- NYT is cited in the AIO with a 45-word answer under a question-phrased H2; your page buries the answer in paragraph 4.

Recommendation: **expand** (one page worth of edits, not a new spoke). Hand off to `optimizing-on-page` with this brief.

## Common mistakes

- **Copying competitors verbatim** — Google flags near-duplicate phrasing; AI systems deprioritize derivative content. Cover the same entities, write your own sentences.
- **Ignoring intent** — a transactional competitor in a mostly-informational SERP is noise.
- **Gap-stuffing** — covering everything makes the page worse. Stop at Tier 1 + Tier 2.
- **Forgetting your differentiator** — your unique angle is the spine; gap entities weave around it.
- **Diffing text only** — schema and freshness gaps are invisible to a markdown diff but often the highest-leverage fix.
- **Running this on a page with no SERP yet** — use `researching-keywords-pre-launch` instead.

## Quick reference — gap type → response

| Gap | Response |
|---|---|
| Entity | Mention naturally in body / H3 |
| H2 | Add the section with a 40–50 word direct answer for AIO eligibility [3] |
| Schema | Hand off to `adding-schema-markup` |
| Depth (after Tier 1) | Expand existing sections with examples, not filler |
| Freshness | Update `dateModified`, refresh stat citations, add "as of [year]" |
| AIO presence | Front-load a question-phrased H2 with a definition-format answer [3] |
| Multi-subtopic | New spoke — `planning-topic-clusters` |

## Lifecycle awareness

Growth-phase skill (3–12 mo). Skip pre-launch (no SERP signal yet — use `researching-keywords-pre-launch`). For mature pages, pair with `refreshing-stale-content` — the gap may be freshness, not coverage.

## What next

- **Tier 1 gaps to fill →** `optimizing-on-page` with the brief in hand.
- **Multi-subtopic gaps →** `planning-topic-clusters`.
- **Schema-only →** `adding-schema-markup`.
- **AIO citation specifically →** `optimizing-for-generative-engines` after the page is structurally sound.

Citations and verification tags in [SOURCES.md](SOURCES.md).
