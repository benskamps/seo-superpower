# Sources — analyzing-content-gaps

Verification tags:
- **[verified]** — primary source, confirmed in 2026, used directly for a claim in SKILL.md
- **[corroborating]** — secondary source supporting the same claim
- **[methodology]** — describes a technique referenced in the skill

---

## [1] Modern Content Gap Analysis: 4 Gap Types & Topic Clusters

**Yotpo — "Content Gap Analysis 2026: 10 Tips For AI Search"**
https://www.yotpo.com/blog/modern-content-gap-analysis/

[verified] Establishes the 2026 framing that "SERP Competitors" are whoever occupies pixel space (not just business competitors), and that gap analysis now examines four distinct gap types — keyword, topic, entity, and AI-visibility. Source for the claim that keywords are surface representations of underlying entities and that "Topic Gaps" occur when a competitor covers a subject with greater dimensionality. Used to justify the diff-axes table.

---

## [2] Firecrawl SERP Scraping — Ethics, Rate Limits, Pricing (2026)

**Firecrawl — "Best Web Search APIs for AI Applications in 2026"**
https://www.firecrawl.dev/blog/best-web-search-apis

**Firecrawl Rate Limits Documentation**
https://docs.firecrawl.dev/rate-limits

**SearchCans — "The 2026 SERP API Pricing Index: SerpApi vs SearchCans vs Serper"**
https://www.searchcans.com/blog/serp-api-pricing-index-2026/

[verified] Firecrawl combines search + full-content extraction in a single call (returns clean markdown), respects robots.txt, rate-limits requests, and works with site owners. Free tier: 500 credits, 20 req/min. Paid: 60–200 req/min. Search costs 2 credits per 10 results. Compared to Serper.dev: Serper returns metadata only (titles/URLs/150–300 char snippets) for $1/1k requests starting, dropping to $0.30/1k at 100k+ volume; 2,500 free queries to start. The skill recommends Firecrawl for content gap work specifically because the diff requires full body content, not snippets.

---

## [3] Featured Snippets, AI Overviews, and Citation Patterns

**Digital Applied — "Featured Snippets in the AI Overview Era: 2026 Guide"**
https://www.digitalapplied.com/blog/featured-snippets-ai-overview-era-optimization-2026

**ALM Corp — "Google AI Overview Citations From Top-10 Pages Dropped From 76% to 38%"**
https://almcorp.com/blog/google-ai-overview-citations-drop-top-ranking-pages-2026/

**Averi — "Google AI Overviews Optimization: How to Get Featured in 2026"**
https://www.averi.ai/blog/google-ai-overviews-optimization-how-to-get-featured-in-2026

[verified] AI Overviews cite 8–13 sources per response, appear on 50–60% of US Google searches, average 157 words (99% under 328, 66% between 150–200). Strong correlation between pages previously holding featured snippets and pages cited in AIO — the same answer-first structural patterns win both. Pages updated within last 3 months are cited ~2× more often. Used for the AIO presence axis, the "front-load a 40–50 word answer under a question-phrased H2" recommendation, and the freshness threshold.

---

## [4] AI Overview Citation Source Distribution

**ALM Corp — Citation analysis (linked above)**

[corroborating] 92.36% of AIO citations come from domains in top 10 for the query, but ~2/3 of cited pages are not on page one of that specific keyword's SERP — meaning topical depth on the sub-question matters more than absolute ranking on the head term. Used to justify why entity-level diffs (not just rank-tracking) drive AIO inclusion.

---

## [5] Skyscraper Technique Evolution — 2.0 vs 1.0

**SERPreach — "The Skyscraper Technique: Does It Still Work in 2026?"**
https://serpreach.com/the-skyscraper-technique/

**Loganix — "Skyscraper Technique: What it is + Best Practices for 2026"**
https://loganix.com/skyscraper-technique/

**DigiCrowd Solutions — "Skyscraper Technique SEO 2.0: Rank Without Writing More"**
https://digicrowdsolution.com/blog/skyscraper-technique-seo-2.0

[verified] "Make it longer" no longer works. 2026 skyscraper requires stronger data, sharper examples, better UX, and tighter intent alignment — not word-count padding. AI handles brief generation and outline drafting via agent workflows. Used to justify the warning that depth gaps should only be addressed *after* Tier 1 entity/H2 gaps are filled, and that gap-stuffing makes pages worse.

---

## [6] Content Brief Tooling Reference — Frase, Clearscope, Surfer

**Trysight — "Clearscope Vs Frase Alternatives: Complete 2026 Guide"**
https://www.trysight.ai/blog/clearscope-vs-frase-alternatives

[methodology] Clearscope, Frase, and Surfer SEO analyze SERPs to identify entity coverage, semantic completeness, and intent alignment — the canonical commercial implementations of the diff workflow this skill describes. Their limitation: they don't address "how do AI models talk about your brand" (i.e. AIO citation strategy), which is why this skill adds the AIO presence axis on top of the standard entity-coverage diff.

---

## [7] Entity Extraction Methodology — Google NLP API & Free Alternatives

**Google Cloud Natural Language API — `analyzeEntities`**
https://cloud.google.com/natural-language/docs/analyzing-entities

**spaCy / compromise.js noun-phrase extraction**
https://spacy.io/api/doc / https://github.com/spencermountain/compromise

[methodology] Two-tier recommendation in the skill: Google NLP API for production-grade entity extraction with salience scores (~$1/1k requests), or free noun-phrase frequency via spaCy/compromise for ~85% of the signal. Both deduplicate via lemma. The skill explicitly notes that frequency-based approaches are sufficient for most briefs because the signal we care about — entities present in all 3 competitors but absent from our page — is robust to extraction noise.

---

## [8] AI Tools for SERP Analysis & Competitor Intelligence (2026 Landscape)

**Energent — "Top AI Tools for SERP Analysis in 2026"**
https://www.energent.ai/energent/compare/en/ai-tools-for-serp-analysis

**Scopic Studios — "8 Best AI SEO Agents for Content Gap Analysis & SERP Expansion in 2026"**
https://scopicstudios.com/blog/best-ai-seo-agents-for-content-gap-analysis/

[corroborating] Confirms the broader 2026 trend: AI agents now extract entity relevance, map intent signals, parse raw SERP data, and output technical recommendations at scale. Validates the architecture this skill follows (scrape → extract entities → diff → rank by impact → output brief) as the emergent industry-standard workflow rather than a Claude-specific invention.
