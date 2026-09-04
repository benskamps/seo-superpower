"use strict";

/**
 * test/schema-check.test.js — unit tests for scripts/schema-check.js.
 *
 * Exercises pure JSON-LD validation functions, case sensitivity checks,
 * required/recommended fields, HTML script block extraction, and CLI execution.
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
  validateJsonLd,
  extractJsonLdBlocks,
  validateTypeCasing,
  CANONICAL_TYPES,
} = require("../scripts/schema-check.js");

const SCRIPT_PATH = path.resolve(__dirname, "../scripts/schema-check.js");

test("schema-check: valid Article passes with zero errors and zero warnings", () => {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Modern Technical SEO",
    author: { "@type": "Person", name: "Jane Developer" },
    datePublished: "2026-04-01T00:00:00Z",
    dateModified: "2026-04-02T00:00:00Z",
    image: "https://example.com/cover.png",
    publisher: { "@type": "Organization", name: "Engineering Org" },
  };

  const res = validateJsonLd(JSON.stringify(payload));
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
  assert.equal(res.warnings.length, 0);
  assert.deepEqual(res.types, ["Article"]);
});

test("schema-check: detects and flags case-sensitivity typos against schema.org", () => {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Website", // should be WebSite
    name: "My Site",
    url: "https://example.com",
  };

  const res = validateJsonLd(JSON.stringify(payload));
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((err) => err.includes("WebSite") && err.includes("incorrect casing")));
});

test("schema-check: flags missing required fields for Article and FAQPage", () => {
  // Article missing headline
  const res1 = validateJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      description: "No headline here",
    }),
  );
  assert.equal(res1.valid, false);
  assert.ok(res1.errors.some((err) => err.includes("headline")));

  // FAQPage missing mainEntity
  const res2 = validateJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
    }),
  );
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some((err) => err.includes("mainEntity")));
});

test("schema-check: flags missing or invalid @context", () => {
  const resMissing = validateJsonLd(
    JSON.stringify({
      "@type": "Organization",
      name: "Acme",
    }),
  );
  assert.equal(resMissing.valid, false);
  assert.ok(resMissing.errors.some((err) => err.includes("@context")));

  const resInvalid = validateJsonLd(
    JSON.stringify({
      "@context": "https://invalid-context.org",
      "@type": "Organization",
      name: "Acme",
    }),
  );
  assert.equal(resInvalid.valid, false);
  assert.ok(resInvalid.errors.some((err) => err.includes("invalid '@context'")));
});

test("schema-check: extracts JSON-LD blocks from HTML document", () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "HTML Extraction Test",
          "author": "Alice",
          "datePublished": "2026-01-01",
          "dateModified": "2026-01-02",
          "image": "https://example.com/a.jpg",
          "publisher": "Acme"
        }
        </script>
      </head>
      <body><h1>Title</h1></body>
    </html>
  `;
  const res = validateJsonLd(html);
  assert.equal(res.valid, true);
  assert.deepEqual(res.types, ["BlogPosting"]);
  assert.equal(res.errors.length, 0);
});

test("schema-check: traverses @graph multi-entity structures", () => {
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Test Site",
        url: "https://example.com",
      },
      {
        "@type": "Organization",
        name: "Test Corp",
        url: "https://example.com",
        logo: "https://example.com/logo.png",
        sameAs: "https://twitter.com/test",
      },
    ],
  };
  const res = validateJsonLd(JSON.stringify(payload));
  assert.equal(res.valid, true);
  assert.ok(res.types.includes("WebSite"));
  assert.ok(res.types.includes("Organization"));
});

test("schema-check: validates Product rich-result requirements", () => {
  // Missing offers / aggregateRating / review
  const resInvalid = validateJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Smart Watch",
    }),
  );
  assert.equal(resInvalid.valid, false);
  assert.ok(resInvalid.errors.some((err) => err.includes("offers") || err.includes("aggregateRating")));

  // Valid product with offers
  const resValid = validateJsonLd(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Smart Watch Pro",
      image: "https://example.com/watch.png",
      description: "Great watch",
      brand: "Acme",
      offers: {
        "@type": "Offer",
        price: "99.00",
        priceCurrency: "USD",
      },
    }),
  );
  assert.equal(resValid.valid, true);
});

test("schema-check: validates BreadcrumbList item structure", () => {
  const payload = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://example.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://example.com/blog",
      },
    ],
  };
  const res = validateJsonLd(JSON.stringify(payload));
  assert.equal(res.valid, true);
  assert.deepEqual(res.types, ["BreadcrumbList"]);
});

test("schema-check: CLI exits 0 for clean schema", () => {
  const cleanJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Clean Article",
    author: "Author",
    datePublished: "2026-01-01",
    dateModified: "2026-01-02",
    image: "https://example.com/img.png",
    publisher: "Org",
  });
  const stdout = execFileSync(process.execPath, [SCRIPT_PATH, "--json", cleanJson], { encoding: "utf8" });
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.warnings.length, 0);
});

test("schema-check: CLI exits 1 for warnings (missing recommended fields)", () => {
  const warnJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Headline Only",
  });
  let exitCode = 0;
  let stdout = "";
  try {
    stdout = execFileSync(process.execPath, [SCRIPT_PATH, "--json", warnJson], { encoding: "utf8" });
  } catch (err) {
    exitCode = err.status;
    stdout = err.stdout;
  }
  assert.equal(exitCode, 1);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.valid, true);
  assert.ok(parsed.warnings.length > 0);
});

test("schema-check: CLI exits 2 for errors (invalid syntax or missing required)", () => {
  const errJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
  });
  let exitCode = 0;
  try {
    execFileSync(process.execPath, [SCRIPT_PATH, "--json", errJson], { encoding: "utf8" });
  } catch (err) {
    exitCode = err.status;
  }
  assert.equal(exitCode, 2);
});

test("schema-check: CLI validates file using --file flag", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "schema-check-test-"));
  const tmpFile = path.join(tmpDir, "schema.json");
  fs.writeFileSync(
    tmpFile,
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "File Test Corp",
      url: "https://example.com",
      logo: "https://example.com/logo.png",
      sameAs: "https://twitter.com/test",
    }),
    "utf8",
  );

  const stdout = execFileSync(process.execPath, [SCRIPT_PATH, "--file", tmpFile], { encoding: "utf8" });
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.types, ["Organization"]);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("schema-check: CLI exits 2 quickly (<1s) when --file flag is missing argument", () => {
  const start = Date.now();
  let exitCode = 0;
  let stderr = "";
  try {
    execFileSync(process.execPath, [SCRIPT_PATH, "--file"], {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    exitCode = err.status;
    stderr = err.stderr || "";
  }
  const duration = Date.now() - start;
  assert.equal(exitCode, 2);
  assert.ok(duration < 1000, `Expected duration < 1000ms, took ${duration}ms`);
  assert.ok(stderr.includes("--file requires a file path"));
});

test("schema-check: CLI exits 2 when --file is followed by another flag", () => {
  let exitCode = 0;
  let stderr = "";
  try {
    execFileSync(process.execPath, [SCRIPT_PATH, "--file", "--text"], {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    exitCode = err.status;
    stderr = err.stderr || "";
  }
  assert.equal(exitCode, 2);
  assert.ok(stderr.includes("--file requires a file path"));
});

test("schema-check: CLI exits 2 when --json or --url flag is missing argument", () => {
  let exitCodeJson = 0;
  let stderrJson = "";
  try {
    execFileSync(process.execPath, [SCRIPT_PATH, "--json"], {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    exitCodeJson = err.status;
    stderrJson = err.stderr || "";
  }
  assert.equal(exitCodeJson, 2);
  assert.ok(stderrJson.includes("--json requires a JSON string"));

  let exitCodeUrl = 0;
  let stderrUrl = "";
  try {
    execFileSync(process.execPath, [SCRIPT_PATH, "--url"], {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    exitCodeUrl = err.status;
    stderrUrl = err.stderr || "";
  }
  assert.equal(exitCodeUrl, 2);
  assert.ok(stderrUrl.includes("--url requires a URL"));
});

