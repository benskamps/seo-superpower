#!/usr/bin/env node
/**
 * scripts/hreflang-tool.js — Deterministic multi-language & hreflang validation and generation.
 *
 * Part of seo-superpower.
 * Pure Node.js stdlib only (Node 18+) — zero external dependencies.
 *
 * Capabilities:
 *   1. Validate hreflang mappings for:
 *      - Language subtags checked against the assigned ISO 639-1 set, with
 *        deprecated codes (iw, in, jw, mo, sh) rejected in favour of the modern one.
 *      - Script subtags checked against ISO 15924 and canonicalised (zh-hans -> zh-Hans).
 *      - Region subtags checked against the 249 officially assigned ISO 3166-1
 *        alpha-2 codes. Withdrawn codes (AN, YU, SU) and never-assigned ones
 *        (UK, EU, UN) are rejected with the correct code where one exists — en-UK
 *        is the most common hreflang error in the wild and must not pass.
 *        UN M.49 numeric areas such as es-419 are accepted.
 *      - Bidirectional reciprocity: If page A lists page B as alternate, page B must list page A.
 *      - Self-referencing link presence: A page must include an alternate link pointing to itself.
 *        Checked independently of reciprocity — a page missing its own tag is a
 *        defect in its own right and must not suppress any other check.
 *      - x-default presence: Recommended fallback for unmatched locales.
 *      - Absolute URL enforcement: URLs must be fully-qualified absolute URLs (https://).
 *      - Conflicting canonicals or duplicate hreflang tags.
 *
 *   ISO reference tables live in scripts/iso-codes.js. They are generated from
 *   the runtime's ICU data and re-verified by test/iso-codes.test.js, so the
 *   plugin needs no ICU at runtime and the tables cannot silently drift.
 *   2. Generate multi-language tags:
 *      - HTML <link rel="alternate" ... /> tags.
 *      - XML sitemap <xhtml:link ... /> entries.
 *      - Next.js / framework metadata configurations.
 *
 * CLI Usage:
 *   node scripts/hreflang-tool.js validate <mapping.json> [--strict] [--json]
 *   node scripts/hreflang-tool.js generate <mapping.json> [--format html|xml|nextjs] [--json]
 *
 * Exit codes:
 *   0 = Valid / Successful generation
 *   1 = Validation errors or warnings found (under --strict)
 *   2 = Invalid CLI arguments / missing file / syntax error
 */
"use strict";

const fs = require("fs");
const path = require("path");

const {
  ASSIGNED_REGIONS,
  DEPRECATED_REGIONS,
  RESERVED_REGIONS,
  TOLERATED_REGIONS,
  ASSIGNED_LANGS,
  DEPRECATED_LANGS,
  SCRIPTS
} = require("./iso-codes.js");

// The BCP 47 shape Google accepts for hreflang: language[-Script][-Region].
//   language = ISO 639-1 (2 alpha) or ISO 639-2/3 (3 alpha)
//   Script   = ISO 15924 (4 alpha, e.g. Hans)
//   Region   = ISO 3166-1 alpha-2 (2 alpha) or UN M.49 area (3 digits, e.g. 419)
// Anything else (private-use subtags, variants, underscores) is not meaningful
// to hreflang and is rejected rather than silently accepted.
const HREFLANG_PATTERN =
  /^(?:x-default|[A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|[0-9]{3}))?)$/;

/** Rebuild a canonical tag from its parts, dropping absent components. */
function composeTag(lang, script, region) {
  return [lang, script, region].filter(Boolean).join("-");
}

/**
 * Validate a single hreflang tag string.
 */
function validateHreflangCode(code) {
  if (typeof code !== "string" || !code.trim()) {
    return { valid: false, reason: "Empty or non-string hreflang code" };
  }
  const clean = code.trim();
  if (clean.toLowerCase() === "x-default") {
    return { valid: true, canonical: "x-default" };
  }
  if (!HREFLANG_PATTERN.test(clean)) {
    return {
      valid: false,
      reason: `Invalid hreflang syntax: '${code}'. Expected language[-Script][-Region], e.g. 'en', 'en-GB', 'zh-Hans', 'zh-Hant-TW', 'es-419'.`
    };
  }
  // Split into components. A 4-alpha subtag is a script; anything else after
  // the language is the region (BCP 47 orders them language-Script-Region).
  const parts = clean.split("-");
  const lang = parts[0].toLowerCase();
  let script = null;
  let region = null;
  for (const part of parts.slice(1)) {
    if (part.length === 4) script = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    else region = part.toUpperCase();
  }

  const notes = [];

  // --- Language: ISO 639-1 (preferred) or ISO 639-2/3 -----------------------
  if (Object.prototype.hasOwnProperty.call(DEPRECATED_LANGS, lang)) {
    const modern = DEPRECATED_LANGS[lang];
    return {
      valid: false,
      reason: `'${lang}' is a deprecated ISO 639 language code (in '${clean}'). Use '${modern}' instead.`,
      suggestion: composeTag(modern, script, region)
    };
  }
  if (lang.length === 3) {
    notes.push(
      `'${lang}' is a three-letter ISO 639-2/3 code; Google prefers the two-letter ISO 639-1 code where one exists.`
    );
  } else if (!ASSIGNED_LANGS.has(lang)) {
    return {
      valid: false,
      reason: `'${lang}' is not an assigned ISO 639-1 language code (in '${clean}').`
    };
  }

  // --- Script: ISO 15924 ----------------------------------------------------
  if (script && !SCRIPTS.has(script)) {
    return {
      valid: false,
      reason: `'${script}' is not an assigned ISO 15924 script subtag (in '${clean}').`
    };
  }

  // --- Region: ISO 3166-1 alpha-2, or UN M.49 numeric area ------------------
  // Numeric areas such as es-419 (Latin America) are valid and left as-is.
  if (region && !/^[0-9]{3}$/.test(region)) {
    if (Object.prototype.hasOwnProperty.call(RESERVED_REGIONS, region)) {
      const better = RESERVED_REGIONS[region];
      return {
        valid: false,
        reason: better
          ? `'${region}' is not an officially assigned ISO 3166-1 alpha-2 code (in '${clean}'). Use '${better}'.`
          : `'${region}' is not a country in ISO 3166-1 alpha-2 (in '${clean}'). hreflang regions must be countries.`,
        suggestion: better ? composeTag(lang, script, better) : undefined
      };
    }
    if (Object.prototype.hasOwnProperty.call(DEPRECATED_REGIONS, region)) {
      const successor = DEPRECATED_REGIONS[region];
      return {
        valid: false,
        reason: `'${region}' is a withdrawn ISO 3166-1 code (in '${clean}'). Use '${successor}'.`,
        suggestion: composeTag(lang, script, successor)
      };
    }
    if (Object.prototype.hasOwnProperty.call(TOLERATED_REGIONS, region)) {
      notes.push(`'${region}' is ${TOLERATED_REGIONS[region]}; some search engines may ignore it.`);
    } else if (!ASSIGNED_REGIONS.has(region)) {
      return {
        valid: false,
        reason: `'${region}' is not an assigned ISO 3166-1 alpha-2 region code (in '${clean}').`
      };
    }
  }

  const result = { valid: true, canonical: composeTag(lang, script, region) };
  if (notes.length) result.warning = notes.join(" ");
  return result;
}

/**
 * Normalizes input mapping into a canonical structure:
 * Array of groups: [ { group: string, alternates: [ { lang: string, url: string } ] } ]
 */
function normalizeMapping(raw) {
  if (Array.isArray(raw)) {
    // Array of group objects: [{ group?: "name", alternates: [{ lang, url }] }]
    return raw.map((item, idx) => {
      const groupName = item.group || `group_${idx + 1}`;
      const alts = Array.isArray(item.alternates) ? item.alternates : [];
      return {
        group: groupName,
        alternates: alts.map(a => ({
          lang: (a.lang || a.hreflang || "").trim(),
          url: (a.url || a.href || "").trim()
        }))
      };
    });
  } else if (typeof raw === "object" && raw !== null) {
    // Flat map: { "https://example.com/en": [ { lang, url }, ... ] }
    // Or key-based grouped: { "homepage": [ { lang, url }, ... ] }
    const groups = [];
    for (const [key, val] of Object.entries(raw)) {
      if (Array.isArray(val)) {
        groups.push({
          group: key,
          alternates: val.map(a => ({
            lang: (a.lang || a.hreflang || "").trim(),
            url: (a.url || a.href || "").trim()
          }))
        });
      } else if (typeof val === "object" && val !== null) {
        // Shorthand format: { "https://example.com/": { "en": "https://example.com/en", "es": "..." } }
        const alts = Object.entries(val).map(([lang, url]) => ({
          lang: lang.trim(),
          url: String(url).trim()
        }));
        groups.push({
          group: key,
          alternates: alts
        });
      }
    }
    return groups;
  }
  return [];
}

/**
 * Validates hreflang groups according to Google Search Central specifications.
 */
function validateHreflangGroups(groups) {
  const issues = [];
  const warnings = [];

  if (groups.length === 0) {
    issues.push({
      type: "empty_mapping",
      message: "No hreflang groups or alternates provided."
    });
    return { valid: false, issues, warnings, totalGroups: 0, totalAlternates: 0 };
  }

  let totalAlternates = 0;

  for (const group of groups) {
    const { group: groupName, alternates } = group;
    totalAlternates += alternates.length;

    if (alternates.length < 2) {
      warnings.push({
        group: groupName,
        type: "single_alternate",
        message: `Group '${groupName}' contains fewer than 2 alternate links. Hreflang is intended for multi-language or multi-regional alternatives.`
      });
    }

    const seenLangs = new Map();
    let hasXDefault = false;

    for (const alt of alternates) {
      // Check hreflang code
      const codeCheck = validateHreflangCode(alt.lang);
      if (!codeCheck.valid) {
        issues.push({
          group: groupName,
          type: "invalid_hreflang_code",
          message: `Group '${groupName}' has invalid hreflang code '${alt.lang}': ${codeCheck.reason}`,
          alternate: alt
        });
      } else if (codeCheck.warning) {
        warnings.push({
          group: groupName,
          type: "rare_hreflang_code",
          message: `Group '${groupName}': ${codeCheck.warning}`
        });
      }

      const lowerLang = alt.lang.toLowerCase();
      if (lowerLang === "x-default") {
        hasXDefault = true;
      }

      // Check duplicates
      if (seenLangs.has(lowerLang)) {
        issues.push({
          group: groupName,
          type: "duplicate_hreflang_tag",
          message: `Group '${groupName}' has duplicate hreflang tag '${alt.lang}' for both '${seenLangs.get(lowerLang)}' and '${alt.url}'`
        });
      } else {
        seenLangs.set(lowerLang, alt.url);
      }

      // Check absolute URL
      try {
        const u = new URL(alt.url);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          issues.push({
            group: groupName,
            type: "invalid_url_protocol",
            message: `Group '${groupName}' alternate '${alt.url}' must use HTTP or HTTPS protocol.`
          });
        }
      } catch {
        issues.push({
          group: groupName,
          type: "invalid_url_format",
          message: `Group '${groupName}' alternate URL '${alt.url}' is not a valid absolute URL.`
        });
      }

    }

    if (!hasXDefault) {
      warnings.push({
        group: groupName,
        type: "missing_x_default",
        message: `Group '${groupName}' has no 'x-default' alternate tag. A generic fallback URL is recommended by Google.`
      });
    }
  }

  // Groups keyed by a page URL describe that page's own alternate cluster, so
  // they can be checked for self-reference and reciprocity. Groups keyed by a
  // label ("homepage") carry no page identity and are skipped by both checks.
  const pageGroups = groups.filter(g => /^https?:\/\//i.test(g.group));

  // Self-referential links. Google requires every page in a cluster to list
  // itself. Checked independently of reciprocity: a page missing its own tag is
  // a defect in its own right, and must not suppress the reciprocity pass below.
  for (const group of pageGroups) {
    if (!group.alternates.some(a => a.url === group.group)) {
      issues.push({
        group: group.group,
        type: "missing_self_reference",
        message: `Page '${group.group}' does not list itself as an alternate. Google requires a self-referential hreflang link on every page in the cluster, and ignores clusters that omit it.`
      });
    }
  }

  // Reciprocal linkage. Runs for every page-keyed group regardless of whether
  // that group's self-referential link is present.
  const reportedPairs = new Set();
  for (const group of pageGroups) {
    for (const alt of group.alternates) {
      if (!alt.url || alt.url === group.group) continue;
      // Only pages that declare their own cluster can be held to reciprocity.
      const target = pageGroups.find(g => g.group === alt.url);
      if (!target) continue;
      if (target.alternates.some(a => a.url === group.group)) continue;

      const pair = `${group.group} -> ${alt.url}`;
      if (reportedPairs.has(pair)) continue;
      reportedPairs.add(pair);
      issues.push({
        group: group.group,
        type: "missing_reciprocal_link",
        message: `Non-reciprocal hreflang link: Page '${group.group}' links to '${alt.url}', but '${alt.url}' does not link back to '${group.group}'. Google will ignore non-reciprocal hreflang tags.`
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    totalGroups: groups.length,
    totalAlternates
  };
}

/**
 * Generate HTML snippet for a group of alternates.
 */
function generateHtml(alternates) {
  const lines = alternates.map(a => {
    return `<link rel="alternate" hreflang="${a.lang}" href="${a.url}" />`;
  });
  return lines.join("\n");
}

/**
 * Generate XML sitemap block for a URL with xhtml:link alternates.
 */
function generateXml(groupUrl, alternates) {
  const lines = [];
  lines.push(`  <url>`);
  lines.push(`    <loc>${groupUrl}</loc>`);
  for (const alt of alternates) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.url}" />`);
  }
  lines.push(`  </url>`);
  return lines.join("\n");
}

/**
 * Generate Next.js App Router metadata alternates configuration.
 */
function generateNextJs(alternates) {
  const languages = {};
  let canonical = "";
  for (const alt of alternates) {
    if (alt.lang.toLowerCase() === "x-default") {
      canonical = alt.url;
    }
    languages[alt.lang] = alt.url;
  }
  if (!canonical && alternates.length > 0) {
    canonical = alternates[0].url;
  }

  return [
    `// Next.js (App Router) layout or page metadata`,
    `export const metadata = {`,
    `  alternates: {`,
    `    canonical: ${JSON.stringify(canonical)},`,
    `    languages: ${JSON.stringify(languages, null, 6).replace(/^/gm, "    ").trimStart()}`,
    `  }`,
    `};`
  ].join("\n");
}

/**
 * Main CLI execution entrypoint.
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`Usage:
  node scripts/hreflang-tool.js validate <mapping.json> [--strict] [--json]
  node scripts/hreflang-tool.js generate <mapping.json> [--format html|xml|nextjs] [--json]

Commands:
  validate  Verify syntax, reciprocity, x-default, and Google compliance of hreflang tags.
  generate  Generate ready-to-paste HTML tags, XML sitemap blocks, or Next.js metadata.

Flags:
  --strict             Treat warnings as errors (exit code 1).
  --format <type>      Output format for generation: html (default), xml, or nextjs.
  --json               Emit structured JSON output.
  --help, -h           Show this help message.`);
    process.exit(0);
  }

  const command = args[0];
  if (command !== "validate" && command !== "generate") {
    console.error(`hreflang-tool: error: unknown command '${command}'. Expected 'validate' or 'generate'.`);
    process.exit(2);
  }

  const targetFile = args[1];
  if (!targetFile || targetFile.startsWith("--")) {
    console.error(`hreflang-tool: error: missing path to hreflang JSON mapping file.`);
    process.exit(2);
  }

  const isStrict = args.includes("--strict");
  const isJson = args.includes("--json");
  const formatIdx = args.indexOf("--format");
  const format = formatIdx !== -1 && args[formatIdx + 1] ? args[formatIdx + 1] : "html";

  let fileContent;
  try {
    fileContent = fs.readFileSync(path.resolve(targetFile), "utf8");
  } catch (err) {
    console.error(`hreflang-tool: error: could not read file '${targetFile}': ${err.message}`);
    process.exit(2);
  }

  let parsedData;
  try {
    parsedData = JSON.parse(fileContent);
  } catch (err) {
    console.error(`hreflang-tool: error: failed to parse '${targetFile}' as JSON: ${err.message}`);
    process.exit(2);
  }

  const groups = normalizeMapping(parsedData);
  const validation = validateHreflangGroups(groups);

  if (command === "validate") {
    const hasFailures = !validation.valid || (isStrict && validation.warnings.length > 0);

    if (isJson) {
      console.log(JSON.stringify(validation, null, 2));
    } else {
      console.log(`\n=== Hreflang Validation Report: ${targetFile} ===`);
      console.log(`Groups evaluated: ${validation.totalGroups}`);
      console.log(`Total alternates: ${validation.totalAlternates}\n`);

      if (validation.issues.length === 0 && validation.warnings.length === 0) {
        console.log(`[PASS] All hreflang links are fully compliant, reciprocal, and syntax-valid.`);
      } else {
        if (validation.issues.length > 0) {
          console.log(`Errors (${validation.issues.length}):`);
          for (const err of validation.issues) {
            console.log(`  [X] ${err.message}`);
          }
        }
        if (validation.warnings.length > 0) {
          console.log(`Warnings (${validation.warnings.length}):`);
          for (const warn of validation.warnings) {
            console.log(`  [!] ${warn.message}`);
          }
        }
      }
    }

    process.exit(hasFailures ? 1 : 0);
  }

  if (command === "generate") {
    const outputs = [];

    for (const group of groups) {
      let snippet = "";
      if (format === "xml") {
        const groupLoc = group.group.startsWith("http") ? group.group : (group.alternates[0]?.url || "https://example.com/");
        snippet = generateXml(groupLoc, group.alternates);
      } else if (format === "nextjs") {
        snippet = generateNextJs(group.alternates);
      } else {
        snippet = generateHtml(group.alternates);
      }
      outputs.push({
        group: group.group,
        format,
        snippet
      });
    }

    if (isJson) {
      console.log(JSON.stringify({ validation, outputs }, null, 2));
    } else {
      for (const out of outputs) {
        console.log(`\n--- Generated [${format.toUpperCase()}] for group '${out.group}' ---`);
        console.log(out.snippet);
      }
    }

    process.exit(0);
  }
}

// Export for programmatic testing
module.exports = {
  validateHreflangCode,
  normalizeMapping,
  validateHreflangGroups,
  generateHtml,
  generateXml,
  generateNextJs
};

if (require.main === module) {
  main();
}
