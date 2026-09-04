#!/usr/bin/env node
"use strict";

/**
 * scripts/schema-check.js — fast offline JSON-LD schema validator for Node.js.
 *
 * Zero dependencies, pure Node.js stdlib (Node 18+).
 * Validates JSON-LD syntax, schema.org context, @type casing against schema.org vocabulary,
 * and Google Rich Result required & recommended fields:
 * Article, BlogPosting, Product, FAQPage, BreadcrumbList, Organization, HowTo, Recipe, Event, JobPosting, WebSite.
 *
 * Usage:
 *   node scripts/schema-check.js --file <path>
 *   node scripts/schema-check.js --json '<json_string>'
 *   node scripts/schema-check.js --url <url>
 *   node scripts/schema-check.js <file_or_url_or_json>
 *   cat file.json | node scripts/schema-check.js
 *
 * Exit codes:
 *   0 — Valid schema, 0 errors, 0 warnings (clean / rich-result ready)
 *   1 — Valid schema syntax and required fields, but has warnings (missing recommended fields)
 *   2 — Errors: invalid JSON syntax, missing @context, mis-cased @type, missing required fields, or bad input
 */

const fs = require("node:fs");
const path = require("node:path");

const CANONICAL_TYPES = {
  article: "Article",
  blogposting: "BlogPosting",
  newsarticle: "NewsArticle",
  website: "WebSite",
  webpage: "WebPage",
  aboutpage: "AboutPage",
  contactpage: "ContactPage",
  itempage: "ItemPage",
  collectionpage: "CollectionPage",
  profilepage: "ProfilePage",
  organization: "Organization",
  localbusiness: "LocalBusiness",
  corporation: "Corporation",
  product: "Product",
  offer: "Offer",
  aggregaterating: "AggregateRating",
  review: "Review",
  rating: "Rating",
  faqpage: "FAQPage",
  question: "Question",
  answer: "Answer",
  breadcrumblist: "BreadcrumbList",
  listitem: "ListItem",
  itemlist: "ItemList",
  howto: "HowTo",
  howtostep: "HowToStep",
  howtosection: "HowToSection",
  recipe: "Recipe",
  event: "Event",
  jobposting: "JobPosting",
  person: "Person",
  touristtrip: "TouristTrip",
  searchaction: "SearchAction",
  postaladdress: "PostalAddress",
  imageobject: "ImageObject",
  videoobject: "VideoObject",
  softwareapplication: "SoftwareApplication",
};

const VALID_CONTEXT_PREFIXES = [
  "https://schema.org",
  "http://schema.org",
  "https://schema.org/",
  "http://schema.org/",
];

const SCRIPT_LD_JSON_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function extractJsonLdBlocks(text) {
  if (typeof text !== "string") return [];
  const blocks = [];
  let match;
  while ((match = SCRIPT_LD_JSON_RE.exec(text)) !== null) {
    const content = match[1].trim();
    if (content) blocks.push(content);
  }
  if (blocks.length > 0) return blocks;

  const stripped = text.trim();
  if (stripped.startsWith("{") || stripped.startsWith("[")) {
    return [stripped];
  }
  return [];
}

function validateTypeCasing(givenType, currentPath, errors) {
  const lower = String(givenType).toLowerCase();
  if (CANONICAL_TYPES[lower]) {
    const canonical = CANONICAL_TYPES[lower];
    if (givenType !== canonical) {
      errors.push(
        `${currentPath}: @type '${givenType}' has incorrect casing. Schema.org specifies '${canonical}'.`,
      );
    }
    return canonical;
  }
  return givenType;
}

function checkRequiredAndRecommended(entity, canonicalType, currentPath, errors, warnings) {
  function req(field, desc = "") {
    const val = entity[field];
    if (val === undefined || val === null || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
      const msg = `${currentPath} (${canonicalType}): missing required field '${field}'${desc ? ` (${desc})` : ""}`;
      errors.push(msg);
      return false;
    }
    return true;
  }

  function rec(field, desc = "") {
    const val = entity[field];
    if (val === undefined || val === null || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
      const msg = `${currentPath} (${canonicalType}): missing recommended field '${field}'${desc ? ` (${desc})` : ""}`;
      warnings.push(msg);
      return false;
    }
    return true;
  }

  if (canonicalType === "Article" || canonicalType === "BlogPosting" || canonicalType === "NewsArticle") {
    req("headline");
    rec("author");
    rec("datePublished");
    rec("dateModified");
    rec("image");
    rec("publisher");
  } else if (canonicalType === "Product") {
    req("name");
    const hasOffer = Boolean(entity.offers);
    const hasRating = Boolean(entity.aggregateRating);
    const hasReview = Boolean(entity.review);
    if (!hasOffer && !hasRating && !hasReview) {
      errors.push(
        `${currentPath} (${canonicalType}): requires at least one of 'offers', 'aggregateRating', or 'review' for Google rich results`,
      );
    }
    rec("image");
    rec("description");
    rec("brand");
  } else if (canonicalType === "FAQPage") {
    const mainEntity = entity.mainEntity;
    if (!Array.isArray(mainEntity) || mainEntity.length === 0) {
      errors.push(
        `${currentPath} (${canonicalType}): missing required field 'mainEntity' (must be a non-empty array of Question)`,
      );
    } else {
      mainEntity.forEach((q, idx) => {
        const qPath = `${currentPath}.mainEntity[${idx}]`;
        if (typeof q !== "object" || q === null) {
          errors.push(`${qPath}: Question must be an object`);
          return;
        }
        const qType = q["@type"] || "Question";
        validateTypeCasing(qType, qPath, errors);
        if (!q.name) errors.push(`${qPath}: missing required field 'name' (question text)`);
        const ans = q.acceptedAnswer;
        if (!ans || typeof ans !== "object") {
          errors.push(`${qPath}: missing required field 'acceptedAnswer' (Answer object)`);
        } else {
          const ansType = ans["@type"] || "Answer";
          validateTypeCasing(ansType, `${qPath}.acceptedAnswer`, errors);
          if (!ans.text) errors.push(`${qPath}.acceptedAnswer: missing required field 'text' (answer body)`);
        }
      });
    }
  } else if (canonicalType === "BreadcrumbList") {
    const items = entity.itemListElement;
    if (!Array.isArray(items) || items.length === 0) {
      errors.push(
        `${currentPath} (${canonicalType}): missing required field 'itemListElement' (must be a non-empty array of ListItem)`,
      );
    } else {
      items.forEach((item, idx) => {
        const itemPath = `${currentPath}.itemListElement[${idx}]`;
        if (typeof item !== "object" || item === null) {
          errors.push(`${itemPath}: ListItem must be an object`);
          return;
        }
        const itemType = item["@type"] || "ListItem";
        validateTypeCasing(itemType, itemPath, errors);
        if (item.position === undefined || item.position === null) {
          errors.push(`${itemPath}: missing required field 'position'`);
        }
        if (!item.name && !item.item) {
          errors.push(`${itemPath}: requires 'name' or 'item'`);
        }
      });
    }
  } else if (canonicalType === "Organization" || canonicalType === "LocalBusiness" || canonicalType === "Corporation") {
    if (!entity.name && !entity.legalName) {
      errors.push(`${currentPath} (${canonicalType}): missing required field 'name' or 'legalName'`);
    }
    rec("url");
    rec("logo");
    rec("sameAs");
    if (canonicalType === "LocalBusiness") {
      req("address");
      rec("telephone");
    }
  } else if (canonicalType === "HowTo") {
    req("name");
    if (!entity.step && !entity.itemListElement) {
      errors.push(`${currentPath} (${canonicalType}): requires 'step' or 'itemListElement'`);
    }
    rec("image");
    rec("totalTime");
    rec("description");
  } else if (canonicalType === "Recipe") {
    req("name");
    req("image");
    rec("author");
    rec("datePublished");
    rec("description");
    rec("recipeIngredient");
    rec("recipeInstructions");
  } else if (canonicalType === "Event") {
    req("name");
    req("startDate");
    req("location");
    rec("endDate");
    rec("description");
    rec("offers");
    rec("image");
  } else if (canonicalType === "JobPosting") {
    req("title");
    req("description");
    req("datePosted");
    rec("hiringOrganization");
    rec("jobLocation");
  } else if (canonicalType === "WebSite") {
    if (!entity.name && !entity.url) {
      errors.push(`${currentPath} (${canonicalType}): requires 'name' or 'url'`);
    }
    rec("url");
    rec("potentialAction");
  }
}

function validateEntity(node, currentPath, inheritedContext, errors, warnings, typesFound) {
  if (typeof node !== "object" || node === null) {
    errors.push(`${currentPath}: expected JSON-LD entity to be an object`);
    return { type: "Unknown", valid: false };
  }

  // Context check
  const rawContext = node["@context"] || inheritedContext;
  if (!rawContext) {
    errors.push(`${currentPath}: missing '@context'. Must be 'https://schema.org'.`);
  } else if (typeof rawContext === "string") {
    if (!VALID_CONTEXT_PREFIXES.some((p) => rawContext === p || rawContext.startsWith(p))) {
      errors.push(`${currentPath}: invalid '@context' '${rawContext}'. Must be 'https://schema.org'.`);
    }
  } else if (Array.isArray(rawContext)) {
    if (!rawContext.some((c) => typeof c === "string" && VALID_CONTEXT_PREFIXES.some((p) => c.startsWith(p)))) {
      errors.push(`${currentPath}: '@context' array must include 'https://schema.org'.`);
    }
  }

  // @graph check
  if (node["@graph"] !== undefined) {
    const graph = node["@graph"];
    if (!Array.isArray(graph)) {
      errors.push(`${currentPath}: '@graph' must be an array.`);
      return { type: "@graph", valid: false };
    }
    const contextForGraph = node["@context"] || inheritedContext;
    graph.forEach((item, i) => {
      validateEntity(item, `${currentPath}.@graph[${i}]`, contextForGraph, errors, warnings, typesFound);
    });
    return { type: "@graph", valid: errors.length === 0 };
  }

  // @type check
  const rawType = node["@type"];
  if (!rawType) {
    errors.push(`${currentPath}: missing required field '@type'.`);
    return { type: "Unknown", valid: false };
  }

  const currentTypes = [];
  if (typeof rawType === "string") {
    const canonical = validateTypeCasing(rawType, currentPath, errors);
    currentTypes.push(canonical);
  } else if (Array.isArray(rawType)) {
    rawType.forEach((t, idx) => {
      if (typeof t === "string") {
        const canonical = validateTypeCasing(t, `${currentPath}.@type[${idx}]`, errors);
        currentTypes.push(canonical);
      } else {
        errors.push(`${currentPath}.@type[${idx}]: @type item must be a string.`);
      }
    });
  } else {
    errors.push(`${currentPath}: @type must be a string or array of strings.`);
  }

  currentTypes.forEach((ct) => {
    if (!typesFound.includes(ct)) typesFound.push(ct);
    checkRequiredAndRecommended(node, ct, currentPath, errors, warnings);
  });

  return {
    type: currentTypes[0] || "Unknown",
    types: currentTypes,
    valid: errors.length === 0,
  };
}

function validateJsonLd(rawText) {
  const blocks = extractJsonLdBlocks(rawText);
  if (blocks.length === 0) {
    return {
      valid: false,
      errors: ["No JSON-LD found in input (expected valid JSON or <script type='application/ld+json'>)"],
      warnings: [],
      types: [],
      details: { totalBlocks: 0, entities: [] },
    };
  }

  const errors = [];
  const warnings = [];
  const typesFound = [];
  const entitiesDetails = [];

  blocks.forEach((blockStr, blockIdx) => {
    const blockPath = blocks.length > 1 ? `block[${blockIdx}]` : "root";
    let parsed;
    try {
      parsed = JSON.parse(blockStr);
    } catch (e) {
      errors.push(`${blockPath}: JSON syntax error: ${e.message}`);
      return;
    }

    if (Array.isArray(parsed)) {
      parsed.forEach((item, i) => {
        const det = validateEntity(item, `${blockPath}[${i}]`, null, errors, warnings, typesFound);
        entitiesDetails.push(det);
      });
    } else if (typeof parsed === "object" && parsed !== null) {
      const det = validateEntity(parsed, blockPath, null, errors, warnings, typesFound);
      entitiesDetails.push(det);
    } else {
      errors.push(`${blockPath}: top-level JSON-LD must be an object or array`);
    }
  });

  const isValid = errors.length === 0;
  return {
    valid: isValid,
    errors,
    warnings,
    types: typesFound,
    details: {
      totalBlocks: blocks.length,
      totalEntities: entitiesDetails.length,
      entities: entitiesDetails,
    },
  };
}

async function fetchUrl(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "seo-superpower-schema-check/1.0 (+https://github.com/benskamps/seo-superpower)" },
    });
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function renderHuman(result) {
  const lines = [];
  const status = result.valid && result.warnings.length === 0
    ? "CLEAN (0 errors, 0 warnings)"
    : (result.valid ? "WARNINGS" : "ERRORS FOUND");
  lines.push(`Schema Validation Result: ${status}`);
  lines.push(`Schema Types Detected: ${result.types.length ? result.types.join(", ") : "none detected"}`);
  lines.push("");

  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    result.errors.forEach((err) => lines.push(`  ❌ ${err}`));
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    result.warnings.forEach((warn) => lines.push(`  ⚠️  ${warn}`));
    lines.push("");
  }

  if (result.valid && result.warnings.length === 0) {
    lines.push("✅ All required and recommended schema fields present and valid.");
  } else if (result.valid) {
    lines.push("✅ Valid JSON-LD syntax and required fields present (rich-result eligible).");
  } else {
    lines.push("❌ Invalid schema markup. Please resolve errors before shipping.");
  }

  return lines.join("\n");
}

async function main(argv = process.argv) {
  const args = argv.slice(2);
  let rawContent = "";
  let asText = args.includes("--text");

  const fileIdx = args.indexOf("--file") !== -1 ? args.indexOf("--file") : args.indexOf("-f");
  const jsonIdx = args.indexOf("--json") !== -1 ? args.indexOf("--json") : args.indexOf("-j");
  const urlIdx = args.indexOf("--url") !== -1 ? args.indexOf("--url") : args.indexOf("-u");

  if (fileIdx !== -1) {
    const val = args[fileIdx + 1];
    if (!val || val.startsWith("-")) {
      process.stderr.write("schema-check: error: --file requires a file path\n");
      return 2;
    }
    const filePath = val;
    if (!fs.existsSync(filePath)) {
      process.stdout.write(JSON.stringify({ valid: false, errors: [`File not found: ${filePath}`], warnings: [], types: [] }, null, 2) + "\n");
      return 2;
    }
    rawContent = fs.readFileSync(filePath, "utf8");
  } else if (jsonIdx !== -1) {
    const val = args[jsonIdx + 1];
    if (!val || val.startsWith("-")) {
      process.stderr.write("schema-check: error: --json requires a JSON string\n");
      return 2;
    }
    rawContent = val;
  } else if (urlIdx !== -1) {
    const val = args[urlIdx + 1];
    if (!val || val.startsWith("-")) {
      process.stderr.write("schema-check: error: --url requires a URL\n");
      return 2;
    }
    try {
      rawContent = await fetchUrl(val);
    } catch (e) {
      process.stdout.write(JSON.stringify({ valid: false, errors: [`Could not fetch URL ${val}: ${e.message}`], warnings: [], types: [] }, null, 2) + "\n");
      return 2;
    }
  } else {
    const positional = args.find((a) => !a.startsWith("-"));
    if (positional) {
      if (positional.startsWith("http://") || positional.startsWith("https://")) {
        try {
          rawContent = await fetchUrl(positional);
        } catch (e) {
          process.stdout.write(JSON.stringify({ valid: false, errors: [`Could not fetch URL ${positional}: ${e.message}`], warnings: [], types: [] }, null, 2) + "\n");
          return 2;
        }
      } else if (fs.existsSync(positional) && fs.statSync(positional).isFile()) {
        rawContent = fs.readFileSync(positional, "utf8");
      } else if (positional.trim().startsWith("{") || positional.trim().startsWith("[") || positional.trim().startsWith("<")) {
        rawContent = positional;
      } else {
        process.stdout.write(JSON.stringify({ valid: false, errors: [`Invalid target: ${positional}`], warnings: [], types: [] }, null, 2) + "\n");
        return 2;
      }
    } else {
      // Stdin check
      if (!process.stdin.isTTY) {
        rawContent = fs.readFileSync(0, "utf8");
      } else {
        process.stderr.write("usage: node scripts/schema-check.js [--file <path>] [--json '<json>'] [--url <url>]\n");
        return 2;
      }
    }
  }

  if (!rawContent.trim()) {
    process.stdout.write(JSON.stringify({ valid: false, errors: ["Empty input content."], warnings: [], types: [] }, null, 2) + "\n");
    return 2;
  }

  const result = validateJsonLd(rawContent);

  if (asText || args.includes("--format") && args[args.indexOf("--format") + 1] === "text") {
    process.stdout.write(renderHuman(result) + "\n");
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }

  if (!result.valid) return 2;
  if (result.warnings.length > 0) return 1;
  return 0;
}

if (require.main === module) {
  main().then((code) => process.exit(code));
}

module.exports = {
  CANONICAL_TYPES,
  VALID_CONTEXT_PREFIXES,
  extractJsonLdBlocks,
  validateTypeCasing,
  checkRequiredAndRecommended,
  validateEntity,
  validateJsonLd,
  renderHuman,
  main,
};
