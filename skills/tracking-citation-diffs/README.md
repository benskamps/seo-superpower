# tracking-citation-diffs — the GEO Diff Bot

A [Claude Code](https://claude.com/claude-code) skill (part of [`seo-superpower`](https://github.com/benskamps/seo-superpower)) that turns AI-citation tracking into a **daily diff correlated to the git commit that caused each change**.

Traditional rank tracking tells you *where* you rank on Google. GEO citation tracking tells you *whether AI assistants cite you*. The GEO Diff Bot adds the missing third thing: **why it changed** — it ties every gained or lost citation back to the content commit that plausibly caused it, or flags it as an external shift when nothing in your repo moved.

## What it does

Given two citation snapshots taken at different times (produced by the plugin's `geo-check` MCP), it:

1. **Diffs** them → gained / lost / unchanged citations, per provider (ChatGPT, Claude, Perplexity, Gemini), per prompt.
2. **Correlates** each change to the content commit(s) in the window between the snapshots — git-blame at commit granularity, restricted to your content files.
3. **Flags external shifts** — when a citation changes but no content changed in your repo, it says so plainly: this was a model update, a competitor, or a crawl refresh — not you.

## Why it matters

- **Citations churn on a ~14-day window.** "We got cited once" decays silently. This catches regressions.
- **Attribution stops false credit/blame.** A lost citation on a day you shipped nothing is a market signal, not a code bug — and the bot tells them apart.
- **It's a plain CLI.** Wire it into cron or CI; gate a build on a net citation loss if you want.

## The two moving parts

| Part | Where | Makes live API calls? |
|---|---|---|
| Snapshot producer (`geo_track`) | `mcp-servers/geo-check/` | Yes — polls the LLM providers, stamps the snapshot with the current git commit. |
| Diff + correlation engine | `scripts/geo-diff-bot.js` | **No** — pure, offline, deterministic, fully unit-tested. |

The snapshot JSON on disk is the seam between them.

## Quick start

```bash
# 1) Take a snapshot from your site's repo root (needs provider API keys —
#    see mcp-servers/geo-check/README.md). Do this via the geo-check MCP's
#    geo_track tool, writing a dated file, e.g.:
#      .claude/seo/geo-snapshots/2026-07-06.json
#
# 2) A day (or a deploy) later, take another one:
#      .claude/seo/geo-snapshots/2026-07-07.json
#
# 3) Diff them and correlate to commits:
node scripts/geo-diff-bot.js \
  .claude/seo/geo-snapshots/2026-07-06.json \
  .claude/seo/geo-snapshots/2026-07-07.json \
  --repo . \
  --json .claude/seo/geo-diff-report.json
```

Example output:

```
GEO Diff Bot — example.com
  window: 2026-07-06T00:00:00Z @a1b2c3d4  ->  2026-07-07T00:00:00Z @e5f6a7b8
  net citation delta: ChatGPT: +1, Claude: 0, Perplexity: -1

2 citation change(s):
  + GAINED  [ChatGPT] best open-source CRM for startups
            attributed (high): single content commit in window (e5f6a7b) — strongest candidate cause
            candidate commit(s): e5f6a7b
  - LOST    [Perplexity] cheapest transactional email API
            unattributed (external): no content changes in the window — this shift is likely
            external (model update, competitor, or crawl refresh), not your edits

git window: a1b2c3d..e5f6a7b
content commits in window (1):
  e5f6a7b  add CRM comparison table + FAQ  — Ben
            files: content/crm.md
```

Or just ask Claude, in a repo with the plugin installed:

> Run a GEO citation diff between yesterday's and today's snapshots and tell me which commit won or lost each citation.

## Options

| Flag | Meaning |
|---|---|
| `--repo <dir>` | Repo to git-blame against (default: cwd). |
| `--content <glob>` | Content pathspec to attribute against (repeatable). Defaults: `content/ src/content/ app/ pages/ posts/ blog/ *.md *.mdx`. |
| `--json <out>` | Also write the full structured report as JSON. |

## Honesty about correlation

This is **temporal correlation at commit-window resolution, not causal proof**. An answer engine is a black box that moves on its own. The bot's job is to line up citation changes with the commits that *could* have caused them — and, just as importantly, to say `external` when none of your commits line up. Read a *sustained* attributed loss as the actionable event, not a single day's noise.

## Tests

The diff engine, the correlation logic, and the git-blame collection are all unit-tested (`test/geo-diff-bot.test.js`, run via `node --test`) — including against a real throwaway git repo. No test makes a live LLM call.

## Related skills

- **`optimizing-for-generative-engines`** — the per-page craft that *earns* citations.
- **`refreshing-stale-content`** — the decay-driven content-refresh loop.
