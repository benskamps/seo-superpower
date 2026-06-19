#!/usr/bin/env node
/**
 * scripts/decay-check-nudge.js — SessionStart nudge for the content-decay hook.
 *
 * Wired by hooks/seo-decay-check.json (SessionStart). When a session starts, this
 * checks how long it has been since the last decay sweep and, if it is stale,
 * surfaces a single-line nudge into context. It never auto-executes the sweep —
 * the user runs `/seo refresh` when they choose to.
 *
 * Node stdlib only — no external deps, so it stays fast and dependency-free
 * (matching scripts/ci-validate.py's stdlib-only contract).
 *
 * Behavior:
 *   - Reads the last-sweep timestamp from .seoconfig.json (`last_decay_sweep`,
 *     an ISO-8601 date string) when present.
 *   - If the config / timestamp is missing or unreadable, stays silent: a fresh
 *     project with no GSC-verified site should not be nagged.
 *   - If the sweep is older than STALE_AFTER_DAYS (default 7), prints one line.
 *   - Always exits 0 so it can never block a SessionStart.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const STALE_AFTER_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function projectRoot() {
  // hooks pass ${CLAUDE_PROJECT_DIR}; fall back to two levels up from this file
  // (scripts/ -> repo root) so it also works when run directly.
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..");
}

function readLastSweep(root) {
  const cfgPath = path.join(root, ".seoconfig.json");
  let raw;
  try {
    raw = fs.readFileSync(cfgPath, "utf8");
  } catch {
    return null; // no config -> not configured -> stay silent
  }
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch {
    return null; // malformed config -> stay silent rather than error
  }
  const ts = cfg && cfg.last_decay_sweep;
  if (typeof ts !== "string") return null;
  const when = Date.parse(ts);
  return Number.isNaN(when) ? null : when;
}

function main() {
  const root = projectRoot();
  const lastSweep = readLastSweep(root);
  if (lastSweep === null) {
    // Not configured (or no sweep yet). Nothing to nudge about.
    return;
  }
  const ageDays = Math.floor((Date.now() - lastSweep) / MS_PER_DAY);
  if (ageDays >= STALE_AFTER_DAYS) {
    process.stdout.write(
      `SEO: decay sweep is ${ageDays} days old. Run /seo refresh.\n`
    );
  }
}

try {
  main();
} catch {
  // Never let a nudge break SessionStart.
}
process.exit(0);
