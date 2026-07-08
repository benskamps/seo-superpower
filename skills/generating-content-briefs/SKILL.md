---
name: generating-content-briefs
description: Use when turning a topic into a research-grounded content brief AND wiring it toward a shipped PR — the "brief to merged PR" flow. Auto-triggers on "/seo brief", "write a brief for X", "brief to PR", "give me a content brief and a draft", "turn this topic into a post". Takes a topic (+ optional target keyword/URL), pulls your GSC striking-distance data + the live SERP, then runs the deterministic assembler (scripts/brief-assembly.js) to produce CONTENT_BRIEF.md (target keyword + intent, the striking-distance angle, a headline moat, entities/PAA questions, internal-link suggestions from your own content, a word-count target) plus a draft content file, and opens the draft-to-PR. Composes with finding-underserved-keywords (the striking-distance data) and analyzing-content-gaps (the SERP diff); hand the drafted sections to optimizing-on-page and FAQ blocks to adding-schema-markup.
---

# Generating Content Briefs — Brief to Merged PR

## Overview

This is the flagship `/seo brief` flow: **a topic goes in, a research-grounded brief and a draft content file come out, and the draft opens as a PR.** Not a strategy doc you file away — a pipeline that ends in reviewable code.

Most "content brief" tools stop at a Notion page. The moat here is that the brief is *assembled deterministically from your own data* — your GSC striking-distance queries, the live top-3 SERP, and your own existing pages for internal links — and it lands as a draft file in your repo, on a branch, in a PR. Review it like any other change.

**Core principle:** the brief is only as good as the data behind it. Every non-obvious claim in the brief traces to a seam — GSC (what you already almost rank for), the live SERP (what the winners cover), or your repo (what you can link to). The *assembly* of those into a brief is pure and testable; the data-gathering is where judgment and live tools come in.

## The pipeline

```
topic ─┬─ target keyword          (from you, or your GSC top query for the topic)
       ├─ striking-distance rows   ── seam: gsc MCP  (finding-underserved-keywords)
       ├─ SERP entities/questions  ── seam: firecrawl (analyzing-content-gaps)
       └─ your existing pages      ── scan your content dir
                    │
                    ▼
        scripts/brief-assembly.js  (DETERMINISTIC, unit-tested)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   CONTENT_BRIEF.md        content/<slug>.md   (draft: true)
        │                       │
        └────────► git branch + commit + gh pr create ◄────────┘
```

## What's built vs. what's a seam (read this before you run)

**Built + unit-tested** (`scripts/brief-assembly.js`, `test/brief-assembly.test.js`):
- `classifyIntent` — keyword → intent (informational/commercial/transactional/navigational) + content format.
- `strikingDistance` — GSC rows → position 5–15 opportunities (the finding-underserved-keywords method, in code).
- `rankInternalLinks` — your content index + the brief's entities → ranked internal-link suggestions from pages you already have.
- `deriveWordCountTarget` — competitor median (±20%) or a format default.
- `buildOutline` / `assembleBrief` — the headline moat: title + H2 outline with AIO-answer stubs, composed from entities + PAA questions.
- `renderBriefMarkdown` / `renderDraftMarkdown` — the two artifacts.
- `scanContentDir` — reads a content dir into an index (the one filesystem edge, tested against a temp dir).

**Documented seams** (the live run fills these — no LLM/network is in the deterministic core, by design):
- **Target keyword + striking-distance rows** ← your GSC, via the `gsc` MCP. Pull the query rows for the topic's page(s) and hand them in as `--gsc rows.json` (`[{query, position, impressions, clicks}]`).
- **SERP entities + PAA questions + competitor median word count** ← the live SERP, via `firecrawl` (this is exactly what `analyzing-content-gaps` already does). Hand them in as `--serp serp.json` (`{entities, questions, h2s, medianWordCount, aioPresent}`).
- **The draft's prose** ← you (the writer) filling the `TODO` sections against the brief. The scaffold is deliberately stubs, not fabricated content.

If a seam has no data yet (e.g. a brand-new page with no GSC history), the brief says so honestly rather than inventing a striking-distance angle.

## How to run it

1. **Resolve the target keyword.** If the user gave one, use it. Otherwise, if GSC is connected, take the highest-impression query for the topic's existing page; if there's no page yet, use the topic as the keyword and note it's pre-SERP.
2. **Gather the seam data** (at most one clarifying question, per the 1-call rule):
   - `gsc` MCP → export the page's query rows → `gsc.json`.
   - `firecrawl` (or `analyzing-content-gaps`) → scrape the live top-3 → extract `entities`, `questions` (People-Also-Ask), `h2s`, `medianWordCount`, `aioPresent` → `serp.json`.
   - Point `--scan` at the repo's content dir (`content/`, `src/content/`, `posts/`, `blog/`, …) so internal-link suggestions come from real pages.
3. **Assemble:**
   ```bash
   node scripts/brief-assembly.js \
     --topic "<topic>" --keyword "<target keyword>" \
     --gsc gsc.json --serp serp.json --scan content \
     --out-dir content --brief-out CONTENT_BRIEF.md
   ```
   This writes `CONTENT_BRIEF.md` (review it) and `content/<slug>.md` (the `draft: true` scaffold).
4. **Fill the draft** — write the prose into the `TODO` sections, honoring the AIO stubs (front-load a 40–50 word answer under each question-phrased H2), the must-cover entities, and the internal links. This is the human/LLM step; the brief is the spec.
5. **Open the draft-to-PR:**
   ```bash
   git checkout -b content/<slug>
   git add content/<slug>.md CONTENT_BRIEF.md
   git commit -m "content(brief): <keyword>"
   gh pr create --title "content: <title>" --body-file CONTENT_BRIEF.md
   ```
   The CLI prints these exact commands. The brief becomes the PR body, so the reviewer sees the research behind the draft.

## Adapting the draft to a framework

The scaffold uses framework-agnostic YAML frontmatter (`title`, `description`, `slug`, `keyword`, `draft: true`, `date`). Map it to the target stack:
- **Next.js / Contentlayer / MDX** → `content/<slug>.md` or `.mdx` as-is; wire `draft` into your query filter.
- **Astro content collections** → move under `src/content/<collection>/` and match the collection's schema keys.
- **SvelteKit / mdsvex** → `src/posts/<slug>.md`; keep `draft` gating in the route loader.

Set `--out-dir` to the right directory. Never publish with `draft: true` — that flag keeps the stub out of production until the prose is finished.

## When to use / not use

**Use when:** you have a topic and want to go from zero to a reviewable draft PR with the research baked in; you're spinning up a new post and want it SERP- and GSC-grounded from the first commit.

**Don't use when:**
- You only need the competitor diff for an *existing* page → `analyzing-content-gaps` (this skill calls into that for the SERP phase).
- You only need the striking-distance keyword list for a page → `finding-underserved-keywords`.
- The page exists and just needs on-page polish → `optimizing-on-page`.
- The page is decaying → `refreshing-stale-content`.

## Honest limits

- The outline, title, and section stubs are **assembled, not written** — they're a spec and a skeleton, deliberately not fabricated prose. Quality of the final post depends on the writer filling them well.
- Internal-link suggestions are **token-overlap** ranked, not embeddings — good for surfacing obvious topical neighbors, not semantic subtlety. Skim them.
- Striking-distance requires ~90 days of GSC data. Pre-SERP topics get an entity/SERP-driven brief and a note to re-run later.
- Intent classification is keyword-heuristic. For an ambiguous keyword, confirm the intent against the live SERP before committing to a format.

## What next

- **Draft written →** `optimizing-on-page` for the title/meta/internal-link pass on the finished draft.
- **FAQ block →** `adding-schema-markup` for FAQPage JSON-LD.
- **Gaps span 3+ sub-topics →** `planning-topic-clusters` (this is a cluster, not one post).
- **After it ships →** `tracking-citation-diffs` to see whether the new page won AI citations.

Citations and verification tags in [SOURCES.md](SOURCES.md).
