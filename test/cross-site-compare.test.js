"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const {
  inspectSite,
  renderMarkdownTable,
  renderTerminalTable
} = require("../scripts/cross-site-compare.js");

const SCRIPT_PATH = path.resolve(__dirname, "../scripts/cross-site-compare.js");

test("inspectSite: evaluates site directory and computes score", () => {
  const tmpDir = path.resolve(__dirname, "../fixtures/tmp_test_site1");
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    fs.writeFileSync(path.join(tmpDir, "robots.txt"), "User-agent: *\nDisallow:\nUser-agent: OAI-SearchBot\nDisallow:\n", "utf8");
    fs.writeFileSync(path.join(tmpDir, "sitemap.xml"), "<urlset><url><loc>https://example.com/1</loc></url></urlset>", "utf8");
    fs.writeFileSync(
      path.join(tmpDir, "index.html"),
      '<html><head><link rel="canonical" href="https://example.com/"><meta name="description" content="test"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Test"}</script></head></html>',
      "utf8"
    );

    const result = inspectSite(tmpDir, "TestSite1");
    assert.equal(result.name, "TestSite1");
    assert.equal(result.hasRobots, true);
    assert.equal(result.hasSitemap, true);
    assert.equal(result.sitemapUrlCount, 1);
    assert.equal(result.hasCanonical, true);
    assert.equal(result.hasDescription, true);
    assert.equal(result.hasSchema, true);
    assert.ok(result.schemaTypes.includes("WebSite"));
    assert.equal(result.aiBots["OAI-SearchBot"], "Allowed");
    assert.ok(result.score >= 80);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("inspectSite: penalizes blocked OAI-SearchBot", () => {
  const tmpDir = path.resolve(__dirname, "../fixtures/tmp_test_site_blocked");
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    fs.writeFileSync(path.join(tmpDir, "robots.txt"), "User-agent: OAI-SearchBot\nDisallow: /\n", "utf8");

    const result = inspectSite(tmpDir, "BlockedSite");
    assert.equal(result.hasRobots, true);
    assert.equal(result.aiBots["OAI-SearchBot"], "Blocked");
    assert.ok(result.issues.some(i => i.includes("OAI-SearchBot is blocked")));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("renderMarkdownTable and renderTerminalTable: formatting check", () => {
  const mockSites = [
    {
      name: "Alpha",
      framework: "Next.js",
      score: 95,
      hasRobots: true,
      robotsSizeBytes: 120,
      hasSitemap: true,
      sitemapUrlCount: 50,
      hasCanonical: true,
      hasDescription: true,
      hasSchema: true,
      schemaTypes: ["WebSite", "Article"],
      aiBots: { "OAI-SearchBot": "Allowed", "PerplexityBot": "Allowed" }
    },
    {
      name: "Beta",
      framework: "Astro",
      score: 80,
      hasRobots: true,
      robotsSizeBytes: 80,
      hasSitemap: false,
      sitemapUrlCount: 0,
      hasCanonical: true,
      hasDescription: true,
      hasSchema: false,
      schemaTypes: [],
      aiBots: { "OAI-SearchBot": "Blocked", "PerplexityBot": "Allowed" }
    }
  ];

  const md = renderMarkdownTable(mockSites);
  assert.ok(md.includes("| Dimension | Alpha | Beta |"));
  assert.ok(md.includes("Next.js"));
  assert.ok(md.includes("Astro"));
  assert.ok(md.includes("95/100"));

  const term = renderTerminalTable(mockSites);
  assert.ok(term.includes("Alpha"));
  assert.ok(term.includes("Beta"));
});

test("CLI: --help prints usage and exits 0", () => {
  const out = execFileSync(process.execPath, [SCRIPT_PATH, "--help"], { encoding: "utf8" });
  assert.ok(out.includes("Usage:"));
  assert.ok(out.includes("cross-site-compare.js"));
});

test("CLI: missing arguments or non-existent path exits 2", () => {
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT_PATH, "only-one-arg"], { encoding: "utf8" }),
    (err) => err.status === 2
  );
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT_PATH, "fake-path-1", "fake-path-2"], { encoding: "utf8" }),
    (err) => err.status === 2
  );
});

test("CLI: multi-site comparison with --json and --markdown", () => {
  const tmpRoot = path.resolve(__dirname, "../fixtures/tmp_portfolio_test");
  const siteA = path.join(tmpRoot, "siteA");
  const siteB = path.join(tmpRoot, "siteB");
  fs.mkdirSync(siteA, { recursive: true });
  fs.mkdirSync(siteB, { recursive: true });

  try {
    fs.writeFileSync(path.join(siteA, "robots.txt"), "User-agent: *\nDisallow:\n", "utf8");
    fs.writeFileSync(path.join(siteA, "sitemap.xml"), "<urlset><url><loc>https://sitea.com/</loc></url></urlset>", "utf8");

    fs.writeFileSync(path.join(siteB, "robots.txt"), "User-agent: *\nDisallow:\n", "utf8");
    fs.writeFileSync(path.join(siteB, "sitemap.xml"), "<urlset><url><loc>https://siteb.com/</loc></url></urlset>", "utf8");

    // JSON mode with --threshold 30 so it exits 0
    const jsonOut = execFileSync(process.execPath, [SCRIPT_PATH, siteA, siteB, "--threshold", "30", "--json"], { encoding: "utf8" });
    const parsed = JSON.parse(jsonOut);
    assert.equal(parsed.sites.length, 2);
    assert.equal(parsed.sites[0].name, "siteA");
    assert.equal(parsed.sites[1].name, "siteB");

    // Markdown mode with --threshold 30
    const mdOut = execFileSync(process.execPath, [SCRIPT_PATH, siteA, siteB, "--threshold", "30", "--markdown"], { encoding: "utf8" });
    assert.ok(mdOut.includes("| Dimension | siteA | siteB |"));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
