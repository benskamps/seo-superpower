"use strict";

/**
 * test/decay-check.test.js — unit tests for the seo-decay-check hook scripts.
 *
 * Covers the runtime of the shipped seo-decay-check hook (hooks/seo-decay-check.json):
 *   - scripts/decay-check-nudge.js   (SessionStart staleness nudge)
 *   - scripts/decay-check-run.js     (UserPromptSubmit routing directive)
 *
 * Both scripts are entrypoint-only (no module.exports), so the tests drive them
 * as real child processes against a temp .seoconfig.json + CLAUDE_PROJECT_DIR.
 * That exercises the actual stdout / exit-code contract without touching source.
 *
 * Node stdlib only (node:test + node:assert) — no package.json, no deps.
 * Run with:  node --test test/
 */

const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SCRIPTS_DIR = path.join(__dirname, "..", "scripts");
const NUDGE = path.join(SCRIPTS_DIR, "decay-check-nudge.js");
const RUN = path.join(SCRIPTS_DIR, "decay-check-run.js");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const createdDirs = [];

// Fresh, isolated project dir per test; cleaned up after the suite.
function makeProjectDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-decay-test-"));
  createdDirs.push(dir);
  return dir;
}

// `value` may be an object (serialized) or a raw string (for malformed cases).
function writeConfig(dir, value) {
  const body = typeof value === "string" ? value : JSON.stringify(value);
  fs.writeFileSync(path.join(dir, ".seoconfig.json"), body, "utf8");
}

function runNudge(projectDir) {
  return spawnSync(process.execPath, [NUDGE], {
    cwd: projectDir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    encoding: "utf8",
  });
}

function runDirective() {
  return spawnSync(process.execPath, [RUN], {
    env: { ...process.env },
    encoding: "utf8",
  });
}

after(() => {
  for (const dir of createdDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  }
});

// ---------------------------------------------------------------------------
// decay-check-nudge.js — readLastSweep branches + STALE_AFTER_DAYS age gate.
// Contract: never blocks SessionStart (always exit 0); silent unless stale.
// ---------------------------------------------------------------------------

test("nudge: missing .seoconfig.json -> silent, exit 0", () => {
  const dir = makeProjectDir(); // no config written
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: malformed JSON -> silent, exit 0", () => {
  const dir = makeProjectDir();
  writeConfig(dir, "{ not: valid json, ");
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: non-string last_decay_sweep -> silent", () => {
  const dir = makeProjectDir();
  writeConfig(dir, { last_decay_sweep: 1717200000000 });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: missing last_decay_sweep key -> silent", () => {
  const dir = makeProjectDir();
  writeConfig(dir, { site: "https://example.com" });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: unparseable date string -> silent", () => {
  const dir = makeProjectDir();
  writeConfig(dir, { last_decay_sweep: "not-a-real-date" });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: fresh sweep (today) -> silent", () => {
  const dir = makeProjectDir();
  writeConfig(dir, { last_decay_sweep: new Date().toISOString() });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: 6 days old (just under the 7-day gate) -> silent", () => {
  const dir = makeProjectDir();
  const ts = new Date(Date.now() - 6 * MS_PER_DAY).toISOString();
  writeConfig(dir, { last_decay_sweep: ts });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), "");
});

test("nudge: exactly 7 days old (at the gate) -> nudge line, exit 0", () => {
  const dir = makeProjectDir();
  const ts = new Date(Date.now() - 7 * MS_PER_DAY).toISOString();
  writeConfig(dir, { last_decay_sweep: ts });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  // Exact single-line shape, including the trailing newline.
  assert.match(
    res.stdout,
    /^SEO: decay sweep is \d+ days old\. Run \/seo refresh\.\n$/
  );
  // The child's Date.now() runs a few ms after ours, so age floors to 7.
  assert.match(res.stdout, /is 7 days old/);
});

test("nudge: 30 days old (clearly stale) -> nudge reports correct age", () => {
  const dir = makeProjectDir();
  const ts = new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
  writeConfig(dir, { last_decay_sweep: ts });
  const res = runNudge(dir);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /is 30 days old/);
});

// ---------------------------------------------------------------------------
// decay-check-run.js — emits a fixed routing directive, always exit 0.
// ---------------------------------------------------------------------------

test("run: emits the routing directive on a single line, exit 0", () => {
  const res = runDirective();
  assert.equal(res.status, 0);
  const lines = res.stdout.split("\n").filter(Boolean);
  assert.equal(lines.length, 1);
  assert.ok(res.stdout.endsWith("\n"));
});

test("run: directive routes to the refreshing-stale-content skill / sweep", () => {
  const res = runDirective();
  assert.equal(res.status, 0);
  assert.match(res.stdout, /refreshing-stale-content/);
  assert.match(res.stdout, /decay/i);
  assert.match(res.stdout, /gsc-mcp/);
});

// ---------------------------------------------------------------------------
// decay-automation.js — automated decay sweep runner & calculation.
// ---------------------------------------------------------------------------

const { evaluateDecay } = require("../scripts/decay-automation.js");
const AUTO = path.join(SCRIPTS_DIR, "decay-automation.js");

test("decay-automation: evaluateDecay flags pages with sustained YoY impression drops", () => {
  const pages = [
    { url: "https://example.com/blog/decaying", current_impressions: 50, prior_impressions: 100 }, // -50%
    { url: "https://example.com/blog/stable", current_impressions: 95, prior_impressions: 100 },    // -5%
    { url: "https://example.com/blog/growing", current_impressions: 150, prior_impressions: 100 }   // +50%
  ];

  const { decaying, stable } = evaluateDecay(pages, 20);
  assert.equal(decaying.length, 1);
  assert.equal(decaying[0].url, "https://example.com/blog/decaying");
  assert.equal(decaying[0].deltaPct, -50);
  assert.equal(stable.length, 2);
});

// Helper: run the automation runner inside a throwaway project dir.
function runAuto(dir, args) {
  return spawnSync(process.execPath, [AUTO, ...args], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8"
  });
}

// Helper: write a data file and return its path.
function writeData(dir, name, rows) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, JSON.stringify(rows), "utf8");
  return p;
}

test("decay-automation: CLI runs cleanly with --dry-run and --json on healthy data", () => {
  const dir = makeProjectDir();
  const data = writeData(dir, "healthy.json", [
    { url: "https://example.com/fine", current_impressions: 98, prior_impressions: 100 }
  ]);

  const res = runAuto(dir, ["--dry-run", "--json", "--data", data]);
  assert.equal(res.status, 0);
  const parsed = JSON.parse(res.stdout);
  assert.equal(parsed.status, "HEALTHY");
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.totalEvaluated, 1);
  assert.equal(parsed.skippedCount, 0);
});

// Regression guard. Each of these three inputs used to print
// "[PASS] No decaying pages detected. All content is performing within normal
// bounds." and exit 0 — a verdict of "healthy" reached without reading a single
// row. The scheduled workflow ran the first of them weekly. A sweep that cannot
// evaluate must exit 2, never 0.
test("decay-automation: refuses to report health with no data source", () => {
  const dir = makeProjectDir();
  const res = runAuto(dir, ["--dry-run", "--json"]);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /no data source configured/i);
  assert.doesNotMatch(res.stdout, /\[PASS\]/);
});

test("decay-automation: refuses to report health when the data file is missing", () => {
  const dir = makeProjectDir();
  const res = runAuto(dir, ["--dry-run", "--data", path.join(dir, "nope.json")]);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /data file not found/i);
  assert.doesNotMatch(res.stdout, /\[PASS\]/);
});

test("decay-automation: refuses to report health when no row matches the schema", () => {
  const dir = makeProjectDir();
  // Correct-looking JSON, wrong field names — the exact typo that used to read
  // as a clean bill of health.
  const data = writeData(dir, "wrong-schema.json", [
    { url: "https://example.com/a", impressions_current: 100, impressions_prior: 1000 }
  ]);

  const res = runAuto(dir, ["--dry-run", "--data", data]);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /none of the 1 row\(s\)/i);
  assert.doesNotMatch(res.stdout, /\[PASS\]/);
});

test("decay-automation: rejects a data file that is not a JSON array", () => {
  const dir = makeProjectDir();
  const p = path.join(dir, "object.json");
  fs.writeFileSync(p, JSON.stringify({ url: "https://example.com/a" }), "utf8");

  const res = runAuto(dir, ["--dry-run", "--data", p]);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /must contain a JSON array/i);
});

test("decay-automation: evaluates good rows and reports partially skipped ones", () => {
  const dir = makeProjectDir();
  const data = writeData(dir, "mixed.json", [
    { url: "https://example.com/good", current_impressions: 10, prior_impressions: 100 },
    { url: "https://example.com/bad", impressions_current: 10 }
  ]);

  const res = runAuto(dir, ["--dry-run", "--json", "--data", data]);
  assert.equal(res.status, 1);
  const parsed = JSON.parse(res.stdout);
  assert.equal(parsed.totalRows, 2);
  assert.equal(parsed.totalEvaluated, 1);
  assert.equal(parsed.skippedCount, 1);
  assert.deepEqual(parsed.skippedUrls, ["https://example.com/bad"]);
});

test("decay-automation: evaluateDecay reports unusable rows as skipped", () => {
  const { decaying, stable, skipped } = evaluateDecay(
    [
      { url: "https://example.com/a", current_impressions: 10, prior_impressions: 100 },
      { url: "https://example.com/b", current_impressions: "oops", prior_impressions: 100 },
      { url: "https://example.com/c" }
    ],
    20
  );
  assert.equal(decaying.length, 1);
  assert.equal(stable.length, 0);
  assert.deepEqual(skipped, ["https://example.com/b", "https://example.com/c"]);
});

// The scheduled workflow's self-test asserts these exact exit codes. If the
// fixtures or the runner drift, CI must fail rather than quietly go green.
test("decay-automation: committed workflow fixtures produce the asserted exit codes", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const decaying = path.join(repoRoot, "fixtures/decay/decaying-impressions.json");
  const stable = path.join(repoRoot, "fixtures/decay/stable-impressions.json");

  assert.ok(fs.existsSync(decaying), "decaying fixture must exist for the CI self-test");
  assert.ok(fs.existsSync(stable), "stable fixture must exist for the CI self-test");

  const bad = runAuto(repoRoot, ["--dry-run", "--data", decaying]);
  assert.equal(bad.status, 1, "decaying fixture must exit 1");

  const good = runAuto(repoRoot, ["--dry-run", "--data", stable]);
  assert.equal(good.status, 0, "stable fixture must exit 0");
});

test("decay-automation: CLI flags decaying pages and exits with code 1", () => {
  const dir = makeProjectDir();
  const sampleData = path.join(dir, "impressions.json");
  fs.writeFileSync(
    sampleData,
    JSON.stringify([
      { url: "https://example.com/stale-post", current_impressions: 30, prior_impressions: 100 }
    ]),
    "utf8"
  );

  const res = spawnSync(process.execPath, [AUTO, "--data", sampleData, "--json"], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8"
  });
  assert.equal(res.status, 1);
  const parsed = JSON.parse(res.stdout);
  assert.equal(parsed.status, "DECAY_DETECTED");
  assert.equal(parsed.decayCount, 1);
  assert.equal(parsed.decayingPages[0].url, "https://example.com/stale-post");
});

