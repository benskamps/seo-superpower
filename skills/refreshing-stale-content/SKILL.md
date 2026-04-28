---
name: refreshing-stale-content
description: Use when content is losing traffic, dropping in rankings, or showing decay signals in Google Search Console — impressions down >20% YoY, position sliding, CTR rotting, or LLM citations falling. Auto-triggers on phrases like "refresh this content", "fix the decay", "traffic is dropping on /blog/X", "update old post", "content refresh". Pairs with gsc-mcp for decay detection and opens a single PR with updated copy, schema (dateModified), internal links, and an IndexNow ping. Mature-phase only — page must have >6 months of GSC data.
---

# Refreshing Stale Content

## Overview

Content decay is no longer a back-burner problem. The competitive-topic half-life collapsed from 12–18 months to **3–6 months** [1] (see also `finding-underserved-keywords/SOURCES.md` [7]). Plateaus arrive faster, decay starts sooner, and refresh now beats new content for any page that has accumulated link equity. Refreshing what is already live brings 3–5× more return than writing from scratch — you keep the URL, the backlinks, the index history, and the brand trust [2].

This skill is the **Mature-phase decay defense** workflow. It pairs with `gsc-mcp` to detect impression decay automatically, then opens a single, focused refresh PR per affected page.

**Core principle:** preserve the URL, change the substance.

## The Detection Signals

A page is a refresh candidate when **any** of the following fire:

| Signal | Threshold | Why it matters |
|---|---|---|
| GSC impressions YoY | **down >20%** sustained 4–8 weeks | Canonical decay signal [3] |
| Impressions falling faster than clicks | impressions −40% / clicks −20% | Early-stage decay; Google is showing the page less often [3] |
| Position drift on stable queries | **3+ spots down** | SERP is reordering around fresher entrants |
| CTR rot (position flat) | CTR down ≥25% | Snippet/title aging — title rewrite alone may suffice |
| LLM citation drop | when geo-check MCP available | AI engines re-rank citations within ~14 days; ChatGPT cites pages updated <30d ago at 76.4%, Perplexity at 82% [4][5] |
| QDF mismatch | page mentions a year ≥2 years stale, or "best [X] [old-year]" | Query-Deserves-Freshness pattern punishes age hardest [1] |

## The Refresh Playbook

1. **Pull GSC data** for the target page via `gsc-mcp` — 12-month window, queries + position + impressions + CTR. Compare to prior-year window. Compute YoY delta.
2. **Read the current page.** Identify dates, stats, year references, internal links, JSON-LD `dateModified`.
3. **Competitive SERP scrape.** Pull top 3 results currently ranking for the page's primary keyword. List entities, H2s, and stat-with-source lines they cover that the target page does not.
4. **Update the intro hook.** First 50 words are featured-snippet-eligible — rewrite to lead with the freshest fact and the primary query verbatim.
5. **Refresh stats and dates.** Replace stale numbers with current numbers; cite source and year inline (LLMs preferentially cite stat-with-source lines [6]).
6. **Add an updated H2 or FAQ entry** covering the largest competitive gap from step 3. FAQ entries drive citation density on Perplexity and ChatGPT [6].
7. **Bump `dateModified` in JSON-LD** using ISO 8601 with timezone (`2026-04-26T14:30:00+00:00`). Only bump when changes are substantive — Google detects and discounts cosmetic-only date bumps [7][8].
8. **Adjust internal links.** Remove links to retired/decayed pages; add links to newer related pages on the site.
9. **Open ONE PR per page** with all changes. Title format: `refresh: <slug> (YoY −X% impressions)`.
10. **Ping IndexNow after merge.** POST the URL to `https://api.indexnow.org/indexnow` with the site's API key. Bing, Yandex, Naver, Seznam, and Yep recrawl within minutes [9]. Google does not consume IndexNow but recrawls via sitemap lastmod independently.

## Anti-patterns

- **Cosmetic-only edits with date bump.** Google detects and discounts date updates that don't reflect material change [7][8]. Treat `dateModified` as a reward for real edits.
- **Deleting old content.** Drops backlinks, index history, and authority. Refresh, don't replace [2].
- **Aggressive rewrite that changes URL slug.** URL change loses backlink equity even with 301s. Preserve the URL [2].
- **Refreshing a page <6 months old.** Not enough GSC data to identify real decay vs. natural ramp-up — use `finding-underserved-keywords` Phase 2 instead.
- **Refreshing every page on a fixed cadence regardless of signal.** Wastes effort. Let GSC tell you which pages decayed.

## Quick Reference — Refresh Cadence by Content Type

(From `finding-underserved-keywords/SKILL.md` [1])

| Content type | Cadence |
|---|---|
| Time-sensitive ("Best of", comparisons, regulatory) | Quarterly |
| Industry trends / strategic guides | Every 6 months |
| Revenue-generating pages | Monthly review |
| Tier-2 evergreen | Quarterly review |

## Lifecycle

**Mature phase only (12+ months, or ≥6 months of GSC data).** Pre-flight check before running:

```
Has page been live ≥6 months?           → no  → use finding-underserved-keywords (Phase 1 or 2)
Does page have GSC data for prior year?  → no  → wait
Is there a real decay signal above?      → no  → no refresh; revisit in 30 days
```

## What Next

- `optimizing-on-page` — actually edit the copy, headings, and intro hook
- `adding-schema-markup` — bump `dateModified`, validate JSON-LD
- `finding-underserved-keywords` — for pages <12 months old or in growth phase
- The `seo-decay-check` weekly hook (see `hooks/seo-decay-check.json`) runs the detection sweep automatically; this skill executes the per-page response

## Source

Distilled from 2026 industry data on content decay thresholds, IndexNow adoption, `dateModified` semantics, LLM citation freshness, and content-refresh ROI. Full citations and verification tags in [SOURCES.md](SOURCES.md).
