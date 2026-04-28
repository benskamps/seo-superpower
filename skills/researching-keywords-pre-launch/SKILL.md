---
name: researching-keywords-pre-launch
description: Use when starting keyword research for a brand-new site with no Google Search Console history yet — pre-launch, just-launched, or first 90 days. Covers cold-start discovery via Google autocomplete / People Also Ask / related searches, Google Trends, Reddit/HN/Indie Hackers demand mining, competitor SERP overlap, and AI-search query patterns. Produces a clustered KEYWORD_MAP.md to seed the first content slate. Auto-triggers on "what should I write about", "keyword research from scratch", "no GSC data yet", "cold start SEO", "what keywords should I target", "pre-launch keyword research", "topic ideas for new site".
---

# Researching Keywords Pre-Launch

## Overview

Before a site has 90+ days of Google Search Console data, the striking-distance loop in `finding-underserved-keywords` doesn't work — there are no impressions to listen to. Cold-start discovery instead listens to **public demand signals**: search-suggest, the SERP boxes Google ships, communities where your users complain, competitor URLs, and the way prompts land in ChatGPT/Claude/Perplexity. No paid Ahrefs/Semrush seat needed.

**Core principle:** real users have already typed the queries you need to rank for — into Google, Reddit, ChatGPT. Harvest that exhaust, cluster by intent, pick the cluster you can plausibly win first.

## When to use

Pre-launch or just-launched site (no GSC verification or <90 days of data); considering a new content vertical with no historical signal; founder asks "what should the first 10 posts be?".

**Don't use for:** sites with 90+ days of GSC data — hand off to `finding-underserved-keywords`.

## The 5 free signals

1. **Google search-surface (autocomplete + People Also Ask + related searches).** Type your seed plus each letter a–z to enumerate autocomplete; recursively expand PAA; scroll to "related searches". Real Google queries, not estimates [1][2].
2. **Google Trends.** Compare seed terms; sort by *Rising* breakouts; check geographic delta — flat nationally but spiking in three states is a real signal [3].
3. **Reddit / Hacker News / Indie Hackers.** Search the subreddits and forums where your users live. Look for **questions with weak top answers**, high-comment posts, recurring complaints. Reddit threads rank in Google *and* are heavily cited by ChatGPT [4][5].
4. **Competitor SERP overlap.** Pick 3–5 direct competitors. Free tools (Mangools KWFinder free tier, Ahrefs Webmaster Tools, Semrush free daily searches, Keyword Insights SERP Similarity, MozBar DA overlay) show what they rank for. Target where they rank weakly (positions 8–30) [6].
5. **LLM query patterns.** ChatGPT/Claude/Perplexity prompts are longer, conversational, full questions: *"which CRM works best for a 5-person agency on monthly retainers"* vs. Google's terse *"crm for agencies"* [7][8]. Capture both — Google and AI-citation traffic come from different phrasings of the same intent.

## The discovery flow

1. **Define your seed cluster.** 3–5 root concepts your product solves. For `vibecrafting.ai`: `vibecoding`, `ai coding workflow`, `claude code prompts`, `cursor vs claude code`, `ai-assisted dev for non-engineers`.
2. **Mine the 5 signals in parallel.** Dump everything to a working list — don't filter yet.
3. **Cluster by intent.** Tag each candidate **informational** (how/what/why), **commercial** (best/vs/review), **transactional** (buy/download/pricing), or **navigational** (brand). The four-intent model still rules in 2026, with context-sensitivity layered on top [9].
4. **Rank by attainability × intent-fit.** Don't chase head terms in clusters where you have zero authority.
5. **Write `KEYWORD_MAP.md`** — 30–100 candidates grouped by cluster and intent, one-line note per cluster on which signal surfaced it.

## The intent-attainability matrix

```
                LOW VOLUME           HIGH VOLUME
HIGH INTENT  | first targets here | long-game commercial
LOW INTENT   | skip               | informational pillar
```

**First targets** = low-volume, high-intent. For `vibecrafting.ai`: *"how to set up claude code skills for a beginner"* before *"best ai coding tool"*. Wins compound; head terms come later.

## Common mistakes

- **Chasing head terms** with no domain authority — the SERP is owned by 10-year-old sites.
- **Ignoring intent.** Informational guide on a SERP full of pricing pages won't rank [9].
- **Mining only Google.** All 2–3 word terms = invisible to ChatGPT/Claude citations [7][8].
- **Validating from one signal.** Require ≥2 signals before a keyword enters the map.
- **Forgetting the long tail.** 4–6 word conversational questions are where new sites win [10].

## Quick reference — where to mine first

| If your product is… | Mine first |
|---|---|
| Dev tool / API | HN, GitHub issues, Stack Overflow, ChatGPT-style "how do I X with Y" |
| Indie SaaS / B2B | Indie Hackers, r/SideProject, r/SaaS, competitor SERP, PAA |
| Consumer product | Reddit subs, Trends rising, autocomplete a–z, YouTube suggest |
| Local service | Autocomplete with city modifiers, Google Maps suggestions, "near me" PAA |
| Content/media | PAA recursion, Answer the Public, related searches, LLM "explain X" prompts |

## Lifecycle

Runs **once**, at the start. After ~90 days of GSC data, hand off to `finding-underserved-keywords`. Never re-run this once GSC has signal — GSC is always the better source.

## What's next

- `planning-topic-clusters` consumes `KEYWORD_MAP.md` into a pillar/spoke structure.
- `optimizing-on-page` for the first piece of content.
- `auditing-technical-seo` if the site isn't deployed yet.

Citations and verification tags in [SOURCES.md](SOURCES.md).
