# Knowledge Base — optimizing-on-page

Generated: 2026-04-27
Sources: 7 documents cross-referenced
Verification: 7 Supported

This file is the enrichment artifact for the SKILL.md. Every numbered citation in SKILL.md resolves here. Authority tiers: **A** = primary/standards, **B** = established references, **C** = empirical/applied, **D** = unverified.

## Source Registry

| ID  | Source | Authority | Date | Domain |
|-----|--------|-----------|------|--------|
| [1] | [Zyppy — Best Title Tag Length for Google SEO (Latest Data)](https://zyppy.com/title-tags/meta-title-tag-length/) | C | 2026 | Title tag pixel-width study |
| [2] | [Straight North — How to Optimize Title Tags & Meta Descriptions in 2026](https://www.straightnorth.com/blog/title-tags-and-meta-descriptions-how-to-write-and-optimize-them-in-2026/) | B | 2026 | Meta description length, mobile truncation |
| [3] | [Conductor — How to Structure H1–H6 Headings for SEO and AI](https://www.conductor.com/academy/headings/) | B | 2026 | Heading hierarchy, single H1, AI Overview parsing |
| [4] | [Traffic Think Tank — 7 Internal Linking Best Practices for SEOs (2026)](https://trafficthinktank.com/internal-linking-best-practices/) | B | 2026 | Anchor text variety, link density, placement |
| [5] | [Google Search Central — Image SEO Best Practices](https://developers.google.com/search/docs/appearance/google-images) | A | 2026 | Alt text, decorative images, keyword-stuffing penalty |
| [6] | [Digital Applied — Featured Snippets in the AI Overview Era: 2026 Guide](https://www.digitalapplied.com/blog/featured-snippets-ai-overview-era-optimization-2026) | C | 2026 | Featured snippet word counts, paragraph structure |
| [7] | [Unlighthouse — Lighthouse SEO Audit: All 8 Checks](https://unlighthouse.dev/learn-lighthouse/seo) | B | 2026 | Lighthouse SEO category audits — shared with auditing-technical-seo |

## Verified Claims

### Title tags
- **Title tag truncates beyond ~600 pixels (≈50–60 chars); pixel width is the real limit, not character count** [1] — **Supported**.
- **Primary keyword should land in the first 30–35 characters** [1] — **Supported**.
- **Google rewrites titles when they exceed 600px or look spammy/clickbait** [1] — **Supported**.

### Meta descriptions
- **Optimal range 140–158 characters; mobile truncates closer to 120 characters** [2] — **Supported**.
- **Place primary keywords and value prop within the first 120 characters** [2] — **Supported**.
- **Meta description is not a direct ranking factor; it's a CTR lever** [2] — **Supported**.

### Heading structure
- **One H1 per page is best practice** [3] — **Supported**.
- **Don't skip heading levels (H1→H3 or H2→H4)** [3] — **Supported**.
- **AI Overviews preferentially cite content with a clear heading hierarchy** [3] — **Supported**.

### Internal linking
- **2–5 contextual links per 1,000 words; cap total page links at ~150** [4] — **Supported**.
- **Anchor text mix: ~15–25% exact match, 30–40% partial match, 25–35% semantic variant** [4] — **Supported**.
- **Top 30% of body content carry more weight than footer/nav links** [4] — **Supported**.
- **Generic anchors fail accessibility and provide no semantic signal** [4] — **Supported**.

### Alt text
- **Descriptive alt text 50–125 characters; avoid "image of" / "picture of" prefixes** [5] — **Supported**.
- **Decorative images should use `alt=""`** [5] — **Supported**.
- **Keyword-stuffed alt text is a spam signal** [5] — **Supported** (explicit Google docs).

### Featured snippets
- **Paragraph snippets perform best at 40–50 words** [6] — **Supported**.
- **Pattern: H2 phrased as question + immediate concise answer paragraph** [6] — **Supported**.
- **Featured snippets generate 30–40% CTR lift over position 1 for queries where they appear** [6] — **Supported**.

### Lighthouse SEO baseline
- **Lighthouse runs 8 pass/fail SEO audits** [7] — **Supported** (cross-references `auditing-technical-seo/SOURCES.md`).
- **Lighthouse SEO does not evaluate content quality, intent match, or featured-snippet readiness** [7] — **Supported**.

## Contradictions Resolved

**Title-tag character vs. pixel limits.** Sources split: some quote 50/60/70-character limits; primary data says pixel width (~600px) is what Google truncates on [1]. Resolution: SKILL.md leads with pixel-width as the rule and gives 50–60 chars as the practical heuristic.

**Anchor-text exact-match thresholds.** Sources cite different mixes (15–25% vs. 40% exact match) [4]. Resolution: SKILL.md uses the conservative ~15–25% exact-match figure, the more commonly recommended ratio in 2026 guides.

## Gaps and Estimates

- **Brand-doubling in title penalty** — observed empirically (the Vibecrafting trip-page bug) but no primary Google statement; treated as a rewrite-trigger heuristic.
- **AI-citation lift from alt text** — industry consensus, no controlled study quantifying the effect; treated as directional.
- **Internal-link CTR lift (35%)** — single industry study [4]; treated as supportive, not authoritative.

## Methodology Note

Built using parallel WebSearch queries covering: title tag pixel width, meta description mobile truncation, H1/H2 structure, internal linking, image alt text, featured snippet capture. Authority weighting prioritized Google primary docs ([5]) and the shared Lighthouse reference ([7]); secondary sources used for empirical thresholds.

## Changelog

- **2026-04-27**: Initial knowledge base from 7 sources, 6 parallel research queries.
