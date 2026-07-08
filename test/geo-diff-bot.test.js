"use strict";

/**
 * test/geo-diff-bot.test.js — unit tests for the GEO Diff Bot.
 *
 * Covers the deterministic, offline core (scripts/geo-diff-bot.js):
 *   - validateSnapshot / loadSnapshot   (snapshot store contract)
 *   - diffSnapshots                     (pure diff engine, incl. prompt drift)
 *   - correlateChanges                  (pure git-blame correlation logic)
 *   - collectGitFacts                   (against a REAL temp git repo — the
 *                                        git-blame/log step, no LLM anywhere)
 *   - CLI                               (child process, render + exit codes)
 *
 * No live LLM calls: snapshots are hand-built fixtures. The only external
 * dependency is `git`, exercised against a throwaway repo created per test;
 * the git-integration tests skip cleanly if `git` is not on PATH.
 *
 * Node stdlib only (node:test + node:assert) — no package.json, no deps.
 * Run with:  node --test
 */

const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const bot = require("../scripts/geo-diff-bot.js");

const SCRIPT = path.join(__dirname, "..", "scripts", "geo-diff-bot.js");
const createdDirs = [];

after(() => {
  for (const dir of createdDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
});

function tmpDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  createdDirs.push(dir);
  return dir;
}

// Build a minimal valid snapshot. `cells` is {provider: {prompt: cited(bool)}}.
function snapshot({ domain = "example.com", timestamp = "2026-07-01T00:00:00Z", commit = null, cells = {} }) {
  const results = {};
  for (const [provider, prompts] of Object.entries(cells)) {
    results[provider] = {};
    for (const [prompt, cited] of Object.entries(prompts)) {
      results[provider][prompt] = { cited, snippet: cited ? `...${domain}...` : "" };
    }
  }
  return { schema_version: 1, domain, timestamp, commit, providers: Object.keys(cells), results };
}

function gitAvailable() {
  const r = spawnSync("git", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

// ---------------------------------------------------------------------------
// validateSnapshot
// ---------------------------------------------------------------------------

test("validateSnapshot: accepts a well-formed snapshot", () => {
  const snap = snapshot({ cells: { anthropic: { "best crm": true } } });
  const { ok, errors } = bot.validateSnapshot(snap);
  assert.equal(ok, true, errors.join("; "));
});

test("validateSnapshot: rejects non-object", () => {
  assert.equal(bot.validateSnapshot(null).ok, false);
  assert.equal(bot.validateSnapshot([]).ok, false);
  assert.equal(bot.validateSnapshot("nope").ok, false);
});

test("validateSnapshot: rejects missing domain + results", () => {
  const r = bot.validateSnapshot({ schema_version: 1 });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("domain")));
  assert.ok(r.errors.some((e) => e.includes("results")));
});

test("validateSnapshot: rejects a cell with no `cited`", () => {
  const bad = { domain: "x.com", results: { anthropic: { "q": { snippet: "hi" } } } };
  const r = bot.validateSnapshot(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("cited")));
});

test("loadSnapshot: round-trips a file; throws readable errors", () => {
  const dir = tmpDir("geo-load-");
  const good = path.join(dir, "good.json");
  fs.writeFileSync(good, JSON.stringify(snapshot({ cells: { openai: { q: true } } })));
  const loaded = bot.loadSnapshot(good);
  assert.equal(loaded.domain, "example.com");

  const bad = path.join(dir, "bad.json");
  fs.writeFileSync(bad, "{ not json");
  assert.throws(() => bot.loadSnapshot(bad), /not valid JSON/);

  assert.throws(() => bot.loadSnapshot(path.join(dir, "missing.json")), /cannot read/);

  const malformed = path.join(dir, "malformed.json");
  fs.writeFileSync(malformed, JSON.stringify({ schema_version: 1 }));
  assert.throws(() => bot.loadSnapshot(malformed), /malformed/);
});

// ---------------------------------------------------------------------------
// diffSnapshots — the pure diff engine
// ---------------------------------------------------------------------------

test("diffSnapshots: classifies gained / lost / unchanged", () => {
  const prev = snapshot({
    commit: "aaaa",
    cells: {
      anthropic: { "best crm": false, "top esp": true, "steady q": true },
    },
  });
  const next = snapshot({
    commit: "bbbb",
    cells: {
      anthropic: { "best crm": true, "top esp": false, "steady q": true },
    },
  });
  const diff = bot.diffSnapshots(prev, next);

  assert.equal(diff.totals.gained, 1);
  assert.equal(diff.totals.lost, 1);
  assert.equal(diff.totals.unchanged, 1);

  const gained = diff.changes.find((c) => c.change === "gained");
  const lost = diff.changes.find((c) => c.change === "lost");
  assert.equal(gained.prompt, "best crm");
  assert.equal(gained.label, "Claude");
  assert.equal(lost.prompt, "top esp");

  // Net delta per provider surfaces in the summary line: +1 gained -1 lost = 0.
  assert.equal(diff.summaryLine, "Claude: 0");
  assert.equal(diff.from.commit, "aaaa");
  assert.equal(diff.to.commit, "bbbb");
});

test("diffSnapshots: multi-provider net deltas + summary", () => {
  const prev = snapshot({
    cells: { anthropic: { q: false }, openai: { q: true }, perplexity: { q: true } },
  });
  const next = snapshot({
    cells: { anthropic: { q: true }, openai: { q: true }, perplexity: { q: false } },
  });
  const diff = bot.diffSnapshots(prev, next);
  assert.equal(diff.summaryLine, "Claude: +1, ChatGPT: 0, Perplexity: -1");
  assert.equal(diff.totals.gained, 1);
  assert.equal(diff.totals.lost, 1);
});

test("diffSnapshots: warns (does not crash) on prompt-set drift", () => {
  const prev = snapshot({ cells: { anthropic: { "kept": true, "dropped": true } } });
  const next = snapshot({ cells: { anthropic: { "kept": false, "added": true } } });
  const diff = bot.diffSnapshots(prev, next);

  // Only "kept" is diffable: was cited, now not -> one lost, no crash.
  assert.equal(diff.totals.lost, 1);
  assert.equal(diff.changes.length, 1);
  assert.ok(diff.warnings.some((w) => w.includes("dropped")));
  assert.ok(diff.warnings.some((w) => w.includes("added")));
});

test("diffSnapshots: warns on provider-set drift", () => {
  const prev = snapshot({ cells: { anthropic: { q: true } } });
  const next = snapshot({ cells: { anthropic: { q: true }, gemini: { q: true } } });
  const diff = bot.diffSnapshots(prev, next);
  assert.ok(diff.warnings.some((w) => w.includes("gemini") && w.includes("newer")));
});

test("diffSnapshots: no changes -> empty changes, zeroed summary", () => {
  const prev = snapshot({ cells: { openai: { q: true } } });
  const next = snapshot({ cells: { openai: { q: true } } });
  const diff = bot.diffSnapshots(prev, next);
  assert.equal(diff.changes.length, 0);
  assert.equal(diff.totals.unchanged, 1);
  assert.equal(diff.summaryLine, "ChatGPT: 0");
});

// ---------------------------------------------------------------------------
// correlateChanges — pure attribution logic
// ---------------------------------------------------------------------------

function oneChangeDiff() {
  const prev = snapshot({ commit: "aaaa", cells: { openai: { "best crm": false } } });
  const next = snapshot({ commit: "bbbb", cells: { openai: { "best crm": true } } });
  return bot.diffSnapshots(prev, next);
}

test("correlateChanges: single content commit -> high confidence, attributed", () => {
  const diff = oneChangeDiff();
  const facts = {
    available: true,
    range: "aaaa..bbbb",
    changedFiles: ["content/crm.md"],
    commits: [{ sha: "b".repeat(40), shortSha: "bbbbbbb", subject: "add crm faq", author: "Ben", date: "2026-07-02", files: ["content/crm.md"] }],
  };
  const cor = bot.correlateChanges(diff, facts);
  assert.equal(cor.verdict, "attributed");
  const c = cor.correlations[0];
  assert.equal(c.confidence, "high");
  assert.equal(c.verdict, "attributed");
  assert.deepEqual(c.candidateCommits, ["bbbbbbb"]);
  assert.match(c.note, /strongest candidate/);
});

test("correlateChanges: multiple content commits -> medium confidence, all candidates", () => {
  const diff = oneChangeDiff();
  const facts = {
    available: true,
    range: "aaaa..bbbb",
    changedFiles: ["content/crm.md", "content/esp.md"],
    commits: [
      { sha: "1".repeat(40), shortSha: "1111111", subject: "a", author: "Ben", date: "d", files: ["content/crm.md"] },
      { sha: "2".repeat(40), shortSha: "2222222", subject: "b", author: "Ben", date: "d", files: ["content/esp.md"] },
    ],
  };
  const cor = bot.correlateChanges(diff, facts);
  const c = cor.correlations[0];
  assert.equal(c.confidence, "medium");
  assert.deepEqual(c.candidateCommits, ["1111111", "2222222"]);
  assert.match(c.note, /not proven causation/);
});

test("correlateChanges: no content changes -> external, unattributed (the honest signal)", () => {
  const diff = oneChangeDiff();
  const facts = { available: true, range: "aaaa..bbbb", changedFiles: [], commits: [] };
  const cor = bot.correlateChanges(diff, facts);
  assert.equal(cor.verdict, "unattributed");
  const c = cor.correlations[0];
  assert.equal(c.confidence, "external");
  assert.equal(c.candidateCommits.length, 0);
  assert.match(c.note, /external/);
});

test("correlateChanges: content changed but no discrete commit -> attributed, not external", () => {
  // Merge-based repo: git diff shows content changed, but --no-merges log was
  // empty and the fallback still resolved nothing. Must NOT be called external.
  const diff = oneChangeDiff();
  const facts = { available: true, range: "aaaa..bbbb", changedFiles: ["content/crm.md"], commits: [] };
  const cor = bot.correlateChanges(diff, facts);
  assert.equal(cor.verdict, "attributed");
  const c = cor.correlations[0];
  assert.equal(c.confidence, "medium");
  assert.match(c.note, /no.*discrete commit/);
});

test("correlateChanges: git unavailable -> no-git verdict, diff still stands", () => {
  const diff = oneChangeDiff();
  const facts = { available: false, reason: "commit not found", commits: [], changedFiles: [] };
  const cor = bot.correlateChanges(diff, facts);
  assert.equal(cor.verdict, "no-git");
  assert.equal(cor.correlations[0].verdict, "no-git");
  assert.equal(cor.gitReason, "commit not found");
});

test("correlateChanges: no changes -> no-change rollup", () => {
  const prev = snapshot({ commit: "a", cells: { openai: { q: true } } });
  const next = snapshot({ commit: "b", cells: { openai: { q: true } } });
  const diff = bot.diffSnapshots(prev, next);
  const cor = bot.correlateChanges(diff, { available: true, range: "a..b", commits: [], changedFiles: [] });
  assert.equal(cor.verdict, "no-change");
  assert.equal(cor.correlations.length, 0);
});

// ---------------------------------------------------------------------------
// collectGitFacts — against a REAL temp git repo (the git-blame/log step)
// ---------------------------------------------------------------------------

function initRepo() {
  const dir = tmpDir("geo-git-");
  const g = (args) => {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
    return r.stdout.trim();
  };
  g(["init", "-q"]);
  g(["config", "user.email", "test@example.com"]);
  g(["config", "user.name", "Test"]);
  g(["config", "commit.gpgsign", "false"]);
  return { dir, g };
}

test("collectGitFacts: finds content commits in the window, filters non-content", { skip: !gitAvailable() }, () => {
  const { dir, g } = initRepo();
  fs.mkdirSync(path.join(dir, "content"));

  // Commit A (base): a content page + a non-content config file.
  fs.writeFileSync(path.join(dir, "content", "crm.md"), "# CRM\nv1\n");
  fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}\n");
  g(["add", "-A"]); g(["commit", "-qm", "base"]);
  const shaA = g(["rev-parse", "HEAD"]);

  // Commit B: edit the content page (a *content* commit — should be found).
  fs.writeFileSync(path.join(dir, "content", "crm.md"), "# CRM\nv2 with a quotable stat [source]\n");
  g(["add", "-A"]); g(["commit", "-qm", "add crm quotable stat"]);
  const shaB = g(["rev-parse", "HEAD"]);

  // Commit C: edit a non-content config file (must be EXCLUDED by the pathspec).
  fs.writeFileSync(path.join(dir, "tsconfig.json"), '{"strict":true}\n');
  g(["add", "-A"]); g(["commit", "-qm", "tighten tsconfig"]);
  const shaC = g(["rev-parse", "HEAD"]);

  const facts = bot.collectGitFacts({
    repoDir: dir,
    fromCommit: shaA,
    toCommit: shaC,
    contentGlobs: ["content"],
  });

  assert.equal(facts.available, true, facts.reason);
  // Only the content commit (B) is in the window under the content pathspec.
  assert.equal(facts.commits.length, 1);
  assert.equal(facts.commits[0].sha, shaB);
  assert.equal(facts.commits[0].subject, "add crm quotable stat");
  assert.deepEqual(facts.commits[0].files, ["content/crm.md"]);
  assert.deepEqual(facts.changedFiles, ["content/crm.md"]);
  // Sanity: shaA/shaC are real, distinct commits.
  assert.notEqual(shaA, shaC);
});

test("collectGitFacts: unresolvable commit -> available:false with reason", { skip: !gitAvailable() }, () => {
  const { dir, g } = initRepo();
  fs.writeFileSync(path.join(dir, "a.md"), "hi\n");
  g(["add", "-A"]); g(["commit", "-qm", "one"]);
  const real = g(["rev-parse", "HEAD"]);

  const facts = bot.collectGitFacts({
    repoDir: dir,
    fromCommit: real,
    toCommit: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  });
  assert.equal(facts.available, false);
  assert.match(facts.reason, /to-commit/);
});

test("collectGitFacts: missing commit field -> available:false, no git calls", () => {
  let called = 0;
  const facts = bot.collectGitFacts({
    repoDir: "/nope",
    fromCommit: null,
    toCommit: "bbbb",
    runGit: () => { called++; return { ok: true, stdout: "", stderr: "", status: 0 }; },
  });
  assert.equal(facts.available, false);
  assert.equal(called, 0);
  assert.match(facts.reason, /no `commit` field/);
});

test("collectGitFacts: end-to-end via runDiffBot against a real repo", { skip: !gitAvailable() }, () => {
  const { dir, g } = initRepo();
  fs.mkdirSync(path.join(dir, "content"));
  fs.writeFileSync(path.join(dir, "content", "crm.md"), "v1\n");
  g(["add", "-A"]); g(["commit", "-qm", "base"]);
  const shaA = g(["rev-parse", "HEAD"]);
  fs.writeFileSync(path.join(dir, "content", "crm.md"), "v2 quotable\n");
  g(["add", "-A"]); g(["commit", "-qm", "quotable stat added"]);
  const shaB = g(["rev-parse", "HEAD"]);

  const prev = snapshot({ commit: shaA, cells: { openai: { "best crm": false } } });
  const next = snapshot({ commit: shaB, cells: { openai: { "best crm": true } } });
  const report = bot.runDiffBot({ prev, next, repoDir: dir, contentGlobs: ["content"] });

  assert.equal(report.diff.totals.gained, 1);
  assert.equal(report.correlation.verdict, "attributed");
  assert.equal(report.correlation.correlations[0].confidence, "high");
  assert.equal(report.correlation.correlations[0].candidateCommits[0], next.commit.slice(0, 7));
});

// ---------------------------------------------------------------------------
// formatReport
// ---------------------------------------------------------------------------

test("formatReport: renders gained/lost lines + external verdict", () => {
  const prev = snapshot({ commit: "aaaa", cells: { openai: { q: false } } });
  const next = snapshot({ commit: "bbbb", cells: { openai: { q: true } } });
  const diff = bot.diffSnapshots(prev, next);
  const cor = bot.correlateChanges(diff, { available: true, range: "aaaa..bbbb", commits: [], changedFiles: [] });
  const out = bot.formatReport({ diff, correlation: cor });
  assert.match(out, /GEO Diff Bot — example\.com/);
  assert.match(out, /\+ GAINED/);
  assert.match(out, /external/);
});

// ---------------------------------------------------------------------------
// CLI (child process)
// ---------------------------------------------------------------------------

function runCli(args, cwd) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: cwd || process.cwd(),
    encoding: "utf8",
  });
}

test("cli: --help exits 0 and prints usage", () => {
  const res = runCli(["--help"]);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Usage: node scripts\/geo-diff-bot\.js/);
});

test("cli: missing args exits 1 with usage", () => {
  const res = runCli([]);
  assert.equal(res.status, 1);
  assert.match(res.stdout, /Usage:/);
});

test("cli: malformed snapshot exits 1 with readable error", () => {
  const dir = tmpDir("geo-cli-bad-");
  const p = path.join(dir, "prev.json");
  const n = path.join(dir, "next.json");
  fs.writeFileSync(p, "{ broken");
  fs.writeFileSync(n, JSON.stringify(snapshot({ cells: { openai: { q: true } } })));
  const res = runCli([p, n]);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /geo-diff-bot:/);
});

test("cli: diffs two snapshots, renders report + writes --json", () => {
  const dir = tmpDir("geo-cli-");
  const p = path.join(dir, "prev.json");
  const n = path.join(dir, "next.json");
  const out = path.join(dir, "report.json");
  // No commit fields -> git correlation cleanly unavailable, diff still renders.
  fs.writeFileSync(p, JSON.stringify(snapshot({ cells: { openai: { "best crm": false } } })));
  fs.writeFileSync(n, JSON.stringify(snapshot({ cells: { openai: { "best crm": true } } })));

  const res = runCli([p, n, "--json", out]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /\+ GAINED {2}\[ChatGPT\] best crm/);
  assert.match(res.stdout, /git correlation: unavailable/);

  const report = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.equal(report.diff.totals.gained, 1);
  assert.equal(report.correlation.gitAvailable, false);
});
