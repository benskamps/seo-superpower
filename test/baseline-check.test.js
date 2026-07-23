"use strict";

/**
 * test/baseline-check.test.js — unit tests for scripts/baseline-check.js.
 *
 * Everything here is hermetic: the pure functions (robots parsing, group
 * resolution, head parsing, scoring, routing) are exercised against inline
 * strings. No network. `runBaseline` itself is the only networked function and
 * is deliberately NOT tested here — CI must not depend on third-party sites
 * being up.
 *
 * Several tests are regression locks on facts the prose got wrong. They cite
 * the reason inline so a future edit that "simplifies" them has to argue with
 * the citation rather than the code.
 *
 * Node stdlib only (node:test + node:assert) — no package.json, no deps.
 * Run with:  node --test
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  parseRobots,
  groupForAgent,
  pathMatches,
  isAllowed,
  isNamed,
  analyzeAiBots,
  parseHead,
  parseSitemap,
  scoreBaseline,
  routeFor,
  normalizeUrl,
  SITEMAP_MAX_URLS,
  SITEMAP_MAX_BYTES,
  ROBOTS_MAX_BYTES,
  RETRIEVAL_BOTS,
} = require("../scripts/baseline-check.js");

// ---------------------------------------------------------------------------
// robots.txt parsing
// ---------------------------------------------------------------------------

test("parseRobots: groups a user-agent with its rules", () => {
  const { groups } = parseRobots("User-agent: GPTBot\nAllow: /\nDisallow: /private");
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].agents, ["gptbot"]);
  assert.deepEqual(groups[0].rules, [
    { type: "allow", path: "/" },
    { type: "disallow", path: "/private" },
  ]);
});

test("parseRobots: consecutive user-agent lines share one rule block", () => {
  const { groups } = parseRobots("User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /x");
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].agents, ["gptbot", "claudebot"]);
  assert.equal(groups[0].rules.length, 1);
});

test("parseRobots: a rule after a blank line still belongs to the open group", () => {
  const { groups } = parseRobots("User-agent: *\n\nDisallow: /api/");
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].rules, [{ type: "disallow", path: "/api/" }]);
});

test("parseRobots: strips comments and ignores blank lines", () => {
  const { groups } = parseRobots("# hello\nUser-agent: * # inline\nAllow: / # trailing\n\n");
  assert.deepEqual(groups[0].agents, ["*"]);
  assert.deepEqual(groups[0].rules, [{ type: "allow", path: "/" }]);
});

test("parseRobots: collects Sitemap directives from anywhere in the file", () => {
  const { sitemaps } = parseRobots(
    "Sitemap: https://a.example/sitemap.xml\nUser-agent: *\nAllow: /\nSitemap: https://b.example/s2.xml",
  );
  assert.deepEqual(sitemaps, ["https://a.example/sitemap.xml", "https://b.example/s2.xml"]);
});

test("parseRobots: ignores rules that appear before any user-agent", () => {
  const { groups } = parseRobots("Disallow: /orphan\nUser-agent: *\nAllow: /");
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].rules, [{ type: "allow", path: "/" }]);
});

test("parseRobots: tolerates non-string input", () => {
  assert.deepEqual(parseRobots(null), { groups: [], sitemaps: [] });
});

// ---------------------------------------------------------------------------
// Group resolution — most specific wins, `*` is fallback
// ---------------------------------------------------------------------------

test("groupForAgent: a named group beats the wildcard group", () => {
  const { groups } = parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /");
  const g = groupForAgent(groups, "GPTBot");
  assert.deepEqual(g.rules, [{ type: "allow", path: "/" }]);
});

test("groupForAgent: falls back to the wildcard when the agent is unnamed", () => {
  const { groups } = parseRobots("User-agent: *\nDisallow: /secret");
  const g = groupForAgent(groups, "OAI-SearchBot");
  assert.deepEqual(g.agents, ["*"]);
});

test("groupForAgent: returns null when the file has no groups", () => {
  assert.equal(groupForAgent([], "GPTBot"), null);
});

test("groupForAgent: longer token wins on overlapping prefixes", () => {
  // "Claude-SearchBot" must not be captured by the shorter "Claude" group.
  const { groups } = parseRobots(
    "User-agent: Claude\nDisallow: /\n\nUser-agent: Claude-SearchBot\nAllow: /",
  );
  const g = groupForAgent(groups, "Claude-SearchBot");
  assert.deepEqual(g.rules, [{ type: "allow", path: "/" }]);
});

// ---------------------------------------------------------------------------
// Path matching
// ---------------------------------------------------------------------------

test("pathMatches: empty Disallow value matches nothing (means allow-all)", () => {
  assert.equal(pathMatches("", "/anything"), false);
});

test("pathMatches: plain prefix", () => {
  assert.equal(pathMatches("/api", "/api/users"), true);
  assert.equal(pathMatches("/api", "/public"), false);
});

test("pathMatches: `*` wildcard spans any characters", () => {
  assert.equal(pathMatches("/*.pdf", "/docs/manual.pdf"), true);
});

test("pathMatches: trailing `$` anchors the end", () => {
  assert.equal(pathMatches("/page$", "/page"), true);
  assert.equal(pathMatches("/page$", "/page/sub"), false);
});

test("pathMatches: regex metacharacters in the pattern are literal", () => {
  assert.equal(pathMatches("/a+b", "/a+b"), true);
  assert.equal(pathMatches("/a+b", "/aaab"), false);
});

// ---------------------------------------------------------------------------
// Allow/Disallow resolution
// ---------------------------------------------------------------------------

test("isAllowed: no matching rule means allowed", () => {
  const { groups } = parseRobots("User-agent: *\nDisallow: /api/");
  assert.equal(isAllowed(groups, "GPTBot", "/"), true);
});

test("isAllowed: site-wide disallow blocks the root", () => {
  const { groups } = parseRobots("User-agent: *\nDisallow: /");
  assert.equal(isAllowed(groups, "GPTBot", "/"), false);
});

test("isAllowed: longest matching rule wins over a shorter one", () => {
  const { groups } = parseRobots("User-agent: *\nDisallow: /\nAllow: /public/");
  assert.equal(isAllowed(groups, "GPTBot", "/public/x"), true);
  assert.equal(isAllowed(groups, "GPTBot", "/private/x"), false);
});

test("isAllowed: Allow wins an equal-length tie", () => {
  const { groups } = parseRobots("User-agent: *\nDisallow: /x\nAllow: /x");
  assert.equal(isAllowed(groups, "GPTBot", "/x"), true);
});

test("isAllowed: an empty robots.txt allows everything", () => {
  const { groups } = parseRobots("");
  assert.equal(isAllowed(groups, "OAI-SearchBot", "/"), true);
});

// ---------------------------------------------------------------------------
// Naming vs. effective access — the distinction the prose check could not make
// ---------------------------------------------------------------------------

test("isNamed: `*` coverage does not count as being named", () => {
  const { groups } = parseRobots("User-agent: *\nAllow: /");
  assert.equal(isNamed(groups, "OAI-SearchBot"), false);
});

test("isNamed: an explicit group counts", () => {
  const { groups } = parseRobots("User-agent: OAI-SearchBot\nAllow: /");
  assert.equal(isNamed(groups, "OAI-SearchBot"), true);
});

test("analyzeAiBots: a bot can be unnamed yet allowed (inherits a permissive `*`)", () => {
  const { groups } = parseRobots("User-agent: *\nAllow: /");
  const r = analyzeAiBots(groups);
  assert.equal(r.retrievalNamed.includes("OAI-SearchBot"), false);
  assert.equal(r.retrievalAllowed.includes("OAI-SearchBot"), true);
  assert.equal(r.citationReady, true);
});

test("analyzeAiBots: a bot can be unnamed AND blocked by a restrictive `*`", () => {
  // The failure this whole check exists to catch: nobody typed the bot's name,
  // the wildcard group is hostile, and citation dies silently.
  const { groups } = parseRobots("User-agent: *\nDisallow: /");
  const r = analyzeAiBots(groups);
  assert.equal(r.citationReady, false);
  assert.deepEqual(r.retrievalBlocked.sort(), [...RETRIEVAL_BOTS].sort());
});

test("analyzeAiBots: regression — naming 8 crawlers without OAI-SearchBot is not citation coverage", () => {
  // This is brokenbranch.dev's production robots.txt shape as of 2026-07-23:
  // eleven AI crawlers named under a comment claiming "canonical 2026 tokens",
  // with the one bot that governs ChatGPT Search citation absent.
  // Per OpenAI's crawler docs, OAI-SearchBot is what surfaces sites in ChatGPT
  // search; blocking it removes you from those answers. GPTBot is training-only
  // and does not substitute.
  const { groups } = parseRobots(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "User-agent: GPTBot",
      "Allow: /",
      "User-agent: ChatGPT-User",
      "Allow: /",
      "User-agent: ClaudeBot",
      "Allow: /",
      "User-agent: Claude-User",
      "Allow: /",
      "User-agent: Claude-SearchBot",
      "Allow: /",
      "User-agent: Google-Extended",
      "Allow: /",
      "User-agent: PerplexityBot",
      "Allow: /",
      "User-agent: CCBot",
      "Allow: /",
    ].join("\n"),
  );
  const r = analyzeAiBots(groups);
  assert.ok(r.namedCount >= 8, "several crawlers are named");
  assert.equal(r.retrievalNamed.includes("OAI-SearchBot"), false, "but not the one that matters");
  // Allowed only because the wildcard happens to be permissive — luck, not policy.
  assert.equal(r.citationReady, true);
});

// ---------------------------------------------------------------------------
// HTML head parsing
// ---------------------------------------------------------------------------

test("parseHead: extracts title, description, canonical, viewport", () => {
  const html = `
    <html><head>
      <title>Hello World</title>
      <meta name="description" content="A description here">
      <link rel="canonical" href="https://example.com/">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head><body><h1>Hi</h1></body></html>`;
  const h = parseHead(html);
  assert.equal(h.title, "Hello World");
  assert.equal(h.description, "A description here");
  assert.equal(h.canonical, "https://example.com/");
  assert.equal(h.viewport, "width=device-width, initial-scale=1");
  assert.equal(h.h1Count, 1);
});

test("parseHead: handles reversed attribute order on meta description", () => {
  const h = parseHead('<meta content="Backwards attrs" name="description">');
  assert.equal(h.description, "Backwards attrs");
});

test("parseHead: handles reversed attribute order on canonical", () => {
  const h = parseHead('<link href="https://example.com/x" rel="canonical">');
  assert.equal(h.canonical, "https://example.com/x");
});

test("parseHead: missing tags come back null, not undefined or throw", () => {
  const h = parseHead("<html><head></head><body></body></html>");
  assert.equal(h.title, null);
  assert.equal(h.description, null);
  assert.equal(h.canonical, null);
  assert.equal(h.viewport, null);
  assert.equal(h.h1Count, 0);
  assert.equal(h.jsonLdCount, 0);
});

test("parseHead: counts valid vs invalid JSON-LD blocks separately", () => {
  const html = `
    <script type="application/ld+json">{"@type":"Organization","name":"X"}</script>
    <script type="application/ld+json">{ this is not json }</script>`;
  const h = parseHead(html);
  assert.equal(h.jsonLdCount, 2);
  assert.equal(h.jsonLdValid, 1);
  assert.deepEqual(h.jsonLdTypes, ["Organization"]);
});

test("parseHead: walks @graph to collect nested types", () => {
  const html = `<script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"WebSite","name":"S"},
      {"@type":["Organization","LocalBusiness"],"name":"O"}
    ]}</script>`;
  const h = parseHead(html);
  assert.deepEqual(h.jsonLdTypes, ["WebSite", "Organization", "LocalBusiness"]);
});

test("parseHead: detects a noindex robots meta", () => {
  const h = parseHead('<meta name="robots" content="noindex, nofollow">');
  assert.equal(h.noindex, true);
});

test("parseHead: multiple h1 tags are counted (Pass A wants exactly one)", () => {
  const h = parseHead("<h1>a</h1><h1>b</h1>");
  assert.equal(h.h1Count, 2);
});

test("parseHead: tolerates non-string input", () => {
  const h = parseHead(undefined);
  assert.equal(h.title, null);
  assert.equal(h.h1Count, 0);
});

// ---------------------------------------------------------------------------
// Sitemap parsing — including the regression lock on the size limit
// ---------------------------------------------------------------------------

test("parseSitemap: recognises a urlset and counts <loc> entries", () => {
  const xml = '<urlset><url><loc>https://a/</loc></url><url><loc>https://b/</loc></url></urlset>';
  const s = parseSitemap(xml, 120);
  assert.equal(s.isXml, true);
  assert.equal(s.isIndex, false);
  assert.equal(s.urlCount, 2);
});

test("parseSitemap: recognises a sitemap index", () => {
  const xml = '<sitemapindex><sitemap><loc>https://a/s1.xml</loc></sitemap></sitemapindex>';
  const s = parseSitemap(xml, 90);
  assert.equal(s.isIndex, true);
  assert.equal(s.urlCount, 1);
});

test("parseSitemap: HTML served at /sitemap.xml is not valid XML", () => {
  const s = parseSitemap("<!doctype html><html><body>404</body></html>", 40);
  assert.equal(s.isXml, false);
  assert.equal(s.urlCount, 0);
});

test("parseSitemap: REGRESSION — 600 KiB is a perfectly legal sitemap", () => {
  // skills/seo-superpower + auditing-technical-seo previously checked
  // "sitemap < 500 KiB (Google's hard cap)". 500 KiB is the *robots.txt* parse
  // cap. A single sitemap's real limits are 50,000 URLs / 50 MB uncompressed
  // (Google Search Central, "Build and submit a sitemap"). The old check was
  // ~100x too strict and would have failed healthy sitemaps.
  const s = parseSitemap("<urlset><url><loc>https://a/</loc></url></urlset>", 600 * 1024);
  assert.equal(s.overByteLimit, false);
  assert.equal(s.overUrlLimit, false);
});

test("parseSitemap: flags a genuinely oversized sitemap at the real 50 MB limit", () => {
  const s = parseSitemap("<urlset></urlset>", SITEMAP_MAX_BYTES + 1);
  assert.equal(s.overByteLimit, true);
});

test("parseSitemap: flags more than 50,000 URLs", () => {
  const xml = "<urlset>" + "<loc>x</loc>".repeat(SITEMAP_MAX_URLS + 1) + "</urlset>";
  const s = parseSitemap(xml, 1000);
  assert.equal(s.overUrlLimit, true);
});

test("the two size constants are not the same number", () => {
  // The conflation this file exists to prevent.
  assert.notEqual(SITEMAP_MAX_BYTES, ROBOTS_MAX_BYTES);
  assert.equal(ROBOTS_MAX_BYTES, 500 * 1024);
  assert.equal(SITEMAP_MAX_BYTES, 50 * 1024 * 1024);
});

// ---------------------------------------------------------------------------
// Scoring + routing
// ---------------------------------------------------------------------------

/** Build a scoreBaseline input where every check passes, then let tests break one. */
function healthyInput(overrides = {}) {
  const base = {
    robots: {
      ok: true,
      status: 200,
      nonEmpty: true,
      sitemaps: ["https://example.com/sitemap.xml"],
      aiBots: { namedCount: 8, named: ["GPTBot", "ClaudeBot", "PerplexityBot"] },
    },
    sitemap: { ok: true, status: 200, isXml: true, isIndex: false, urlCount: 20 },
    head: {
      title: "T",
      titleLength: 1,
      description: "D",
      descriptionLength: 1,
      canonical: "https://example.com/",
      viewport: "width=device-width",
      jsonLdCount: 1,
      jsonLdValid: 1,
      jsonLdTypes: ["Organization"],
      h1Count: 1,
    },
    https: true,
  };
  return {
    ...base,
    ...overrides,
    head: { ...base.head, ...(overrides.head || {}) },
    robots: { ...base.robots, ...(overrides.robots || {}) },
    sitemap: { ...base.sitemap, ...(overrides.sitemap || {}) },
  };
}

test("scoreBaseline: a fully healthy site scores 10/10", () => {
  const r = scoreBaseline(healthyInput());
  assert.equal(r.total, 10);
  assert.equal(r.passed, 10);
  assert.equal(r.healthy, true);
});

test("scoreBaseline: each failure costs exactly one point", () => {
  const r = scoreBaseline(healthyInput({ head: { canonical: null } }));
  assert.equal(r.passed, 9);
  assert.equal(r.items.find((i) => i.id === "canonical").pass, false);
});

test("scoreBaseline: 8/10 is still 'healthy' per the router's threshold", () => {
  // visualinventory.ai's real shape on 2026-07-23: no canonical, no AI-bot
  // policy. Two P1 gaps, yet the >=8 gate still routes it to growth work.
  const r = scoreBaseline(
    healthyInput({ head: { canonical: null }, robots: { aiBots: { namedCount: 0, named: [] } } }),
  );
  assert.equal(r.passed, 8);
  assert.equal(r.healthy, true);
});

test("scoreBaseline: an invalid-only JSON-LD block does not earn the point", () => {
  const r = scoreBaseline(healthyInput({ head: { jsonLdCount: 2, jsonLdValid: 0 } }));
  assert.equal(r.items.find((i) => i.id === "jsonld").pass, false);
});

test("scoreBaseline: a 200 sitemap with zero URLs fails", () => {
  const r = scoreBaseline(healthyInput({ sitemap: { urlCount: 0 } }));
  assert.equal(r.items.find((i) => i.id === "sitemap").pass, false);
});

test("scoreBaseline: robots.txt without a Sitemap: line fails that check", () => {
  const r = scoreBaseline(healthyInput({ robots: { sitemaps: [] } }));
  assert.equal(r.items.find((i) => i.id === "robots").pass, false);
});

test("routeFor: a healthy site routes to growth", () => {
  const r = scoreBaseline(healthyInput());
  assert.equal(routeFor(r, { citationReady: true }).decision, "growth");
});

test("routeFor: structural failures route to bootstrap", () => {
  const r = scoreBaseline(
    healthyInput({ robots: { sitemaps: [] }, sitemap: { urlCount: 0 }, head: { jsonLdValid: 0 } }),
  );
  assert.equal(routeFor(r, {}).decision, "bootstrap");
});

test("routeFor: cosmetic failures route to audit, not bootstrap", () => {
  const r = scoreBaseline(
    healthyInput({ head: { canonical: null, viewport: null, title: null, h1Count: 3 } }),
  );
  assert.equal(routeFor(r, {}).decision, "audit");
});

// ---------------------------------------------------------------------------
// URL normalisation
// ---------------------------------------------------------------------------

test("normalizeUrl: adds https:// to a bare domain", () => {
  assert.equal(normalizeUrl("example.com").origin, "https://example.com");
});

test("normalizeUrl: preserves an explicit scheme", () => {
  assert.equal(normalizeUrl("http://example.com").protocol, "http:");
});

test("normalizeUrl: returns null on unusable input", () => {
  assert.equal(normalizeUrl(""), null);
  assert.equal(normalizeUrl(null), null);
});
