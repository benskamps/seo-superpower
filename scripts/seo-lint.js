#!/usr/bin/env node
"use strict";

/**
 * scripts/seo-lint.js — SEO asset integrity and placeholder linter.
 *
 * Scans directories or files for dangerous SEO regressions before commit or deployment:
 *   1. Unreplaced placeholder tokens (REPLACE-WITH-[A-Z0-9_-]+).
 *   2. Accidental noindex tags in production templates (outside 404/staging/admin).
 *   3. Relative URLs in sitemaps (<loc>) or canonical links (<link rel="canonical">).
 *   4. Schema.org casing typos in JSON-LD blocks (e.g. "Website" -> "WebSite").
 *
 * Usage:
 *   node scripts/seo-lint.js [directory_or_file] [--json]
 *
 * Exit codes:
 *   0 — Clean: 0 issues found.
 *   1 — Issues found (placeholders, accidental noindex, relative URLs, or bad schema).
 *   2 — Runtime error (missing path or unreadable file).
 *
 * Stdlib only — no dependencies.
 */

const fs = require("node:fs");
const path = require("node:path");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".agents",
  "dist",
  "build",
  ".next",
  ".astro",
  ".svelte-kit",
  ".cache",
  "coverage",
]);

const SCANNABLE_EXTS = new Set([
  ".html",
  ".htm",
  ".xml",
  ".txt",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".astro",
  ".svelte",
  ".vue",
  ".json",
  ".md",
  ".mdx",
]);

const CANONICAL_SCHEMA_TYPES = {
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

const PLACEHOLDER_RE = /\b(REPLACE-WITH-[A-Z0-9_-]+)\b/g;

function isTestOrDocFile(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  return (
    /(^|\/)(test|tests|fixtures)\//i.test(norm) ||
    /\.(test|spec)\.[a-z0-9]+$/i.test(norm) ||
    norm.endsWith("seo-lint.js") ||
    norm.endsWith("detect-framework.js")
  );
}

function lintContent(filePath, content) {
  const issues = [];
  const lines = content.split(/\r?\n/);
  const isTest = isTestOrDocFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath).toLowerCase();

  // 1. Placeholder token check
  if (!isTest) {
    lines.forEach((lineText, lineIdx) => {
      let m;
      PLACEHOLDER_RE.lastIndex = 0;
      while ((m = PLACEHOLDER_RE.exec(lineText)) !== null) {
        issues.push({
          file: filePath,
          line: lineIdx + 1,
          col: m.index + 1,
          rule: "no-placeholder-tokens",
          token: m[1],
          message: `Unreplaced placeholder token '${m[1]}' must be resolved before deployment.`,
        });
      }
    });
  }

  // 2. Accidental noindex check
  const isTemplate = [".html", ".htm", ".jsx", ".tsx", ".astro", ".svelte", ".vue"].includes(ext);
  const normPath = filePath.replace(/\\/g, "/").toLowerCase();
  const isIgnoredNoindexFile =
    baseName.startsWith("404") ||
    baseName.includes("not-found") ||
    baseName.includes("admin") ||
    baseName.includes("staging") ||
    normPath.includes("/admin/") ||
    normPath.includes("/staging/") ||
    isTest;

  if (isTemplate && !isIgnoredNoindexFile) {
    lines.forEach((lineText, lineIdx) => {
      // HTML meta tag noindex
      const metaMatch =
        /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*noindex[^"']*)["']/i.exec(lineText) ||
        /<meta[^>]+content=["']([^"']*noindex[^"']*)["'][^>]*name=["']robots["']/i.exec(lineText);
      if (metaMatch) {
        issues.push({
          file: filePath,
          line: lineIdx + 1,
          col: metaMatch.index + 1,
          rule: "no-accidental-noindex",
          message: `Accidental 'noindex' directive found in production template.`,
        });
      }

      // Next.js metadata robots { index: false }
      const nextMatch = /robots:\s*\{\s*index:\s*false/i.exec(lineText);
      if (nextMatch) {
        issues.push({
          file: filePath,
          line: lineIdx + 1,
          col: nextMatch.index + 1,
          rule: "no-accidental-noindex",
          message: `Next.js metadata sets 'index: false' in production template.`,
        });
      }
    });
  }

  // 3. Relative URLs in sitemap.xml
  const isSitemap = baseName.includes("sitemap") || content.includes("<urlset");
  if (isSitemap && !isTest) {
    lines.forEach((lineText, lineIdx) => {
      const locMatch = /<loc>\s*([^<]+)\s*<\/loc>/gi.exec(lineText);
      if (locMatch) {
        const url = locMatch[1].trim();
        if (!/^https?:\/\//i.test(url) && !url.includes("REPLACE-WITH-")) {
          issues.push({
            file: filePath,
            line: lineIdx + 1,
            col: locMatch.index + 1,
            rule: "no-relative-sitemap-urls",
            url,
            message: `Relative URL '${url}' in sitemap <loc> tag (must be absolute HTTPS URL).`,
          });
        }
      }
    });
  }

  // 4. Relative URLs in <link rel="canonical">
  if (isTemplate && !isTest) {
    lines.forEach((lineText, lineIdx) => {
      const canonMatch =
        /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i.exec(lineText) ||
        /<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i.exec(lineText);
      if (canonMatch) {
        const href = canonMatch[1].trim();
        const isDynamic = href.startsWith("{") || href.startsWith("$") || href.startsWith("<%") || href.startsWith("[");
        if (!isDynamic && !href.startsWith("http://") && !href.startsWith("https://")) {
          issues.push({
            file: filePath,
            line: lineIdx + 1,
            col: canonMatch.index + 1,
            rule: "no-relative-canonicals",
            href,
            message: `Relative or empty canonical URL '${href}' (canonical tags must be absolute URLs).`,
          });
        }
      }
    });
  }

  // 5. Schema casing check
  if (!isTest && (isTemplate || ext === ".json" || ext === ".js" || ext === ".ts")) {
    const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    const blocks = [];
    while ((scriptMatch = ldRe.exec(content)) !== null) {
      blocks.push({ text: scriptMatch[1], offset: scriptMatch.index });
    }
    if (ext === ".json" && (content.includes("@context") || content.includes("@type"))) {
      blocks.push({ text: content, offset: 0 });
    }

    blocks.forEach((b) => {
      // Regex search for "@type": "..."
      const typeRe = /"@type"\s*:\s*"([A-Za-z0-9_-]+)"/g;
      let tm;
      while ((tm = typeRe.exec(b.text)) !== null) {
        const given = tm[1];
        const lower = given.toLowerCase();
        if (CANONICAL_SCHEMA_TYPES[lower] && CANONICAL_SCHEMA_TYPES[lower] !== given) {
          const canonical = CANONICAL_SCHEMA_TYPES[lower];
          // Find line number
          const preText = content.slice(0, b.offset + tm.index);
          const lineNum = preText.split(/\r?\n/).length;
          issues.push({
            file: filePath,
            line: lineNum,
            col: 1,
            rule: "schema-casing",
            message: `@type '${given}' has incorrect casing. Schema.org specifies '${canonical}'.`,
          });
        }
      }
    });
  }

  return issues;
}

function lintFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return lintContent(filePath, content);
  } catch (err) {
    return [
      {
        file: filePath,
        line: 0,
        col: 0,
        rule: "read-error",
        message: `Could not read file: ${err.message}`,
      },
    ];
  }
}

function lintDirectory(dirPath, options = {}) {
  const issues = [];
  let scannedFiles = 0;

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SCANNABLE_EXTS.has(ext)) {
          scannedFiles++;
          const fileIssues = lintFile(fullPath);
          issues.push(...fileIssues);
        }
      }
    }
  }

  walk(path.resolve(dirPath));
  return {
    clean: issues.length === 0,
    issueCount: issues.length,
    issues,
    scannedFiles,
  };
}

function main(argv = process.argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const target = args.find((a) => !a.startsWith("--")) || ".";

  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) {
    process.stderr.write(`seo-lint: path not found: ${target}\n`);
    return 2;
  }

  let result;
  if (fs.statSync(resolved).isFile()) {
    const issues = lintFile(resolved);
    result = {
      clean: issues.length === 0,
      issueCount: issues.length,
      issues,
      scannedFiles: 1,
    };
  } else {
    result = lintDirectory(resolved);
  }

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    if (result.clean) {
      process.stdout.write(`SEO Lint: clean! 0 issues found across ${result.scannedFiles} file(s).\n`);
    } else {
      process.stdout.write(`SEO Lint: ${result.issueCount} issue(s) found across ${result.scannedFiles} file(s):\n\n`);
      for (const iss of result.issues) {
        const pos = iss.line > 0 ? `${iss.line}:${iss.col}` : "1";
        process.stdout.write(`  ${iss.file}:${pos} [${iss.rule}]\n    ${iss.message}\n`);
      }
      process.stdout.write("\n");
    }
  }

  return result.clean ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  lintContent,
  lintFile,
  lintDirectory,
  main,
  CANONICAL_SCHEMA_TYPES,
  PLACEHOLDER_RE,
};
