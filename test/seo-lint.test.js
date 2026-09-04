"use strict";

/**
 * test/seo-lint.test.js — unit tests for scripts/seo-lint.js.
 *
 * Tests detection of placeholder tokens, accidental noindex directives,
 * relative sitemap/canonical URLs, schema casing typos, and CLI behavior.
 *
 * Node stdlib only (node:test + node:assert) — no dependencies.
 * Run with: node --test test/*.test.js
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const {
  lintContent,
  lintDirectory,
  main,
} = require("../scripts/seo-lint.js");

const SCRIPT_PATH = path.resolve(__dirname, "../scripts/seo-lint.js");

function createMockProject(files = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-lint-test-"));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(tmpDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return tmpDir;
}

test("seo-lint: clean project produces 0 issues", () => {
  const tmp = createMockProject({
    "public/robots.txt": "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n",
    "public/sitemap.xml": '<?xml version="1.0"?><urlset><url><loc>https://example.com/</loc></url></urlset>',
    "index.html": `<!doctype html>
      <html>
        <head>
          <title>Clean Title</title>
          <link rel="canonical" href="https://example.com/">
          <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "WebSite", "name": "Clean"}
          </script>
        </head>
        <body><h1>Hello</h1></body>
      </html>`,
  });

  try {
    const res = lintDirectory(tmp);
    assert.equal(res.clean, true);
    assert.equal(res.issueCount, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("seo-lint: detects unreplaced REPLACE-WITH-* tokens", () => {
  const content = `
    User-agent: *
    Allow: /
    Sitemap: REPLACE-WITH-CANONICAL-ORIGIN/sitemap.xml
  `;
  const issues = lintContent("public/robots.txt", content);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].rule, "no-placeholder-tokens");
  assert.equal(issues[0].token, "REPLACE-WITH-CANONICAL-ORIGIN");
  assert.equal(issues[0].line, 4);
});

test("seo-lint: detects accidental noindex directives in production templates", () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Staging Leak</title>
        <meta name="robots" content="noindex, nofollow">
      </head>
      <body><h1>Oops</h1></body>
    </html>
  `;
  const issues = lintContent("src/pages/index.html", html);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].rule, "no-accidental-noindex");
  assert.equal(issues[0].line, 6);
});

test("seo-lint: ignores noindex on 404 or admin pages", () => {
  const notFoundHtml = `
    <html>
      <head><meta name="robots" content="noindex"></head>
      <body><h1>404 Not Found</h1></body>
    </html>
  `;
  const issues404 = lintContent("src/pages/404.html", notFoundHtml);
  assert.equal(issues404.length, 0);

  const adminHtml = `
    <html>
      <head><meta name="robots" content="noindex"></head>
      <body><h1>Admin Dashboard</h1></body>
    </html>
  `;
  const issuesAdmin = lintContent("src/admin/settings.html", adminHtml);
  assert.equal(issuesAdmin.length, 0);
});

test("seo-lint: detects relative URLs in sitemaps", () => {
  const sitemap = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://example.com/valid</loc></url>
      <url><loc>/pricing</loc></url>
    </urlset>
  `;
  const issues = lintContent("public/sitemap.xml", sitemap);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].rule, "no-relative-sitemap-urls");
  assert.equal(issues[0].url, "/pricing");
  assert.equal(issues[0].line, 4);
});

test("seo-lint: detects relative canonical links in HTML templates", () => {
  const html = `
    <html>
      <head>
        <title>Page</title>
        <link rel="canonical" href="/blog/my-post">
      </head>
      <body><h1>Post</h1></body>
    </html>
  `;
  const issues = lintContent("app/blog/page.html", html);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].rule, "no-relative-canonicals");
  assert.equal(issues[0].href, "/blog/my-post");
});

test("seo-lint: detects schema.org casing errors", () => {
  const html = `
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Website",
          "name": "Test"
        }
        </script>
      </head>
    </html>
  `;
  const issues = lintContent("index.html", html);
  assert.ok(issues.some((i) => i.rule === "schema-casing" && i.message.includes("WebSite")));
});

test("seo-lint: CLI exits 0 on clean target and 1 on issues", () => {
  const cleanDir = createMockProject({
    "index.html": "<html><head><title>Clean</title></head><body><h1>Hi</h1></body></html>",
  });
  const dirtyDir = createMockProject({
    "index.html": '<html><head><link rel="canonical" href="/relative-only"></head></html>',
  });

  try {
    // Clean directory -> exit 0
    const out0 = execFileSync(process.execPath, [SCRIPT_PATH, cleanDir, "--json"], { encoding: "utf8" });
    const parsed0 = JSON.parse(out0);
    assert.equal(parsed0.clean, true);
    assert.equal(parsed0.issueCount, 0);

    // Dirty directory -> exit 1
    let exitCode = 0;
    let out1 = "";
    try {
      out1 = execFileSync(process.execPath, [SCRIPT_PATH, dirtyDir, "--json"], { encoding: "utf8" });
    } catch (err) {
      exitCode = err.status;
      out1 = err.stdout;
    }
    assert.equal(exitCode, 1);
    const parsed1 = JSON.parse(out1);
    assert.equal(parsed1.clean, false);
    assert.equal(parsed1.issueCount, 1);
    assert.equal(parsed1.issues[0].rule, "no-relative-canonicals");

    // Non-existent path -> exit 2
    let code2 = 0;
    try {
      execFileSync(process.execPath, [SCRIPT_PATH, "/nonexistent/path/for/sure"], { encoding: "utf8" });
    } catch (err) {
      code2 = err.status;
    }
    assert.equal(code2, 2);
  } finally {
    fs.rmSync(cleanDir, { recursive: true, force: true });
    fs.rmSync(dirtyDir, { recursive: true, force: true });
  }
});
