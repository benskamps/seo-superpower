# Knowledge Base — researching-keywords-pre-launch

Generated: 2026-04-26
Sources: 10 documents cross-referenced
Verification: 9 Supported / 1 Partially Supported

This file is the enrichment artifact for the SKILL.md. Every numbered citation in SKILL.md resolves here. Authority tiers follow the enrichment skill convention: **A** = primary/standards, **B** = established references, **C** = empirical/applied, **D** = unverified.

## Source Registry

| ID  | Source | Authority | Date | Domain |
|-----|--------|-----------|------|--------|
| [1] | [Semrush — How to Do Keyword Research in 2026 (6 Ways + Framework)](https://www.semrush.com/blog/keyword-research/) | B | 2026 | Free keyword research methods, seed keywords |
| [2] | [Answer Socrates — Google Autocomplete for SEO](https://answersocrates.com/blog/google-autocomplete-for-seo/) | C | 2025–2026 | Autocomplete, PAA, related searches as data sources |
| [3] | [getfreeseo — How to Do Keyword Research for Free in 2026](https://getfreeseo.com/en/blog/free-keyword-research-guide) | C | 2026 | Google Trends, free-tool stack for new sites |
| [4] | [Indie Hackers — Reddit + SEO: The Combo That's Still Criminally Underrated](https://www.indiehackers.com/post/reddit-seo-the-indie-hacker-combo-that-s-still-criminally-underrated-e952665135) | C | 2025–2026 | Reddit demand mining, language harvesting |
| [5] | [Let's Talk Shop — Best Indie Hacker and Solopreneur Communities (2026)](https://www.letstalkshop.com/blog/best-indie-hacker-and-solopreneur-communities) | C | 2026 | Where indie hacker users congregate (IH, HN, r/SideProject) |
| [6] | [Proven SaaS — 12 Best Free Competitor Analysis Tools for 2026](https://proven-saas.com/blog/12-best-free-competitor-analysis-tools-for-2026) | C | 2026 | Free competitor SERP overlap tools |
| [7] | [Search Engine Land — AI assistants now equal 56% of global search engine volume](https://searchengineland.com/ai-assistants-global-search-engine-volume-study-471118) | B | 2026 | AI-search share, conversational query length |
| [8] | [Content Levers — I Ran 8 Queries Across ChatGPT, Perplexity, Claude, Gemini, and AI Overviews](https://contentlevers.xyz/blog/ai-search-optimization-5-platforms) | C | 2026 | Empirical AI-platform query construction patterns |
| [9] | [Topical Map — Search Intent Classification Methods: A Complete Guide for 2026](https://topicalmap.ai/blog/auto/search-intent-classification-methods-2026) | B | 2026 | Four-intent framework + 2026 context-sensitivity additions |
| [10] | [Search Engine Land — Why AI optimization is just long-tail SEO done right](https://searchengineland.com/ai-optimization-long-tail-seo-469315) | B | 2026 | Long-tail discovery, conversational query patterns |

## Verified Claims

### Cold-start discovery without paid tools
- **New sites can target 100–1,000 monthly-search keywords and compete on quality alone** [1] — **Supported**.
- **Seed keywords (3–5 root concepts) are the canonical starting point** [1] — **Supported**.
- **Free Google-native sources (autocomplete, PAA, related searches) reflect real user queries, not estimates** [2] — **Supported**.

### Google search-surface signals
- **Autocomplete returns popular real-time queries; recursive a–z expansion enumerates branches** [2] — **Supported**.
- **People Also Ask boxes are sourced from real Google queries clustered by topical proximity** [2] — **Supported**.
- **Related searches (bottom of SERP) reveal adjacent intents** [2] — **Supported**.

### Google Trends
- **Trends supports interest-over-time, geographic delta, and rising/breakout terms** [3] — **Supported**. Useful for distinguishing seasonal vs. structural demand without volume estimates.

### Reddit / HN / Indie Hackers demand mining
- **Reddit threads are best for asynchronous research and pattern-matching language users actually use** [4] — **Supported**.
- **In 2026 the indie-hacker community is centered on indiehackers.com, Hacker News, r/SideProject, X #buildinpublic, and WIP Discord** [5] — **Supported**.
- **Reddit content is heavily cited by ChatGPT and Perplexity** — **Supported** (cross-referenced from finding-underserved-keywords SOURCES.md [5][7]).

### Competitor SERP overlap (free tools)
- **Free or freemium options for competitor keyword analysis: KWFinder (Mangools), SpyFu (limited free), Wincher, Semrush free daily searches, Keyword Insights free SERP Similarity, Rank Tracker, MozBar (DA overlay)** [6] — **Supported**.
- **Targeting competitor positions 8–30 (where they're weak) yields the highest cold-start ROI** — **Partially Supported**. This mirrors the striking-distance principle from [finding-underserved-keywords SOURCES.md] applied externally; no single source frames it this way for cold-start, but the methodology composes cleanly.

### LLM / AI-search query patterns
- **AI assistants now equal ~56% of global search engine volume** [7] — **Supported**.
- **LLM prompts are longer, conversational, and full questions; Google queries are short and keyword-oriented** [7][8] — **Supported**. Multiple 2025–2026 studies (including academic student-behavior research cited in [7]) confirm this distinct evolution.
- **ChatGPT decomposes broad prompts into multi-part sub-queries with brand names already baked in** [8] — **Supported**. Empirical observation from running 8 identical queries across 5 platforms.
- **AI search platforms prioritize content written at grade-10 reading level or below answering specific, naturally-phrased customer questions** [8] — **Supported**.

### Search intent classification
- **The four canonical intent types — informational, navigational, commercial, transactional — remain the working framework in 2026** [9] — **Supported**.
- **Informational queries are ~70% of all search volume** [9] — **Supported**.
- **2026 addition: context-sensitivity (location, device, time, prior behavior) layered on top of the four-type model** [9] — **Supported**. Modern queries often carry multiple intent signals (e.g., "best project management software pricing" = commercial + transactional) requiring prioritization.

### Long-tail discovery
- **Long-tail in 2026 is defined by hyper-specific user intent and entity relationships, not just word count** [10] — **Supported**.
- **AI search has caused a measurable spike in long-tail conversational queries** [10] — **Supported**.
- **Voice search averages 4–6 words and natural conversational language** [10] — **Supported**.

## Contradictions Resolved

**Long-tail definition.** Some sources still define long-tail by word count (4+ words); 2026 sources [10] redefine it by intent specificity. Resolution: SKILL.md uses the 2026 framing (intent specificity) but treats word count as a useful proxy when the intent signal is unclear.

**Free-tool reliability.** Competitor SERP tools' free tiers vary wildly in row limits and freshness. Resolution: SKILL.md lists multiple options without endorsing one — the user should triangulate across 2–3 free tools rather than rely on any single one.

## Gaps and Estimates

- **No primary academic source for "≥2 signals before a keyword enters the map" rule** — applied heuristic from triangulation principle. Treated as best practice.
- **"Targeting competitor positions 8–30" is a composed recommendation** — no single source frames cold-start competitor analysis this way. Composes correctly from striking-distance methodology + competitor-gap analysis but flagged here.
- **AI-search citation share by platform** referenced lightly; full GEO mechanics live in `optimizing-for-generative-engines` and `finding-underserved-keywords` SOURCES.md, not duplicated here.

## Methodology Note

This knowledge base was built using the `enrichment` skill: 8 parallel WebSearch queries covering cold-start methods, autocomplete/PAA/related searches, Reddit/HN/IH demand mining, intent classification frameworks, LLM-vs-Google query patterns, competitor SERP overlap, long-tail discovery, and AI-search citation patterns. Cross-referenced against the sibling skill `finding-underserved-keywords` SOURCES.md to maintain consistency on shared claims (AI-search share, citation behavior).

## Changelog

- **2026-04-26**: Initial knowledge base from 10 sources, 8 parallel research queries.
