"use strict";

/**
 * test/codebase-mirror.test.js — unit tests for the Competitor Codebase Mirror.
 *
 * Covers the deterministic, offline core (scripts/codebase-mirror.js):
 *   - extractSignals   (HTML -> implementation fingerprint, incl. the
 *                       top-level-only JSON-LD rule and the client-shell call)
 *   - summarizeSite    (fingerprints -> per-site rates and medians)
 *   - findGaps         (DIRECTION: only what they ship and you don't)
 *   - rankGaps /
 *     normalizeSerp    (severity x SERP delta, and the honest unknown path)
 *   - loadPages        (local files, robots.txt gate, fetch failures — with an
 *                       injected fetch; no test touches the network)
 *   - CLI              (child process: render, --json, exit codes)
 *
 * Fixtures: fixtures/codebase-mirror/{ours,theirs}/*.html — hand-written HTML,
 * no network, no LLM.
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

const mirror = require("../scripts/codebase-mirror.js");

const ROOT = path.join(__dirname, "..");
const SCRIPT = path.join(ROOT, "scripts", "codebase-mirror.js");
const FIXTURES = path.join(ROOT, "fixtures", "codebase-mirror");
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

function fixture(side, name) {
  return path.join(FIXTURES, side, name);
}

/** Build a page whose signals are whatever the test needs, defaults elsewhere. */
function page({
  title = "T", description = null, canonical = "https://ours.example/p", og = false,
  types = [], dateModified = null, h2 = [], links = [], images = 0, alt = 0,
  words = 200, scripts = 0, hreflang = 0,
} = {}) {
  const ld = types.length
    ? `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@graph": types.map((t) => (t === "Article" && dateModified
          ? { "@type": t, dateModified }
          : { "@type": t })),
      })}</script>`
    : "";
  const head = [
    `<title>${title}</title>`,
    description ? `<meta name="description" content="${description}">` : "",
    canonical ? `<link rel="canonical" href="${canonical}">` : "",
    og ? '<meta property="og:title" content="x"><meta property="og:image" content="y">' : "",
    hreflang ? '<link rel="alternate" hreflang="fr" href="/fr">' : "",
    ld,
  ].join("\n");
  const body = [
    "<h1>Heading</h1>",
    h2.map((h) => `<h2>${h}</h2>`).join("\n"),
    links.map(([href, text]) => `<a href="${href}">${text}</a>`).join("\n"),
    Array.from({ length: images }, (_, i) =>
      i < alt ? `<img src="/${i}.png" alt="described image ${i}">` : `<img src="/${i}.png">`).join("\n"),
    `<p>${Array.from({ length: words }, (_, i) => `word${i}`).join(" ")}</p>`,
    Array.from({ length: scripts }, () => '<script src="/a.js"></script>').join("\n"),
  ].join("\n");
  return `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
}

// ---------------------------------------------------------------------------
// extractSignals
// ---------------------------------------------------------------------------

test("extractSignals reads meta, schema, headings, links, media", () => {
  const html = fs.readFileSync(fixture("theirs", "home.html"), "utf8");
  const s = mirror.extractSignals(html, "https://billfold.example/");

  assert.equal(s.meta.title, "Billfold — invoicing built for freelancers");
  assert.ok(s.meta.description.startsWith("Billfold turns tracked hours"));
  assert.equal(s.meta.canonical, "https://billfold.example/");
  assert.equal(s.meta.hasOgTitle, true);
  assert.equal(s.meta.hasOgImage, true);
  assert.equal(s.meta.noindex, false);

  assert.equal(s.schema.blocks, 1);
  assert.equal(s.schema.valid, 1);
  assert.deepEqual(s.schema.types, ["Article", "BreadcrumbList", "FAQPage", "Organization"]);
  assert.equal(s.freshness.dateModified, "2026-07-30");

  assert.equal(s.headings.counts.h1, 1);
  assert.ok(s.headings.counts.h2 >= 5);
  assert.ok(s.headings.questionHeadings >= 4);

  assert.ok(s.links.internal >= 9);
  assert.equal(s.links.external, 0);
  assert.equal(s.links.genericAnchors, 0);
  assert.equal(s.media.images, 2);
  assert.equal(s.media.imagesWithAlt, 2);

  assert.equal(s.stack.framework, "astro");
  assert.equal(s.content.rendering, "server-html");
});

test("extractSignals collects page-level JSON-LD types only (no nested children)", () => {
  const html = fs.readFileSync(fixture("theirs", "guide.html"), "utf8");
  const s = mirror.extractSignals(html, "https://billfold.example/guide/first-invoice");
  // The FAQPage holds Question nodes and the BreadcrumbList holds ListItems;
  // reporting those separately would count the same gap two ways.
  assert.deepEqual(s.schema.types, ["Article", "BreadcrumbList", "FAQPage"]);
  assert.ok(!s.schema.types.includes("Question"));
  assert.ok(!s.schema.types.includes("ListItem"));
});

test("extractSignals flags a client-side shell as such", () => {
  const html = fs.readFileSync(fixture("ours", "guide.html"), "utf8");
  const s = mirror.extractSignals(html, "https://ledgerly.example/guide");
  assert.equal(s.content.rendering, "client-shell");
  assert.ok(s.content.words < mirror.CLIENT_SHELL_WORD_FLOOR);
  assert.ok(s.content.scripts > 0);
});

test("extractSignals counts a malformed JSON-LD block but does not call it valid", () => {
  const html = '<html><head><script type="application/ld+json">{oops</script></head><body>x</body></html>';
  const s = mirror.extractSignals(html, null);
  assert.equal(s.schema.blocks, 1);
  assert.equal(s.schema.valid, 0);
  assert.deepEqual(s.schema.types, []);
});

test("extractSignals classifies links against the page origin, canonical as fallback", () => {
  const html = [
    '<html><head><link rel="canonical" href="https://ours.example/p"></head><body>',
    '<a href="/internal">internal relative</a>',
    '<a href="https://ours.example/also">internal absolute</a>',
    '<a href="https://www.ours.example/www-variant">internal www</a>',
    '<a href="https://other.example/out">external</a>',
    '<a href="#anchor">skipped</a><a href="mailto:a@b.c">skipped</a>',
    '<a href="/generic">Read more</a>',
    "</body></html>",
  ].join("");
  const s = mirror.extractSignals(html, null); // no URL -> canonical supplies origin
  assert.equal(s.links.internal, 4);
  assert.equal(s.links.external, 1);
  assert.equal(s.links.genericAnchors, 1);
  assert.equal(s.links.descriptiveAnchors, 4);
});

test("textOf decodes the entities that show up in headings", () => {
  assert.equal(mirror.textOf("<em>Tips&nbsp;&amp;&nbsp;tricks</em>"), "Tips & tricks");
  assert.equal(mirror.textOf("What&#39;s new?"), "What's new?");
});

test("bodyWordCount ignores script and style payloads", () => {
  const html = "<html><body><script>var a = 1; var b = 2; var c = 3;</script>" +
    "<style>.x{color:red}</style><p>one two three</p></body></html>";
  assert.equal(mirror.bodyWordCount(html), 3);
});

// ---------------------------------------------------------------------------
// summarizeSite
// ---------------------------------------------------------------------------

test("summarizeSite reports rates and medians, not totals", () => {
  const signals = [
    mirror.extractSignals(page({ types: ["Article"], description: "d", links: [["/a", "alpha"]], images: 2, alt: 2 })),
    mirror.extractSignals(page({ types: ["Article", "FAQPage"], links: [["/a", "alpha"], ["/b", "beta"]], images: 2, alt: 0 })),
    mirror.extractSignals(page({ types: [], links: [["/a", "alpha"], ["/b", "beta"], ["/c", "gamma"]] })),
  ];
  const site = mirror.summarizeSite(signals, "ours");
  assert.equal(site.pages, 3);
  assert.equal(site.label, "ours");
  assert.equal(site.schemaTypeRates.Article, 0.6667);
  assert.equal(site.schemaTypeRates.FAQPage, 0.3333);
  assert.equal(site.descriptionRate, 0.3333);
  assert.equal(site.medianInternalLinks, 2);
  assert.equal(site.altRate, 0.5);
  assert.equal(site.serverRenderedRate, 1);
});

test("median handles even and odd lengths and the empty case", () => {
  assert.equal(mirror.median([]), 0);
  assert.equal(mirror.median([5]), 5);
  assert.equal(mirror.median([1, 3, 9]), 3);
  assert.equal(mirror.median([1, 3, 5, 9]), 4);
});

// ---------------------------------------------------------------------------
// findGaps — the direction contract
// ---------------------------------------------------------------------------

function sitesFromFixtures() {
  const load = (side, names) =>
    mirror.summarizeSite(names.map((n) => mirror.extractSignals(fs.readFileSync(fixture(side, n), "utf8"))), side);
  const names = ["home.html", "guide.html", "pricing.html"];
  return { ours: load("ours", names), theirs: load("theirs", names) };
}

test("findGaps reports what they ship and you don't", () => {
  const { ours, theirs } = sitesFromFixtures();
  const gaps = mirror.findGaps(ours, theirs);
  const ids = gaps.map((g) => g.id);
  assert.ok(ids.includes("rendering"), "client-shell pages vs server HTML is a gap");
  assert.ok(ids.includes("schema:FAQPage"));
  assert.ok(ids.includes("schema:Article"));
  assert.ok(ids.includes("question-headings"));
  assert.ok(ids.includes("internal-links"));
  assert.ok(ids.includes("open-graph"));
  // Nested schema children must never surface as their own gap.
  assert.ok(!ids.some((id) => id === "schema:Question" || id === "schema:ListItem"));
  // Every gap carries a hand-off to a real skill in this plugin.
  for (const g of gaps) {
    assert.ok(fs.existsSync(path.join(ROOT, "skills", g.handoff, "SKILL.md")),
      `handoff '${g.handoff}' must be a real skill`);
  }
});

test("findGaps is directional: swapping the sides reports none of the same gaps", () => {
  const { ours, theirs } = sitesFromFixtures();
  const forward = mirror.findGaps(ours, theirs).map((g) => g.id);
  const backward = mirror.findGaps(theirs, ours).map((g) => g.id);
  assert.ok(forward.length > 0);
  for (const id of backward) {
    assert.ok(!forward.includes(id), `'${id}' cannot be a gap in both directions`);
  }
});

test("findGaps stays silent when the sides match", () => {
  const { theirs } = sitesFromFixtures();
  assert.deepEqual(mirror.findGaps(theirs, theirs), []);
});

test("a schema type below the pattern rate is not a gap", () => {
  const base = { schemaTypeRates: {}, descriptionRate: 1, canonicalRate: 1, ogRate: 1, hreflangRate: 1,
    serverRenderedRate: 1, freshnessRate: 1, questionHeadingRate: 0, altRate: 1, descriptiveAnchorRate: 1,
    medianInternalLinks: 10, medianWords: 500, medianH2: 4, pages: 4, framework: "astro", label: "x" };
  const ours = { ...base };
  const rare = { ...base, schemaTypeRates: { HowTo: mirror.SCHEMA_PATTERN_RATE - 0.01 } };
  const common = { ...base, schemaTypeRates: { HowTo: mirror.SCHEMA_PATTERN_RATE } };
  assert.deepEqual(mirror.findGaps(ours, rare), []);
  const gaps = mirror.findGaps(ours, common);
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].id, "schema:HowTo");
  assert.equal(gaps[0].severity, "high"); // absent on our side entirely
});

test("partial schema coverage is a medium gap, not a high one", () => {
  const base = { schemaTypeRates: {}, descriptionRate: 1, canonicalRate: 1, ogRate: 1, hreflangRate: 1,
    serverRenderedRate: 1, freshnessRate: 1, questionHeadingRate: 0, altRate: 1, descriptiveAnchorRate: 1,
    medianInternalLinks: 10, medianWords: 500, medianH2: 4, pages: 4, framework: "astro", label: "x" };
  const gaps = mirror.findGaps(
    { ...base, schemaTypeRates: { Article: 0.25 } },
    { ...base, schemaTypeRates: { Article: 1 } },
  );
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].severity, "medium");
});

test("internal-link depth needs both the ratio and the absolute margin", () => {
  const base = { schemaTypeRates: {}, descriptionRate: 1, canonicalRate: 1, ogRate: 1, hreflangRate: 1,
    serverRenderedRate: 1, freshnessRate: 1, questionHeadingRate: 0, altRate: 1, descriptiveAnchorRate: 1,
    medianInternalLinks: 4, medianWords: 500, medianH2: 4, pages: 4, framework: "astro", label: "x" };
  // 4 -> 7: ratio is 1.75 (over the bar) but the absolute margin is 3 (under it).
  assert.deepEqual(mirror.findGaps(base, { ...base, medianInternalLinks: 7 }), []);
  // 4 -> 12: both clear.
  const gaps = mirror.findGaps(base, { ...base, medianInternalLinks: 12 });
  assert.equal(gaps.length, 1);
  assert.equal(gaps[0].id, "internal-links");
});

test("depth is reported last and lowest, and never against a zero baseline", () => {
  const base = { schemaTypeRates: {}, descriptionRate: 1, canonicalRate: 1, ogRate: 1, hreflangRate: 1,
    serverRenderedRate: 1, freshnessRate: 1, questionHeadingRate: 0, altRate: 1, descriptiveAnchorRate: 1,
    medianInternalLinks: 10, medianWords: 400, medianH2: 4, pages: 4, framework: "astro", label: "x" };
  const deep = mirror.findGaps(base, { ...base, medianWords: 400 * mirror.DEPTH_GAP_RATIO });
  assert.equal(deep.length, 1);
  assert.equal(deep[0].id, "depth");
  assert.equal(deep[0].severity, "low");
  // With no measurable content of our own, "they have more words" is noise.
  assert.deepEqual(mirror.findGaps({ ...base, medianWords: 0 }, { ...base, medianWords: 4000 }), []);
});

// ---------------------------------------------------------------------------
// normalizeSerp + rankGaps
// ---------------------------------------------------------------------------

test("normalizeSerp accepts both the object and the shorthand form", () => {
  const full = mirror.normalizeSerp({ query: "q", ours: { position: 14.2 }, theirs: { position: 3.1 } });
  assert.equal(full.known, true);
  assert.equal(full.query, "q");
  assert.equal(full.delta, 11.1);
  assert.equal(full.multiplier, 2.0);

  const short = mirror.normalizeSerp({ ours: 5, theirs: 4 });
  assert.equal(short.known, true);
  assert.equal(short.delta, 1);
  assert.equal(short.multiplier, 1.2);
});

test("normalizeSerp never invents a position", () => {
  for (const input of [null, undefined, {}, { ours: 3 }, { ours: "3", theirs: 1 }, "nope"]) {
    const v = mirror.normalizeSerp(input);
    assert.equal(v.known, false, `${JSON.stringify(input)} must not be treated as known`);
    assert.ok(v.reason && v.reason.length > 0);
  }
});

test("normalizeSerp de-weights their patterns when you already outrank them", () => {
  const v = mirror.normalizeSerp({ ours: 2, theirs: 9 });
  assert.equal(v.multiplier, 0.75);
  assert.match(v.verdict, /you already outrank/i);
});

test("rankGaps tags every row serp:unknown when positions are missing", () => {
  const gaps = [
    { id: "b", axis: "meta", label: "B", severity: "low", theirs: "1", ours: "0", evidence: "", handoff: "optimizing-on-page" },
    { id: "a", axis: "schema", label: "A", severity: "high", theirs: "1", ours: "0", evidence: "", handoff: "adding-schema-markup" },
  ];
  const ranked = mirror.rankGaps(gaps, mirror.normalizeSerp(null));
  assert.deepEqual(ranked.map((g) => g.id), ["a", "b"]);
  assert.deepEqual(ranked.map((g) => g.serp), ["unknown", "unknown"]);
  assert.equal(ranked[0].impact, mirror.SEVERITY_WEIGHT.high * 1.0);
});

test("rankGaps scales impact by the SERP multiplier", () => {
  const gaps = [{ id: "a", axis: "schema", label: "A", severity: "high", theirs: "1", ours: "0", evidence: "", handoff: "adding-schema-markup" }];
  const ranked = mirror.rankGaps(gaps, mirror.normalizeSerp({ ours: 20, theirs: 2 }));
  assert.equal(ranked[0].impact, 6);
  assert.match(ranked[0].serp, /outrank you decisively/);
});

test("rankGaps sorts by impact then severity then id, deterministically", () => {
  const mk = (id, severity) => ({ id, axis: "x", label: id, severity, theirs: "1", ours: "0", evidence: "", handoff: "optimizing-on-page" });
  const ranked = mirror.rankGaps([mk("z", "medium"), mk("a", "medium"), mk("m", "high"), mk("b", "low")], null);
  assert.deepEqual(ranked.map((g) => g.id), ["m", "a", "z", "b"]);
});

// ---------------------------------------------------------------------------
// loadPages — files, robots gate, failures (injected fetch; never the network)
// ---------------------------------------------------------------------------

test("loadPages reads local HTML files", async () => {
  const { signals, warnings } = await mirror.loadPages([fixture("ours", "home.html")], { delayMs: 0 });
  assert.equal(signals.length, 1);
  assert.deepEqual(warnings, []);
  assert.equal(signals[0].meta.canonical, "https://ledgerly.example/");
});

test("loadPages warns instead of throwing on an unreadable file", async () => {
  const { signals, warnings } = await mirror.loadPages([path.join(tmpDir("mirror-"), "nope.html")], { delayMs: 0 });
  assert.equal(signals.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /could not read/);
});

/** Minimal injected fetch: a map of url -> {status, body}. Records every call. */
function fakeFetch(routes, calls = []) {
  return async (url) => {
    calls.push(url);
    const hit = routes[url];
    if (!hit) return { ok: false, status: 404, text: async () => "" };
    return { ok: hit.status >= 200 && hit.status < 300, status: hit.status, text: async () => hit.body };
  };
}

test("loadPages honours robots.txt and never fetches a disallowed page", async () => {
  const calls = [];
  const fetchImpl = fakeFetch({
    "https://them.example/robots.txt": { status: 200, body: "User-agent: *\nDisallow: /private\n" },
    "https://them.example/ok": { status: 200, body: page({ types: ["Article"] }) },
    "https://them.example/private/secret": { status: 200, body: page({}) },
  }, calls);

  const { signals, warnings } = await mirror.loadPages(
    ["https://them.example/ok", "https://them.example/private/secret"],
    { fetchImpl, delayMs: 0 },
  );

  assert.equal(signals.length, 1);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /robots\.txt disallows/);
  assert.ok(!calls.includes("https://them.example/private/secret"), "disallowed URL must not be requested");
  // robots.txt is fetched once per origin, not once per page.
  assert.equal(calls.filter((u) => u.endsWith("/robots.txt")).length, 1);
});

test("loadPages turns a failed fetch into a warning, not a silent zero", async () => {
  const fetchImpl = fakeFetch({
    "https://them.example/robots.txt": { status: 200, body: "" },
    "https://them.example/gone": { status: 500, body: "" },
  });
  const { signals, warnings } = await mirror.loadPages(["https://them.example/gone"], { fetchImpl, delayMs: 0 });
  assert.equal(signals.length, 0);
  assert.match(warnings[0], /could not fetch .*HTTP 500/);
});

test("loadPages can skip the robots gate for pages you own", async () => {
  const calls = [];
  const fetchImpl = fakeFetch({
    "https://ours.example/p": { status: 200, body: page({ types: ["Article"] }) },
  }, calls);
  const { signals } = await mirror.loadPages(["https://ours.example/p"],
    { fetchImpl, delayMs: 0, respectRobots: false });
  assert.equal(signals.length, 1);
  assert.ok(!calls.some((u) => u.endsWith("/robots.txt")));
});

// ---------------------------------------------------------------------------
// runMirror
// ---------------------------------------------------------------------------

test("runMirror warns when the SERP is unknown and when the sample is thin", () => {
  const ourSignals = [mirror.extractSignals(page({ types: [] }))];
  const theirSignals = [mirror.extractSignals(page({ types: ["FAQPage"], og: true }))];
  const report = mirror.runMirror({ ourSignals, theirSignals });
  assert.equal(report.schema_version, 1);
  assert.equal(report.serp.known, false);
  assert.ok(report.warnings.some((w) => /severity only/.test(w)));
  assert.ok(report.warnings.some((w) => /fewer than 2 pages/.test(w)));
  assert.equal(report.totals.high + report.totals.medium + report.totals.low, report.gaps.length);
});

test("runMirror carries loader warnings through to the report", () => {
  const report = mirror.runMirror({
    ourSignals: [mirror.extractSignals(page({}))],
    theirSignals: [mirror.extractSignals(page({}))],
    warnings: ["could not fetch https://them.example/x (HTTP 503)"],
  });
  assert.ok(report.warnings.some((w) => /HTTP 503/.test(w)));
});

test("formatReport renders the no-gap case without pretending it is a clean bill", () => {
  const signals = [mirror.extractSignals(page({}))];
  const text = mirror.formatReport(mirror.runMirror({ ourSignals: signals, theirSignals: signals }));
  assert.match(text, /No patterns found/);
  assert.match(text, /sample is too small/);
});

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function runCli(args, opts = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", cwd: ROOT, ...opts });
}

const FIXTURE_ARGS = [
  "--ours", fixture("ours", "home.html"),
  "--ours", fixture("ours", "guide.html"),
  "--ours", fixture("ours", "pricing.html"),
  "--theirs", fixture("theirs", "home.html"),
  "--theirs", fixture("theirs", "guide.html"),
  "--theirs", fixture("theirs", "pricing.html"),
];

test("CLI renders the fixture mirror and exits 0", () => {
  const r = runCli(FIXTURE_ARGS);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Codebase Mirror/);
  assert.match(r.stdout, /they do you don't/);
  assert.match(r.stdout, /SERP delta: unknown — severity-only ranking/);
  assert.match(r.stdout, /FAQPage schema/);
});

test("CLI --json writes the structured report", () => {
  const out = path.join(tmpDir("mirror-cli-"), "nested", "report.json");
  const r = runCli([...FIXTURE_ARGS, "--json", out]);
  assert.equal(r.status, 0, r.stderr);
  const report = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.equal(report.schema_version, 1);
  assert.ok(report.gaps.length > 0);
  assert.equal(report.serp.known, false);
  assert.ok(report.gaps.every((g) => g.serp === "unknown"));
});

test("CLI --serp weights the ranking and prints the delta", () => {
  const dir = tmpDir("mirror-serp-");
  const serpPath = path.join(dir, "serp.json");
  fs.writeFileSync(serpPath, JSON.stringify({
    query: "invoicing software for freelancers",
    ours: { position: 14.2 },
    theirs: { position: 3.1 },
  }), "utf8");
  const jsonOut = path.join(dir, "report.json");
  const r = runCli([...FIXTURE_ARGS, "--serp", serpPath, "--json", jsonOut]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /they outrank you decisively/);
  const report = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
  assert.equal(report.serp.multiplier, 2);
  assert.equal(report.gaps[0].impact, 6);
});

test("CLI --fail-on-high is a CI gate", () => {
  const r = runCli([...FIXTURE_ARGS, "--fail-on-high"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /HIGH/);
});

test("CLI prints usage and exits 1 with no arguments", () => {
  const r = runCli([]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /Usage: node scripts\/codebase-mirror\.js/);
});

test("CLI --help exits 0", () => {
  const r = runCli(["--help"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /--serp/);
});

test("CLI rejects an unknown flag instead of ignoring it", () => {
  const r = runCli([...FIXTURE_ARGS, "--scrape-everything"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown argument: --scrape-everything/);
});

test("CLI fails loudly when a side loads no pages", () => {
  const r = runCli(["--ours", fixture("ours", "home.html"), "--theirs", "/definitely/not/here.html"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /could not load any pages/);
});
