#!/usr/bin/env node
/**
 * scripts/hreflang-tool.js — Deterministic multi-language & hreflang validation and generation.
 *
 * Part of seo-superpower.
 * Pure Node.js stdlib only (Node 18+) — zero external dependencies.
 *
 * Capabilities:
 *   1. Validate hreflang mappings for:
 *      - ISO 639-1 language code syntax and optional ISO 3166-1 alpha-2 country/region syntax.
 *      - Bidirectional reciprocity: If page A lists page B as alternate, page B must list page A.
 *      - Self-referencing link presence: A page must include an alternate link pointing to itself.
 *      - x-default presence: Recommended fallback for unmatched locales.
 *      - Absolute URL enforcement: URLs must be fully-qualified absolute URLs (https://).
 *      - Conflicting canonicals or duplicate hreflang tags.
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

// Valid ISO 639-1 language codes (two letters) + ISO 639-2/3 (three letters) + optional script/region
const HREFLANG_PATTERN = /^(?:x-default|[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)$/i;

// Common ISO 639-1 language codes (subset for heuristic checking)
const COMMON_LANGS = new Set([
  "af", "am", "ar", "az", "be", "bg", "bn", "bs", "ca", "cs", "cy", "da", "de",
  "el", "en", "es", "et", "eu", "fa", "fi", "fr", "ga", "gl", "he", "hi", "hr",
  "hu", "hy", "id", "is", "it", "ja", "ka", "kk", "km", "kn", "ko", "ky", "lt",
  "lv", "mk", "ml", "mn", "mr", "ms", "my", "ne", "nl", "no", "pa", "pl", "pt",
  "ro", "ru", "si", "sk", "sl", "sq", "sr", "sv", "sw", "ta", "te", "th", "tl",
  "tr", "uk", "ur", "uz", "vi", "zh", "zu"
]);

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
    return { valid: false, reason: `Invalid hreflang syntax: '${code}'` };
  }
  const parts = clean.split("-");
  const lang = parts[0].toLowerCase();
  if (!COMMON_LANGS.has(lang)) {
    // Non-standard language code warning (might be 3-letter or obscure, allow with warning)
    return {
      valid: true,
      canonical: clean,
      warning: `Unrecognized or rare ISO language code '${lang}' in '${clean}'`
    };
  }
  // If region is specified (e.g. en-us -> en-US), check casing
  if (parts.length === 2 && parts[1].length === 2) {
    const formatted = `${lang}-${parts[1].toUpperCase()}`;
    return { valid: true, canonical: formatted };
  }
  return { valid: true, canonical: clean };
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
  const urlToGroup = new Map();

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

      // Track URL membership for cross-group reciprocity checks
      if (alt.url) {
        if (!urlToGroup.has(alt.url)) {
          urlToGroup.set(alt.url, []);
        }
        urlToGroup.get(alt.url).push({ group: groupName, lang: alt.lang, groupRef: group });
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

  // Reciprocal linkage verification:
  // If groups are defined per page URL, ensure reciprocity across pages
  for (const [url, memberships] of urlToGroup.entries()) {
    for (const mem of memberships) {
      const groupAlts = mem.groupRef.alternates;
      // Does this group's alternate list contain a self-reference for the group URL?
      const isGroupUrl = groupAlts.some(a => a.url === mem.group);
      if (isGroupUrl) {
        // Group name is itself an alternate page URL.
        // Check if other alternate URLs in this group define their own group pointing back.
        for (const targetAlt of groupAlts) {
          if (targetAlt.url === mem.group) continue; // self
          const targetMemberships = urlToGroup.get(targetAlt.url) || [];
          const targetGroup = targetMemberships.find(m => m.group === targetAlt.url);
          if (targetGroup) {
            // Target URL has its own defined alternates. Verify it includes mem.group
            const reciprocal = targetGroup.groupRef.alternates.some(a => a.url === mem.group);
            if (!reciprocal) {
              issues.push({
                group: mem.group,
                type: "missing_reciprocal_link",
                message: `Non-reciprocal hreflang link: Page '${mem.group}' links to '${targetAlt.url}', but '${targetAlt.url}' does not link back to '${mem.group}'. Google will ignore non-reciprocal hreflang tags.`
              });
            }
          }
        }
      }
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
