# Knowledge Base — optimizing-for-generative-engines

Generated: 2026-04-26
Sources: 9 documents cross-referenced
Verification: 7 Supported / 2 Partially Supported

This file is the enrichment artifact for the SKILL.md. Every numbered citation in SKILL.md resolves here. Authority tiers follow the enrichment skill convention: **A** = primary/standards, **B** = established references, **C** = empirical/applied, **D** = unverified.

GEO citations are reused from the `finding-underserved-keywords/SOURCES.md` knowledge base where overlap exists; new sources cover per-platform LLM citation behavior, E-E-A-T's role in AI citations, citation pattern research, and freshness windows.

## Source Registry

| ID  | Source | Authority | Date | Domain |
|-----|--------|-----------|------|--------|
| [1] | [AI Magicx — GEO: Getting Cited in ChatGPT, Claude, and Perplexity](https://www.aimagicx.com/blog/generative-engine-optimization-chatgpt-perplexity-2026) | C | 2026 | Citation tactics, FAQ density, stat-with-source |
| [2] | [GenOptima — Generative Engine Optimization Best Practices: The Complete 2026 Playbook](https://www.gen-optima.com/blog/generative-engine-optimization-best-practices-complete-2026-playbook/) | C | 2026 | Triple-schema stacking, listicle format, citation rate growth |
| [3] | [Position Digital — 150+ AI SEO Statistics for 2026 (April update)](https://www.position.digital/blog/ai-seo-statistics/) | C | 2026 | AI search share, traffic loss by content type |
| [4] | [Discovered Labs — AI Citation Patterns: How ChatGPT, Claude, and Perplexity Choose Sources](https://discoveredlabs.com/blog/ai-citation-patterns-how-chatgpt-claude-and-perplexity-choose-sources) | C | 2026 | Per-platform citation counts, schema correlation, platform overlap |
| [5] | [Profound — AI Platform Citation Patterns](https://www.tryprofound.com/blog/ai-platform-citation-patterns) | C | 2026 | Wikipedia/Reddit dominance per platform |
| [6] | [Rankeo — How to Get Cited by ChatGPT, Perplexity & Claude (2026 Guide)](https://rankeo.io/blog/how-to-get-cited-by-chatgpt-perplexity-claude) | C | 2026 | Extractable structure, definitive language, schema requirements |
| [7] | [LLMrefs — GEO 2026 Guide](https://llmrefs.com/generative-engine-optimization) | C | 2026 | AI search share, platform citation behavior (reused from finding-underserved-keywords) |
| [8] | [Qwairy — E-E-A-T for AI: +40% Citations with Credentials (2026)](https://www.qwairy.co/blog/eeat-for-ai-authority-signals-guide) | C | 2026 | Author credentials, E-E-A-T's role in AI citation |
| [9] | [ALM Corp — Content Decay Guide](https://almcorp.com/blog/content-decay/) | B | 2025–2026 | Recency windows, citation decay, fresh-content cadence (reused) |

## Verified Claims

### AI search share and impact (2026)
- **AI platforms take 15–20% of informational query volume from traditional search** [3] — **Supported**. Consistent with the 12–18% range cited in the sibling skill; numbers have crept up across the year.
- **Non-branded informational traffic down 15–30% across content sites; eCommerce loss 5–15%** [3] — **Supported**.
- **ChatGPT has 80.49% AI chatbot market share but shed 22.2 pp of Gen AI traffic share Jan 2025 → Jan 2026** [3] — **Supported**. Indicates consolidation, not collapse — Perplexity and Gemini are taking share.

### Per-platform citation behavior
- **ChatGPT cites 2–4 sources per answer; Perplexity cites 4–8; Claude cites only when web search is active and prefers fewer, higher-authority sources** [4] — **Supported**.
- **Wikipedia accounts for 47.9% of ChatGPT's top-10 citations; Reddit dominates Perplexity (6.6%) and Google AI Overviews (2.2%)** [5] — **Supported**.
- **Only 11% of websites earn citations from both ChatGPT and Perplexity** [4] — **Supported**. Strongest evidence for per-platform tuning.

### Content patterns that get cited
- **Front-loaded answer capsules + question-based H2s + definitive language drive extractability** [6] — **Supported**.
- **Triple-stack `Article + ItemList + FAQPage` schema correlates with high citation rates; "Top N" structured content accounts for 74.2% of AI citations in measured verticals** [2] — **Partially Supported**. The 74% figure is single-source and vertical-specific; directionally correct but should not be cited as universal.
- **45% of most-cited pages use `Person` schema; 47% use `BreadcrumbList`** [4] — **Supported**.
- **Comparison tables are among the most-cited content formats** [2] — **Supported**.

### E-E-A-T and authorship
- **Content from authors with visible credentials receives 40% more citations from AI models** [8] — **Supported**.
- **96% of AI Overview citations come from sources with strong E-E-A-T signals** [8] — **Supported**.
- **AI engines cross-reference author names against LinkedIn, professional directories, and publication history** [8] — **Supported**.

### Freshness and citation decay
- **Content updated within the past 12 months earns 3.2× more citations than content older than 24 months** [4] — **Supported**. (501-site benchmark.)
- **Pages updated within the last 3 months get cited ~2× more often by AI engines** [9] — **Supported** (secondary citation; reused from sibling skill).
- **AI engines update citation choices within days, not weeks** [9] — **Supported**.
- **Brands following structured GEO see citation rates climb from near-zero to double-digit % within 60 days** [2] — **Partially Supported**. Vendor-reported; directionally consistent with multiple GEO case studies but not independently audited.

### AI Overviews specifics
- **Only 38% of AI Overview citations come from top-10 ranked pages, down from ~76% in earlier studies** [2] — **Supported**. AI Overviews increasingly surface structured content that classic SEO underrates.

### Anti-patterns
- **`llms.txt` adoption ~10% of domains; effect on AI citations unproven** [9] (carried forward from `auditing-technical-seo` SOURCES) — **Supported**.

## Contradictions Resolved

**ChatGPT's Reddit vs Wikipedia preference.** Sources [4] and [5] frame ChatGPT slightly differently — [4] emphasizes Wikipedia (47.9% of top-10), [5] notes Reddit dominance in conversational answers. Resolution: both are correct; ChatGPT's source mix shifts by query type (factual → Wikipedia; community/opinion → Reddit). SKILL.md cites both behaviors without committing to a single number.

**AI search share — 12–18% vs 15–20%.** The sibling skill (`finding-underserved-keywords`) cites 12–18% from Q1 2026 data [7]; Position Digital's April update [3] cites 15–20%. Resolution: SKILL.md uses 15–20% as the more recent number; the share is growing, so older values are not wrong, just stale.

## Gaps and Estimates

- **No primary source for the 14-day citation-decay window.** Carried as informed estimate from the sibling skill; framed as a tactical heuristic for re-poll cadence rather than a hard claim.
- **Schema correlation studies (47% BreadcrumbList, 45% Person) are single-source.** Discovered Labs is reputable but the underlying dataset is not independently published.
- **"Citation rates climb to double-digit % in 60 days" is vendor-reported.** Treated as Partially Supported; do not cite as a guarantee in client work.

## Methodology Note

Built using the `enrichment` skill: 4 parallel WebSearch queries covering per-platform citation patterns, GEO best practices and schema correlation, AI search traffic share for 2026, and E-E-A-T signals in AI citation. Cross-referenced against the existing `finding-underserved-keywords/SOURCES.md` and `auditing-technical-seo/SOURCES.md` to maintain shared-citation consistency across the seo-superpower plugin.

## Changelog

- **2026-04-26**: Initial knowledge base — 9 sources, 4 parallel research queries, 3 sources reused from sibling skills for citation consistency.
