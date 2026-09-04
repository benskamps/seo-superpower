# Primary Sources & Empirical Knowledge Base

> **Tenet 3 (soul.md): Ruthless Empirical Pragmatism — Facts Over Fads**  
> *"Every threshold, cap, and recommendation must trace to a verified primary source: Google Search Central documentation, schema.org specifications, W3C standards, or peer-reviewed research."*

`seo-superpower` is built on empirical truth rather than SEO folklore or marketing hype. This document serves as the master index of all primary standards, engineering specifications, peer-reviewed studies, and the 12 skill-level knowledge bases that govern our deterministic scripts, thresholds, and routing decisions.

---

## Authority Tiers

Every claim, constant, and diagnostic threshold in this repository is tagged with an authority tier:

| Tier | Category | Description | Examples |
|:---:|---|---|---|
| **A** | **Primary Standards & Platform Specs** | First-party specifications from search engines, standards bodies, and official protocol authors. Non-negotiable bedrock. | Google Search Central, schema.org, W3C, IETF RFCs, IndexNow |
| **B** | **Established Engineering & Technical References** | Official developer blogs, browser engine source code, and verified developer documentation from platform maintainers. | web.dev, Anthropic Claude Docs, OpenAI Documentation, Bing Webmaster |
| **C** | **Empirical Field Research & Large Datasets** | Rigorous quantitative analyses with disclosed methodology (log analyses, multi-million URL crawls, SERP clickstream datasets). | Clearscope striking-distance studies, AEO/GEO citation studies |
| **D** | **Unverified Industry Claims & Marketing Fads** | Anecdotal assertions, promotional vendor marketing, or unverified claims lacking independent data. **Excluded from core logic.** | Unproven `llms.txt` citation claims, fake update timestamps |

---

## 1. Technical Standards & Engine Specifications (Tier A)

### Google Search Central Specifications
- **robots.txt Parser Cap (500 KiB):** Google ignores all directives after 500 kibibytes (512,000 bytes) of content in a robots.txt file. Any `Disallow:` or `Allow:` rule past byte 512,000 is silently ignored.  
  *Source:* [Google Search Central — robots.txt Specifications](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)  
  *Implementation:* Enforced deterministically in `scripts/baseline-check.js` (`ROBOTS_MAX_BYTES = 512000`).
- **Sitemap Hard Limits (50,000 URLs / 50 MB):** A single XML sitemap file must not exceed 50,000 `<url>` entries or 50 MB uncompressed. Larger deployments must shard into a `<sitemapindex>` container.  
  *Source:* [Google Search Central — Build and Submit a Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)  
  *Implementation:* Enforced in `scripts/baseline-check.js` (`SITEMAP_MAX_URLS = 50000`, `SITEMAP_MAX_BYTES = 52428800`).
- **Structured Data Policies & Manual Actions:** Search engines mandate that structured data must accurately represent visible, human-readable page content. Markups for non-existent content or manipulated `AggregateRating` attributes trigger algorithmic discounts or manual actions.  
  *Source:* [Google Search Central — General Structured Data Policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- **Rich Result Deprecations:** Google formally retired HowTo rich results on desktop and mobile (2023–2024), and restricted `FAQPage` rich results strictly to authoritative government and healthcare domains. (However, structured FAQ markup remains heavily cited by AI retrieval engines).  
  *Source:* [Google Search Central — Changes to HowTo and FAQ Rich Results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) & [FAQPage Docs](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- **Google Search Console Data Boundaries:** The Search Console API provides a 16-month rolling window with pagination up to 25,000 rows per query (contrasted with the 1,000-row UI table limit).  
  *Source:* [Google Search Central — Performance Data Deep Dive](https://developers.google.com/search/blog/2022/10/performance-data-deep-dive)

### schema.org Specifications
- **Schema Validation & Typing:** Canonical casing and schema definitions (e.g. `Article`, `BlogPosting`, `Product`, `Organization`, `WebSite`, `BreadcrumbList`, `ItemList`, `FAQPage`, `TouristTrip`).  
  *Source:* [Schema.org Core Vocabulary](https://schema.org/)
- **Cross-Referenced `@graph` Architecture:** Linking discrete entities (e.g. `WebSite` -> `Organization` -> `Article` -> `Person` author) via `@id` URIs inside a unified `@graph` block represents the gold-standard entity-relationship model for both classical search engines and LLM embeddings.  
  *Source:* [W3C JSON-LD 1.1 Processing Architecture](https://www.w3.org/TR/json-ld11/)  
  *Implementation:* Validated offline in `scripts/schema-quick.py` and `scripts/schema-check.js`.

### W3C & Web Performance Standards
- **Core Web Vitals Thresholds (p75):** Performance evaluated at the 75th percentile of real-world user experiences (Chrome UX Report):
  - **LCP (Largest Contentful Paint):** Good < 2.5s, Needs Improvement 2.5s–4.0s, Poor > 4.0s.
  - **INP (Interaction to Next Paint):** Replaced FID in March 2024. Good < 200ms, Needs Improvement 200ms–500ms, Poor > 500ms.
  - **CLS (Cumulative Layout Shift):** Good < 0.1, Needs Improvement 0.1–0.25, Poor > 0.25.  
  *Source:* [web.dev — Core Web Vitals](https://web.dev/articles/vitals)  
  *Implementation:* Evaluated via `scripts/psi-quick.py` and Lighthouse MCP integration.
- **HTML5 Semantic Standards & Open Protocols:**
  - Viewport declaration requirement: `<meta name="viewport" content="width=device-width, initial-scale=1">`.
  - Canonical URL relation: RFC 6596 (`<link rel="canonical" href="...">`).
  - IndexNow instant indexing protocol for real-time engine discovery: [IndexNow.org](https://www.indexnow.org/).

---

## 2. Empirical Research & AI Retrieval Benchmarks (Tiers B & C)

### AI Search Retrieval Crawlers & Robots Exclusion
Anthropic, OpenAI, Perplexity, and Apple maintain distinct crawler agents distinguishing training models from live retrieval and search indexers:
- **Anthropic:** `Claude-SearchBot` (live search indexing), `Claude-User` (on-demand user query fetches), and `ClaudeBot` (foundation model training).
- **OpenAI:** `OAI-SearchBot` (ChatGPT Search live indexer), `ChatGPT-User` (real-time browsing), and `GPTBot` (foundation training).
- **Perplexity:** `PerplexityBot` (search indexing & RAG retrieval).
- **Apple & Google:** `Applebot-Extended`, `Google-Extended`.  
*Empirical finding:* Blocking all AI bots blinds your site to modern search. To preserve citations in generative engines while preventing training scraping, allow retrieval bots (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`) while restricting training crawlers (`GPTBot`, `ClaudeBot`) if desired.  
*Implementation:* Audited deterministically in `scripts/baseline-check.js` (`RETRIEVAL_BOTS`).

### AI Citation Lift & Structured Data Correlation
- **Structured Data Lift:** Multiple independent datasets (Discoverability, Hashmeta, GenOptima) demonstrate that pages with valid, comprehensive JSON-LD structured data are cited **2.5× to 3.2× more frequently** in AI answers (ChatGPT Search, Perplexity, Claude, Google AI Overviews).
- **Triple-Stack Schema:** Layering `Article` + `ItemList` + `FAQPage` schema on comprehensive guides generates high citation density across multi-turn LLM reasoning flows.
- **Citation Sources Shift:** Cross-platform research demonstrates that user-generated discussion and high-E-E-A-T communities (Reddit) represent a major fraction of citations in ChatGPT and Perplexity, emphasizing the need for authentic first-person experience signals.

### Fact-Checking Industry Fads
- **The `llms.txt` Hypothesis:** Empirical log and citation analysis across 500 million website visits ([aeo.press — The State of llms.txt in 2026](https://www.aeo.press/ai/the-state-of-llms-txt-in-2026)) demonstrated **zero statistically significant correlation** between the presence of an `/llms.txt` file and AI engine citation frequency. As codified in Tenet 3, `seo-superpower` treats `llms.txt` as an optional hint rather than a mandatory requirement.
- **Content Decay Velocity:** Competitive content half-life has compressed from 12–18 months down to **3–6 months**. Refreshing existing pages that already possess backlinks and search equity yields 3×–5× higher return than drafting net-new URLs from zero authority.

---

## 3. Skill-Specific Knowledge Bases Index

Detailed citation registries, verification tags, and empirical evidence chains for each individual workflow are documented in the 12 skill knowledge bases:

| Skill Directory | Focus Area | Key Citations & Scope |
|---|---|---|
| [skills/adding-schema-markup/SOURCES.md](skills/adding-schema-markup/SOURCES.md) | Schema & Structured Data | Google rich-result policies, FAQPage restrictions, schema.org types, `@graph` entity architectures, 2.5×–3.2× AI citation lift. |
| [skills/analyzing-content-gaps/SOURCES.md](skills/analyzing-content-gaps/SOURCES.md) | Content & SERP Gaps | SERP competitor definition, four-tier gap model (keyword, topic, entity, AI visibility), Firecrawl rate limits. |
| [skills/auditing-technical-seo/SOURCES.md](skills/auditing-technical-seo/SOURCES.md) | Technical Auditing | Core Web Vitals thresholds (p75), robots.txt 500 KiB cap, sitemap 50K limits, AI crawler taxonomy, `llms.txt` log analysis. |
| [skills/building-eeat-and-authority/SOURCES.md](skills/building-eeat-and-authority/SOURCES.md) | E-E-A-T & Entity Trust | 96% AI Overview citation E-E-A-T correlation, `Person` schema and `sameAs` authority linking, author credentials. |
| [skills/finding-underserved-keywords/SOURCES.md](skills/finding-underserved-keywords/SOURCES.md) | GSC Opportunity Mining | Striking-distance queries (positions 8–20), CTR degradation curves, Search Console API limits, high-impression/low-CTR arbitrage. |
| [skills/generating-content-briefs/SOURCES.md](skills/generating-content-briefs/SOURCES.md) | Research-Grounded Briefs | Extractable heading structures, front-loaded answer capsules, SERP intent mapping, topic depth models. |
| [skills/generating-programmatic-seo/SOURCES.md](skills/generating-programmatic-seo/SOURCES.md) | Programmatic SEO (pSEO) | Scaled content abuse policies, 60% uniqueness thresholds, Tripadvisor/Zapier scale benchmarks, Next.js sitemap sharding. |
| [skills/optimizing-for-generative-engines/SOURCES.md](skills/optimizing-for-generative-engines/SOURCES.md) | Generative Engine Optimization (GEO) | ChatGPT, Claude, Perplexity citation behaviors, Reddit/Wikipedia distribution, answer capsule design, extractability scoring. |
| [skills/optimizing-on-page/SOURCES.md](skills/optimizing-on-page/SOURCES.md) | On-Page Technical Signals | Title tags (50–60 chars), meta descriptions (120–160 chars), single `<h1>` hierarchy, image alt text, semantic HTML5 tags. |
| [skills/planning-topic-clusters/SOURCES.md](skills/planning-topic-clusters/SOURCES.md) | Topic Clusters & Pillars | Hub-and-spoke content topology, pillar/spoke word count ratios, URL hierarchy, internal link anchor signaling. |
| [skills/refreshing-stale-content/SOURCES.md](skills/refreshing-stale-content/SOURCES.md) | Content Refresh & Decay | >20% sustained traffic decay trigger, `dateModified` ISO 8601 schema, IndexNow real-time protocol, 3–6 month decay half-life. |
| [skills/researching-keywords-pre-launch/SOURCES.md](skills/researching-keywords-pre-launch/SOURCES.md) | Pre-Launch Demand Discovery | Zero-GSC cold-start research, search autocomplete, People Also Ask (PAA) expansion, community demand mining (Reddit/HN). |

---

## Contributing & Verification Rules

Any contribution proposing changes to thresholds, lint rules, or diagnostic heuristics must:
1. Provide a citation in the relevant skill's `SOURCES.md` and link to it from this master `SOURCES.md`.
2. Specify the source's authority tier (Tier A, B, or C).
3. Accompanied by automated unit tests in `test/` preventing future regressions against documented standards.
