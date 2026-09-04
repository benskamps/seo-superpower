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

// ---------------------------------------------------------------------------
// ISO 3166-1 region validation.
//
// Every code below used to return { valid: true } and the CLI reported
// "[PASS] All hreflang links are fully compliant". Only the language half of a
// tag was checked; the region half was uppercased and accepted unread. en-UK is
// the most common hreflang error in the wild and the skill doc calls it out by
// name, so the validator has to be the thing that catches it.
// ---------------------------------------------------------------------------

test("validateHreflangCode: rejects en-UK and points at en-GB", () => {
  const res = validateHreflangCode("en-UK");
  assert.equal(res.valid, false);
  assert.match(res.reason, /not an officially assigned ISO 3166-1/);
  assert.equal(res.suggestion, "en-GB");
});

test("validateHreflangCode: rejects unassigned region codes", () => {
  for (const code of ["en-XX", "en-ZZ", "de-QQ"]) {
    const res = validateHreflangCode(code);
    assert.equal(res.valid, false, `${code} must not validate`);
    assert.match(res.reason, /not an assigned ISO 3166-1 alpha-2 region code/);
  }
});

test("validateHreflangCode: rejects withdrawn regions with their successor", () => {
  const res = validateHreflangCode("nl-AN"); // Netherlands Antilles, dissolved 2010
  assert.equal(res.valid, false);
  assert.match(res.reason, /withdrawn ISO 3166-1 code/);
  assert.equal(res.suggestion, "nl-CW");
});

test("validateHreflangCode: rejects non-country regions such as EU", () => {
  const res = validateHreflangCode("en-EU");
  assert.equal(res.valid, false);
  assert.match(res.reason, /must be countries/);
});

test("validateHreflangCode: accepts every assigned ISO 3166-1 region", () => {
  for (const region of ["GB", "US", "DE", "JP", "BR", "ZA", "AU", "IN"]) {
    const res = validateHreflangCode(`en-${region}`);
    assert.equal(res.valid, true, `en-${region} must validate`);
    assert.equal(res.canonical, `en-${region}`);
  }
});

test("validateHreflangCode: accepts UN M.49 numeric areas like es-419", () => {
  const res = validateHreflangCode("es-419");
  assert.equal(res.valid, true);
  assert.equal(res.canonical, "es-419");
});

test("validateHreflangCode: warns on user-assigned XK but does not reject it", () => {
  const res = validateHreflangCode("sq-XK");
  assert.equal(res.valid, true);
  assert.match(res.warning, /not ISO-official/);
});

// ---------------------------------------------------------------------------
// ISO 639-1 language coverage and ISO 15924 script subtags.
// ---------------------------------------------------------------------------

test("validateHreflangCode: no spurious warning for real but uncommon languages", () => {
  // These are assigned ISO 639-1 codes that the old hard-coded subset omitted,
  // so every Nordic and Gujarati site got a bogus "rare code" warning.
  for (const lang of ["nb", "nn", "gu", "mt", "lb", "fo", "gd", "or", "as"]) {
    const res = validateHreflangCode(lang);
    assert.equal(res.valid, true, `${lang} must validate`);
    assert.equal(res.warning, undefined, `${lang} must not warn`);
  }
});

test("validateHreflangCode: rejects deprecated language codes with the modern one", () => {
  const res = validateHreflangCode("iw-IL"); // legacy Hebrew
  assert.equal(res.valid, false);
  assert.match(res.reason, /deprecated ISO 639 language code/);
  assert.equal(res.suggestion, "he-IL");
});

test("validateHreflangCode: rejects unknown languages instead of warning", () => {
  const res = validateHreflangCode("qq");
  assert.equal(res.valid, false);
  assert.match(res.reason, /not an assigned ISO 639-1 language code/);
});

test("validateHreflangCode: canonicalizes script subtags to Title case", () => {
  assert.equal(validateHreflangCode("zh-hans").canonical, "zh-Hans");
  assert.equal(validateHreflangCode("zh-HANT").canonical, "zh-Hant");
  assert.equal(validateHreflangCode("zh-hant-tw").canonical, "zh-Hant-TW");
  assert.equal(validateHreflangCode("sr-latn-rs").canonical, "sr-Latn-RS");
});

test("validateHreflangCode: rejects unknown script subtags", () => {
  const res = validateHreflangCode("zh-Qqqq");
  assert.equal(res.valid, false);
  assert.match(res.reason, /not an assigned ISO 15924 script subtag/);
});

// ---------------------------------------------------------------------------
// Self-referential links and reciprocity.
//
// These were coupled: the self-reference test was used as the GUARD around the
// reciprocity loop, so a page missing its own tag had reciprocity silently
// switched off. Both defects had to be present for the bug to show, which is
// why a group with both errors reported "[PASS] fully compliant".
// ---------------------------------------------------------------------------

test("validateHreflangGroups: flags a page that omits its self-referential link", () => {
  const groups = normalizeMapping({
    "https://example.com/en": {
      es: "https://example.com/es",
      "x-default": "https://example.com/"
    }
  });
  const res = validateHreflangGroups(groups);
  assert.equal(res.valid, false);
  assert.ok(res.issues.some(i => i.type === "missing_self_reference"));
});

test("validateHreflangGroups: a missing self-reference does not disable reciprocity", () => {
  // /en omits its own tag AND /es never links back. Both must be reported.
  const groups = normalizeMapping({
    "https://example.com/en": {
      es: "https://example.com/es",
      "x-default": "https://example.com/"
    },
    "https://example.com/es": {
      es: "https://example.com/es",
      "x-default": "https://example.com/"
    }
  });
  const res = validateHreflangGroups(groups);
  assert.equal(res.valid, false);
  assert.ok(
    res.issues.some(i => i.type === "missing_self_reference"),
    "missing self-reference must be reported"
  );
  assert.ok(
    res.issues.some(i => i.type === "missing_reciprocal_link"),
    "reciprocity must still be checked when the self-reference is absent"
  );
});

test("validateHreflangGroups: reports each non-reciprocal pair exactly once", () => {
  const groups = normalizeMapping({
    "https://example.com/en": {
      en: "https://example.com/en",
      es: "https://example.com/es",
      "x-default": "https://example.com/"
    },
    "https://example.com/es": {
      es: "https://example.com/es",
      "x-default": "https://example.com/"
    }
  });
  const res = validateHreflangGroups(groups);
  const recip = res.issues.filter(i => i.type === "missing_reciprocal_link");
  assert.equal(recip.length, 1, "one broken pair should produce one error, not one per membership");
});

test("validateHreflangGroups: a fully correct cluster still passes", () => {
  const groups = normalizeMapping({
    "https://example.com/en": {
      en: "https://example.com/en",
      "es-MX": "https://example.com/es",
      "x-default": "https://example.com/"
    },
    "https://example.com/es": {
      en: "https://example.com/en",
      "es-MX": "https://example.com/es",
      "x-default": "https://example.com/"
    }
  });
  const res = validateHreflangGroups(groups);
  assert.equal(res.valid, true, JSON.stringify(res.issues, null, 2));
});

test("validateHreflangGroups: label-keyed groups are exempt from page-level checks", () => {
  // "homepage" is not a URL, so it carries no page identity to self-reference.
  const groups = normalizeMapping({
    homepage: {
      en: "https://example.com/en",
      es: "https://example.com/es",
      "x-default": "https://example.com/"
    }
  });
  const res = validateHreflangGroups(groups);
  assert.ok(!res.issues.some(i => i.type === "missing_self_reference"));
});
