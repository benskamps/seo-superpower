# Knowledge Base — adding-schema-markup

Generated: 2026-04-27
Sources: 9 documents cross-referenced
Verification: 8 Supported / 1 Partially Supported

This file is the enrichment artifact for `SKILL.md`. Every numbered citation in SKILL.md resolves here. Authority tiers: **A** = primary/standards (schema.org, Google Search Central), **B** = established references, **C** = empirical/applied industry analysis, **D** = unverified.

## Source Registry

| ID | Source | Authority | Date | Domain |
|----|--------|-----------|------|--------|
| [1] | [Google Search Central — Changes to HowTo and FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes) | A | 2023 (still in force 2026) | Rich-result deprecations, manual-action policy |
| [2] | [Google Search Central — FAQPage structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage) | A | 2026 | FAQPage gov/health restriction, current rules |
| [3] | [Discoverability — Schema Markup Complete Guide for SEO and AI Search 2026](https://discoverability.co/resources/schema-markup-guide/) | C | 2026 | 2.5× citation rate, AI-search structured-data correlation |
| [4] | [Hashmeta — Structured Data for AI Search Engines (ChatGPT, Perplexity, Google AI)](https://www.hashmeta.ai/en/blog/structured-data-for-ai-search-engines-the-complete-guide-to-schema-markup-for-chatgpt-perplexity-google-ai) | C | 2026 | 3.2× citation lift, FAQ + freshness signals |
| [5] | [Schema.org — TouristTrip](https://schema.org/TouristTrip) | A | 2026 | TouristTrip required/recommended properties, `itinerary` |
| [6] | [Google Search Central — Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) | A | 2026 | Article required vs recommended fields |
| [7] | [Google Search Central — Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product) | A | 2026 | Product + Offer + AggregateRating rules |
| [8] | [Schema Pilot — JSON-LD Complete Guide 2026 (multiple blocks vs @graph)](https://www.schemapilot.app/blog/json-ld-guide/) | B | 2026 | @graph + @id pattern, Google preference |
| [9] | [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/) | A | 2026 | Current validator URLs, validation workflow |

## Verified Claims

### Rich-result deprecations
- **HowTo rich results retired (desktop + mobile, 2023–2024 rollout, fully gone by 2025)** [1] — **Supported**. HowTo schema still parses but produces no SERP enhancement.
- **FAQPage rich-result display restricted to "well-known authoritative gov and health sites"** [1][2] — **Supported**. Direct Google policy statement.
- **Schema for content not visible on the page is a manual-action target** [1] — **Supported**.
- **Faking `AggregateRating` is a manual-action target** [1][7] — **Supported**.

### AI-citation correlation
- **Pages with structured data cited 2.5–3.2× more often in AI search** [3][4] — **Supported**. Multiple independent industry analyses (BrightEdge, Hashmeta, Discoverability) converge on the 2.5×–3.2× range. Note: a Dec 2024 Search/Atlas study found no correlation; this is captured in the SKILL.md framing as "well-formed" schema rather than presence alone.
- **FAQPage still drives high citation density on Perplexity and ChatGPT despite Google rich-result deprecation** [4] — **Supported**.
- **Pages updated within 3 months cited ~2× more often by AI engines** [4] — **Partially Supported** (industry observation, secondary citation).

### JSON-LD structure
- **Google accepts both multiple `<script>` blocks and a single `@graph` block** [8] — **Supported**.
- **`@graph` with `@id` cross-references is the 2026 best practice when entities relate to each other** [8] — **Supported**. Reflects Google's AI Mode treating schema as an entity-relationship trust signal, not just a display trigger.

### Type-specific properties
- **TouristTrip key properties: `name`, `itinerary`, `offers`, `provider`, `touristType`, `arrivalTime`, `departureTime`** [5] — **Supported** (direct from schema.org).
- **Article required: `headline`, `datePublished`, `author`, `image`** (recommended: `dateModified`, `publisher`, `mainEntityOfPage`) [6] — **Supported**.
- **Product + Offer required: `name`, `image`, `offers` with `price`, `priceCurrency`, `availability`** [7] — **Supported**.

### Validators
- **Google Rich Results Test current URL: `https://search.google.com/test/rich-results`** [9] — **Supported**.
- **Schema.org Validator current URL: `https://validator.schema.org/`** [9] — **Supported**. (Successor to the deprecated Structured Data Testing Tool.)

## Contradictions Resolved

**Does schema markup actually correlate with AI citations?** Industry sources (Hashmeta, Discoverability, BrightEdge cited via [3][4]) report 2.5–3.2× citation lift; a Dec 2024 Search/Atlas study found no correlation between schema coverage and citation rate. Resolution: the lift appears tied to *well-formed, content-accurate* schema, not raw presence. SKILL.md frames this as "populate from real content" rather than "more schema = more citations" and discourages over-schema on thin pages.

**FAQPage — useful or dead?** Google [1][2] effectively killed the rich-result surface; AI-search studies [4] show it remains one of the highest-density citation drivers. Resolution: keep FAQPage schema for AI consumption, but don't add it expecting Google rich results.

## Gaps and Estimates

- **Exact AI-citation lift varies by study** (2.5×–3.2× range cited in SKILL.md). No single primary academic source; treated as directionally correct from converging industry analyses.
- **Schema.org type deprecation cadence in 2026 onward** — Google announced 7 retired structured-data features for 2025–2026 rollout; details still partially in flux. The "Lifecycle" section advises annual re-audit rather than committing to specific types.

## Methodology Note

Built via the `enrichment` skill: 5 parallel WebSearch queries covering rich-result deprecations, JSON-LD `@graph` best practice, AI-search citation correlation, type-specific required properties, and current validator URLs. Cross-referenced for contradictions; primary Google + schema.org sources weighted highest; converging industry analyses used for empirical claims.

## Changelog

- **2026-04-27**: Initial knowledge base, 9 sources, 5 parallel research queries.
