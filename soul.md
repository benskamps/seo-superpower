# Soul of seo-superpower

> *"Make SEO a normal dev loop for technical builders. One command, one PR, one merged change at a time."*

---

## 1. The Manifesto

SEO is broken for the people who actually build the web.

Legacy SEO is an industry of $130–$500/month SaaS dashboards, bloated agencies, spreadsheet audits, and Notion task lists that developers dread and ultimately ignore. Technical founders ship brilliant products, skip SEO because they lack the time and budget for an enterprise marketing stack, and surrender six to twelve months of compounding organic and AI-search traffic.

Meanwhile, search has fundamentally transformed. We have entered the AI-search era: answers are synthesized directly by Large Language Models, queries fan out into multi-step agentic research sessions, and traditional ten-blue-links SERPs are pushed below the fold.

**`seo-superpower` exists to turn SEO and GEO (Generative Engine Optimization) into a standard developer workflow.**

We do not believe in external dashboards you must remember to log into. We do not believe in vanity metrics or vibes-based recommendations. We believe in the terminal you already live in, the codebase you are already editing, and the reviewable git pull requests you already know how to merge.

---

## 2. The Five Inviolable Tenets

### I. The Dev Loop Mandate: PRs Over Dashboards

- **In-codebase context is our superpower:** External crawlers can only guess at how a site works from the outside. We read your real Next.js, Astro, or SvelteKit route structures, inspect your Markdown/MDX frontmatter, analyze your actual layout components, and trace your git history.
- **Action over reporting:** An audit without an accompanying fix is just friction. We do not hand you an 80-item PDF checklist; we hand you an `SEO_AUDIT.md` ranked by `impact × effort` alongside an opened Pull Request containing clean, minimal code changes.
- **Git is the interface:** Content decay triggers refresh branches. Lost citations trigger `git blame` investigations. Topic briefs become `draft: true` scaffolds on isolated feature branches. The developer workflow is the SEO workflow.

### II. The Zero-Dollar Wedge: The Free-Tier Law

- **$0 marginal cost is non-negotiable:** We will never require paid third-party SEO APIs (DataForSEO, Semrush, Ahrefs, paid proxy scrapers). If a feature cannot run on free-tier APIs (Google Search Console, PageSpeed Insights, free search primitives) or local compute, it does not belong in this repository. Open-source plus free-tier is our moat; we resist any "v3 requires an API key" creep.
- **Graceful degradation is the default path:** Lack of credentials is not an edge case; it is the default first-time user experience. Commands must degrade gracefully, executing local static audits and diagnostics in under 60 seconds without requiring OAuth or API keys. Value comes first; credentials unlock deeper analysis later.

### III. Ruthless Empirical Pragmatism: Facts Over Fads

- **No vibes-based SEO:** Every threshold, cap, and recommendation must trace to a verified primary source: Google Search Central documentation, schema.org specifications, W3C standards, or peer-reviewed research (`SOURCES.md`).
- **Immunity to hype:** When the SEO industry chases fads, we look at empirical data. When the industry hypes `llms.txt`, we cite the 500M AI-bot visit logs and 300k-domain studies showing zero citation lift, declining to ship snake-oil features.
- **Honest self-correction:** When we discover contradictions in our documentation or logic, we do not hide them. We write unit tests, codify correct numbers (such as 50,000 URLs / 50 MB sitemaps vs. 500 KiB robots.txt fetch limits), and lock them with regression tests.

### IV. The 1-Call Rule & Triage Discipline: Respect the Builder's Time

- **One command, zero interrogation:** A technical founder should never need to navigate a maze of commands or answer a five-question intake form. `/seo` diagnoses, triages, and acts. At most one clarifying question is permitted when ambiguity demands it.
- **Triage before action:** Vague intent routes through deterministic diagnostic gates. Explicit intent executes immediately. Parallel static diagnostics run instantly to establish site context.
- **Predictable output shape:** Every diagnostic run returns three concrete things:
  1. *What I found* (3 bullets maximum).
  2. *What I'm doing next* (chosen child skill + tool).
  3. *What you will get* (a PR, a ranked diff, or a concrete asset).

### V. Deterministic Core & Trust Boundaries: Humans Stay in Control

- **Code before guesswork:** If something can be computed deterministically, an LLM must never eyeball it. We do not count checklist items with prompt tokens; we run Node and Python stdlib scripts with exit codes (`0`, `1`, `2`) that carry routing decisions.
- **Clear trust boundaries:**
  - *Automated PRs* are strictly reserved for low-risk, mechanical, high-confidence changes (viewport tags, canonical hygiene, missing descriptions, robots.txt sitemap pointers, base JSON-LD).
  - *Architectural decisions* (client-rendering to SSR migrations, image optimization pipelines, routing redesigns) are documented as prioritized architectural choices for the human engineer.
  - *Prose is human-authored:* Claude prepares research-grounded outlines, entity targets, and PAA questions into draft scaffolds with `draft: true`. We never hallucinate or publish synthetic content without human review.
  - *Quality gates on programmatic generation:* Automated content must pass strict uniqueness (≥60%), minimum depth (≥400 words), internal link graph, and schema validation gates to prevent search spam penalties.

---

## 3. The Architectural Trinity

To keep the system robust, testable, and maintainable, every capability in `seo-superpower` is split into three clean layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. SKILLS (The Mind)                     │
│  Markdown playbooks defining expert judgment, lifecycle     │
│  awareness, anti-patterns, and routing rules.               │
└──────────────────────────────┬──────────────────────────────┘
                               │ guides
┌──────────────────────────────▼──────────────────────────────┐
│                 2. TOOLS & SEAMS (The Hands)                │
│  MCP servers (gsc, pagespeed, geo-check, schema-validate)   │
│  and live fetch seams that retrieve ground truth.           │
└──────────────────────────────┬──────────────────────────────┘
                               │ feeds
┌──────────────────────────────▼──────────────────────────────┐
│                  3. SCRIPTS (The Bedrock)                   │
│  Pure, deterministic, stdlib-only Node.js & Python tools.   │
│  Zero external dependencies. Fully unit-tested offline.     │
└─────────────────────────────────────────────────────────────┘
```

1. **Scripts (`scripts/*.js`, `scripts/*.py`):** The immutable bedrock. Written in vanilla Node.js and Python using only standard libraries. They run with zero network overhead in CI, accept inputs via CLI flags, emit exit codes (`0`, `1`, `2`), and are backed by exhaustive offline unit tests in `test/`.
2. **Tools & Seams (`mcp-servers/`):** Fast, standalone Python and TypeScript tools that interface with external reality (GSC queries, CrUX performance, AI provider search citations).
3. **Skills (`skills/*/SKILL.md`):** The operational brains. Rich markdown playbooks that give Claude context-aware judgment, lifecycle awareness, and step-by-step instructions.

---

## 4. The GEO Doctrine (Generative Engine Optimization)

Classical search indexing is the admission ticket; Generative Engine Optimization is how you win in the post-search web.

1. **AI search is agentic:** Modern engines do not match keywords; they run multi-step query fan-outs, plan retrieval paths, and synthesize answers. We optimize for the planner's follow-up questions, not just the surface prompt.
2. **Citability over density:** LLMs do not care about keyword repetition. They extract and cite:
   - Quotable, attributed claims with primary source citations.
   - Front-loaded answer capsules in opening sentences.
   - Comparison tables with explicit evaluation criteria.
   - Structured enumerations and numbered entries.
   - Verified author entities (`Person` schema with `sameAs` LinkedIn/Wikidata chains).
   - Freshness markers (`dateModified` backed by real, substantive edits).
3. **Citation tracking as code diffs:** We monitor AI citations across OpenAI, Anthropic, Perplexity, and Google. When a citation is won or lost, the GEO Diff Bot runs `git blame` across the content commit history to correlate citation movement with code changes.

---

## 5. Honest Limits & Anti-Goals

To stay true to our soul, there are things we will never do:

- **We will never maintain a synthetic backlink database.** Backlink crawler infrastructure costs millions. Use Ahrefs or Moz free trials quarterly; don't expect a local plugin to fake it.
- **We will never build multi-tenant agency dashboards.** We are a tool for builders and teams shipping products in code repositories.
- **We will never generate bulk AI slop.** Programmatic SEO must pass strict uniqueness, depth, and internal-linking quality gates to protect users from search spam penalties.
- **We will never fabricate data.** If PageSpeed or Search Console data is unavailable, we explicitly report the gap. We never guess metrics.

---

## 6. The Bar for Contributors

Every PR to `seo-superpower` must honor this soul:

1. **Does it solve a real builder scenario?** Skills must auto-trigger on genuine developer workflows without colliding with existing triggers.
2. **Is it 100% free-tier compatible?** Zero paid API dependencies. `$0` marginal cost is the wedge.
3. **Is the core logic deterministic and tested?** Mathematical, parsing, and routing logic must live in stdlib scripts accompanied by unit tests.
4. **Does it end in a PR?** If a skill merely outputs advice without leading to an actionable diff or ranked asset, it is incomplete.

SEO is not magic. It is code, structure, data, and persistence. Treat it like software.
