"use strict";

/**
 * test/brief-assembly.test.js — unit tests for the /seo brief deterministic core.
 *
 * Covers scripts/brief-assembly.js:
 *   - classifyIntent            (pure intent + format heuristics)
 *   - strikingDistance          (pure GSC position 5–15 selection + sort)
 *   - rankInternalLinks         (pure token-overlap ranking of repo pages)
 *   - deriveWordCountTarget     (pure ±20% competitor / format-default)
 *   - buildOutline / assembleBrief (pure composition — the moat's core)
 *   - renderBriefMarkdown / renderDraftMarkdown (deterministic renders)
 *   - parseContentFile          (pure markdown record parse)
 *   - scanContentDir            (against a REAL temp dir — the one fs edge)
 *   - assembleFromInputs        (orchestrator, no disk write)
 *   - CLI                       (child process, writes files, exit codes)
 *
 * No live LLM / GSC / network anywhere: every input is a hand-built fixture.
 * Node stdlib only (node:test + node:assert). Run with:  node --test
 */

const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const b = require("../scripts/brief-assembly.js");

const SCRIPT = path.join(__dirname, "..", "scripts", "brief-assembly.js");
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

// ---------------------------------------------------------------------------
// classifyIntent
// ---------------------------------------------------------------------------

test("classifyIntent: transactional keyword", () => {
  const r = b.classifyIntent("buy crm software pricing");
  assert.equal(r.intent, "transactional");
  assert.equal(r.signal, "buy"); // transactional wins over the commercial 'software'
});

test("classifyIntent: commercial 'best' -> listicle", () => {
  const r = b.classifyIntent("best email marketing tools");
  assert.equal(r.intent, "commercial");
  assert.equal(r.format, "listicle");
});

test("classifyIntent: 'X vs Y' -> comparison", () => {
  const r = b.classifyIntent("notion vs obsidian");
  assert.equal(r.intent, "commercial");
  assert.equal(r.format, "comparison");
});

test("classifyIntent: 'how to' -> informational + how-to", () => {
  const r = b.classifyIntent("how to set up google search console");
  assert.equal(r.intent, "informational");
  assert.equal(r.format, "how-to");
});

test("classifyIntent: bare topic -> informational guide", () => {
  const r = b.classifyIntent("content decay");
  assert.equal(r.intent, "informational");
  assert.equal(r.format, "guide");
  assert.equal(r.signal, null);
});

test("classifyIntent: number in query -> listicle", () => {
  const r = b.classifyIntent("7 capsule wardrobe formulas");
  assert.equal(r.format, "listicle");
});

// ---------------------------------------------------------------------------
// strikingDistance
// ---------------------------------------------------------------------------

test("strikingDistance: selects position 5–15, sorts by impressions desc", () => {
  const rows = [
    { query: "won already", position: 2, impressions: 9000 },   // too high — excluded
    { query: "striking a", position: 8, impressions: 4000 },
    { query: "striking b", position: 12.4, impressions: 6000 },
    { query: "too far", position: 40, impressions: 8000 },       // excluded
    { query: "edge low", position: 5, impressions: 100 },        // included (boundary)
    { query: "edge high", position: 15, impressions: 100 },      // included (boundary)
  ];
  const out = b.strikingDistance(rows);
  assert.deepEqual(out.map((r) => r.query), ["striking b", "striking a", "edge low", "edge high"]);
  assert.equal(out[0].impressions, 6000);
});

test("strikingDistance: tolerates junk / non-array", () => {
  assert.deepEqual(b.strikingDistance(null), []);
  assert.deepEqual(b.strikingDistance([{ nope: true }, { position: "x" }]), []);
});

// ---------------------------------------------------------------------------
// rankInternalLinks
// ---------------------------------------------------------------------------

test("rankInternalLinks: ranks by token overlap, excludes the target page", () => {
  const index = [
    { path: "content/crm-guide.md", title: "The CRM Buyers Guide", headings: ["CRM pricing", "CRM features"] },
    { path: "content/email.md", title: "Email marketing basics", headings: ["Deliverability"] },
    { path: "content/self.md", title: "CRM software overview", headings: ["CRM"] },
  ];
  const links = b.rankInternalLinks(index, { keyword: "crm software", entities: ["CRM pricing"] }, { excludePath: "content/self.md" });
  assert.equal(links.length, 1); // only crm-guide overlaps and self is excluded
  assert.equal(links[0].path, "content/crm-guide.md");
  assert.ok(links[0].overlap.includes("crm"));
  assert.ok(links[0].score > 0);
});

test("rankInternalLinks: empty focus or index -> []", () => {
  assert.deepEqual(b.rankInternalLinks([], { keyword: "x" }), []);
  assert.deepEqual(b.rankInternalLinks([{ path: "a.md", title: "a" }], { keyword: "", entities: [] }), []);
});

// ---------------------------------------------------------------------------
// deriveWordCountTarget
// ---------------------------------------------------------------------------

test("deriveWordCountTarget: competitor median anchors ±20%", () => {
  const t = b.deriveWordCountTarget("guide", 2000);
  assert.equal(t.min, 1600);
  assert.equal(t.target, 2000);
  assert.equal(t.max, 2400);
  assert.match(t.basis, /competitor median/);
});

test("deriveWordCountTarget: no median -> format default", () => {
  const t = b.deriveWordCountTarget("how-to");
  assert.deepEqual([t.min, t.target, t.max], [1000, 1500, 1800]);
  assert.match(t.basis, /format default/);
});

// ---------------------------------------------------------------------------
// assembleBrief — the pure composition
// ---------------------------------------------------------------------------

function sampleInput(overrides = {}) {
  return Object.assign({
    topic: "content decay",
    keyword: "content decay",
    gscRows: [
      { query: "what is content decay", position: 9, impressions: 5000 },
      { query: "content decay", position: 6, impressions: 3000 },
    ],
    serp: {
      entities: ["content half-life", "QDF", "dateModified"],
      questions: ["how do you fix content decay", "what causes content decay"],
      medianWordCount: 1800,
      aioPresent: true,
    },
    contentIndex: [
      { path: "content/refresh.md", title: "How to refresh stale content", headings: ["content decay signals", "dateModified"] },
    ],
  }, overrides);
}

test("assembleBrief: produces a complete, correct structured brief", () => {
  const brief = b.assembleBrief(sampleInput());
  assert.equal(brief.topic, "content decay");
  assert.equal(brief.targetKeyword, "content decay");
  assert.equal(brief.intent, "informational");
  assert.equal(brief.format, "guide");
  assert.equal(brief.slug, "content-decay");
  assert.equal(brief.aioPresent, true);

  // Angle: strongest striking-distance query that isn't the keyword restated.
  assert.equal(brief.angle.strikingDistance.query, "what is content decay");
  assert.match(brief.angle.note, /striking distance/i);

  // Word count anchored to competitor median.
  assert.equal(brief.wordCountTarget.target, 1800);

  // Entities + questions carried through, deduped.
  assert.deepEqual(brief.entities, ["content half-life", "QDF", "dateModified"]);
  assert.equal(brief.questions.length, 2);

  // Outline: lead + one H2 per question + entity-coverage + FAQ.
  const h2s = brief.outline.map((s) => s.h2);
  assert.equal(h2s[0], "What is content decay?");
  assert.ok(h2s.some((h) => /how do you fix content decay/i.test(h)));
  assert.ok(h2s[h2s.length - 1] === "FAQ");

  // Internal link surfaced from own content.
  assert.equal(brief.internalLinks.length, 1);
  assert.equal(brief.internalLinks[0].path, "content/refresh.md");
});

test("assembleBrief: is pure — same input, identical output", () => {
  const i1 = sampleInput();
  const i2 = sampleInput();
  assert.deepEqual(b.assembleBrief(i1), b.assembleBrief(i2));
});

test("assembleBrief: no GSC data -> honest angle note, no crash", () => {
  const brief = b.assembleBrief({ topic: "widget sizing", serp: {} });
  assert.equal(brief.angle.strikingDistance, null);
  assert.match(brief.angle.note, /No GSC striking-distance data/);
  assert.equal(brief.wordCountTarget.basis, "guide format default");
});

test("assembleBrief: throws on missing topic", () => {
  assert.throws(() => b.assembleBrief({}), /topic` is required/);
});

test("assembleBrief: keyword defaults to topic; url excluded from links", () => {
  const brief = b.assembleBrief({
    topic: "crm software",
    url: "content/crm.md",
    contentIndex: [
      { path: "content/crm.md", title: "crm software", headings: ["crm"] },
      { path: "content/other.md", title: "crm pricing tips", headings: ["crm"] },
    ],
  });
  assert.equal(brief.targetKeyword, "crm software");
  assert.ok(!brief.internalLinks.some((l) => l.path === "content/crm.md"));
});

// ---------------------------------------------------------------------------
// renderBriefMarkdown / renderDraftMarkdown
// ---------------------------------------------------------------------------

test("renderBriefMarkdown: contains all the brief sections", () => {
  const brief = b.assembleBrief(sampleInput());
  brief.generatedAt = "2026-07-07";
  const md = b.renderBriefMarkdown(brief);
  assert.match(md, /# Content Brief:/);
  assert.match(md, /## The angle/);
  assert.match(md, /## Title \(headline moat\)/);
  assert.match(md, /## Outline/);
  assert.match(md, /Target length: \*\*1800 words\*\*/);
  assert.match(md, /## Entities to cover/);
  assert.match(md, /- \[ \] content half-life/);
  assert.match(md, /## Internal links/);
  assert.match(md, /content\/refresh\.md/);
});

test("renderDraftMarkdown: valid frontmatter + H2 skeleton + safe comments", () => {
  const brief = b.assembleBrief(sampleInput());
  brief.generatedAt = "2026-07-07";
  brief.draftPath = "content/content-decay.md";
  const md = b.renderDraftMarkdown(brief);
  assert.ok(md.startsWith("---\n"));
  assert.match(md, /title: "Content Decay: The Complete Guide \(2026\)"/);
  assert.match(md, /draft: true/);
  assert.match(md, /^## What is content decay\?$/m);
  assert.match(md, /TODO: write this section\./);
  // HTML comments must not contain a raw "-->" from the stub text.
  const bodyComments = md.match(/<!--[\s\S]*?-->/g) || [];
  for (const c of bodyComments) {
    assert.equal(c.slice(4, -3).includes("-->"), false, "comment contains a nested -->");
  }
});

// ---------------------------------------------------------------------------
// parseContentFile (pure)
// ---------------------------------------------------------------------------

test("parseContentFile: reads frontmatter title/slug + headings", () => {
  const text = [
    "---",
    'title: "My CRM Guide"',
    "slug: crm-guide",
    "---",
    "# My CRM Guide",
    "## CRM pricing",
    "### Deep dive",
    "not a heading",
  ].join("\n");
  const rec = b.parseContentFile(text, "content/crm.md");
  assert.equal(rec.path, "content/crm.md");
  assert.equal(rec.title, "My CRM Guide");
  assert.equal(rec.slug, "crm-guide");
  assert.deepEqual(rec.headings, ["My CRM Guide", "CRM pricing", "Deep dive"]);
});

test("parseContentFile: no frontmatter -> first H1 is the title", () => {
  const rec = b.parseContentFile("# Just A Heading\n## Sub\n", "a.md");
  assert.equal(rec.title, "Just A Heading");
  assert.equal(rec.slug, "just-a-heading");
});

// ---------------------------------------------------------------------------
// scanContentDir — against a REAL temp dir (the one fs edge)
// ---------------------------------------------------------------------------

test("scanContentDir: indexes markdown recursively, skips non-content + dotdirs", () => {
  const dir = tmpDir("brief-scan-");
  fs.mkdirSync(path.join(dir, "posts"));
  fs.mkdirSync(path.join(dir, "node_modules"));
  fs.writeFileSync(path.join(dir, "posts", "a.md"), '---\ntitle: "Alpha"\n---\n# Alpha\n## Beta\n');
  fs.writeFileSync(path.join(dir, "posts", "b.mdx"), "# Gamma\n");
  fs.writeFileSync(path.join(dir, "posts", "ignore.txt"), "not content\n");
  fs.writeFileSync(path.join(dir, "node_modules", "dep.md"), "# Should be skipped\n");

  const index = b.scanContentDir(dir);
  const paths = index.map((r) => r.path).sort();
  assert.deepEqual(paths, ["posts/a.md", "posts/b.mdx"]);
  const alpha = index.find((r) => r.path === "posts/a.md");
  assert.equal(alpha.title, "Alpha");
  assert.deepEqual(alpha.headings, ["Alpha", "Beta"]);
});

test("scanContentDir: missing dir -> [] (no throw)", () => {
  assert.deepEqual(b.scanContentDir(path.join(os.tmpdir(), "definitely-not-here-xyz")), []);
});

test("scanContentDir feeds rankInternalLinks end-to-end", () => {
  const dir = tmpDir("brief-scan2-");
  fs.writeFileSync(path.join(dir, "crm.md"), "# CRM software pricing guide\n## CRM tiers\n");
  fs.writeFileSync(path.join(dir, "unrelated.md"), "# Gardening tips\n");
  const index = b.scanContentDir(dir);
  const links = b.rankInternalLinks(index, { keyword: "crm software", entities: ["CRM tiers"] });
  assert.equal(links.length, 1);
  assert.equal(links[0].path, "crm.md");
});

// ---------------------------------------------------------------------------
// assembleFromInputs (orchestrator, in-memory)
// ---------------------------------------------------------------------------

test("assembleFromInputs: builds brief + both renders, stamps date, sets draftPath", () => {
  const dir = tmpDir("brief-inputs-");
  const gsc = path.join(dir, "gsc.json");
  const serp = path.join(dir, "serp.json");
  fs.writeFileSync(gsc, JSON.stringify([{ query: "what is x", position: 8, impressions: 900 }]));
  fs.writeFileSync(serp, JSON.stringify({ entities: ["E1"], questions: ["how to x"], medianWordCount: 1200 }));

  const { brief, briefMarkdown, draftMarkdown } = b.assembleFromInputs({
    topic: "thing x", gsc, serp, outDir: "content", draft: true, now: "2026-07-07",
  });
  assert.equal(brief.generatedAt, "2026-07-07");
  assert.equal(brief.draftPath, "content/thing-x.md");
  assert.match(briefMarkdown, /# Content Brief:/);
  assert.ok(draftMarkdown.startsWith("---\n"));
});

test("assembleFromInputs: --no-draft yields null draft, no draftPath", () => {
  const { brief, draftMarkdown } = b.assembleFromInputs({ topic: "y", draft: false, now: "2026-07-07" });
  assert.equal(draftMarkdown, null);
  assert.equal(brief.draftPath, null);
});

// ---------------------------------------------------------------------------
// CLI (child process)
// ---------------------------------------------------------------------------

function runCli(args, cwd) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: cwd || process.cwd(), encoding: "utf8" });
}

test("cli: --help exits 0 with usage", () => {
  const res = runCli(["--help"]);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Usage: node scripts\/brief-assembly\.js/);
});

test("cli: missing --topic exits 1", () => {
  const res = runCli([]);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /--topic is required/);
});

test("cli: writes CONTENT_BRIEF.md + draft + --json, prints PR wiring", () => {
  const dir = tmpDir("brief-cli-");
  const briefOut = path.join(dir, "CONTENT_BRIEF.md");
  const jsonOut = path.join(dir, "brief.json");
  const serp = path.join(dir, "serp.json");
  fs.writeFileSync(serp, JSON.stringify({ entities: ["Alpha"], questions: ["how to alpha"], medianWordCount: 1500 }));

  const res = runCli([
    "--topic", "alpha widgets",
    "--serp", serp,
    "--out-dir", path.join(dir, "content"),
    "--brief-out", briefOut,
    "--json", jsonOut,
  ]);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /brief  -> /);
  assert.match(res.stdout, /draft  -> /);
  assert.match(res.stdout, /gh pr create/);

  assert.ok(fs.existsSync(briefOut));
  const draftFile = path.join(dir, "content", "alpha-widgets.md");
  assert.ok(fs.existsSync(draftFile), "draft file written");
  const brief = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
  assert.equal(brief.targetKeyword, "alpha widgets");
  assert.equal(brief.slug, "alpha-widgets");
});

test("cli: --no-draft writes only the brief", () => {
  const dir = tmpDir("brief-cli-nd-");
  const briefOut = path.join(dir, "CONTENT_BRIEF.md");
  const res = runCli(["--topic", "solo topic", "--brief-out", briefOut, "--out-dir", path.join(dir, "content"), "--no-draft"]);
  assert.equal(res.status, 0, res.stderr);
  assert.ok(fs.existsSync(briefOut));
  assert.equal(fs.existsSync(path.join(dir, "content")), false);
});

test("cli: malformed seam JSON exits 1 with readable error", () => {
  const dir = tmpDir("brief-cli-bad-");
  const serp = path.join(dir, "serp.json");
  fs.writeFileSync(serp, "{ not json");
  const res = runCli(["--topic", "x", "--serp", serp, "--brief-out", path.join(dir, "b.md")]);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /brief-assembly:/);
});
