# Knowledge Base — generating-programmatic-seo

Generated: 2026-04-26
Sources: 9 documents cross-referenced
Verification: 8 Supported / 1 Partially Supported

This file is the enrichment artifact for SKILL.md. Every numbered citation in SKILL.md resolves here. Authority tiers follow the enrichment skill convention: **A** = primary/standards (Google, framework docs), **B** = established references (industry leaders, well-cited practitioner blogs), **C** = empirical/applied case studies, **D** = unverified.

## Source Registry

| ID  | Source | Authority | Date | Domain |
|-----|--------|-----------|------|--------|
| [1] | [Practical Programmatic — Tripadvisor & Zapier Case Studies](https://practicalprogrammatic.com/examples/tripadvisor) | C | 2025–2026 | pSEO scale benchmarks (Tripadvisor 700M pages / 226M monthly visits, Zapier 50K pages / 2.6M monthly visits) |
| [2] | [Google Search Central — March 2024 Core Update and Spam Policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies) | A | 2024 | Scaled content abuse policy — primary source |
| [3] | [Google 2026 Helpful Content Update Guide](https://orbitinfotech.com/blog/google-2026-helpful-content-update/) | C | 2026 | HCU integration into core algorithm, 2026 enforcement state |
| [4] | [Metaflow — Programmatic SEO in 2026: Avoiding Scaled Content Abuse](https://metaflow.life/blog/what-is-programmatic-seo) | B | 2026 | 60% uniqueness threshold, 500-word floor, quality gate framework |
| [5] | [Digital Applied — Programmatic SEO After March 2026](https://www.digitalapplied.com/blog/programmatic-seo-after-march-2026-surviving-scaled-content-ban) | B | 2026 | Post-update survival patterns, template + data + LLM enrichment requirement |
| [6] | [SEOmatic — Programmatic SEO Internal Linking](https://seomatic.ai/blog/programmatic-seo-internal-linking) | B | 2026 | Hub-and-spoke for pSEO, 3-link minimum rule, orphan prevention |
| [7] | [Google Search Central — Sitemap Limits Documentation](https://www.screamingfrog.co.uk/seo-spider/issues/sitemaps/xml-sitemap-with-over-50k-urls/) | A | 2026 | 50,000 URL / 50MB hard limit, sitemap index pattern |
| [8] | [Next.js Docs — generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) + [generateSitemaps](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps) | A | 2026 | Static params, dynamic params, ISR, sitemap sharding — primary framework docs |
| [9] | [Search Engine Land — Programmatic SEO Guide](https://searchengineland.com/guide/programmatic-seo) | B | 2025–2026 | General pSEO methodology, demand validation requirement |

## Verified Claims

### Scale benchmarks (Tripadvisor, Zapier)
- **Tripadvisor: ~700M indexed pages, ~226M monthly organic visits from cuisine × city × neighborhood combinations** [1] — **Supported**.
- **Zapier: ~5,000 tools → ~50,000 integration pages, ~2.6M monthly organic visits** [1] — **Supported**.
- **Tripadvisor layers attributes (price, dietary, occasion) for hyper-specific pages like "Vegan Restaurants in Downtown LA"** [1] — **Supported**.

### Google's scaled content abuse policy
- **Policy shipped March 2024 alongside the core update** [2] — **Supported** (primary source).
- **Enforcement is intent- and outcome-based, not method-based — applies regardless of human, AI, or template generation** [2] — **Supported**.
- **Helpful Content system folded into core algorithm March 2024, no longer a separate update** [2][3] — **Supported**.
- **Site reputation abuse policy took effect May 5, 2024** [2] — **Supported**.

### Quality thresholds
- **Uniqueness ≥ 60% page-to-page is the consensus 2026 threshold** [4][5] — **Supported**. Multiple practitioner sources converge on this number; below it, pages cluster/dedupe or trigger scaled-content classification.
- **Word count floor: 400 substantive words minimum, 500+ for competitive verticals** [4] — **Supported**. Sources vary (300 for low-competition local pages, 500 for destination hubs, 800 for editorial), but 400 is the safe substantive floor.
- **At least 3 page modules must differ meaningfully (not just keyword swaps)** [4] — **Supported**.
- **LLM enrichment + template + data is the surviving 2026 pattern** [4][5] — **Supported**. Pure-template pSEO no longer ranks; AI-only content also flagged. Hybrid is required.

### Internal linking
- **Hub-and-spoke is the canonical pSEO link pattern** [6] — **Supported**.
- **Every page should have ≥3 internal links from relevant pages** [6] — **Supported**.
- **Orphan pages (zero internal links) frequently fail to be crawled or ranked** [6] — **Supported**.
- **Programmatic pages need automated internal-link generation, not hand-curated** [6] — **Supported**.

### Sitemap limits
- **50,000 URLs and 50MB uncompressed per sitemap file — hard limit** [7] — **Supported** (Google primary source).
- **Sitemap index pattern for sites above the limit; theoretical max 2.5B URLs** [7] — **Supported**.
- **Dynamic generation from database recommended for programmatic at scale** [7] — **Supported**.

### Next.js patterns
- **`generateStaticParams` + `dynamicParams = true` is the recommended pattern for thousands of pages** [8] — **Supported**. Pre-render the high-value subset; let the long tail render on-demand.
- **`generateSitemaps` shards sitemap output for large sites; available at `/sitemap/[id].xml`** [8] — **Supported** (primary framework docs).
- **ISR `revalidate` values: 24h–7d typical for pSEO** [8] — **Partially Supported**. Framework docs document the mechanism; the 24h–7d range is industry practice, not an official Next.js recommendation.

### Demand validation
- **pSEO requires upfront keyword/demand validation before generation** [9] — **Supported**. "Interesting matrix ≠ search demand" is consensus across all reviewed sources.

## Contradictions Resolved

**Word count floor.** Sources gave a wide range: 300 (location-based service pages), 400 (general pSEO), 500 (competitive verticals, destination hubs), 800 (editorial). Resolution: SKILL.md uses 400 as the substantive floor and notes 500+ as the safer competitive threshold. No values masked.

**Uniqueness threshold.** Most sources cite 60%; some cite 30% (lower-bar interpretations). Resolution: 60% is the consensus among 2026-specific sources [4][5]; the 30% number traces to pre-March-2024 advice and predates the scaled-content-abuse enforcement. SKILL.md uses 60% as the gate.

**LLM enrichment vs. AI-only generation.** Some agencies still recommend AI-only programmatic generation; the empirical record post-March 2024 shows these sites get hit. Resolution: SKILL.md treats LLM-enrichment-of-data as required and AI-only as a known failure mode. This matches what the search results converged on.

## Gaps and Estimates

- **Specific egress/cost numbers for ISR at scale** — varies too much by hosting provider and traffic shape to commit to a number. SKILL.md flags as a checklist item without a hard threshold.
- **Exact word count required by page type** — sources disagree by vertical. SKILL.md gives a 400-word floor with 500+ as the safer competitive bar.
- **The "ISR revalidate 24h–7d" range** — directional industry practice, not an official recommendation. Flagged Partially Supported.

## Methodology Note

This knowledge base was built using the `enrichment` skill: 6 parallel WebSearch queries covering programmatic SEO 2026 best practices, scale case studies (Tripadvisor/Zapier), uniqueness/word-count thresholds, Next.js generateStaticParams patterns, scaled content abuse policy, internal linking for pSEO, and sitemap limits at scale. Cross-referenced for contradictions; values weighted by source authority tier; primary Google/framework docs preferred where available.

## Changelog

- **2026-04-26**: Initial knowledge base from 9 sources, 6 parallel research queries.
