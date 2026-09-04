#!/usr/bin/env node
/**
 * scripts/cross-site-compare.js — Multi-site portfolio SEO comparison & benchmarking.
 *
 * Part of seo-superpower.
 * Pure Node.js stdlib only (Node 18+) — zero external dependencies.
 *
 * Capabilities:
 *   - Compares technical SEO baseline metrics across 2+ websites in a portfolio:
 *     - Framework & render architecture detection
 *     - Robots.txt & sitemap presence, size, and hygiene
 *     - AI Bot permissions (OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended)
 *     - JSON-LD Schema.org markup presence and entity types
 *     - Key meta tag coverage (viewport, canonical, description, OpenGraph)
 *     - Overall technical SEO readiness score (0-100)
 *   - Formats: Pretty-printed terminal matrix, GitHub Markdown table, or structured JSON.
 *
 * CLI Usage:
 *   node scripts/cross-site-compare.js <dir1> <dir2> [dir3...] [--json] [--markdown]
 *   node scripts/cross-site-compare.js --config <portfolio.json> [--json] [--markdown]
 *
 * Exit codes:
 *   0 = Comparison completed successfully
 *   1 = Comparison completed but one or more sites scored below threshold (<70)
 *   2 = Invalid arguments, missing files, or parse errors
 */
"use strict";

const fs = require("fs");
const path = require("path");

const { detectFramework } = require("./detect-framework.js");

// Key AI search crawlers that govern LLM answer synthesis
const AI_BOTS = ["OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"];

/**
 * Inspect a single directory for technical SEO assets and hygiene.
 */
function inspectSite(sitePath, siteName) {
  const resolved = path.resolve(sitePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Directory does not exist or is not a directory: '${sitePath}'`);
  }

  const name = siteName || path.basename(resolved);
  const result = {
    name,
    path: resolved,
    framework: "Unknown",
    hasRobots: false,
    robotsSizeBytes: 0,
    aiBots: {},
    hasSitemap: false,
    sitemapUrlCount: 0,
    hasSchema: false,
    schemaTypes: [],
    hasCanonical: false,
    hasDescription: false,
    score: 0,
    issues: []
  };

  // 1. Framework detection
  try {
    const fw = detectFramework(resolved, { searchSubdirs: true });
    if (fw && fw.framework) {
      result.framework = fw.framework.label || fw.framework.id || "Detected";
    }
  } catch {
    result.framework = "Unknown";
  }

  // 2. Robots.txt inspection
  const possibleRobots = [
    path.join(resolved, "robots.txt"),
    path.join(resolved, "public", "robots.txt"),
    path.join(resolved, "static", "robots.txt"),
    path.join(resolved, "dist", "robots.txt"),
    path.join(resolved, "build", "robots.txt")
  ];

  for (const rPath of possibleRobots) {
    if (fs.existsSync(rPath) && fs.statSync(rPath).isFile()) {
      result.hasRobots = true;
      const content = fs.readFileSync(rPath, "utf8");
      result.robotsSizeBytes = Buffer.byteLength(content, "utf8");

      for (const bot of AI_BOTS) {
        const botRegex = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*(.*)`, "i");
        const match = content.match(botRegex);
        if (match) {
          const disallow = match[1].trim();
          result.aiBots[bot] = disallow === "/" ? "Blocked" : "Allowed";
        } else {
          // Default rule check
          const defaultRegex = /User-agent:\s*\*[\s\S]*?Disallow:\s*(.*)/i;
          const defMatch = content.match(defaultRegex);
          if (defMatch && defMatch[1].trim() === "/") {
            result.aiBots[bot] = "Blocked (by *)";
          } else {
            result.aiBots[bot] = "Allowed (Default)";
          }
        }
      }
      break;
    }
  }

  if (!result.hasRobots) {
    for (const bot of AI_BOTS) {
      result.aiBots[bot] = "Allowed (No robots.txt)";
    }
    result.issues.push("Missing robots.txt");
  }

  // 3. Sitemap inspection
  const possibleSitemaps = [
    path.join(resolved, "sitemap.xml"),
    path.join(resolved, "public", "sitemap.xml"),
    path.join(resolved, "static", "sitemap.xml"),
    path.join(resolved, "dist", "sitemap.xml"),
    path.join(resolved, "build", "sitemap.xml")
  ];

  for (const sPath of possibleSitemaps) {
    if (fs.existsSync(sPath) && fs.statSync(sPath).isFile()) {
      result.hasSitemap = true;
      const content = fs.readFileSync(sPath, "utf8");
      const urls = (content.match(/<loc>/g) || []).length;
      result.sitemapUrlCount = urls;
      break;
    }
  }

  if (!result.hasSitemap) {
    // Check Next.js app/sitemap.ts or src/routes/sitemap.xml
    const appSitemap = path.join(resolved, "app", "sitemap.ts");
    const appSitemapJs = path.join(resolved, "app", "sitemap.js");
    if (fs.existsSync(appSitemap) || fs.existsSync(appSitemapJs)) {
      result.hasSitemap = true;
      result.sitemapUrlCount = -1; // Dynamic Next.js generator
    } else {
      result.issues.push("Missing sitemap.xml");
    }
  }

  // 4. HTML Scan (check representative HTML/template files)
  const htmlFiles = findHtmlFiles(resolved, 5);
  const foundSchemaTypes = new Set();

  for (const hPath of htmlFiles) {
    try {
      const content = fs.readFileSync(hPath, "utf8");
      if (/<link[^>]+rel=["']canonical["']/i.test(content)) {
        result.hasCanonical = true;
      }
      if (/<meta[^>]+name=["']description["']/i.test(content)) {
        result.hasDescription = true;
      }
      const schemaMatches = content.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (schemaMatches) {
        result.hasSchema = true;
        for (const m of schemaMatches) {
          const typeMatch = m.match(/"@type"\s*:\s*"([A-Za-z0-9]+)"/g);
          if (typeMatch) {
            for (const tm of typeMatch) {
              const t = tm.split(":")[1].replace(/["\s]/g, "");
              if (t) foundSchemaTypes.add(t);
            }
          }
        }
      }
    } catch {
      // skip unreadable file
    }
  }

  result.schemaTypes = Array.from(foundSchemaTypes);

  // 5. Compute Readiness Score (0-100)
  let score = 0;
  if (result.framework !== "Unknown") score += 15;
  if (result.hasRobots) score += 20;
  if (result.hasSitemap) score += 20;
  if (result.hasCanonical) score += 15;
  if (result.hasDescription) score += 10;
  if (result.hasSchema) score += 20;

  // Penalty if OAI-SearchBot is blocked (critical for GEO)
  if (result.aiBots["OAI-SearchBot"] && result.aiBots["OAI-SearchBot"].startsWith("Blocked")) {
    score = Math.max(0, score - 20);
    result.issues.push("OAI-SearchBot is blocked (ChatGPT Search cannot cite site)");
  }

  result.score = score;
  return result;
}

/**
 * Find up to maxCount HTML or layout template files.
 */
function findHtmlFiles(dir, maxCount) {
  const matched = [];
  function walk(curr, depth) {
    if (depth > 3 || matched.length >= maxCount) return;
    let entries;
    try {
      entries = fs.readdirSync(curr, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "dist") continue;
      const full = path.join(curr, e.name);
      if (e.isDirectory()) {
        walk(full, depth + 1);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (ext === ".html" || ext === ".tsx" || ext === ".jsx" || ext === ".astro") {
          matched.push(full);
          if (matched.length >= maxCount) break;
        }
      }
    }
  }
  walk(dir, 0);
  return matched;
}

/**
 * Render Markdown comparison table.
 */
function renderMarkdownTable(sites) {
  const headers = ["Dimension", ...sites.map(s => s.name)];
  const rows = [
    ["Framework", ...sites.map(s => s.framework)],
    ["Health Score", ...sites.map(s => `${s.score}/100`)],
    ["Robots.txt", ...sites.map(s => (s.hasRobots ? `✅ Present (${s.robotsSizeBytes}B)` : "❌ Missing"))],
    ["Sitemap", ...sites.map(s => (s.hasSitemap ? (s.sitemapUrlCount >= 0 ? `✅ ${s.sitemapUrlCount} URLs` : "✅ Dynamic") : "❌ Missing"))],
    ["OAI-SearchBot", ...sites.map(s => (s.aiBots["OAI-SearchBot"]?.startsWith("Blocked") ? "❌ Blocked" : "✅ Allowed"))],
    ["PerplexityBot", ...sites.map(s => (s.aiBots["PerplexityBot"]?.startsWith("Blocked") ? "❌ Blocked" : "✅ Allowed"))],
    ["Schema.org", ...sites.map(s => (s.hasSchema ? `✅ ${s.schemaTypes.join(", ") || "Yes"}` : "❌ Missing"))],
    ["Canonical Tag", ...sites.map(s => (s.hasCanonical ? "✅ Present" : "⚠️ Not found in samples"))],
    ["Meta Description", ...sites.map(s => (s.hasDescription ? "✅ Present" : "⚠️ Not found in samples"))]
  ];

  let md = `| ${headers.join(" | ")} |\n`;
  md += `| ${headers.map(() => "---").join(" | ")} |\n`;
  for (const row of rows) {
    md += `| ${row.join(" | ")} |\n`;
  }
  return md;
}

/**
 * Render ASCII terminal comparison table.
 */
function renderTerminalTable(sites) {
  const colWidths = [18, ...sites.map(s => Math.max(16, s.name.length + 2))];

  function formatRow(cells) {
    return cells.map((cell, idx) => {
      const w = colWidths[idx];
      const str = String(cell);
      return str.length > w - 1 ? str.slice(0, w - 4) + "..." : str.padEnd(w);
    }).join(" | ");
  }

  const divider = colWidths.map(w => "-".repeat(w)).join("-+-");
  const headers = ["Dimension", ...sites.map(s => s.name)];
  const rows = [
    ["Framework", ...sites.map(s => s.framework)],
    ["Health Score", ...sites.map(s => `${s.score}/100`)],
    ["Robots.txt", ...sites.map(s => (s.hasRobots ? `Yes (${s.robotsSizeBytes}B)` : "Missing"))],
    ["Sitemap", ...sites.map(s => (s.hasSitemap ? (s.sitemapUrlCount >= 0 ? `${s.sitemapUrlCount} URLs` : "Dynamic") : "Missing"))],
    ["OAI-SearchBot", ...sites.map(s => (s.aiBots["OAI-SearchBot"]?.startsWith("Blocked") ? "BLOCKED" : "Allowed"))],
    ["PerplexityBot", ...sites.map(s => (s.aiBots["PerplexityBot"]?.startsWith("Blocked") ? "BLOCKED" : "Allowed"))],
    ["Schema.org", ...sites.map(s => (s.hasSchema ? (s.schemaTypes.slice(0, 2).join(",") || "Yes") : "Missing"))]
  ];

  const lines = [];
  lines.push(formatRow(headers));
  lines.push(divider);
  for (const r of rows) {
    lines.push(formatRow(r));
  }
  return lines.join("\n");
}

/**
 * Main CLI execution entrypoint.
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`Usage:
  node scripts/cross-site-compare.js <dir1> <dir2> [dir3...] [--json] [--markdown]
  node scripts/cross-site-compare.js --config <portfolio.json> [--json] [--markdown]

Options:
  --config <file>     Path to portfolio JSON config file.
  --json              Emit structured JSON output.
  --markdown          Output table formatted in GitHub Flavored Markdown.
  --threshold <n>     Minimum acceptable health score (default: 70). Exits with 1 if lower.
  --help, -h          Show this help message.`);
    process.exit(0);
  }

  const isJson = args.includes("--json");
  const isMarkdown = args.includes("--markdown");
  const configIdx = args.indexOf("--config");
  const thresholdIdx = args.indexOf("--threshold");
  const threshold = thresholdIdx !== -1 && args[thresholdIdx + 1] ? parseInt(args[thresholdIdx + 1], 10) : 70;

  let siteConfigs = [];

  if (configIdx !== -1 && args[configIdx + 1]) {
    const cfgPath = path.resolve(args[configIdx + 1]);
    try {
      const raw = fs.readFileSync(cfgPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.sites)) {
        siteConfigs = parsed.sites.map(s => ({
          path: path.resolve(path.dirname(cfgPath), s.path || s.dir),
          name: s.name || path.basename(s.path || s.dir)
        }));
      } else if (Array.isArray(parsed)) {
        siteConfigs = parsed.map(s => ({
          path: path.resolve(path.dirname(cfgPath), s.path || s.dir || s),
          name: s.name || path.basename(s.path || s.dir || s)
        }));
      }
    } catch (err) {
      console.error(`cross-site-compare: error: could not load config '${cfgPath}': ${err.message}`);
      process.exit(2);
    }
  } else {
    // Positional directory arguments
    const dirArgs = args.filter(a => !a.startsWith("--") && (args[args.indexOf(a) - 1] !== "--config") && (args[args.indexOf(a) - 1] !== "--threshold"));
    if (dirArgs.length < 2) {
      console.error(`cross-site-compare: error: at least 2 site directories are required for portfolio comparison.`);
      process.exit(2);
    }
    siteConfigs = dirArgs.map(d => ({
      path: path.resolve(d),
      name: path.basename(path.resolve(d))
    }));
  }

  if (siteConfigs.length < 2) {
    console.error(`cross-site-compare: error: at least 2 valid site directories are required.`);
    process.exit(2);
  }

  const siteResults = [];
  let hasErrors = false;

  for (const cfg of siteConfigs) {
    try {
      const result = inspectSite(cfg.path, cfg.name);
      siteResults.push(result);
      if (result.score < threshold) {
        hasErrors = true;
      }
    } catch (err) {
      console.error(`cross-site-compare: error inspecting '${cfg.name}' (${cfg.path}): ${err.message}`);
      process.exit(2);
    }
  }

  if (isJson) {
    console.log(JSON.stringify({ sites: siteResults, benchmarkPassed: !hasErrors }, null, 2));
  } else if (isMarkdown) {
    console.log(`\n# Portfolio Technical SEO Comparison\n`);
    console.log(renderMarkdownTable(siteResults));
  } else {
    console.log(`\n=== Portfolio Technical SEO Comparison (${siteResults.length} sites) ===\n`);
    console.log(renderTerminalTable(siteResults));
    console.log(`\nThreshold: ${threshold}/100. Status: ${hasErrors ? "FAIL (Sites below threshold)" : "PASS (All sites compliant)"}`);
  }

  process.exit(hasErrors ? 1 : 0);
}

// Export for programmatic testing
module.exports = {
  inspectSite,
  renderMarkdownTable,
  renderTerminalTable
};

if (require.main === module) {
  main();
}
