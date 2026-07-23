"use strict";

/**
 * test/detect-framework.test.js — unit tests for scripts/detect-framework.js.
 *
 * Everything runs against the real folder shapes in fixtures/ rather than mocks,
 * because the thing being tested IS filesystem interpretation. No network, no
 * installs, no build — each fixture is a handful of tiny files.
 *
 * The fixtures live at the repo root, NOT under test/, on purpose: a bare
 * `node --test` treats every .js/.mjs file under a `test/` directory as a test
 * file, so `astro.config.mjs` and `svelte.config.js` fixtures placed there get
 * executed as (failing) test files. At the root they match no discovery pattern.
 *
 * Node stdlib only (node:test + node:assert) — no package.json, no deps.
 * Run with:  node --test
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

const {
  detectProject,
  renderReport,
  detectFrameworkId,
  readPackageJson,
  FRAMEWORK_META,
} = require("../scripts/detect-framework.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const FIXTURES = path.join(REPO_ROOT, "fixtures");
const fixture = (name) => path.join(FIXTURES, name);

// ---------------------------------------------------------------------------
// Detection — one test per framework branch
// ---------------------------------------------------------------------------

test("detects Astro from the astro dependency", () => {
  const r = detectProject(fixture("astro-minimal"));
  assert.equal(r.framework, "astro");
  assert.equal(r.detected, true);
  assert.equal(r.label, "Astro");
});

test("detects SvelteKit when @sveltejs/kit is only a devDependency", () => {
  const r = detectProject(fixture("sveltekit-minimal"));
  assert.equal(r.framework, "sveltekit");
  assert.equal(r.detected, true);
});

test("detects Next.js App Router from next + app/", () => {
  const r = detectProject(fixture("nextjs-app-minimal"));
  assert.equal(r.framework, "nextjs-app");
});

test("detects Next.js Pages Router from next + pages/ only", () => {
  const r = detectProject(fixture("nextjs-pages-minimal"));
  assert.equal(r.framework, "nextjs-pages");
});

test("falls back to the static path for Vite + React Router", () => {
  const r = detectProject(fixture("vite-rr-minimal"));
  assert.equal(r.framework, "vite-react-router");
  assert.equal(r.templates, null, "SPA has no framework template dir");
});

test("App Router wins when a repo has both app/ and pages/", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-both-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { next: "^15.0.0" } }));
  fs.mkdirSync(path.join(dir, "app"));
  fs.mkdirSync(path.join(dir, "pages"));
  assert.equal(detectProject(dir).framework, "nextjs-app");
});

test("detects Next under a src/ root", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-src-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { next: "^15.0.0" } }));
  fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
  assert.equal(detectProject(dir).framework, "nextjs-app");
});

// ---------------------------------------------------------------------------
// Graceful failure — the paths that run inside a stranger's repo
// ---------------------------------------------------------------------------

test("no package.json is unknown, not a crash", () => {
  const r = detectProject(fixture("bare-no-pkg"));
  assert.equal(r.detected, false);
  assert.equal(r.framework, "unknown");
  assert.match(r.reason, /package\.json/);
});

test("unparseable package.json is unknown, not a throw", () => {
  assert.doesNotThrow(() => detectProject(fixture("broken-pkg")));
  assert.equal(detectProject(fixture("broken-pkg")).detected, false);
});

test("a nonexistent directory returns unknown", () => {
  const r = detectProject(fixture("does-not-exist-anywhere"));
  assert.equal(r.detected, false);
  assert.equal(r.reason, "not a directory");
});

test("readPackageJson merges dependencies and devDependencies", () => {
  const pkg = readPackageJson(fixture("sveltekit-minimal"));
  assert.ok(pkg);
  assert.ok(Object.prototype.hasOwnProperty.call(pkg.deps, "@sveltejs/kit"));
});

test("detectFrameworkId returns null for an unrelated dependency set", () => {
  assert.equal(detectFrameworkId(FIXTURES, { express: "^4.0.0" }), null);
});

// ---------------------------------------------------------------------------
// Asset audit — the Step 2 table, as data
// ---------------------------------------------------------------------------

test("a bare Astro project reports all four assets missing", () => {
  const r = detectProject(fixture("astro-minimal"));
  assert.deepEqual(r.missing.sort(), ["jsonLd", "ogImage", "robots", "sitemap"]);
});

test("a bare Astro project reports the missing canonical site URL", () => {
  const r = detectProject(fixture("astro-minimal"));
  assert.equal(r.siteUrl.url, null);
  assert.equal(r.siteUrl.key, "site");
  assert.match(r.siteUrl.source, /astro\.config/);
});

test("a complete Astro project has nothing missing", () => {
  const r = detectProject(fixture("astro-complete"));
  assert.deepEqual(r.missing, [], `unexpected missing: ${r.missing.join(", ")}`);
});

test("the @astrojs/sitemap integration counts as a sitemap", () => {
  const r = detectProject(fixture("astro-complete"));
  assert.match(r.assets.sitemap.present, /@astrojs\/sitemap/);
});

test("Astro site: is read out of astro.config.*", () => {
  const r = detectProject(fixture("astro-complete"));
  assert.equal(r.siteUrl.url, "https://example.com");
  assert.equal(r.siteUrl.key, "site");
});

test("JSON-LD is detected inside the root layout, not by filename", () => {
  const complete = detectProject(fixture("astro-complete"));
  const minimal = detectProject(fixture("astro-minimal"));
  assert.match(complete.assets.jsonLd.present, /Layout\.astro/);
  assert.equal(minimal.assets.jsonLd.present, null, "an empty Layout.astro is not JSON-LD");
});

test("SvelteKit assets are audited at SvelteKit paths, not Next paths", () => {
  const r = detectProject(fixture("sveltekit-minimal"));
  assert.equal(r.assets.robots.expected, "static/robots.txt");
  assert.match(r.assets.sitemap.expected, /^src\/routes\/sitemap\.xml\//);
});

test("Next App Router expects the metadata-file convention", () => {
  const r = detectProject(fixture("nextjs-app-minimal"));
  assert.equal(r.assets.sitemap.expected, "app/sitemap.ts");
  assert.equal(r.assets.robots.expected, "app/robots.ts");
});

test("a Next app with no metadataBase reports the canonical URL missing", () => {
  const r = detectProject(fixture("nextjs-app-minimal"));
  assert.equal(r.siteUrl.url, null);
  assert.equal(r.siteUrl.key, "metadataBase");
});

test("metadataBase is read out of next.config.*", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-mb-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { next: "^15.0.0" } }));
  fs.mkdirSync(path.join(dir, "app"));
  fs.writeFileSync(
    path.join(dir, "next.config.mjs"),
    'export default { metadataBase: new URL("https://acme.dev") };\n',
  );
  assert.equal(detectProject(dir).siteUrl.url, "https://acme.dev");
});

// ---------------------------------------------------------------------------
// metadataBase extraction
//
// Regression: the first version scanned forward from the word "metadataBase"
// for any URL, and on a real repo returned a nextjs.org docs link that appeared
// in a comment further down the file.
// ---------------------------------------------------------------------------

/** Build a throwaway Next App Router project whose layout has `body`. */
function nextAppWithLayout(t, body) {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-mbx-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { next: "^15.0.0" } }));
  fs.mkdirSync(path.join(dir, "app"));
  fs.writeFileSync(path.join(dir, "app", "layout.tsx"), body);
  return dir;
}

test("metadataBase resolves through a const identifier", (t) => {
  const dir = nextAppWithLayout(
    t,
    [
      'const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibecrafting.ai";',
      "export const metadata = {",
      "  metadataBase: new URL(SITE_URL),",
      "};",
    ].join("\n"),
  );
  assert.equal(detectProject(dir).siteUrl.url, "https://vibecrafting.ai");
});

test("a docs URL in a later comment does not become the canonical origin", (t) => {
  const dir = nextAppWithLayout(
    t,
    [
      "export const metadata = {",
      "  metadataBase: new URL(SITE_URL),",
      "};",
      "// see https://nextjs.org/docs/app/guides/json-ld for the schema shape",
    ].join("\n"),
  );
  // SITE_URL is never declared, so this is honestly unknown — not the docs link.
  assert.equal(detectProject(dir).siteUrl.url, null);
});

test("a bare URL elsewhere in the file is not mistaken for metadataBase", (t) => {
  const dir = nextAppWithLayout(t, '// https://example.com/some/doc\nexport const metadata = {};\n');
  assert.equal(detectProject(dir).siteUrl.url, null);
});

// ---------------------------------------------------------------------------
// Monorepo search
//
// Dogfooding the detector against the real estate found this: a repo whose Next
// app lives in `web/` under a near-empty root package.json reported "unknown"
// and silently downgraded the user to the static fallback.
// ---------------------------------------------------------------------------

test("finds a Next app nested in web/ under a non-framework root", () => {
  const r = detectProject(fixture("monorepo-next"));
  assert.equal(r.framework, "nextjs-app");
  assert.equal(r.detectedIn, "web");
});

test("monorepo asset paths resolve against the app root, not the repo root", () => {
  const r = detectProject(fixture("monorepo-next"));
  // next.config.mjs lives in web/, so metadataBase is only findable from there.
  assert.equal(r.siteUrl.url, "https://monorepo.example");
  assert.ok(r.appRoot.endsWith(path.join("monorepo-next", "web")), r.appRoot);
});

test("detectedIn is null when the framework is at the requested root", () => {
  assert.equal(detectProject(fixture("astro-minimal")).detectedIn, null);
});

test("searchSubdirs:false keeps the old root-only behaviour", () => {
  const r = detectProject(fixture("monorepo-next"), { searchSubdirs: false });
  assert.equal(r.detected, false);
});

test("a framework vendored in node_modules is never detected", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-nm-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "root" }));
  const vendored = path.join(dir, "node_modules", "astro");
  fs.mkdirSync(vendored, { recursive: true });
  fs.writeFileSync(
    path.join(vendored, "package.json"),
    JSON.stringify({ name: "astro", dependencies: { astro: "^5.0.0" } }),
  );
  assert.equal(detectProject(dir).detected, false, "walked into node_modules");
});

test("build output directories are not searched", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-dist-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "root" }));
  const dist = path.join(dir, "dist");
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, "package.json"), JSON.stringify({ dependencies: { next: "^15.0.0" } }));
  assert.equal(detectProject(dir).detected, false, "searched a build dir");
});

test("findAppRoot prefers a conventional app dir over an alphabetically earlier one", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-pref-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "root" }));
  for (const name of ["admin-tool", "web"]) {
    const sub = path.join(dir, name);
    fs.mkdirSync(sub, { recursive: true });
    fs.writeFileSync(
      path.join(sub, "package.json"),
      JSON.stringify({ dependencies: name === "web" ? { next: "^15.0.0" } : { astro: "^5.0.0" } }),
    );
  }
  const r = detectProject(dir);
  assert.equal(r.detectedIn, "web");
  assert.equal(r.framework, "nextjs-app");
});

test("the subdirectory search is depth-bounded", (t) => {
  const dir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "seosp-deep-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "root" }));
  const deep = path.join(dir, "a", "b", "c");
  fs.mkdirSync(deep, { recursive: true });
  fs.writeFileSync(path.join(deep, "package.json"), JSON.stringify({ dependencies: { astro: "^5.0.0" } }));
  assert.equal(detectProject(dir).detected, false, "searched deeper than 2 levels");
});

// ---------------------------------------------------------------------------
// Templates contract — the regression that started this lane
//
// seo-bootstrap Step 3 tells the model to write files from templates/<fw>/.
// Those directories did not exist. Detection pointing at a directory that is
// not there is worse than no detection, so it is asserted here.
// ---------------------------------------------------------------------------

test("every framework that advertises a template dir actually has one on disk", () => {
  for (const [id, meta] of Object.entries(FRAMEWORK_META)) {
    if (!meta.templates) continue;
    const dir = path.join(REPO_ROOT, meta.templates);
    assert.ok(
      fs.existsSync(dir) && fs.statSync(dir).isDirectory(),
      `${id} advertises ${meta.templates} but it does not exist`,
    );
    assert.ok(
      fs.readdirSync(dir).length > 0,
      `${meta.templates} exists but is empty`,
    );
  }
});

test("a detected framework routes to an existing template dir", () => {
  for (const name of ["astro-minimal", "sveltekit-minimal", "nextjs-app-minimal", "nextjs-pages-minimal"]) {
    const r = detectProject(fixture(name));
    assert.ok(r.templates, `${name} produced no template dir`);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, r.templates)), `${name} -> missing ${r.templates}`);
  }
});

// ---------------------------------------------------------------------------
// Report rendering + CLI
// ---------------------------------------------------------------------------

test("renderReport names the framework and every missing asset", () => {
  const out = renderReport(detectProject(fixture("astro-minimal")));
  assert.match(out, /Astro/);
  assert.match(out, /MISSING/);
  assert.match(out, /Generate: /);
});

test("renderReport tells a complete project to run the audit skill instead", () => {
  const out = renderReport(detectProject(fixture("astro-complete")));
  assert.match(out, /auditing-technical-seo/);
});

test("CLI exits 0 on a detected framework and prints the label", () => {
  const res = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, "scripts", "detect-framework.js"), fixture("astro-minimal")],
    { encoding: "utf8" },
  );
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Framework: Astro/);
});

test("CLI --json emits parseable JSON", () => {
  const res = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, "scripts", "detect-framework.js"), fixture("sveltekit-minimal"), "--json"],
    { encoding: "utf8" },
  );
  assert.equal(res.status, 0, res.stderr);
  const parsed = JSON.parse(res.stdout);
  assert.equal(parsed.framework, "sveltekit");
});

test("CLI exits 1 when no framework is detected", () => {
  const res = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, "scripts", "detect-framework.js"), fixture("bare-no-pkg")],
    { encoding: "utf8" },
  );
  assert.equal(res.status, 1);
  assert.match(res.stdout, /no supported framework detected/);
});

test("CLI exits 2 on a bad path", () => {
  const res = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, "scripts", "detect-framework.js"), fixture("nope-not-here")],
    { encoding: "utf8" },
  );
  assert.equal(res.status, 2);
});
