"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const {
  inspectSite,
  renderMarkdownTable,
  renderTerminalTable,
  parseRobots,
  botAccess
} = require("../scripts/cross-site-compare.js");

// ---------------------------------------------------------------------------
// robots.txt AI-bot access.
//
// The previous implementation searched forward from a bot's User-agent line for
// the next `Disallow:` anywhere in the file. On a robots.txt that explicitly
// allows the AI crawlers and disallows one unrelated scraper further down, it
// attributed that unrelated `Disallow: /` to every allowed bot above it and
// reported them as Blocked — telling you to "fix" a site that was already
// correct, on the plugin's flagship GEO check.
// ---------------------------------------------------------------------------

// The shape that broke it: allow-only groups, then an unrelated Disallow.
const ALLOW_THEN_UNRELATED_BLOCK = `
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# Block one unrelated training scraper
User-agent: Bytespider
Disallow: /
`;

test("botAccess: an unrelated Disallow later in the file does not block an allowed bot", () => {
  const groups = parseRobots(ALLOW_THEN_UNRELATED_BLOCK);
  assert.equal(botAccess(groups, "OAI-SearchBot"), "Allowed");
  assert.equal(botAccess(groups, "PerplexityBot"), "Allowed");
});

test("botAccess: a bot with its own Disallow is blocked", () => {
  const groups = parseRobots("User-agent: OAI-SearchBot\nDisallow: /\n");
  assert.equal(botAccess(groups, "OAI-SearchBot"), "Blocked");
});

test("botAccess: falls back to the wildcard group", () => {
  const blocked = parseRobots("User-agent: *\nDisallow: /\n");
  assert.equal(botAccess(blocked, "OAI-SearchBot"), "Blocked (by *)");

  const open = parseRobots("User-agent: *\nDisallow:\n");
  assert.equal(botAccess(open, "OAI-SearchBot"), "Allowed (Default)");
});

test("botAccess: an explicit bot group overrides a restrictive wildcard", () => {
  const groups = parseRobots(
    "User-agent: *\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n"
  );
  assert.equal(botAccess(groups, "OAI-SearchBot"), "Allowed");
  assert.equal(botAccess(groups, "ClaudeBot"), "Blocked (by *)");
});

test("botAccess: Allow beats Disallow at equal specificity", () => {
  const groups = parseRobots("User-agent: OAI-SearchBot\nDisallow: /\nAllow: /\n");
  assert.equal(botAccess(groups, "OAI-SearchBot"), "Allowed");
});

test("botAccess: a Disallow on a subpath does not block the root", () => {
  const groups = parseRobots("User-agent: OAI-SearchBot\nDisallow: /admin\n");
  assert.equal(botAccess(groups, "OAI-SearchBot"), "Allowed");
});

test("parseRobots: consecutive User-agent lines share one rule group", () => {
  const groups = parseRobots(
    "User-agent: OAI-SearchBot\nUser-agent: PerplexityBot\nDisallow: /\n"
  );
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].agents, ["oai-searchbot", "perplexitybot"]);
  assert.equal(botAccess(groups, "PerplexityBot"), "Blocked");
});

test("parseRobots: ignores comments and blank lines", () => {
  const groups = parseRobots("# a comment\n\nUser-agent: * # trailing\nDisallow: /\n");
  assert.equal(groups.length, 1);
  assert.equal(groups[0].rules.length, 1);
});

// ---------------------------------------------------------------------------
// Framework detection.
//
// cross-site-compare imported `detectFramework`, a name detect-framework.js
// never exported. Every lookup threw TypeError, the catch swallowed it, and
// every site in every comparison reported "Unknown" — which also silently cost
// each site the 15-point framework bonus in its health score.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Route-generated assets and source-embedded JSON-LD.
//
// These three blind spots made the tool report real, well-configured sites as
// broken: a Next.js app that generates robots.txt from app/robots.ts was called
// "Missing robots.txt", src/app/sitemap.ts was not recognised at all, and a
// self-closing JSX <script type="application/ld+json" /> was invisible to a
// regex that required a closing tag.
// ---------------------------------------------------------------------------

function makeTmpSite(name, files) {
  const dir = path.resolve(__dirname, `../fixtures/${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

test("inspectSite: recognises a route-generated robots.txt and abstains on bot rules", () => {
  const dir = makeTmpSite("tmp_dynamic_robots", {
    "app/robots.ts": "export default function robots() { return { rules: [] }; }"
  });
  try {
    const result = inspectSite(dir, "DynRobots");
    assert.equal(result.hasRobots, true);
    assert.equal(result.robotsSource, "dynamic");
    // We cannot know what the route emits without fetching the deployed URL.
    assert.equal(result.aiBots["OAI-SearchBot"], "Unknown (dynamic)");
    assert.ok(!result.issues.some(i => i === "Missing robots.txt"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("inspectSite: recognises a sitemap route under src/app", () => {
  const dir = makeTmpSite("tmp_src_sitemap", {
    "src/app/sitemap.ts": "export default function sitemap() { return []; }"
  });
  try {
    const result = inspectSite(dir, "SrcSitemap");
    assert.equal(result.hasSitemap, true);
    assert.equal(result.sitemapUrlCount, -1);
    assert.ok(!result.issues.some(i => i === "Missing sitemap.xml"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("inspectSite: finds JSON-LD in a self-closing JSX script tag", () => {
  const dir = makeTmpSite("tmp_jsx_schema", {
    "app/Schema.tsx":
      'const data = { "@context": "https://schema.org", "@type": "Article", name: "x" };\n' +
      "export default function S() {\n" +
      '  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;\n' +
      "}\n"
  });
  try {
    const result = inspectSite(dir, "JsxSchema");
    assert.equal(result.hasSchema, true);
    assert.equal(result.schemaSource, "dynamic");
    assert.ok(result.schemaTypes.includes("Article"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("inspectSite: scans deeply enough to find schema past the first few files", () => {
  const files = {};
  // Bury the JSON-LD behind more files and deeper nesting than the old
  // 5-file / depth-3 sample would ever have reached.
  for (let i = 0; i < 12; i++) files[`app/components/part${i}.tsx`] = "export const x = 1;\n";
  files["app/a/b/c/d/Deep.tsx"] =
    'const d = { "@type": "Organization" };\n' +
    'export default () => <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(d)}} />;\n';

  const dir = makeTmpSite("tmp_deep_schema", files);
  try {
    const result = inspectSite(dir, "DeepSchema");
    assert.equal(result.hasSchema, true);
    assert.ok(result.schemaTypes.includes("Organization"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("inspectSite: detects a real framework instead of always reporting Unknown", () => {
  const tmpDir = path.resolve(__dirname, "../fixtures/tmp_test_framework");
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "x", dependencies: { next: "15.0.0", react: "19.0.0" } }),
      "utf8"
    );
    fs.mkdirSync(path.join(tmpDir, "app"), { recursive: true });

    const result = inspectSite(tmpDir, "FrameworkSite");
    assert.notEqual(result.framework, "Unknown");
    assert.match(result.framework, /Next\.js/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

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
