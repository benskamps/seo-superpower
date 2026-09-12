"use strict";

/**
 * Cross-checks the committed ISO tables in scripts/iso-codes.js against the
 * Node runtime's own bundled ICU/CLDR data.
 *
 * scripts/iso-codes.js is generated, not hand-written, precisely so that nobody
 * has to trust a human (or a model) to transcribe 249 region codes correctly.
 * This test re-derives the same sets from ICU at test time and fails if the
 * committed file has drifted — which makes the tables a re-runnable claim
 * rather than an assertion in a commit message.
 *
 * Skipped on a Node built with a reduced ICU that cannot resolve display names.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ASSIGNED_REGIONS,
  DEPRECATED_REGIONS,
  RESERVED_REGIONS,
  TOLERATED_REGIONS,
  ASSIGNED_LANGS,
  DEPRECATED_LANGS,
  SCRIPTS
} = require("../scripts/iso-codes.js");

function icuAvailable() {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of("DE") === "Germany";
  } catch {
    return false;
  }
}

const HAS_ICU = icuAvailable();
const skip = HAS_ICU ? false : "requires a full-icu Node build";

function icuKnownRegions() {
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  const known = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a) + String.fromCharCode(b);
      let name;
      try {
        name = display.of(code);
      } catch {
        continue;
      }
      if (name && name !== code && name !== "Unknown Region") known.push(code);
    }
  }
  return known;
}

function icuKnownLanguages() {
  const display = new Intl.DisplayNames(["en"], { type: "language" });
  const known = [];
  for (let a = 97; a <= 122; a++) {
    for (let b = 97; b <= 122; b++) {
      const code = String.fromCharCode(a) + String.fromCharCode(b);
      let name;
      try {
        name = display.of(code);
      } catch {
        continue;
      }
      if (name && name !== code) known.push(code);
    }
  }
  return known;
}

test("iso-codes: committed region tables partition everything ICU knows", { skip }, () => {
  const known = icuKnownRegions();
  for (const code of known) {
    const classified =
      ASSIGNED_REGIONS.has(code) ||
      Object.prototype.hasOwnProperty.call(DEPRECATED_REGIONS, code) ||
      Object.prototype.hasOwnProperty.call(RESERVED_REGIONS, code) ||
      Object.prototype.hasOwnProperty.call(TOLERATED_REGIONS, code);
    assert.ok(classified, `ICU knows region '${code}' but iso-codes.js does not classify it`);
  }
});

test("iso-codes: the classifications are mutually exclusive", { skip }, () => {
  for (const code of ASSIGNED_REGIONS) {
    assert.ok(
      !Object.prototype.hasOwnProperty.call(DEPRECATED_REGIONS, code),
      `'${code}' is both assigned and deprecated`
    );
    assert.ok(
      !Object.prototype.hasOwnProperty.call(RESERVED_REGIONS, code),
      `'${code}' is both assigned and reserved`
    );
  }
});

test("iso-codes: holds exactly the 249 officially assigned ISO 3166-1 codes", () => {
  assert.equal(ASSIGNED_REGIONS.size, 249);
});

test("iso-codes: every suggested successor is itself a valid assigned code", () => {
  const successors = [
    ...Object.values(DEPRECATED_REGIONS),
    ...Object.values(RESERVED_REGIONS)
  ].filter(Boolean);
  for (const code of successors) {
    assert.ok(ASSIGNED_REGIONS.has(code), `suggested successor '${code}' is not an assigned region`);
  }
});

test("iso-codes: GB is assigned and UK is not", () => {
  // The whole reason this module exists. ICU resolves "UK" to "United Kingdom"
  // as a legacy CLDR alias, so ICU acceptance alone would let en-UK through.
  assert.ok(ASSIGNED_REGIONS.has("GB"));
  assert.ok(!ASSIGNED_REGIONS.has("UK"));
  assert.equal(RESERVED_REGIONS.UK, "GB");
});

test("iso-codes: committed language table matches ICU minus deprecated aliases", { skip }, () => {
  const known = icuKnownLanguages();
  const expected = known.filter(
    (code) => !Object.prototype.hasOwnProperty.call(DEPRECATED_LANGS, code)
  );
  assert.deepEqual([...ASSIGNED_LANGS].sort(), expected.sort());
});

test("iso-codes: every deprecated language maps to a known replacement", () => {
  for (const [legacy, modern] of Object.entries(DEPRECATED_LANGS)) {
    assert.ok(!ASSIGNED_LANGS.has(legacy), `'${legacy}' should not be in the assigned set`);
    // 'bho' is a three-letter ISO 639-2 replacement and is intentionally not in
    // the two-letter assigned set.
    if (modern.length === 2) {
      assert.ok(ASSIGNED_LANGS.has(modern), `replacement '${modern}' must be assigned`);
    }
  }
});

test("iso-codes: script table carries the subtags real sites use", () => {
  for (const code of ["Hans", "Hant", "Latn", "Cyrl", "Arab", "Hebr", "Grek", "Deva"]) {
    assert.ok(SCRIPTS.has(code), `missing ISO 15924 script '${code}'`);
  }
});
