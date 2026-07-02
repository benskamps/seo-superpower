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
