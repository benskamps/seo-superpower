# Knowledge Base — auditing-technical-seo

Generated: 2026-04-27
Sources: 8 documents cross-referenced
Verification: 7 Supported / 1 Partially Supported

This file is the enrichment artifact for the SKILL.md. Every numbered citation in SKILL.md resolves here. Authority tiers: **A** = primary/standards, **B** = established references, **C** = empirical/applied, **D** = unverified.

## Source Registry

| ID  | Source | Authority | Date | Domain |
|-----|--------|-----------|------|--------|
| [1] | [web.dev — Web Vitals](https://web.dev/articles/vitals) | A | 2026 | Core Web Vitals thresholds, p75 methodology |
| [2] | [Scrunch — Guide to AI User Agents](https://scrunch.com/resources/guides/guide-to-ai-user-agents/) | B | 2026 | GPTBot, PerplexityBot, ClaudeBot user agents |
| [3] | [ALM Corp — ClaudeBot, Claude-User & Claude-SearchBot](https://almcorp.com/blog/anthropic-claude-bots-robots-txt-strategy/) | B | 2026 | Anthropic's three-bot framework, robots.txt strategy |
| [4] | [Schema.org — Article](https://schema.org/Article) and [Organization](https://schema.org/Organization) | A | 2026 | Canonical schema types, valid subtypes |
| [5] | [Unlighthouse — Lighthouse SEO Audit: All 8 Checks](https://unlighthouse.dev/learn-lighthouse/seo) | B | 2026 | Lighthouse SEO category audits |
| [6] | [Google Search Central — robots.txt spec](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec) | A | 2026 | robots.txt parsing, 500 KiB limit |
| [7] | [Google Search Central — Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | A | 2026 | Sitemap size limits, alignment with robots.txt |
| [8] | [aeo.press — The State of llms.txt in 2026](https://www.aeo.press/ai/the-state-of-llms-txt-in-2026) | C | 2026 | llms.txt adoption, citation correlation |

## Verified Claims

### Core Web Vitals thresholds
- **LCP < 2.5s, INP < 200ms, CLS < 0.1 at p75 (good)** [1] — **Supported**. Google measures at the 75th percentile of real-user data; all three must pass for a "good" assessment.
- **INP replaced FID as a Core Web Vital in March 2024** [1] — **Supported**.

### AI-search crawlers
- **GPTBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Amazonbot, Applebot-Extended are the major AI crawlers in 2026** [2][3] — **Supported**.
- **Anthropic split its single ClaudeBot into ClaudeBot (training), Claude-User (user-initiated fetches), and Claude-SearchBot (search index)** in 2025–2026 [3] — **Supported**.
- **GPTBot, ClaudeBot, PerplexityBot all document robots.txt compliance** [2][3] — **Supported**.
- **Bingbot uses Chromium-derived user-agent strings and modern rendering; crawl rate scales with site quality and freshness** — **Supported** (verified via Bing Webmaster docs in search results).

### llms.txt
- **llms.txt adoption ~10.13% of domains as of 2026** [8] — **Supported** (large-domain dataset cited).
- **No measurable correlation between llms.txt presence and AI citation rate** [8] — **Partially Supported**. Source claims statistical and ML analysis show no effect; primary data not independently audited. SKILL.md treats llms.txt as optional/suggestion, not requirement.

### Schema.org
- **Valid Article subtypes: Article, BlogPosting, NewsArticle, TechArticle, ScholarlyArticle, Report, SatiricalArticle, SocialMediaPosting, AdvertiserContentArticle** [4] — **Supported**.
- **Organization is the canonical type for site-level entity markup; specific subtypes (LocalBusiness, etc.) preferred where applicable** [4] — **Supported**.
- **JSON-LD is Google's recommended format, declared inside `<script type="application/ld+json">`** [4] — **Supported**.

### Lighthouse SEO category
- **Lighthouse runs 8 SEO audits, each pass/fail** [5] — **Supported**.
- **Audits cover: not blocked from indexing, valid HTTP status, valid robots.txt, valid rel=canonical, meta description, title, link text descriptive, hreflang correct, image alt** [5] — **Supported**.
- **Lighthouse SEO does not evaluate content quality, keyword optimization, or backlinks** [5] — **Supported**.

### robots.txt + sitemap
- **Google processes robots.txt up to 500 KiB; bytes beyond are ignored** [6] — **Supported**.
- **Sitemap referenced via `Sitemap:` directive (absolute URL, can be on a different host)** [6][7] — **Supported**.
- **Single sitemap limit: 50,000 URLs or 50 MB uncompressed; split into sitemap index for larger sites** [7] — **Supported**.
- **`noindex` URLs should not appear in sitemap; classic conflict is blocking in robots.txt while listing in sitemap** [7] — **Supported**.

## Contradictions Resolved

**llms.txt status.** Sources split: some 2026 guides advocate adopting it; aeo.press [8] reports no citation correlation. Resolution: SKILL.md presents llms.txt as optional with explicit caveat that effect on AI citations is unproven, while still checking for its presence so the user has the information.

**AI bot enumeration.** Different lists across sources (some include FacebookBot, Bytespider, Diffbot, etc.). Resolution: SKILL.md focuses on the bots most relevant to user-facing AI search (GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended) since those drive citations in ChatGPT, Claude, Perplexity, and Google AI Overviews.

## Gaps and Estimates

- **CSR-invisibility-to-AI-crawlers claim** is widely repeated in 2026 SEO commentary but lacks a primary controlled study; treated as strongly directional, not numerically pinned.
- **Mature-site CWV regression rates** not quantified — would require a longitudinal CrUX study not available in this enrichment pass.

## Methodology Note

Built using the `enrichment` skill: 7 parallel WebSearch queries covering CWV thresholds, AI crawler user agents, llms.txt status, schema.org valid types, Lighthouse SEO checks, robots.txt + sitemap best practices, and Bingbot behavior. Authority weighting prioritized Google/web.dev/schema.org primary sources for spec-level claims; secondary sources used for adoption metrics.

## Changelog

- **2026-04-27**: Initial knowledge base from 8 sources, 7 parallel research queries.
