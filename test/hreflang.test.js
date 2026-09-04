"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const {
  validateHreflangCode,
  normalizeMapping,
  validateHreflangGroups,
  generateHtml,
  generateXml,
  generateNextJs
} = require("../scripts/hreflang-tool.js");

const SCRIPT_PATH = path.resolve(__dirname, "../scripts/hreflang-tool.js");

test("validateHreflangCode: valid ISO codes and x-default", () => {
  assert.equal(validateHreflangCode("en").valid, true);
  assert.equal(validateHreflangCode("es").valid, true);
  assert.equal(validateHreflangCode("fr").valid, true);
  assert.equal(validateHreflangCode("x-default").valid, true);
  assert.equal(validateHreflangCode("x-default").canonical, "x-default");

  const region = validateHreflangCode("en-us");
  assert.equal(region.valid, true);
  assert.equal(region.canonical, "en-US");
});

test("validateHreflangCode: rejects invalid syntax and underscores", () => {
  assert.equal(validateHreflangCode("").valid, false);
  assert.equal(validateHreflangCode("123").valid, false);
  assert.equal(validateHreflangCode("en_US").valid, false); // Underscores invalid in hreflang
  assert.equal(validateHreflangCode("english").valid, false);
  assert.equal(validateHreflangCode(null).valid, false);
});

test("normalizeMapping: handles array and object structures", () => {
  const arr = [
    {
      group: "home",
      alternates: [
        { lang: "en", url: "https://example.com/en" },
        { lang: "es", url: "https://example.com/es" }
      ]
    }
  ];
  const norm1 = normalizeMapping(arr);
  assert.equal(norm1.length, 1);
  assert.equal(norm1[0].alternates.length, 2);

  const obj = {
    "https://example.com/en": {
      "en": "https://example.com/en",
      "es": "https://example.com/es",
      "x-default": "https://example.com/"
    }
  };
  const norm2 = normalizeMapping(obj);
  assert.equal(norm2.length, 1);
  assert.equal(norm2[0].alternates.length, 3);
});

test("validateHreflangGroups: passes for clean reciprocal mappings", () => {
  const clean = [
    {
      group: "https://example.com/en",
      alternates: [
        { lang: "en", url: "https://example.com/en" },
        { lang: "es", url: "https://example.com/es" },
        { lang: "x-default", url: "https://example.com/" }
      ]
    },
    {
      group: "https://example.com/es",
      alternates: [
        { lang: "en", url: "https://example.com/en" },
        { lang: "es", url: "https://example.com/es" },
        { lang: "x-default", url: "https://example.com/" }
      ]
    }
  ];
  const result = validateHreflangGroups(clean);
  assert.equal(result.valid, true);
  assert.equal(result.issues.length, 0);
});

test("validateHreflangGroups: detects missing reciprocal links", () => {
  const asymmetric = [
    {
      group: "https://example.com/en",
      alternates: [
        { lang: "en", url: "https://example.com/en" },
        { lang: "es", url: "https://example.com/es" },
        { lang: "x-default", url: "https://example.com/" }
      ]
    },
    {
      group: "https://example.com/es",
      alternates: [
        { lang: "es", url: "https://example.com/es" },
        { lang: "fr", url: "https://example.com/fr" }, // Links to fr, missing en!
        { lang: "x-default", url: "https://example.com/" }
      ]
    }
  ];
  const result = validateHreflangGroups(asymmetric);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some(i => i.type === "missing_reciprocal_link"));
});

test("validateHreflangGroups: flags duplicate tags and invalid URLs", () => {
  const invalid = [
    {
      group: "test",
      alternates: [
        { lang: "en", url: "https://example.com/en1" },
        { lang: "en", url: "https://example.com/en2" }, // Duplicate language
        { lang: "es", url: "/relative/path" } // Relative URL invalid
      ]
    }
  ];
  const result = validateHreflangGroups(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some(i => i.type === "duplicate_hreflang_tag"));
  assert.ok(result.issues.some(i => i.type === "invalid_url_format"));
  assert.ok(result.warnings.some(w => w.type === "missing_x_default"));
});

test("generateHtml, generateXml, generateNextJs: output format verification", () => {
  const alts = [
    { lang: "en", url: "https://example.com/en" },
    { lang: "es", url: "https://example.com/es" },
    { lang: "x-default", url: "https://example.com/" }
  ];

  const html = generateHtml(alts);
  assert.ok(html.includes('<link rel="alternate" hreflang="en" href="https://example.com/en" />'));
  assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="https://example.com/" />'));

  const xml = generateXml("https://example.com/en", alts);
  assert.ok(xml.includes("<loc>https://example.com/en</loc>"));
  assert.ok(xml.includes('<xhtml:link rel="alternate" hreflang="es" href="https://example.com/es" />'));

  const nextjs = generateNextJs(alts);
  assert.ok(nextjs.includes("export const metadata"));
  assert.ok(nextjs.includes('canonical: "https://example.com/"'));
  assert.ok(nextjs.includes('"en": "https://example.com/en"'));
});

test("CLI: --help exits 0 and prints usage", () => {
  const output = execFileSync(process.execPath, [SCRIPT_PATH, "--help"], { encoding: "utf8" });
  assert.ok(output.includes("Usage:"));
  assert.ok(output.includes("hreflang-tool.js"));
});

test("CLI: missing args or bad commands exit 2", () => {
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT_PATH, "unknown"], { encoding: "utf8" }),
    (err) => err.status === 2
  );
  assert.throws(
    () => execFileSync(process.execPath, [SCRIPT_PATH, "validate"], { encoding: "utf8" }),
    (err) => err.status === 2
  );
});

test("CLI: validate and generate commands execute cleanly against temporary fixture", () => {
  const tmpDir = path.resolve(__dirname, "../fixtures/tmp_test_hreflang");
  fs.mkdirSync(tmpDir, { recursive: true });
  const fixturePath = path.join(tmpDir, "mapping.json");

  const fixtureData = [
    {
      group: "https://example.com/en",
      alternates: [
        { lang: "en", url: "https://example.com/en" },
        { lang: "es", url: "https://example.com/es" },
        { lang: "x-default", url: "https://example.com/" }
      ]
    },
    {
      group: "https://example.com/es",
      alternates: [
        { lang: "en", url: "https://example.com/en" },
        { lang: "es", url: "https://example.com/es" },
        { lang: "x-default", url: "https://example.com/" }
      ]
    }
  ];

  try {
    fs.writeFileSync(fixturePath, JSON.stringify(fixtureData), "utf8");

    // Test validate command
    const valOut = execFileSync(process.execPath, [SCRIPT_PATH, "validate", fixturePath], { encoding: "utf8" });
    assert.ok(valOut.includes("[PASS] All hreflang links are fully compliant"));

    // Test validate with --json
    const valJson = execFileSync(process.execPath, [SCRIPT_PATH, "validate", fixturePath, "--json"], { encoding: "utf8" });
    const parsed = JSON.parse(valJson);
    assert.equal(parsed.valid, true);

    // Test generate command HTML
    const genHtml = execFileSync(process.execPath, [SCRIPT_PATH, "generate", fixturePath, "--format", "html"], { encoding: "utf8" });
    assert.ok(genHtml.includes('<link rel="alternate" hreflang="en"'));

    // Test generate command XML
    const genXml = execFileSync(process.execPath, [SCRIPT_PATH, "generate", fixturePath, "--format", "xml"], { encoding: "utf8" });
    assert.ok(genXml.includes("<xhtml:link"));

    // Test generate command Next.js
    const genNext = execFileSync(process.execPath, [SCRIPT_PATH, "generate", fixturePath, "--format", "nextjs"], { encoding: "utf8" });
    assert.ok(genNext.includes("export const metadata"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
