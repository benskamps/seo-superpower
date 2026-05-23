# GEO Landscape — May 2026 Enrichment Pass

**Project:** seo-superpower (v0.3.1 shipping → v3 roadmap)
**Generated:** 2026-05-22
**Author:** win-claude-opus (night-shift round 2, 5/5)
**Scope:** Generative Engine Optimization landscape, May 2026. AI-search citation game + classical-SEO integration + tooling. Aimed at the v3 roadmap and the post-v3 backlog.
**Out of scope:** Claude Code plugin ecosystem / distribution / marketplace dynamics (sibling agent's lane).
**Pairs with:** existing `skills/optimizing-for-generative-engines/SOURCES.md` (Apr 26, 2026) — this doc updates and extends, doesn't replace.

---

## TL;DR — 12 moves the v3-and-beyond roadmap should incorporate

Ordered by leverage. Each links to the source section below.

1. **Add a `query-fan-out` simulator skill or MCP** to model the 6-8 synthetic queries Google AI Mode generates per user query. Mike King's Qforia is the public reference; building a free-tier equivalent (Gemini API, ~$0.001/query) gives every page a "what AI Mode will actually ask about this" preview before publishing. [§Agentic RAG]
2. **Re-weight the citation playbook around Reddit.** Reddit's share of AI citations grew 73% Oct 2025 → Jan 2026; Google added a "Community Perspectives" block to AI Overviews on **2026-05-07** pulling Reddit quotes inline. The existing skill mentions Reddit; v3 should add a `reddit-presence` companion skill (which subreddits, what answer shapes, ToS-safe seeding). [§May 2026 platform shifts] [§Per-platform tuning]
3. **Reframe llms.txt from "include as optional" to "include with a verdict."** SERanking 300k-domain study (Nov 2025) found no measurable citation lift; 500M-AI-bot-visit analysis found only 408 requested llms.txt directly. Anthropic publishes one but hasn't confirmed ClaudeBot reads it. The skill should say "publish if you're a docs site (Mintlify auto-does it); skip otherwise — it is not load-bearing." Stronger anti-hype stance than current language. [§llms.txt reality]
4. **Add an "answer-capsule density" linter** — a content-side check that measures: front-loaded first-sentence answers, stat-with-citation ratio per H2, FAQ-block presence, comparison-table presence. Outputs a score per page. iPullRank's "extractable claims per 100 words" framing is the academic version; we ship a free-tier MCP/script that does it on any URL. [§Answer-first content shape]
5. **Add an entity-establishment checklist** — Wikidata QID, Google Business Profile completeness, Crunchbase entry, schema.org `sameAs` cross-references, About-page facticity (founder, founded-date, HQ, NAP consistency). Entity recognition is now a citation-likelihood prerequisite; the 3-6 month timeline to a Knowledge Panel is part of the user's roadmap, not an afterthought. New skill candidate: `establishing-entity-presence`. [§Entity + Knowledge Graph]
6. **Add an AI-Mode CTR-defense playbook.** AI Overviews drop top-result CTR by 58% (Ahrefs Dec 2025) but AI-referred visitors convert at 14.2% vs. 2.8% organic (Yahoo Finance). The user's mature-content lifecycle needs a skill that names the conversion-rate tradeoff explicitly and gives a 5-tactic defense (in-content CTA reframing, comparison-table-as-decision-aid, citation-bait insertions). New skill candidate or extension of `refreshing-stale-content`. [§AI Overviews]
7. **Update the Wikipedia-vs-Reddit split in the existing skill.** The current SKILL.md cites 47.9% Wikipedia / 6.6% Reddit for Perplexity. The June 2025 cross-platform study (cited in 5W research) puts Reddit at 40.1% across all four engines and Wikipedia at 26.3%. Perplexity-specific: Reddit 46.7% top-10 citations. The numbers in the current skill are not wrong but are increasingly stale on the Reddit side. [§Per-platform tuning]
8. **Add author/E-E-A-T verification to schema-validate MCP.** Currently `schema-validate` checks 9 rich-result types. Add a check that verifies `Article.author` resolves to a `Person` with `sameAs` LinkedIn/Wikipedia and a real `url` to an author bio page. AI engines cross-reference author names against LinkedIn and publication history; missing the linkback breaks the chain. Cheap addition; high payoff. [§E-E-A-T]
9. **Ship a JS-rendered-schema detector.** AI crawlers parse server-rendered HTML; client-side JSON-LD (SPAs) is invisible. Add a check that fetches with `User-Agent: GPTBot` and asserts JSON-LD is present in the raw HTML, not just after hydration. This is a single-line addition to `auditing-technical-seo`'s No-MCP fallback and catches a common silent failure. [§Schema for GEO]
10. **Position vs. dedicated AI-tracking tools** — Profound/Otterly/Athena/Peec/Ayzeo all run prompt polling. `geo-check` does the same thing free; the moat is: (a) git-integrated diff (correlate citation losses to recent commits), (b) MCP-native (lives in Claude Code, not a SaaS), (c) free-tier. Lean into those three rather than racing the SaaS feature checklists. The "GEO Diff Bot" in VISION.md §5 is the right frame; build it concretely as a default-on canary. [§Tooling landscape]
11. **Add a B2B/LinkedIn track.** LinkedIn became ChatGPT's 5th-most-cited source between Dec 2025 and mid-Feb 2026; 70%+ of LinkedIn's citations go to 500-2000 word articles. The plugin currently doesn't address LinkedIn presence; for B2B users (a significant slice of "technical builders"), this is a citation channel separate from on-site. New skill candidate: `linkedin-presence-for-citations` or fold into `building-eeat-and-authority`. [§Local + B2B]
12. **Document the "agentic search" thesis as a versioned doctrine.** Mike King's May 2026 essays argue every major engine is now agentic (multi-pass retrieval, query fan-out, planner-driven). The plugin's current framing treats AI search as a single-shot retrieval; v4 should treat it as an agent's research session. Concretely: pages should be cite-worthy on the *follow-up* queries, not just the surface query. Add this as a doctrine note in `optimizing-for-generative-engines` and in VISION.md. [§Agentic RAG]

---

## Source Registry

Authority tiers per the enrichment skill: **A** = primary/peer-reviewed/standards. **B** = recognized practitioners + named research. **C** = SEO publications. **D** = blog posts of unverified provenance.

| ID | Source | Authority | Date | Domain |
|----|--------|-----------|------|--------|
| [P1] | [Aggarwal et al., "GEO: Generative Engine Optimization", KDD 2024 (arXiv 2311.09735)](https://arxiv.org/pdf/2311.09735) | **A** | Nov 2023 → KDD Aug 2024 | Foundational GEO paper |
| [P2] | [iPullRank — "Beyond RAG: Why Every AI Search Platform Is Now Agentic"](https://ipullrank.com/agentic-rag) | **B** | 2026 | Agentic search architecture |
| [P3] | [iPullRank — "How AI Mode Works"](https://ipullrank.com/how-ai-mode-works) | **B** | 2026 | Patent-based AI Mode analysis |
| [P4] | [Mike King via PPC Land — "Google's AI search guide serves platform over the open web"](https://ppc.land/mike-king-googles-ai-search-guide-serves-platform-over-the-open-web/) | **B** | 2026-05-18 | Critique of Google's GEO guidance |
| [P5] | [SearchEngineLand — "Query Fan-Out: What is it and how does it work"](https://searchengineland.com/guide/query-fan-out) | **C** | 2026 | Query fan-out mechanics |
| [P6] | [SearchEngineLand — "How to create answer-first content that AI models actually cite"](https://searchengineland.com/guide/how-to-create-answer-first-content) | **C** | 2026 | Answer-first content shape |
| [P7] | [Profound — "AI Platform Citation Patterns"](https://www.tryprofound.com/blog/ai-platform-citation-patterns) | **B** | 2026 | 30M-citation study Aug 24 → Jun 25 |
| [P8] | [PRNewswire / 5W Research — "Wikipedia and Reddit Now Drive Over 25% of ChatGPT Citations in the U.S."](https://www.prnewswire.com/news-releases/wikipedia-and-reddit-now-drive-over-25-of-chatgpt-citations-in-the-us-new-5w-research-finds--wsj-nyt-and-bloomberg-do-not-appear-in-the-top-20-302768339.html) | **B** | Q1 2026 | ChatGPT US citation share |
| [P9] | [TechCrunch — "Google updates AI search to include quotes from Reddit and other sources"](https://techcrunch.com/2026/05/06/google-updates-ai-search-to-include-expert-advice-from-reddit-and-other-web-forums/) | **C** | 2026-05-06 | AI Overviews Community Perspectives launch |
| [P10] | [Nobori — "AI Overviews Add Reddit Community Perspectives"](https://nobori.ai/blog/google-ai-overviews-community-perspectives-reddit-citations-2026) | **C** | 2026-05-07 | 5 May 2026 AI Mode updates |
| [P11] | [SaasIntelligence — "Reddit's AI Citation Share Just Grew 73% in the Categories That Matter"](https://saasintelligence.substack.com/p/reddits-ai-citation-share-just-grew) | **C** | 2026 | Reddit citation growth Oct 25 → Jan 26 |
| [P12] | [Las Vegas Sun / Ahrefs — "Google's AI Overviews Now Cost Websites 58% of Their Clicks"](https://lasvegassun.com/news/2026/may/19/new-research-googles-ai-overviews-now-cost-website/) | **C** | 2026-05-19 | AIO CTR impact |
| [P13] | [ALM Corp — "Google AI Overviews and Organic CTR in 2026"](https://almcorp.com/blog/google-ai-overviews-organic-ctr-2026/) | **C** | 2026 | AIO CTR data, query type breakdown |
| [P14] | [Heroic Rankings — "Google AI Overview Statistics: 2026 Trends and Impact"](https://heroicrankings.com/seo/managed/google-ai-overview-statistics-2026/) | **C** | 2026 | AIO coverage rate by query type |
| [P15] | [Codersera — "llms.txt Explained (May 2026)"](https://codersera.com/blog/llms-txt-complete-guide-2026/) | **C** | 2026-05 | llms.txt adoption + Mintlify role |
| [P16] | [PresenC AI — "State of llms.txt 2026"](https://presenc.ai/research/state-of-llms-txt-2026) | **C** | 2026 | llms.txt adoption stats |
| [P17] | [Mintlify — "The value of llms.txt: Hype or real?"](https://www.mintlify.com/blog/the-value-of-llms-txt-hype-or-real) | **B** | 2026 | First-party tooling vendor analysis |
| [P18] | [PPC Land — "llms.txt adoption stalls as major AI platforms ignore proposed standard"](https://ppc.land/llms-txt-adoption-stalls-as-major-ai-platforms-ignore-proposed-standard/) | **C** | 2026 | 500M AI-bot-visit analysis |
| [P19] | [Kai Spriestersbach via Medium — "The llms.txt is dead. More precisely: a dud"](https://medium.com/@kaispriestersbach/the-llms-txt-is-dead-more-precisely-a-dud-ab7bee4f469c) | **D** | 2026 | Contrarian view on llms.txt |
| [P20] | [SearchEngineLand — "Schema markup AI search no hype"](https://searchengineland.com/schema-markup-ai-search-no-hype-472339) | **C** | 2026 | Schema parsing path: data-to-text |
| [P21] | [Stackmatix — "Structured Data AI Search: Schema Markup Guide 2026"](https://www.stackmatix.com/blog/structured-data-ai-search) | **C** | 2026 | 6 schema types matter most in 2026 |
| [P22] | [Discovered Labs — "Entity Recognition & Knowledge Graphs"](https://discoveredlabs.com/blog/entity-recognition-knowledge-graphs-how-to-structure-your-brand-for-ai-understanding) | **C** | 2026 | Entity SEO playbook |
| [P23] | [Over The Top SEO — "Wikidata for SEO"](https://www.overthetopseo.com/wikidata-seo-entity-knowledge-graph-2/) | **C** | 2026 | Wikidata QID role in AI citation |
| [P24] | [Conductor — "Top 10 AEO Tools to Get You Cited in AI Search"](https://www.conductor.com/academy/best-aeo-geo-tools/) | **C** | 2026 | Tool landscape overview |
| [P25] | [Ayzeo — "AI Chatbot Citation Tracking Platforms: 5 Tools Compared"](https://ayzeo.com/blog/ai-chatbot-citation-tracking-platforms) | **C** | 2026 | Profound/Otterly/Athena/Peec/Ayzeo comparison |
| [P26] | [Aleyda Solis — "AI Search Optimization Roadmap" (Speaker Deck)](https://speakerdeck.com/aleyda/the-ai-search-optimization-roadmap-by-aleyda-solis) | **B** | 2026 | Practitioner roadmap |
| [P27] | [Salespeak — "10 Generative Engine Optimization Experts Worth Following in 2026"](https://salespeak.ai/aeo-news/top-experts-generative-engine-optimization) | **D** | 2026 | Practitioner overview |
| [P28] | [Built In — "LinkedIn and AI Search: How to Get Discovered by Recruiters"](https://builtin.com/articles/how-to-optimize-linkedin-for-ai-search) | **C** | 2026 | LinkedIn citation growth |
| [P29] | [DemandConvert — "2026 Guide to AI Search for Plumbers"](https://demandconvert.com/learn/blog/2026-ai-search-for-plumbers/) | **C** | 2026 | Local services AI search |
| [P30] | [Yahoo Finance — "73% of B2B Buyers Use AI Tools in Purchase Research"](https://finance.yahoo.com/sectors/technology/articles/73-b2b-buyers-ai-tools-231200431.html) | **C** | 2026 | B2B AI conversion data |
| [P31] | [Position Digital — "150+ AI SEO Statistics for 2026"](https://www.position.digital/blog/ai-seo-statistics/) | **C** | 2026-04 | AI search share + traffic loss |
| [P32] | [Similarweb — "11 GEO Mistakes Keeping You Invisible to AI Search"](https://www.similarweb.com/blog/marketing/geo/geo-mistakes/) | **C** | 2026 | Anti-patterns |
| [P33] | [SearchEngineLand — "Black hat GEO is real"](https://searchengineland.com/black-hat-geo-pay-attention-463684) | **C** | 2026 | GEO manipulation tactics |

Plus the 9 sources already in `optimizing-for-generative-engines/SOURCES.md` (reused, not relisted here).

---

## Section 1: Definition, history, foundation

### Origin of "GEO"

The term was coined by **Aggarwal et al. (Princeton + Georgia Tech + Allen AI)** in arXiv 2311.09735, "GEO: Generative Engine Optimization," first posted Nov 2023, formally published at **KDD 2024** (Aug 2024). The paper introduced **GEO-Bench**, a benchmark over 10,000 queries, and tested optimization tactics against generative search engines. Headline finding: certain interventions could boost visibility in AI responses by up to **40%**, with effectiveness varying significantly by topic. The paper also documented that pages ranked 5th in traditional search saw a **115.1% visibility increase** in AI responses when proper citations were added. [P1] — **Supported**.

The framing in the paper is **citation visibility**, not "ranking" — they explicitly distinguish AI-search optimization from classical SEO. The 9 optimization methods they tested include citation addition, source quotation, statistic emphasis, fluency optimization, authority signaling, and several control conditions. This is the academic ancestor of nearly every "GEO playbook" in circulation. **Supported** [P1].

### Relationship to classical SEO

**GEO is a complement, not a successor.** The dominant view across practitioner sources in 2026 [P26, P27, P32, P33] is that classical SEO and GEO share a foundation (crawlability, indexability, content quality, schema markup, freshness) but diverge on tactics (keyword density irrelevant for GEO; quotable claims load-bearing; per-platform tuning matters because each engine indexes from different priors).

Aleyda Solis's distinctive framing: **before optimizing a single sentence for LLM citation, the bots that feed those LLMs have to fetch and parse your pages** [P26]. The crawl-and-render layer is shared with classical SEO; the citation-extraction layer is novel. **Supported**.

### What's new in May 2026

Mike King's May 2026 thesis [P2, P3, P4]: every major AI search platform is now **agentic** — they don't do one-shot retrieval anymore; they decompose, fan out queries, retrieve in multiple passes, and synthesize. This changes the optimization target from "the surface query" to "the planner's follow-up queries." See §Agentic RAG below. **Supported** with the caveat that King is a single (very informed) practitioner voice; the agentic framing is widely echoed but the implementation details are reverse-engineered from patents [P3, P5], not from disclosed Google docs.

---

## Section 2: Per-platform tuning — May 2026 state

### Market share (best available estimates as of May 2026)

Numbers vary by methodology; treat the absolute values as **Training-Confirmed** and the rank-order as **Supported**.

- **ChatGPT** holds ~**80.5%** of AI chatbot market share (down 22.2 pp YoY — losing share to Perplexity + Gemini, not collapsing) [P31]. 800M weekly active users.
- **Google AI Mode / AI Overviews** trigger on **~25%** of all queries by some measures, up to **50%** in US for some query-type slices [P14]. Different methodologies; both numbers cited widely.
- **Perplexity** ~22M MAU, ~50M weekly queries [P25, P31].
- **Claude** — citation behavior asymmetric: cites only when web search is invoked; favors fewer, higher-authority sources [existing SOURCES.md].
- **Grok 4.1** scores high on emotional intelligence + creative writing benchmarks; xAI-data-backed but minimal citation share visibility outside X-data queries [P11, P25].

### Citation source preferences — UPDATED numbers

This is where the existing SKILL.md needs an update. **Reddit's citation share has grown sharply across all major engines** between Oct 2025 and May 2026 [P9, P10, P11].

| Engine | Wikipedia | Reddit | YouTube | LinkedIn | Notes |
|--------|-----------|--------|---------|----------|-------|
| ChatGPT | 13.15% (US, Q1 2026) [P8] | 11.97% (US, Q1 2026) [P8]; 1.8% globally [existing] | — | — | Wikipedia dominant for factual; Reddit dominant for conversational |
| Perplexity | — | 46.7% of top-10 [P7]; 24% of all citations Jan 2026 [P11] | 13.9% (P7) | — | Reddit dominant |
| Gemini / AIO | — | 44% of social citations [P11] | — | — | Got Community Perspectives block 2026-05-07 [P9, P10] |
| Cross-platform (Jun 2025) | 26.3% [P11] | 40.1% [P11] | 23% [P11] | — | Reddit #1 across all 4 engines |

**Resolution of conflict with existing skill:** The current SOURCES.md cites Wikipedia at 47.9% for ChatGPT's top-10 from the Discovered Labs / Profound dataset. That was a top-10-citations-only measurement on an older corpus (Aug 2024 → Jun 2025). The newer 5W research [P8] and Profound updates [P7, P11] show **Reddit growing fast** in both ChatGPT and Perplexity, and the post-2026-05-07 Google AI Overviews change [P9, P10] increased Reddit's share in AIO citations. **Both are correct for their windows; the trend is rising-Reddit, declining-Wikipedia-dominance.** — **Supported**.

### LinkedIn's rise

LinkedIn more than doubled its domain rank on ChatGPT between Dec 2025 and mid-Feb 2026, becoming ChatGPT's **5th-most-cited source** [P28]. **70%+ of LinkedIn's citations go to articles 500-2000 words** [P28]. For B2B users this is a separate citation channel from on-site content. — **Supported**.

### Citation count per answer

Consistent across sources [P7, existing SOURCES.md]: ChatGPT cites 2-4 sources per answer; Perplexity cites 4-8; Claude cites only with web search on, prefers fewer + higher-authority; AI Overviews cite 5.31 avg for short responses, 28 avg for long (>6,600 char) responses [P12]. — **Supported**.

---

## Section 3: Google AI Overviews — coverage, CTR, ranking factors

### Coverage rate by query type

The widely-cited ~25% overall AIO trigger rate masks huge variation by intent:

- **Informational queries:** AIO appears **~36%** of the time [P13].
- **Commercial queries:** ~8% [P13].
- **Transactional queries:** ~5% [P13].
- **B2B technology queries:** **82%** trigger AIO [P9, P11] (massive jump from 36% earlier in 2025).
- US-wide overall: ranges quoted from **21% to 60%** depending on methodology [P14]. Lower bound is conservative, upper bound is some informational-query slices.

**Supported with caveats** — every source acknowledges methodology drift between studies.

### CTR impact

- **Ahrefs December 2025:** AI Overviews drop top-result CTR by **58%** [P12, P13].
- **Pew Research:** clicks fell from 15% to 8% when AIO is present [P13].
- **Seer Interactive longitudinal:** CTR on AIO queries dropped from 1.76% to 0.61% by Sep 2025, then **rebounded to 2.4% by Feb 2026** [P13] as users adapted.

The rebound is important — the panic of "AIO killed organic" was overstated. Conversion rates from AI-referred traffic are dramatically higher: **14.2% vs. 2.8% for Google organic** [P30]. Users arrive pre-qualified. — **Supported**.

### Ranking factors that promote AIO inclusion

From cross-referencing [P12, P13, P14] and the existing skill:

1. **Schema.org Article + ItemList + FAQPage triple-stack** (carried from existing skill, single-source 74.2%, **Partially Supported**).
2. **Structured comparison tables** [P10, P21].
3. **Recency** (`dateModified` within 12 months earns 3.2× more citations [existing]; pages updated within 3 months get ~2× more citations [existing]).
4. **Quotable stat-with-source lines** [P6].
5. **Author byline + Person schema linked to LinkedIn / Wikipedia** [P22, existing E-E-A-T data].
6. **Only 38%** of AIO citations come from top-10 ranked pages [existing] — meaning long-tail and structured content surfaces in AIO even without classical ranking.

### What demotes AIO inclusion

- **Thin content** (broad topics without specific intent-focused information) [P32].
- **Keyword-stuffed AI-generated content** without original insight [P32, P33].
- **Missing schema** or JS-rendered schema invisible to GPTBot [P21].
- **Paid links / link networks** — black-hat GEO is real; SearchEngineLand [P33] documents detection patterns.

### The AIO collapse / expansion controversy

May 2026 update [P9, P10]: Google shipped 5 changes to AI Overviews + AI Mode on **2026-05-07**:

1. **Community Perspectives** — pulls Reddit + niche forum + social quotes inline.
2. **Inline links within AI responses** positioned next to relevant text.
3. **Website hover previews** on desktop.
4. **"Further Exploration"** section with suggested next queries.
5. **Subscription-aware content labels** for publications users pay for.

Net effect: AIO is becoming richer (more inline links → better CTR than the "answer-only" version) but more competitive (Reddit getting featured slot). — **Supported**.

---

## Section 4: llms.txt — verdict by May 2026

The pattern is consistent across 4 of 5 sources [P15, P16, P17, P18, P19]: **adoption is shallow, evidence of citation effect is weak, major AI crawlers don't read it in volume.**

### Adoption (May 2026)

- **~5-15%** of websites have implemented llms.txt [P15, P16].
- Notable adopters: Anthropic, Stripe, Cursor, Cloudflare, Vercel, Mintlify, Supabase, LangGraph [P15].
- **Mintlify auto-generates llms.txt** for hosted projects (Nov 2024 rollout) — most adoption growth is mechanical from Mintlify's installed base, not deliberate publisher choice [P15, P17].

### Citation effect — the evidence

- **SERanking 300,000-domain study (Nov 2025):** llms.txt does **not measurably improve AI citations** [P18].
- **Cloudflare-scale analysis: 500M AI-bot visits over 90 days, only 408 requested llms.txt directly** [P18] — i.e., negligible for crawler traffic.
- **Counter-finding:** moderately positive correlation between curated llms.txt and Anthropic/Perplexity citation lift in some practitioner reports [P15] — but no controlled study confirms causation.
- **Anthropic's position:** publishes llms.txt at docs.claude.com but **has not publicly confirmed that Claude or ClaudeBot consumes the file at inference time** [P15]. Publishing ≠ reading.

### Verdict

`llms.txt` is **not load-bearing** for AI citation. Worth publishing **if you're a docs site** (low cost, possible discoverability win, signals brand-level care to a small fraction of crawlers). **Skip otherwise.** — **Supported**.

### Implication for seo-superpower

Current skill flags llms.txt as "suggestion only, not a fix" — that's correct. The v3 enhancement should be:
- **For docs-style sites:** include a `templates/llms.txt` generator (low effort, modest upside).
- **For content/marketing sites:** explicitly recommend skipping it and channeling that effort into entity-establishment or Reddit presence.
- **Don't add an llms.txt generator skill** — the ROI doesn't justify a top-level skill in the registry.

---

## Section 5: Answer-first content shape — the citation-extraction surface

### Core principle

LLMs lift content that's **extractable** — meaning the model's retrieval pipeline can pull a single clean span and use it directly. The optimization target is **extractability per 100 words**, not engagement-per-page-load. [P6, P2].

### Concrete tactics (cross-validated across [P6, P2, existing skill, P26])

1. **First sentence = the answer.** Front-load the canonical claim before any preamble. — **Supported** [P6, existing].
2. **Question-shaped H2s with concise answers underneath.** Each H2-answer pair is a citable unit. — **Supported** [P6, existing].
3. **Stat-with-citation lines.** "X grew 47% YoY according to [source]" beats "X grew significantly." [P6, existing] — **Supported**.
4. **Comparison tables.** AI engines lift tables whole into answers; structured Top-N formats reportedly account for **74.2%** of AI citations in some verticals [existing, P10] — **Partially Supported** (single-source figure).
5. **Move stats out of image captions and into body text.** Content with key stats in plain text near top of sections is more likely to be cited [P6] — **Supported**.
6. **TL;DRs at the top.** Models extract TL;DR blocks at high rates [P6] — **Supported**.
7. **Listicles with numbered entries.** Each numbered entry becomes a citable point [existing] — **Supported**.

### The tension with engagement SEO

Classical engagement SEO opens with a hook, builds curiosity, delays the answer. **GEO inverts this.** The conflict is real, not theoretical — practitioners report that A/B tests show GEO-optimized openings can lower bounce-rate-to-target metrics while raising citation rates [P32 cautions, P6].

**Resolution:** Hybrid layout. TL;DR + key stat at top (for GEO + skim-readers), then narrative for engaged readers. Both audiences served. — **Supported**.

### What seo-superpower could add

A **content-shape linter** — fetch a URL, score on the 7 tactics above, output a per-page report. This is well within the plugin's free-tier philosophy and doesn't exist as a polished tool in the SaaS landscape (most tools track output citations; few audit input shape directly). — **Estimated** for the "doesn't exist polished" claim; not exhaustively verified across all 12 AEO tools.

---

## Section 6: Entity SEO + Knowledge Graph — the prerequisite layer

### Why this matters now

AI engines treat **recognized entities** differently from unrecognized name strings. When ChatGPT decides whether to cite "Vibecrafting" or skip it, the knowledge-graph link determines whether the name resolves to a brand or a noise token. [P22, P23]. — **Supported**.

### The establishment playbook (3-6 month timeline)

From [P22, P23]:

1. **Wikidata QID** — create a Wikidata entry with industry, founding date, headquarters, key people, official website. This provides a canonical identifier across AI systems.
2. **Schema.org markup with `sameAs`** — link your `Organization` and `Person` schema to the Wikidata QID, LinkedIn page, Crunchbase entry. Every cross-link tightens entity resolution.
3. **Google Business Profile** (for local) — must be complete and verified.
4. **Crunchbase entry** with consistent name, founder, founding date, HQ.
5. **NAP consistency** (Name, Address, Phone) — across web mentions [P29 for local services].
6. **About-page facticity** — explicit founder name, founded-date, HQ city, what-we-do paragraph. AI engines parse this directly [P22].

### Timeline

[P22]: 3-6 months of consistent entity signal building to trigger a **Google Knowledge Panel**. Changes picked up by AI crawlers in **2-4 weeks**; citation lift follows over the next **60-90 days**. — **Supported**.

### Wikipedia ≠ required

[P22, P23]: You **don't need** a Wikipedia page to trigger a Knowledge Panel — Wikidata + complete Business Profile + Crunchbase + active social profiles can do it. Wikipedia is the highest-leverage entity signal but is gated by notability requirements. — **Supported**.

### Implication for seo-superpower

This is a **new skill candidate** (`establishing-entity-presence` or similar). The existing `building-eeat-and-authority` skill covers some of this (author bios, brand mentions), but the **entity-graph piece (Wikidata, Crunchbase, sameAs cross-references)** is distinct and not currently covered. Free-tier compatible (all the signal-building is manual editing of public databases). — **Estimated** for the "not currently covered" claim; verified against `building-eeat-and-authority/SKILL.md` description in VISION.md.

---

## Section 7: E-E-A-T + author signals in May 2026

Existing skill [SOURCES.md, [P8 there]] says:
- **40% more citations** for content with credentialed author signals.
- **96% of AI Overview citations** come from sources with strong E-E-A-T signals.

These hold. New addition for May 2026 [P22, P28]: AI engines cross-reference author names against LinkedIn, professional directories, and publication history. Missing the cross-reference (no LinkedIn `sameAs`, no author bio page, no professional history) **breaks the verification chain**.

### Practical author-schema checklist

For every `Article` published:
- `author` field present and pointing to a `Person` schema.
- `Person.name` matches a real LinkedIn profile.
- `Person.sameAs` includes LinkedIn URL and (if applicable) Wikipedia / Wikidata QID.
- `Person.url` resolves to a real author bio page on the site (not 404).
- Bio page has independent third-party signals (publications, talks, certifications).

### Implication for seo-superpower

Add the above checklist as an extension to `schema-validate` MCP. Verify the chain, not just the schema's syntactic validity. — **Estimated** ROI; high-confidence directional move.

---

## Section 8: Schema.org for GEO — what AI crawlers consume

### The Data-to-Text pipeline

[P20] documents the actual mechanism: **LLMs don't read JSON-LD payloads directly.** They receive structured data **indirectly via Data-to-Text conversion during training**. The training pipeline reads the HTML, extracts visible text, parses JSON-LD, and converts the structured data into **natural-language statements** that fold into the training corpus.

**Implication:** Schema-as-prose-template. The values you put in `Article.headline`, `Person.jobTitle`, `Organization.description` become natural-language statements about your entity in training data. **Schema is content, not metadata.** [P20] — **Supported**.

### High-value schema types for 2026

From [P21] cross-referenced with existing skill data:

| Schema type | Status | Why |
|-------------|--------|-----|
| `Article` | Critical | Becomes prose facts about the article (headline, author, date, topic) |
| `HowTo` | Critical | Lifted as procedural answers in AI responses |
| `FAQPage` | Critical even after Google deprecated rich result | AI engines lift Q-A pairs directly |
| `Speakable` | Rising | Voice/assistant answers; underused |
| `Person` (author) | Critical | E-E-A-T verification chain |
| `Organization` (publisher) | Critical | Entity resolution |
| `BreadcrumbList` | Important | 47% of most-cited pages use it [existing] |
| `ItemList` | Important | For listicles + comparisons |
| `Product` + `Review` | Critical for ecommerce | Used in shopping AI features |
| `LocalBusiness` | Critical for local | "near me" + Community Perspectives [P29] |

### What's deprecated / ignored

[P21] notes Google has deprecated several rich-result eligibilities, but **AI engines still consume the underlying schema** even when Google doesn't render rich results. Example: `FAQPage` rich result is deprecated for many query types, but ChatGPT and Perplexity still lift FAQ Q-A pairs at high rates. — **Supported**.

### Contradiction: schema correlation vs. no correlation

[P21] cites a **December 2024 study finding no correlation between schema volume and AI citation frequency**, while practitioner sources [existing, [P22, P23]] claim **2.5×** citation improvement with schema. **Resolution:** volume of schema doesn't help; **correctness + completeness + alignment with content** does. Adding more schema types blindly doesn't move the needle; getting the few high-value types right does. — **Partially Supported** (resolution is consistent with both findings but is a synthesis, not from a single source).

### The JS-rendering trap

[P21] flags: AI crawlers (GPTBot, ClaudeBot, PerplexityBot) parse server-rendered HTML. **Client-side rendered JSON-LD (common in SPAs) is invisible to them.** Validation must include a fetch with the actual crawler User-Agent to confirm schema is in the raw HTML, not just post-hydration. — **Supported**.

### Implication for seo-superpower

The existing `schema-validate` MCP checks 9 rich-result types. Two additions:

1. **JS-rendered detection** — fetch with `User-Agent: GPTBot` and assert schema in raw HTML.
2. **Author-chain verification** — see §E-E-A-T above.

Both are small additions to existing infrastructure, not new MCPs.

---

## Section 9: Agentic RAG / Query Fan-Out — the May 2026 doctrine shift

### The architecture change

Mike King's argument [P2, P3, P4] — well-substantiated by 5 Google patents [P3]:

**Old model:** User query → retrieval → ranked pages → snippet.
**New model:** User query → **planner** decomposes intent → fans out to 6-8 synthetic queries → multi-pass retrieval → synthesis across all retrievals → final answer.

The 5 patents Mike King analyzes [P3]:
- **US11663201B2** "Generating Query Variants Using a Trained Generative Model" (filed Apr 2018, issued May 2023).
- Enumerates **8 variant types**: equivalent, follow-up, generalization, canonicalization, language-translation, entailment, specification, clarification.

Google's AI Mode is the most aggressive agentic implementation in production [P3] — planner-driven fan-out, multi-pass retrieval into Search.

### What this means for content

If a user asks "best deck stain for cedar," the planner may fan out to:
- equivalent: "top-rated cedar deck stains"
- follow-up: "how to apply stain to cedar"
- generalization: "best deck stains" (any wood)
- canonicalization: "[brand] cedar stain reviews"
- specification: "cedar deck stain for hot climate"
- etc.

**Your page needs to be cite-worthy on the fan-out queries, not just the surface query.** If your content only addresses the surface, you're competing with everyone; if it addresses follow-ups too, you're competing with fewer pages and get cited across multiple retrieval passes.

### Qforia

iPullRank ships [Qforia](https://qforia.ai/) — a free tool using Gemini to simulate fan-out for AI Overviews and AI Mode. King's tool replicates 6 of 7 synthetic query styles Google generates. — **Supported** [P3, search result].

### Implication for seo-superpower

**This is the biggest doctrine shift for v4.** Suggested moves:

1. **Add a `query-fan-out-preview` MCP or skill.** Takes a URL or topic, calls Gemini (free tier) to generate 6-8 synthetic queries the AI planner would issue, returns them as a content-gap list. Free-tier achievable (Gemini API ~$0.001/query at small scale).
2. **Document the agentic search thesis in `optimizing-for-generative-engines`** as a doctrine note — explicit framing that optimization targets a session of queries, not a single query.
3. **Update VISION.md** to acknowledge agentic search as the post-v3 operating environment.

---

## Section 10: Tool landscape — May 2026

### The 5 pure-play AI citation tracking platforms [P25]

| Tool | Methodology | Differentiator | Free tier? |
|------|-------------|----------------|------------|
| **Profound** | Brand mentions + URL citations | Largest dataset (30M citations Aug 2024 → Jun 2025) [P7] | No |
| **Otterly.AI** | Daily prompt reruns across ChatGPT, AIO, Perplexity, Gemini, Copilot | Share of Voice + Brand Visibility Index | Limited |
| **Athena HQ** | URL-level + brand mention | Built for "AI Search as strategic priority" teams | No |
| **Peec AI** | URL-level explicit + implicit citation tracking | Mid-market | No |
| **Ayzeo** | URL-level tracking | Newer entrant | No |

Plus expanded SEO platforms:
- **BrightEdge** — established enterprise SEO + AI search visibility module.
- **Semrush** — SEO core + AI tracking add-on; "execution hub" not specialist tracker [P25].

### Methodology critiques [P25, P24]

Key distinction: **brand mention vs. URL citation.** ChatGPT can recommend a brand by name in answer text OR attach a source URL. Tracking only URL citations misses brand mentions; tracking only mentions misses traffic-attributable citations. Best tools do both.

### What seo-superpower's `geo-check` MCP has + doesn't have

**Has:** prompt polling across ChatGPT/Claude/Perplexity/Gemini. `geo_check` / `geo_track` / `geo_diff` tools. Free.

**Doesn't have (vs. SaaS):**
- Share of Voice scoring.
- Historical trend graphs (UI; data is in the diff).
- Competitor citation tracking (head-to-head).
- Brand-mention parsing (currently URL-citation focused).
- Subscription database (must run on-demand).

**Strategic moat (per VISION.md §5):**
1. **Git-integrated diff** — correlate citation losses to recent commits via `git blame`. No SaaS does this.
2. **MCP-native** — lives in Claude Code, not a SaaS dashboard. Builders never leave their editor.
3. **Free-tier** — zero subscription cost.

The roadmap should lean into these three rather than racing the SaaS feature matrix. **Specifically:** the "GEO Diff Bot" in VISION.md §5 — daily polls + diff + git-blame correlation — is the killer feature; ship it concretely as a default-on canary with weekly summary output. — **Supported** by competitive landscape.

---

## Section 11: GEO mistakes — what's been disproven 2024-2025

From [P32, P33] cross-referenced with existing anti-patterns section:

1. **Keyword stuffing for AI** — definitively doesn't work. NLP-based detection penalizes [P32].
2. **AI-generated content at scale without human oversight** — penalized in Google's Helpful Content Update + Spam Update; 17% of top-20 results are AI-generated as of 2025, but the high-quality ones [P32].
3. **Paid links / PBN-style link buying** — still penalized; black-hat-GEO discussion in [P33] documents detection.
4. **Thin content** — "comprehensive sources" preferred; thin pages don't get cited [P32].
5. **Single-engine optimization** — sources confirm only **11%** of websites earn citations from both ChatGPT and Perplexity [existing] — per-platform tuning is real.
6. **Faking citations / made-up studies** — exposed when readers and LLMs cross-reference [existing].
7. **Blocking AI crawlers in robots.txt accidentally** — common silent failure [existing, P21].
8. **`llms.txt` as a silver bullet** — see §4 above; SERanking 300k-domain study disproves [P18].

### Newer specifically May-2026 anti-patterns

9. **Treating AIO as a single-query problem** — Mike King's [P2, P3] critique. Agentic search means you need to be cite-worthy across the fan-out, not just the surface.
10. **Ignoring Reddit** — given Reddit's 73% growth in citation share Oct 2025 → Jan 2026 and the May 2026 Community Perspectives launch [P9, P10, P11], a brand presence on Reddit (real, ToS-safe, not seeded spam) is becoming table stakes.

---

## Section 12: Local + B2B AI search

### Local services (e.g., "plumber near me")

[P29]: Local AI search is now where "plumber near me" queries land. ChatGPT, Perplexity, and Google AIO all field these queries; the answer surfaces are still anchored on Google Business Profile + reviews + NAP-consistent web mentions, but with AI-Overview-style synthesis.

Critical local moves:
- **Google Business Profile completeness + verification.**
- **Review-rich pages with `Review` schema.**
- **NAP consistency across directories.**
- **Service-area pages with structured comparison tables** (services × price × duration × includes).
- **Recent reviews** (recency in AI citation logic).

### B2B

[P30, P28, P10]:
- **73% of B2B buyers use AI tools in purchase research** before reaching out [P30].
- **82% of B2B technology queries** trigger AI search results [P10].
- **AI search traffic converts at 14.2% vs. 2.8% Google organic** [P30] — a 5.1× advantage.
- **LinkedIn** became ChatGPT's 5th-most-cited source between Dec 2025 and Feb 2026 [P28].

Critical B2B moves:
- **LinkedIn article presence** (500-2000 words is the sweet spot [P28]).
- **Industry reports + original research** (LLMs cite primary data preferentially [P6]).
- **G2 / Capterra / Gartner / Forrester** presence for software categories.
- **Comparison tables** for buyer-shortlist queries.

### Implication for seo-superpower

For local-services use cases the plugin should grow a `local-presence` companion skill (or extension of `auditing-technical-seo`). For B2B users (a large slice of "technical builders"), the LinkedIn track is currently missing.

---

## v3 Feature Audit — does each existing skill map to current GEO-era priorities?

13 skills currently (per README, VISION.md). For each: current state vs. May 2026 GEO reality, what to add or change.

| # | Skill | Current focus | May 2026 alignment | Recommended changes |
|---|-------|--------------|-------------------|---------------------|
| 1 | `setting-up-seo-measurement` | GSC + GA4 + Bing + IndexNow | **Good** — measurement infra still classical-SEO-based. Add: Profound/Otterly-style citation tracking pointer (or rely on `geo-check`). | Minor — add a note that `geo-check` is the AI-side measurement, sets expectation. |
| 2 | `auditing-technical-seo` | Crawl + robots + sitemap + schema | **Good but needs JS-rendered schema check.** Add: GPTBot-User-Agent fetch in the No-MCP fallback. | **Add: JS-rendered schema detector.** |
| 3 | `researching-keywords-pre-launch` | Cold-start keyword discovery (5 free signals) | **Mismatch for AI-era.** Classical keyword model. Add: query fan-out preview signal. | **Add: Qforia-style fan-out simulator** as a 6th signal. |
| 4 | `planning-topic-clusters` | Pillar + spoke architecture, internal link graph | **Strong** — topic clusters map cleanly to entity-level coverage. | Minor — add: tag clusters with entity QIDs where applicable. |
| 5 | `analyzing-content-gaps` | Competitor SERP diff + entity extraction | **Strong.** Entity extraction is already there. | Add: cite-share diff (which competitor is cited by ChatGPT for queries you both target — needs `geo-check` integration). |
| 6 | `optimizing-on-page` | Title/meta/H/internal links per page | **Good but classical-leaning.** Should integrate the 7 answer-first patterns. | **Add: answer-capsule density check** + first-sentence linter + comparison-table check. |
| 7 | `adding-schema-markup` | JSON-LD decision tree | **Good — already covers high-value types.** Should reflect Speakable + author-chain. | Add: Speakable schema for voice/AI-assistant outputs + author-chain verification. |
| 8 | `optimizing-for-generative-engines` | 7 high-impact GEO patterns + per-platform tuning | **Best-positioned skill in the registry.** Already cites P7, P8 area. | **Add: agentic-search doctrine note** + updated Reddit/Wikipedia split + Community Perspectives (May 7 2026 AIO change). |
| 9 | `finding-underserved-keywords` | GSC striking-distance | **Good for classical track.** | Add: fan-out gap (queries the planner generates that you don't address). |
| 10 | `refreshing-stale-content` | Decay detection + auto-refresh PR | **Strong — recency is load-bearing for GEO.** | Add: AI-Overviews CTR-defense playbook (the 5.1× conversion advantage even at lower CTR). |
| 11 | `building-eeat-and-authority` | Author bios, brand mentions, original data, YMYL | **Good — already covers most.** Missing: entity graph (Wikidata, Crunchbase, sameAs). | **Add: entity-establishment checklist** OR spin off a new `establishing-entity-presence` skill. |
| 12 | `generating-programmatic-seo` | Template-driven pages + 4 quality gates | **Good.** | Add: per-template fan-out coverage check (does the template address the planner's follow-ups?). |
| ★ | `seo-superpower` (meta-router) | Vague intent → diagnose phase → child skill | **Strong — recently extended with No-MCP fallback.** | Add: new "GEO-decay" branch when `geo-check` shows citation loss week-over-week. |

### Recommended NEW skills / MCPs for v4

Ranked by leverage:

1. **`query-fan-out` skill or MCP** — simulate the 6-8 synthetic queries the AI planner generates. Gemini-API-backed, free tier. Plugs into pre-launch + on-page + topic-cluster skills.
2. **`establishing-entity-presence` skill** — Wikidata + Crunchbase + Google Business Profile + schema sameAs chain. 3-6 month playbook. Net-new ground vs. `building-eeat-and-authority`.
3. **`answer-shape-linter` MCP** — fetch URL, score 7 answer-first patterns, output per-page report. Free; doesn't exist polished in the SaaS space.
4. **`reddit-presence` skill** — ToS-safe subreddit identification, answer-shape, posting cadence. Becoming table stakes given Reddit's citation growth.
5. **`linkedin-presence` skill** (or extension of `building-eeat-and-authority`) — B2B citation track; LinkedIn article authoring 500-2000 word sweet spot.
6. **`geo-decay-watch` automation** — concrete implementation of VISION.md §5's "GEO Diff Bot" — daily `geo-check` polls + diff + git-blame correlation + weekly summary. Default-on for installed instances.

### NOT-recommended additions

- **An llms.txt generator skill.** Not load-bearing; doesn't justify a top-level skill. Include a template instead.
- **A "rank tracker."** Outside free-tier; SaaS competitors do this; outside the plugin's moat.
- **A backlink database.** Same reason. Use Ahrefs free trial quarterly.

---

## Contradictions Resolved

1. **Wikipedia vs. Reddit dominance in ChatGPT citations.** Existing skill: 47.9% Wikipedia top-10 (Discovered Labs / Profound, Aug 24 → Jun 25). May 2026 data [P8, P11]: Reddit rising fast (40.1% across all engines, 24% of Perplexity, 11.97% US in ChatGPT). **Resolution:** both are correct for their windows. The trend is rising-Reddit, declining-but-still-large-Wikipedia. Update the skill to acknowledge the trend; don't pick one number.

2. **Schema correlation: 2.5× lift vs. no correlation.** [P21] cites a Dec 2024 study finding no correlation between schema volume and AI citation; practitioner sources claim 2.5×. **Resolution:** volume doesn't help; correct, complete, content-aligned schema of high-value types does. Synthesis, not single-source.

3. **AIO CTR collapse vs. recovery.** Ahrefs Dec 2025: -58% CTR top result. Seer: 1.76% → 0.61% Sep 2025 → **2.4% Feb 2026 (recovery)** [P13]. **Resolution:** the panic was real but transient; users adapted; conversion rate per visit is much higher (14.2% vs. 2.8%). Net: CTR down, value-per-click up — Mature-content lifecycle skills must reflect both halves.

4. **llms.txt: works vs. doesn't work.** SERanking 300k study + 500M-bot-visit analysis: no measurable effect. Practitioner anecdotes: modest correlation on Anthropic/Perplexity. **Resolution:** not load-bearing; publish for docs sites where it's automated (Mintlify), skip elsewhere.

5. **AI search market share: 12-18% vs. 15-20% vs. 25%.** Numbers depend on whether you measure informational queries only, all queries, or weighted by traffic-value. **Resolution:** rank-order is clear (Google >> ChatGPT > Gemini ≈ Perplexity > Claude > Grok), absolute numbers should be cited with their measurement methodology.

---

## Gaps and Estimates

1. **No primary source for the 14-day citation-decay window** carried from existing skill. **Estimated** — re-poll cadence heuristic, not a hard claim.
2. **74.2% of citations from comparison-table content** — single-source (GenOptima), vertical-specific. **Partially Supported**; directionally correct, don't cite as universal.
3. **"Brands following structured GEO see citation rates climb to double-digit % within 60 days"** [existing P2]. Vendor-reported. **Partially Supported**; don't cite as guarantee.
4. **The "answer-shape linter doesn't exist polished" claim** — not exhaustively verified across all 12 AEO tools. **Estimated**.
5. **3-6 month Wikidata-to-Knowledge-Panel timeline** [P22] — practitioner-reported, not from a published study. **Supported** as practitioner consensus.
6. **Free-tier feasibility of Gemini-based fan-out simulator** — based on Gemini Pro pricing as of training; verify current API pricing before committing. **Training-Confirmed**.
7. **iPullRank's Mike King citations** — Mike King is a single (informed, well-cited) practitioner. His agentic-search thesis is well-substantiated by patents [P3] but the implementation details are inference, not Google-disclosed. **Supported** as well-reasoned hypothesis, not as Google's official position.

---

## Methodology Note

Built using the `enrichment` skill. Research manifest covered 12 sub-domains. Fired **9 parallel WebSearch queries** + cross-referenced with the existing `optimizing-for-generative-engines/SOURCES.md` (Apr 26 2026). Source registry has **33 new sources** (P1-P33); 9 sources reused from the existing skill knowledge base.

Authority distribution:
- **A** (peer-reviewed / standards): 1 (P1, the Princeton paper)
- **B** (recognized practitioners + named research): 6 (P2-P4, P7-P8, P17, P26)
- **C** (SEO publications): 24
- **D** (blog posts): 2

Stale-prone numbers (market share, citation percentages, CTR rates) are tagged inline with their measurement window. **The skill's existing numbers from April 2026 are not wrong but the Reddit-rise and May-7 AI Overviews update are material new state.**

## Changelog

- **2026-05-22**: Initial knowledge base for the May 2026 enrichment pass. Authored by win-claude-opus during night-shift round 2 (5 of 5). Pairs with `skills/optimizing-for-generative-engines/SOURCES.md`; this doc extends and updates, doesn't replace.
