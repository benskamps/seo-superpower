#!/usr/bin/env node
/**
 * scripts/decay-check-run.js — manual-trigger handler for the content-decay hook.
 *
 * Wired by hooks/seo-decay-check.json (UserPromptSubmit). When the user types a
 * trigger phrase ("/seo refresh", "run decay check", "weekly seo sweep"), this
 * prints a directive into context that loads the refreshing-stale-content skill
 * and runs the sweep workflow. The hook matches the phrase; this script emits
 * the routing directive. It does not query GSC or open PRs itself — that work
 * lives in the skill.
 *
 * Node stdlib only — no external deps. Always exits 0 so it can never block a
 * prompt submission.
 */
"use strict";

const DIRECTIVE = [
  "Load the `refreshing-stale-content` skill and run the weekly decay sweep:",
  "query gsc-mcp for the configured site over a 12-month window, rank pages by",
  "decay severity against the thresholds in skills/refreshing-stale-content/SKILL.md,",
  "present the top candidates, and — only after the user confirms — open one",
  "content-refresh PR per page (copy edits, dateModified bump, internal links).",
].join(" ");

try {
  process.stdout.write(DIRECTIVE + "\n");
} catch {
  // Never let the directive emit break prompt submission.
}
process.exit(0);
