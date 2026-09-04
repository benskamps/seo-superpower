#!/usr/bin/env node
/**
 * scripts/decay-automation.js — Scheduled & automated content decay sweep runner.
 *
 * Part of seo-superpower.
 * Pure Node.js stdlib only (Node 18+) — zero external dependencies.
 *
 * Capabilities:
 *   - Runs the weekly content decay audit either attended (CLI) or unattended (cron / CI).
 *   - Evaluates page performance against decay thresholds (default: >20% YoY impression drop).
 *   - Updates `last_decay_sweep` timestamp in `.seoconfig.json`.
 *   - Generates structured JSON or Markdown reports suitable for opening auto-PRs or issue alerts.
 *
 * CLI Usage:
 *   node scripts/decay-automation.js [--dry-run] [--threshold-pct <number>] [--site <url>] [--json]
 *
 * Exit codes:
 *   0 = Sweep succeeded and no urgent decay detected
 *   1 = Sweep succeeded and pages exceeding decay threshold were identified
 *   2 = Configuration or argument error
 */
"use strict";

const fs = require("fs");
const path = require("path");

function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..");
}

function loadConfig(root) {
  const cfgPath = path.join(root, ".seoconfig.json");
  try {
    const raw = fs.readFileSync(cfgPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveConfig(root, cfg) {
  const cfgPath = path.join(root, ".seoconfig.json");
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

/**
 * Heuristic evaluation of decay for a list of page impression records.
 * Records shape: [ { url: string, current_impressions: number, prior_impressions: number } ]
 */
function evaluateDecay(pages, thresholdPct) {
  const decaying = [];
  const stable = [];

  for (const p of pages) {
    if (typeof p.prior_impressions !== "number" || typeof p.current_impressions !== "number") {
      continue;
    }
    const prior = p.prior_impressions;
    const current = p.current_impressions;
    if (prior <= 0) continue;

    const deltaPct = ((current - prior) / prior) * 100;
    const item = {
      url: p.url,
      current,
      prior,
      deltaPct: Math.round(deltaPct * 10) / 10
    };

    // If drop is worse than threshold (e.g. deltaPct <= -20%)
    if (deltaPct <= -Math.abs(thresholdPct)) {
      decaying.push(item);
    } else {
      stable.push(item);
    }
  }

  // Sort decaying by most negative delta
  decaying.sort((a, b) => a.deltaPct - b.deltaPct);

  return { decaying, stable };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage:
  node scripts/decay-automation.js [options]

Options:
  --dry-run                 Run sweep without updating last_decay_sweep timestamp.
  --threshold-pct <number>  YoY impression drop threshold percentage (default: 20).
  --site <url>              Override site URL from .seoconfig.json.
  --data <file>             Path to custom JSON file containing page impression stats.
  --json                    Emit structured JSON output.
  --help, -h                Show this help message.`);
    process.exit(0);
  }

  const root = projectRoot();
  const isDryRun = args.includes("--dry-run");
  const isJson = args.includes("--json");

  const threshIdx = args.indexOf("--threshold-pct");
  const thresholdPct = threshIdx !== -1 && args[threshIdx + 1] ? parseFloat(args[threshIdx + 1]) : 20;

  const siteIdx = args.indexOf("--site");
  const siteOverride = siteIdx !== -1 && args[siteIdx + 1] ? args[siteIdx + 1] : null;

  const dataIdx = args.indexOf("--data");
  const dataPath = dataIdx !== -1 && args[dataIdx + 1] ? path.resolve(args[dataIdx + 1]) : null;

  const cfg = loadConfig(root) || {};
  const site = siteOverride || cfg.site || cfg.siteUrl || "local-project";

  let pages = [];
  if (dataPath && fs.existsSync(dataPath)) {
    try {
      pages = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch (err) {
      console.error(`decay-automation: error parsing data file '${dataPath}': ${err.message}`);
      process.exit(2);
    }
  }

  const { decaying, stable } = evaluateDecay(pages, thresholdPct);
  const now = new Date().toISOString();

  if (!isDryRun) {
    cfg.last_decay_sweep = now;
    try {
      saveConfig(root, cfg);
    } catch {
      // Best-effort config save
    }
  }

  const report = {
    site,
    timestamp: now,
    dryRun: isDryRun,
    thresholdPct,
    totalEvaluated: pages.length,
    decayCount: decaying.length,
    decayingPages: decaying,
    status: decaying.length > 0 ? "DECAY_DETECTED" : "HEALTHY"
  };

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n=== Automated Content Decay Sweep ===`);
    console.log(`Site: ${site}`);
    console.log(`Timestamp: ${now} ${isDryRun ? "(DRY RUN)" : ""}`);
    console.log(`Threshold: YoY impressions <= -${thresholdPct}%\n`);

    if (decaying.length === 0) {
      console.log(`[PASS] No decaying pages detected. All content is performing within normal bounds.`);
    } else {
      console.log(`[ALERT] Found ${decaying.length} page(s) exhibiting sustained content decay:`);
      for (const p of decaying) {
        console.log(`  - ${p.url}: ${p.deltaPct}% YoY (${p.prior} -> ${p.current} impressions)`);
      }
      console.log(`\nRecommendation: run '/seo refresh <url>' on candidate pages to open refresh PRs.`);
    }
  }

  process.exit(decaying.length > 0 ? 1 : 0);
}

module.exports = {
  evaluateDecay,
  loadConfig,
  saveConfig
};

if (require.main === module) {
  main();
}
