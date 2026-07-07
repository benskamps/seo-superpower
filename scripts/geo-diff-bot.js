#!/usr/bin/env node
/**
 * scripts/geo-diff-bot.js — the GEO Diff Bot.
 *
 * Turns two GEO citation snapshots (produced by the geo-check MCP's `geo_track`
 * tool) into a *daily citation diff correlated to the git commits that plausibly
 * caused each change*. This is the deterministic, offline core of the moat demo:
 *
 *   1. loadSnapshot()      — read + validate a snapshot JSON on disk.
 *   2. diffSnapshots()     — pure diff of two snapshots -> gained / lost cells.
 *   3. collectGitFacts()   — git-blame/log the content files that changed between
 *                            the two snapshots' commits (injectable git runner).
 *   4. correlateChanges()  — pure: attribute each citation change to the content
 *                            commits in the window (temporal correlation, honest
 *                            about the causal ceiling).
 *   5. runDiffBot()        — orchestrates 1-4 into one report.
 *   6. formatReport()      — human-readable render for the CLI.
 *
 * WHAT IS BUILT vs A SEAM
 *   Everything in this file is fully built and unit-tested against deterministic
 *   fixtures + a real temp git repo — no live LLM calls anywhere. Producing the
 *   snapshots themselves (the only step that needs live provider calls) is the
 *   *existing* geo-check MCP `geo_track` tool; this bot consumes its JSON output.
 *   That is the documented integration seam, and it already ships and works.
 *
 * Node stdlib only — no package.json, no deps. Exports pure functions for
 * `node --test`; runs as a CLI when invoked directly.
 *
 * CLI:
 *   node scripts/geo-diff-bot.js <prev.json> <next.json> \
 *     [--repo <dir>] [--content <glob>]... [--json <out.json>]
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Provider slug -> human label, matching the geo-check MCP's summary lines.
const PROVIDER_LABELS = {
  anthropic: "Claude",
  openai: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

// Default content globs. A citation shift is plausibly caused by a change to the
// *content* the engines read — not to build config or tests. These cover the
// common places the plugin's target stacks (Next.js / Astro / SvelteKit) keep
// prose. Override with --content on the CLI.
const DEFAULT_CONTENT_GLOBS = [
  "content/**",
  "src/content/**",
  "app/**",
  "pages/**",
  "posts/**",
  "blog/**",
  "*.md",
  "*.mdx",
];

function labelFor(provider) {
  return PROVIDER_LABELS[provider] || provider;
}

// ---------------------------------------------------------------------------
// 1. Snapshot loading + validation
// ---------------------------------------------------------------------------

/**
 * Validate the shape a snapshot must have to be diffable. Mirrors the payload
 * written by the geo-check MCP `geo_track` tool (schema_version 1), plus the
 * optional `commit` field the GEO Diff Bot relies on for correlation.
 *
 * @returns {{ok: boolean, errors: string[]}}
 */
function validateSnapshot(obj) {
  const errors = [];
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, errors: ["snapshot is not a JSON object"] };
  }
  if (typeof obj.domain !== "string" || !obj.domain.trim()) {
    errors.push("missing/empty `domain`");
  }
  if (obj.results === null || typeof obj.results !== "object" || Array.isArray(obj.results)) {
    errors.push("missing/invalid `results` object");
  } else {
    for (const [provider, byPrompt] of Object.entries(obj.results)) {
      if (byPrompt === null || typeof byPrompt !== "object" || Array.isArray(byPrompt)) {
        errors.push(`results.${provider} is not an object`);
        continue;
      }
      for (const [prompt, cell] of Object.entries(byPrompt)) {
        if (cell === null || typeof cell !== "object" || Array.isArray(cell)) {
          errors.push(`results.${provider}[${JSON.stringify(prompt)}] is not an object`);
        } else if (!("cited" in cell)) {
          errors.push(`results.${provider}[${JSON.stringify(prompt)}] has no \`cited\``);
        }
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Read + parse + validate a snapshot file. Throws a readable Error on any
 * problem so the CLI can print a clean message and exit non-zero.
 */
function loadSnapshot(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    throw new Error(`cannot read snapshot ${filePath}: ${e.message}`);
  }
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error(`snapshot ${filePath} is not valid JSON: ${e.message}`);
  }
  const { ok, errors } = validateSnapshot(obj);
  if (!ok) {
    throw new Error(`snapshot ${filePath} is malformed:\n  - ${errors.join("\n  - ")}`);
  }
  return obj;
}

// ---------------------------------------------------------------------------
// 2. Diff engine (pure)
// ---------------------------------------------------------------------------

/**
 * Diff two snapshots into per-cell citation-state changes.
 *
 * A "cell" is a (provider, prompt) pair. For every cell present in BOTH
 * snapshots we classify the citation transition:
 *   - gained: was not cited, now cited
 *   - lost:   was cited, now not cited
 *   - unchanged: same cited boolean
 *
 * Cells that appear in only one snapshot (the prompt or provider set drifted
 * between runs) can't be diffed apples-to-apples. Rather than silently drop
 * them, we surface them as `warnings` so the caller knows the comparison was
 * partial — a common real-world footgun when someone edits their prompt list.
 *
 * Pure: no I/O, deterministic, key order stable. Safe to unit-test directly.
 */
function diffSnapshots(prev, next) {
  const changes = []; // gained + lost cells
  const perProvider = {}; // provider -> {gained, lost, unchanged}
  const warnings = [];

  const prevResults = prev.results || {};
  const nextResults = next.results || {};

  const allProviders = unionKeys(prevResults, nextResults);

  for (const provider of allProviders) {
    const prevPrompts = prevResults[provider] || {};
    const nextPrompts = nextResults[provider] || {};
    perProvider[provider] = { gained: 0, lost: 0, unchanged: 0 };

    if (!(provider in prevResults)) {
      warnings.push(`provider "${provider}" only in the newer snapshot — not diffable`);
    } else if (!(provider in nextResults)) {
      warnings.push(`provider "${provider}" only in the older snapshot — not diffable`);
    }

    for (const prompt of unionKeys(prevPrompts, nextPrompts)) {
      const inPrev = prompt in prevPrompts;
      const inNext = prompt in nextPrompts;
      if (inPrev && !inNext) {
        warnings.push(`prompt only in older snapshot [${labelFor(provider)}]: ${prompt}`);
        continue;
      }
      if (!inPrev && inNext) {
        warnings.push(`prompt only in newer snapshot [${labelFor(provider)}]: ${prompt}`);
        continue;
      }
      const wasCited = Boolean(prevPrompts[prompt].cited);
      const nowCited = Boolean(nextPrompts[prompt].cited);
      if (nowCited && !wasCited) {
        perProvider[provider].gained += 1;
        changes.push(makeChange(provider, prompt, "gained", wasCited, nowCited, nextPrompts[prompt]));
      } else if (wasCited && !nowCited) {
        perProvider[provider].lost += 1;
        changes.push(makeChange(provider, prompt, "lost", wasCited, nowCited, prevPrompts[prompt]));
      } else {
        perProvider[provider].unchanged += 1;
      }
    }
  }

  const totals = { gained: 0, lost: 0, unchanged: 0 };
  for (const counts of Object.values(perProvider)) {
    totals.gained += counts.gained;
    totals.lost += counts.lost;
    totals.unchanged += counts.unchanged;
  }

  return {
    domain: next.domain || prev.domain,
    from: { timestamp: prev.timestamp || null, commit: prev.commit || null },
    to: { timestamp: next.timestamp || null, commit: next.commit || null },
    changes,
    perProvider,
    totals,
    warnings,
    summaryLine: summaryLine(perProvider),
  };
}

function makeChange(provider, prompt, change, wasCited, nowCited, cell) {
  return {
    provider,
    label: labelFor(provider),
    prompt,
    change,
    wasCited,
    nowCited,
    // The snippet from whichever snapshot shows the citation (context for the diff).
    snippet: (cell && typeof cell.snippet === "string") ? cell.snippet : "",
  };
}

function summaryLine(perProvider) {
  const parts = [];
  for (const [provider, counts] of Object.entries(perProvider)) {
    const delta = counts.gained - counts.lost;
    const sign = delta > 0 ? "+" : "";
    parts.push(`${labelFor(provider)}: ${sign}${delta}`);
  }
  return parts.join(", ");
}

function unionKeys(a, b) {
  // Stable order: keys of `a` first (insertion order), then any new keys of `b`.
  const seen = new Set();
  const out = [];
  for (const k of Object.keys(a || {})) {
    if (!seen.has(k)) { seen.add(k); out.push(k); }
  }
  for (const k of Object.keys(b || {})) {
    if (!seen.has(k)) { seen.add(k); out.push(k); }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 3. Git fact collection (git-blame / git-log over the snapshot window)
// ---------------------------------------------------------------------------

// Field + record separators for machine-parsable `git log` output. \x1f (unit
// separator) and \x1e (record separator) never appear in commit metadata.
const GIT_FS = "\x1f";
const GIT_RS = "\x1e";

/**
 * Default git runner: shell out to the real `git` binary. Injectable so tests
 * can drive `collectGitFacts` with a real temp repo or a stubbed runner.
 *
 * @returns {{ok: boolean, stdout: string, stderr: string, status: number|null}}
 */
function defaultRunGit(args, cwd) {
  const res = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (res.error) {
    return { ok: false, stdout: "", stderr: String(res.error.message), status: null };
  }
  return {
    ok: res.status === 0,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
    status: res.status,
  };
}

/**
 * Collect the content commits + changed files between two snapshot commits.
 *
 * This is the "git-blame correlation" data-gathering step: given the git SHA
 * recorded in each snapshot, find every commit that touched a *content* file in
 * the window `fromCommit..toCommit`. Those commits are the candidate causes for
 * any citation change observed between the two snapshots.
 *
 * @param {object} opts
 * @param {string} opts.repoDir       - repo working dir.
 * @param {string} opts.fromCommit    - older snapshot's commit (exclusive bound).
 * @param {string} opts.toCommit      - newer snapshot's commit (inclusive bound).
 * @param {string[]} [opts.contentGlobs] - pathspecs limiting to content files.
 * @param {function} [opts.runGit]    - injectable git runner (defaults to real git).
 * @returns {{available: boolean, reason?: string, range: string,
 *            commits: object[], changedFiles: string[]}}
 */
function collectGitFacts({ repoDir, fromCommit, toCommit, contentGlobs, runGit } = {}) {
  const run = runGit || defaultRunGit;
  const globs = contentGlobs && contentGlobs.length ? contentGlobs : DEFAULT_CONTENT_GLOBS;
  const range = `${fromCommit || "?"}..${toCommit || "?"}`;

  if (!fromCommit || !toCommit) {
    return {
      available: false,
      reason: "one or both snapshots have no `commit` field — cannot correlate to git",
      range,
      commits: [],
      changedFiles: [],
    };
  }

  // Confirm both commits resolve in this repo (a snapshot may come from a
  // different clone, or the commit may have been rebased away).
  for (const [which, sha] of [["from", fromCommit], ["to", toCommit]]) {
    const res = run(["rev-parse", "--verify", "--quiet", `${sha}^{commit}`], repoDir);
    if (!res.ok) {
      return {
        available: false,
        reason: `${which}-commit "${sha}" not found in ${repoDir || "repo"} (wrong clone or rebased away?)`,
        range,
        commits: [],
        changedFiles: [],
      };
    }
  }

  const pathspec = ["--", ...globs];

  // Net content files changed across the window (git diff sees through merge
  // commits, so this is the authoritative "did the content the engines read
  // change?" signal — the one correlateChanges keys its verdict off).
  const filesRes = run(["diff", "--name-only", range, ...pathspec], repoDir);
  const changedFiles = filesRes.ok
    ? filesRes.stdout.split("\n").map((s) => s.trim()).filter(Boolean)
    : [];

  // Candidate commits in the window. Prefer non-merge commits — their subjects
  // are the actual "add FAQ / rewrite intro" changes. But a repo that lands PRs
  // as merge commits keeps the file changes on the merge, so if --no-merges
  // finds nothing while content demonstrably changed, fall back to including
  // merges rather than falsely reporting "no content commits".
  let commits = collectCommits(run, repoDir, range, pathspec, true);
  if (commits.length === 0 && changedFiles.length > 0) {
    commits = collectCommits(run, repoDir, range, pathspec, false);
  }

  return { available: true, range, commits, changedFiles };
}

/**
 * List commits touching the content pathspec in a range, newest first.
 * @param {boolean} noMerges - exclude merge commits (cleaner subjects).
 */
function collectCommits(run, repoDir, range, pathspec, noMerges) {
  const fmt = ["%H", "%h", "%s", "%an", "%aI"].join(GIT_FS) + GIT_RS;
  const args = ["log"];
  if (noMerges) args.push("--no-merges");
  args.push(`--format=${fmt}`, range, ...pathspec);
  const logRes = run(args, repoDir);
  const commits = [];
  if (!logRes.ok) return commits;
  for (const rec of logRes.stdout.split(GIT_RS)) {
    const line = rec.replace(/^\s+/, "");
    if (!line.trim()) continue;
    const [sha, shortSha, subject, author, date] = line.split(GIT_FS);
    if (!sha) continue;
    // Per-commit content files touched (git-blame at commit granularity).
    // For a merge commit this uses -m/--diff-merges so files still surface.
    const dtArgs = ["diff-tree", "--no-commit-id", "--name-only", "-r"];
    if (!noMerges) dtArgs.push("-m", "--diff-merges=first-parent");
    dtArgs.push(sha, ...pathspec);
    const showRes = run(dtArgs, repoDir);
    const files = showRes.ok
      ? showRes.stdout.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
    commits.push({ sha, shortSha, subject, author, date, files });
  }
  return commits;
}

// ---------------------------------------------------------------------------
// 4. Correlation (pure)
// ---------------------------------------------------------------------------

/**
 * Attribute each citation change to the content commits in the snapshot window.
 *
 * HONESTY NOTE: this is *temporal correlation at commit-window resolution*, not
 * a causal proof. We cannot know that a given commit caused a given citation
 * shift — an answer engine is a black box that also moves on its own (model
 * updates, competitor content, crawl refresh). So:
 *   - If content commits exist in the window, they are ranked candidate causes
 *     for every change, and a single-commit window is flagged as the strongest
 *     candidate.
 *   - If NO content changed in the window, the change is marked `unattributed`
 *     and flagged as *external* — the most valuable honest signal this bot
 *     produces: "your edits didn't move this; the AI landscape did."
 *   - If git is unavailable, changes are `no-git` (diff still stands).
 *
 * Pure: takes the diff + already-collected git facts, returns a report object.
 */
function correlateChanges(diff, gitFacts) {
  const facts = gitFacts || { available: false, reason: "no git facts", commits: [], changedFiles: [] };
  const contentCommits = facts.commits || [];
  const changedFiles = facts.changedFiles || [];
  const candidateShas = contentCommits.map((c) => c.shortSha);

  // The verdict keys off whether *content actually changed* in the window
  // (net `changedFiles`, which sees through merge commits) — not off the
  // candidate-commit count, so a merge-based repo isn't falsely "external".
  let baseVerdict;
  if (!facts.available) baseVerdict = "no-git";
  else if (changedFiles.length === 0) baseVerdict = "unattributed";
  else baseVerdict = "attributed";

  const correlations = diff.changes.map((chg) => {
    let verdict = baseVerdict;
    let confidence;
    let note;
    let candidates = [];

    if (baseVerdict === "no-git") {
      confidence = "none";
      note = facts.reason || "git unavailable — diff stands, but no commit correlation";
    } else if (baseVerdict === "unattributed") {
      confidence = "external";
      note =
        "no content changes in the window — this shift is likely external " +
        "(model update, competitor, or crawl refresh), not your edits";
    } else {
      candidates = candidateShas.slice();
      if (contentCommits.length === 1) {
        confidence = "high";
        note = `single content commit in window (${candidateShas[0]}) — strongest candidate cause`;
      } else if (contentCommits.length > 1) {
        confidence = "medium";
        note =
          `${contentCommits.length} content commits in window — candidate causes ` +
          `(temporal correlation, not proven causation)`;
      } else {
        // Content changed (net diff non-empty) but no discrete commit resolved
        // (e.g. squashed/merged out of range). Still attributed to the files.
        confidence = "medium";
        note =
          `content changed in window (${changedFiles.length} file(s)) but no ` +
          `discrete commit resolved — see changed files`;
      }
    }

    return {
      provider: chg.provider,
      label: chg.label,
      prompt: chg.prompt,
      change: chg.change,
      verdict,
      confidence,
      candidateCommits: candidates,
      note,
    };
  });

  return {
    window: { from: diff.from.commit, to: diff.to.commit, range: facts.range || null },
    gitAvailable: facts.available,
    gitReason: facts.available ? null : (facts.reason || null),
    contentCommits,
    changedFiles: facts.changedFiles || [],
    correlations,
    // Roll-up verdict for the run: attributed if any change has a candidate,
    // external if changes exist but none attributable, clean if no changes.
    verdict: rollupVerdict(diff, facts, baseVerdict),
  };
}

function rollupVerdict(diff, facts, baseVerdict) {
  if (diff.changes.length === 0) return "no-change";
  if (!facts.available) return "no-git";
  return baseVerdict; // attributed | unattributed
}

// ---------------------------------------------------------------------------
// 5. Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the whole GEO Diff Bot pipeline and return one report object.
 * Snapshots may be passed as objects (tests) or the CLI loads them from disk.
 */
function runDiffBot({ prev, next, repoDir, contentGlobs, runGit } = {}) {
  const diff = diffSnapshots(prev, next);
  const gitFacts = collectGitFacts({
    repoDir,
    fromCommit: diff.from.commit,
    toCommit: diff.to.commit,
    contentGlobs,
    runGit,
  });
  const correlation = correlateChanges(diff, gitFacts);
  return { diff, correlation };
}

// ---------------------------------------------------------------------------
// 6. Human-readable report
// ---------------------------------------------------------------------------

function formatReport(report) {
  const { diff, correlation } = report;
  const lines = [];
  lines.push(`GEO Diff Bot — ${diff.domain}`);
  lines.push(`  window: ${fmtStamp(diff.from)}  ->  ${fmtStamp(diff.to)}`);
  lines.push(`  net citation delta: ${diff.summaryLine || "(no providers)"}`);
  lines.push("");

  if (diff.changes.length === 0) {
    lines.push("No citation changes since the previous snapshot.");
  } else {
    lines.push(`${diff.changes.length} citation change(s):`);
    for (const c of correlation.correlations) {
      const arrow = c.change === "gained" ? "+ GAINED" : "- LOST  ";
      lines.push(`  ${arrow}  [${c.label}] ${c.prompt}`);
      const tag = c.confidence ? ` (${c.confidence})` : "";
      lines.push(`            ${c.verdict}${tag}: ${c.note}`);
      if (c.candidateCommits.length) {
        lines.push(`            candidate commit(s): ${c.candidateCommits.join(", ")}`);
      }
    }
  }

  lines.push("");
  if (!correlation.gitAvailable) {
    lines.push(`git correlation: unavailable — ${correlation.gitReason}`);
  } else {
    lines.push(`git window: ${correlation.window.range}`);
    if (correlation.contentCommits.length) {
      lines.push(`content commits in window (${correlation.contentCommits.length}):`);
      for (const c of correlation.contentCommits) {
        lines.push(`  ${c.shortSha}  ${c.subject}  — ${c.author}`);
        if (c.files.length) {
          lines.push(`            files: ${c.files.join(", ")}`);
        }
      }
    } else {
      lines.push("content commits in window: none (changes, if any, are external).");
    }
  }

  if (diff.warnings.length) {
    lines.push("");
    lines.push("warnings (partial comparison):");
    for (const w of diff.warnings) lines.push(`  ! ${w}`);
  }

  return lines.join("\n");
}

function fmtStamp(side) {
  const ts = side.timestamp || "?";
  const commit = side.commit ? `@${side.commit.slice(0, 8)}` : "@?";
  return `${ts} ${commit}`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const positionals = [];
  const contentGlobs = [];
  let repoDir = process.cwd();
  let jsonOut = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") { repoDir = argv[++i]; }
    else if (a === "--content") { contentGlobs.push(argv[++i]); }
    else if (a === "--json") { jsonOut = argv[++i]; }
    else if (a === "-h" || a === "--help") { return { help: true }; }
    else { positionals.push(a); }
  }
  return { positionals, contentGlobs, repoDir, jsonOut };
}

const USAGE = [
  "Usage: node scripts/geo-diff-bot.js <prev.json> <next.json> [options]",
  "",
  "  Diff two GEO citation snapshots (from the geo-check MCP `geo_track` tool)",
  "  and correlate each citation change to the content commits in the window.",
  "",
  "Options:",
  "  --repo <dir>       repo to git-blame against (default: cwd)",
  "  --content <glob>   content pathspec to attribute against (repeatable;",
  "                     defaults to content/ src/content/ app/ pages/ posts/ blog/ *.md *.mdx)",
  "  --json <out.json>  also write the full report as JSON",
  "  -h, --help         show this help",
].join("\n");

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help || !opts.positionals || opts.positionals.length < 2) {
    process.stdout.write(USAGE + "\n");
    return opts.help ? 0 : 1;
  }
  const [prevPath, nextPath] = opts.positionals;
  let prev, next;
  try {
    prev = loadSnapshot(prevPath);
    next = loadSnapshot(nextPath);
  } catch (e) {
    process.stderr.write(`geo-diff-bot: ${e.message}\n`);
    return 1;
  }

  const report = runDiffBot({
    prev,
    next,
    repoDir: opts.repoDir,
    contentGlobs: opts.contentGlobs,
  });

  process.stdout.write(formatReport(report) + "\n");

  if (opts.jsonOut) {
    try {
      fs.mkdirSync(path.dirname(path.resolve(opts.jsonOut)), { recursive: true });
      fs.writeFileSync(opts.jsonOut, JSON.stringify(report, null, 2), "utf8");
      process.stdout.write(`\nreport written to ${opts.jsonOut}\n`);
    } catch (e) {
      process.stderr.write(`geo-diff-bot: could not write --json ${opts.jsonOut}: ${e.message}\n`);
      return 1;
    }
  }
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = {
  validateSnapshot,
  loadSnapshot,
  diffSnapshots,
  collectGitFacts,
  correlateChanges,
  runDiffBot,
  formatReport,
  defaultRunGit,
  DEFAULT_CONTENT_GLOBS,
  PROVIDER_LABELS,
};
