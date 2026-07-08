---
name: tracking-citation-diffs
description: Use when tracking how AI-engine citations of your site change over time and tying each change to the commit that caused it — "did my last PR win or lose citations?", "why did ChatGPT stop citing us?", "daily GEO citation diff", "citation regression", "which commit moved our AI visibility". Runs the GEO Diff Bot — diffs two geo-check snapshots and correlates each gained/lost citation to the content commit(s) in the window, or flags it as an external (model/competitor/crawl) shift when nothing in your repo changed. Pairs with the geo-check MCP (geo_track) which produces the snapshots. Mature-phase monitoring, not one-shot audit.
---

# Tracking Citation Diffs (the GEO Diff Bot)

## Overview

Getting cited by ChatGPT, Claude, and Perplexity is the GEO win — but citations are volatile. Fresh-content topics churn their citation choices on a **~14-day window** [see `optimizing-for-generative-engines`], so "we got cited once" decays silently. The question that actually drives work is: **did our last change win or lose citations, or did the AI landscape move on its own?**

The GEO Diff Bot answers that. Given two citation snapshots taken at different times, it:

1. **Diffs** them into gained / lost / unchanged citations, per provider, per prompt.
2. **Correlates** each change to the **content commit(s)** that landed in the window between the two snapshots (git-blame at commit granularity, restricted to content files).
3. **Flags external shifts honestly** — when a citation changes but *no content changed in your repo*, it labels the change `external`: a model update, a competitor, or a crawl refresh moved it, not you. That distinction is the whole point — it stops you from taking credit (or blame) for shifts you didn't cause.

This is the citation-defense monitoring layer. Pair it with `optimizing-for-generative-engines` (the per-page craft that *earns* citations) and `refreshing-stale-content` (the decay-driven refresh loop).

## Architecture: where the pieces live

| Piece | Lives in | Role |
|---|---|---|
| Snapshot producer | `geo-check` MCP → `geo_track` tool | Polls the LLM providers, writes a timestamped JSON snapshot **stamped with the current git commit**. This is the only step that makes live API calls. |
| Diff + correlation engine | `scripts/geo-diff-bot.js` | Pure, offline, deterministic. Reads two snapshots, produces the correlated diff report. No LLM calls, no network. |
| This skill | routing + workflow | Drives the loop and interprets the report for the user. |

The snapshot on disk is the seam between them: `geo_track` writes it, the Diff Bot reads it. Anything the Diff Bot does is unit-tested against fixtures (`test/geo-diff-bot.test.js`).

## The daily loop

1. **Establish the target prompts.** The 5–15 natural-language questions a buyer would ask an AI assistant where you'd want to be cited (e.g. "best open-source CRM for startups", "cheapest transactional email API"). Reuse the same set every run — a stable prompt set is what makes the diff apples-to-apples.

2. **Take today's snapshot** with the `geo-check` MCP:
   > `geo_track(domain="example.com", prompts=[...], output_path=".claude/seo/geo-snapshots/today.json")`

   Run this from the site's repo root so the snapshot is stamped with the right `commit`. Keep the previous run's file (rename or timestamp it) so you always have a `prev` and a `next`.

3. **Run the Diff Bot** against the two snapshots:
   ```bash
   node scripts/geo-diff-bot.js \
     .claude/seo/geo-snapshots/yesterday.json \
     .claude/seo/geo-snapshots/today.json \
     --repo . \
     --json .claude/seo/geo-diff-report.json
   ```
   Add `--content <glob>` (repeatable) if your prose lives somewhere non-standard. Defaults cover `content/ src/content/ app/ pages/ posts/ blog/ *.md *.mdx`.

4. **Read the verdict per change.** Each gained/lost citation is tagged:
   - `attributed` (high confidence) — a **single** content commit in the window; that's your strongest candidate cause.
   - `attributed` (medium) — several content commits in the window; all are listed as candidates (temporal correlation, not proven causation).
   - `external` — **no content changed**; the shift came from outside your repo. Investigate the competitor/model side, don't touch your content.
   - `no-git` — the snapshots lack commits or the repo doesn't have them (different clone / rebased away); the diff still stands, correlation is skipped.

5. **Act.** A **lost** citation attributed to a specific commit is a regression — open an issue or a revert/fix PR referencing that commit. A **gained** citation attributed to a commit is a pattern to repeat. An `external` loss is a market signal, not a code bug.

## Wiring it as a real daily job

The Diff Bot is a plain CLI, so any scheduler drives it. A minimal daily recipe (documented, not auto-installed — wire it into *your* cron/CI):

```bash
# 1. snapshot today (needs provider API keys; see geo-check MCP README)
#    …invoke geo_track via the MCP, writing today's dated snapshot…
# 2. diff against the most recent prior snapshot and fail loudly on a net loss
node scripts/geo-diff-bot.js "$PREV" "$TODAY" --repo . --json report.json
```

Gate on `report.diff.totals.lost` in CI if you want a hard citation-regression check. The bot exits 0 on a successful run regardless of the verdict (a lost citation isn't a *tool* failure) — read the JSON for the signal.

## What this is NOT

- **Not causal proof.** An answer engine is a black box that also moves on its own. Correlation is at commit-window resolution: "these content commits are the plausible causes." The `external` verdict is the honest complement — it names when *no* repo change lines up.
- **Not a live poller.** The Diff Bot never calls an LLM. If you want fresh citation state, that's `geo_track` (the seam). This keeps the diff engine deterministic and testable.
- **Not for cold-start.** You need at least two snapshots over time. First run just establishes the baseline.

## Common mistakes

- **Changing the prompt set between runs.** The diff can only compare cells present in both snapshots; drifted prompts/providers are surfaced as `warnings`, not silently dropped — but you lose comparability. Freeze the prompt set.
- **Running `geo_track` outside the repo.** Then the snapshot's `commit` is null (or wrong) and correlation degrades to `no-git`. Snapshot from the site's repo root.
- **Reading a single day as signal.** Citations churn on a ~2-week window. One day's `lost` may revert tomorrow. Trend across snapshots; treat a *sustained* loss attributed to a commit as the actionable event.
- **Treating `external` as noise.** It's the most valuable output — it's the difference between "our edit broke this" and "a competitor out-published us." Different responses.
