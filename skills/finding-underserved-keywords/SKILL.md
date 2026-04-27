---
name: finding-underserved-keywords
description: Use when optimizing existing pages for SEO, hunting low-hanging keyword opportunities, analyzing pages that get impressions in Google Search Console but few clicks, or planning a content refresh. Covers the full content lifecycle (initial → growth → mature) and integrates with Generative Engine Optimization (GEO) for AI-search visibility. Applies to any site with GSC access.
---

# Finding Underserved Keywords

## Overview

A page gets impressions for queries Google thinks it's relevant to — but if those queries aren't actually mentioned on the page, rankings stall and CTR craters. The canonical SEO term is **striking distance keywords**: queries where the page ranks roughly position 5–15. Close enough to page 1 that small edits move them; far enough away that they're getting almost zero clicks today [1][2].

**Core principle:** Google is already telling you which keywords your page *almost* ranks for. The job is to listen, then weave the gaps into existing content — not to write more pages.

## Why this matters more in 2026 than ever

- **AI Overviews appear on 30%+ of queries**, and queries with AI Overviews carry an **83% zero-click rate** vs. 60% without [3]. Position 1 CTR has dropped roughly 32% since 2024 (28% → 19% on a 200k-keyword study) [4]. Squeezing more from impressions you already have is now table stakes.
- **AI search now handles ~12–18% of English-language informational queries** as of Q1 2026 [5][6]. Pages that don't mention a query won't be cited in ChatGPT or Perplexity either, so the same gap-fill work doubles as GEO.
- **Content half-life has collapsed** from 12–18 months to **3–6 months for competitive topics** [7]. Plateaus arrive faster, decay starts sooner.

## When to Use

- A page is getting impressions but low clicks / average position 5–15
- You're planning a content refresh and need to know what to add
- A piece of content has plateaued and the next move isn't obvious
- Auditing a site for fast on-page wins before commissioning new content
- You want to grow AI-search citations without writing new pages

**Don't use for:** brand-new pages with no GSC history, sites without GSC verification, or when the real problem is a title/snippet (high position + low CTR) rather than a content gap.

---

## The Three Lifecycle Phases

The same page needs different attention depending on age. Pick the phase that matches the content you're working on.

### Phase 1 — Initial (0–3 months post-publication)

**State:** Little or no GSC data. The striking-distance loop doesn't work yet — there are no positions to optimize.

**What to do instead:**
- **Confirm indexing** in GSC (URL Inspection → "URL is on Google").
- **Internal links from authority pages.** Find your highest-authority pages on the site and add contextual links to the new page using descriptive anchor text [1].
- **Pre-seed entity coverage.** Run the page through Google's Natural Language API or a semantic SEO tool to confirm it covers the expected entities (people, products, places, concepts) for its topic [8]. This is a leading indicator — entity gaps now become impression gaps later.
- **Set a calendar reminder for ~90 days.** That's when GSC will have enough data for Phase 2.

**Don't:** keyword-stuff based on guesses, build links aggressively, or refresh before any data exists.

### Phase 2 — Growth (3–12 months) — The Striking Distance Loop

**State:** GSC has 3+ months of per-page query data. This is where the workflow from the original SEO Wins thread applies.

1. **Open Google Search Console** for the target site.
2. **Set the date range to 3 months** (Performance → date picker → "3 months").
3. **Switch to the Pages tab**, click the specific URL. This filters all queries to ones that triggered impressions for *that* page.
4. **Switch back to the Queries tab** (still filtered by page) and **Export → CSV**.
   > **Heads-up:** the GSC UI exports a maximum of 1,000 rows [9]. For high-traffic pages, use the Search Analytics API (up to 25,000 rows per call, 50,000/day per site) [9], the "Search Analytics for Sheets" extension, or schedule a Bulk Data Export to BigQuery if the site qualifies.
5. **Upload the CSV to Claude** with this prompt:
   > Analyze the file and identify which keywords are not used on [PAGE URL] but are still getting a lot of impressions. Group them by intent cluster. Flag any cluster with 5,000+ combined impressions where the root term never appears on the page.
6. **Capture the underserved keywords** — especially clusters around a single intent.
7. **Weave them into existing content**: paragraphs, H2/H3 headings, image alt text, FAQ entries, internal anchor text. Natural placement only.

Repeat per high-traffic page. Quarterly cadence beats annual by ~42% on traffic recovery [7].

### Phase 3 — Mature (12+ months) — Decay Defense + GEO Expansion

**State:** Page has plateaued or is declining. Position 5–15 keywords have largely been captured. Decay risk is real.

**Decay signals to watch (run quarterly):**
- Traffic down >20% YoY → priority refresh candidate [7].
- Positions sliding 3+ spots on previously stable queries.
- New entrants in the SERP with more recent publish/modified dates.
- Query Deserves Freshness (QDF) topics — anything matching "best [X]", "top [Y]", "how to [Z]", or "[year]" [7] — these get punished hardest by staleness.

**Refresh cadences by content type [7]:**
| Content type | Cadence |
|---|---|
| Time-sensitive ("Best of", comparisons, regulatory) | Quarterly |
| Industry trends / strategic guides | Every 6 months |
| Revenue-generating pages | Monthly review |
| Tier-2 evergreen | Quarterly review |

**The GEO layer.** AI search engines update citation choices within days, not weeks [7]. To get cited:
- Pages updated within the last 3 months get cited ~2× more often by AI engines [7].
- Add explicit **stat-with-source** lines (LLMs preferentially cite quotable claims with attribution) [10].
- Add a **FAQ section** with literal Q&A — high citation density on Perplexity and ChatGPT [10].
- Surface the page on platforms LLMs lean on: ChatGPT cites Reddit and Wikipedia heavily; Perplexity leans on Reddit, LinkedIn, and G2 [5].

---

## What "Underserved" Looks Like

| Signal | Meaning |
|---|---|
| Position 5–15, low CTR | Classic striking distance — biggest ROI [1][2] |
| Position 1–10 but no clicks | Snippet/title problem, not content gap. Different fix. |
| Query absent from page text | Pure gap — add the term naturally |
| Query cluster around one phrase | Whole sub-topic missing — consider new H2/H3 section |
| High impressions, position 20–80 | Long-tail gap-fill territory; often the biggest lift on mature pages |

The biggest wins usually come from **query clusters with 5k+ combined impressions where the root term never appears on the page**.

## Common Mistakes

- **Skipping the page filter in step 3** — site-wide query data is much noisier per-URL.
- **Keyword stuffing** — same phrase 12 times tanks rankings; use synonyms and entity variants instead [8].
- **Ignoring intent** — impressions don't mean searcher wants what your page offers. Read the live SERP for the query before adding it.
- **Adding keywords to nav/footer instead of body** — Google weights body content far more.
- **Only looking at top 10 queries** — the long tail (positions 20–80) is where mature-page wins live.
- **Refreshing without changing anything substantive** — Google detects cosmetic-only updates; expect no lift [7].
- **Treating Phase 1 like Phase 2** — running the loop on a 4-week-old page wastes effort; the data isn't there.

## Quick Reference

```
Phase 1 (0-3mo):     index check → internal links → entity audit → wait
Phase 2 (3-12mo):    GSC pages → 3mo data → export → Claude analysis → integrate
Phase 3 (12+mo):     decay check → refresh by cadence → add GEO signals
```

## Source

Workflow distilled from a thread by @seo_wins on X (April 2026), expanded with industry data on striking-distance methodology, content decay, AI Overview impact, and Generative Engine Optimization. Full citations and verification tags in [SOURCES.md](SOURCES.md).
