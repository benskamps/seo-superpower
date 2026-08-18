---
name: mirroring-competitor-codebases
description: Use when comparing your site's *implementation* against a competitor's — "what is their site doing that mine isn't", "mirror their codebase", "reverse-engineer their SEO setup", "why is their markup better", "competitor schema/heading/internal-link audit", "they rank above me, what are they shipping". Runs the Competitor Codebase Mirror — parses the HTML both sites actually serve, folds each side into per-page rates (schema types, question-heading shape, internal-link density, meta coverage, server-rendered vs client shell), and reports only the patterns they ship that you don't, ranked by SERP delta. Template-level and site-wide, not prose-level for one query — for the per-query content diff use `analyzing-content-gaps`.
---

# Mirroring Competitor Codebases (the Codebase Mirror)

## Overview

When a competitor outranks you, the instinct is to read their copy. But a lot of what search and answer engines reward is not written by a writer at all — it is emitted by a template: the JSON-LD block, the heading shape, the internal-link footer, whether the page arrives as HTML or as an empty `<div id="root">`. Those are **codebase decisions**, and they are visible in the HTML they serve.

The Codebase Mirror reads that HTML on both sides and answers one question: **what does their template do that yours doesn't?**

It reports gaps in one direction only. A pattern *you* ship and they don't is not in the report — this list exists to be acted on, and acting on it means adding what is missing.

## Where the line is with `analyzing-content-gaps`

They are complementary and easy to confuse:

| | `analyzing-content-gaps` | `mirroring-competitor-codebases` |
|---|---|---|
| Unit | One query, one page vs the top 3 | Whole site, 3–5 comparable page types per side |
| Reads | Prose — entities, sub-questions, depth | Implementation — what the template emits |
| Output | `CONTENT_BRIEF.md` — what to write | Ranked gap list — what to build |
| Judgment | LLM reads and compares meaning | Deterministic thresholds, no judgment at runtime |

Rule of thumb: **"what should this page say?" → content gaps. "what should our template emit?" → this skill.** Run both when a competitor beats you on a query you care about; the fixes land in different PRs and usually different files.

## Architecture: where the pieces live

| Piece | Lives in | Makes live calls? |
|---|---|---|
| Page fetcher | `scripts/codebase-mirror.js` (`loadPages`) | Yes — plain HTTP GETs, robots.txt-gated for our user-agent, one request per origin per `--delay` ms. Local HTML files work too. |
| Signal extraction + gap engine + ranking | `scripts/codebase-mirror.js` | **No** — pure, offline, deterministic, fully unit-tested. |
| Which pages to compare | You (or `analyzing-content-gaps` for the SERP) | The tool mirrors the URLs you hand it. It does not crawl. |
| SERP positions for ranking | GSC, via `finding-underserved-keywords` | Passed in with `--serp`. Absent → severity-only ranking, tagged `serp: unknown`. |

Everything the engine does is unit-tested against fixtures (`test/codebase-mirror.test.js`, HTML in `fixtures/codebase-mirror/ours/home.html` and `fixtures/codebase-mirror/theirs/home.html`).

## The loop

1. **Pick comparable page types.** 3–5 per side, matched by *role*, not by URL: their home vs your home, their money page vs your money page, two of their guide/blog pages vs two of yours. Mirroring their blog against your pricing page produces noise, and one page per side produces anecdotes — the tool warns when a side has fewer than two.

2. **Get the SERP positions** (optional but this is what makes the ranking mean something). From GSC via `finding-underserved-keywords`: your average position for the query, and theirs from the live SERP. Write them into a small JSON file:
   ```json
   { "query": "invoicing software for freelancers",
     "ours":   { "url": "https://ledgerly.example/",  "position": 14.2 },
     "theirs": { "url": "https://billfold.example/",  "position": 3.1 } }
   ```

3. **Run the mirror:**
   ```bash
   node scripts/codebase-mirror.js \
     --ours   https://yoursite.com/ \
     --ours   https://yoursite.com/pricing \
     --ours   https://yoursite.com/guide/setup \
     --theirs https://competitor.com/ \
     --theirs https://competitor.com/pricing \
     --theirs https://competitor.com/guide/setup \
     --serp .claude/seo/serp-positions.json \
     --json .claude/seo/codebase-mirror.json
   ```
   Try it with no setup at all against the shipped fixtures:
   ```bash
   node scripts/codebase-mirror.js \
     --ours   fixtures/codebase-mirror/ours/home.html \
     --theirs fixtures/codebase-mirror/theirs/home.html
   ```

4. **Read the ranked list.** Each row is `severity × SERP multiplier = impact`, with the two rates that produced it (`them 100% / you 0%`) and a hand-off to the skill that fixes that class of gap.

5. **Act, top-down, one PR per axis.** Schema gaps → `adding-schema-markup`. Rendering → `auditing-technical-seo`. Heading shape → `optimizing-for-generative-engines`. Internal links → `planning-topic-clusters`. Meta coverage → `optimizing-on-page` or `seo-bootstrap`. Then re-run the mirror; the closed rows should disappear.

## What it looks at, and why each axis is there

| Axis | Signal | Why it is a codebase gap, not a copy gap |
|---|---|---|
| **Rendering** | Body words present in the delivered HTML vs an empty shell + scripts | AI-search crawlers do not execute your JS. A client-shell page is invisible to them no matter how good the copy is. Highest severity for a reason. |
| **Schema** | Page-level JSON-LD `@type`s, per-page rate | A type on ≥50% of their pages is a *template*, not a one-off. Nested children (`Question` inside `FAQPage`) are deliberately not counted — that would report one gap twice. |
| **Heading shape** | Share of H2/H3 phrased as questions | The question-then-direct-answer shape is what AI Overviews lift. It is a component decision as often as a writing one. |
| **Internal links** | Median internal links per page, descriptive vs generic anchors | Link density is emitted by layout: related-posts blocks, footers, breadcrumbs. |
| **Meta coverage** | description, canonical, OG title+image, hreflang, image `alt` | Coverage *rates* expose which template forgot the field, not which page. |
| **Freshness** | `dateModified` present in schema | Pages updated <3 months out are cited roughly twice as often by AI engines. |
| **Depth** | Median word count | Reported **last and lowest on purpose** — adding words without the axes above is the skyscraper trap. |

Every threshold is a named constant at the top of `scripts/codebase-mirror.js`. If you disagree with one, change the constant — do not argue with the output.

## Reading the ranking honestly

- **With `--serp`:** the multiplier encodes how much their pattern is worth as evidence. They beat you by 10+ positions → ×2.0. They edge you out → ×1.2. **You already outrank them → ×0.75** — their pattern is weak evidence, and copying a worse-performing site is how you talk yourself into work that does not pay.
- **Without `--serp`:** every row is tagged `serp: "unknown"` and ranked by severity alone. The tool never invents a position, and the report says so in a warning rather than quietly looking SERP-informed.
- **Correlation, not causation.** "They rank above you and their template does X" is not proof X is why. It is the strongest cheap evidence available — treat the high-severity rows as hypotheses worth a PR, not as a diagnosis.

## Etiquette and legality

- It reads the HTML any crawler receives, at crawler volume: **robots.txt is honoured** for our user-agent, and a disallowed path is skipped with a warning rather than fetched anyway. One request per origin per second by default (`--delay`).
- It never touches a competitor's repo, admin, or private endpoints — "codebase mirror" means the shipped implementation, not their source.
- **Copy patterns, never content.** Emitting `FAQPage` because they do is fine. Copying their FAQ answers is duplicate content that Google flags and AI systems deprioritize. The report deliberately gives you rates and structures, not their prose.

## What this is NOT

- **Not a crawler.** It mirrors the URLs you hand it. Site-wide discovery is out of scope by design — a crawl of someone else's site is a different, heavier, ruder tool.
- **Not a renderer.** It sees what arrives in the HTML. Content injected client-side is invisible here — exactly as it is to an AI-search crawler, which is why `rendering` is an axis rather than a caveat.
- **Not a content brief.** No entities, no sub-question analysis, no writing guidance. That is `analyzing-content-gaps`.
- **Not a verdict on their ranking.** It explains what they ship, not why Google likes them.

## Common mistakes

- **Mirroring one page per side.** Rates over one page are anecdotes; the tool warns, and the warning is real. Three to five comparable pages per side.
- **Comparing unlike page types.** Their blog against your landing page manufactures gaps that mean nothing.
- **Running it without `--serp`, then treating the order as truth.** Severity-only ordering is a reasonable default and an explicitly labelled one. Get the positions if the ranking is going to drive the sprint.
- **Starting with the depth row.** It is last for a reason. Close schema/rendering/heading gaps, then re-measure — depth usually shrinks on its own once the structure is right.
- **Copying a pattern from a site you already outrank.** Check the multiplier before you build.

## Lifecycle awareness

Growth → Mature. Needs a live competitor and a live you. Pre-launch there is nothing to mirror on your side — use `researching-keywords-pre-launch` and `seo-bootstrap` first, then come back once your pages exist.

## What next

- **Schema rows →** `adding-schema-markup`.
- **Rendering row →** `auditing-technical-seo`.
- **Question-heading row →** `optimizing-for-generative-engines`.
- **Internal-link row →** `planning-topic-clusters`.
- **Meta rows →** `optimizing-on-page` (per page) or `seo-bootstrap` (site-wide defaults).
- **Depth row, last →** `analyzing-content-gaps` for what to actually add.
