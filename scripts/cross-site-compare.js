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

const { detectProject } = require("./detect-framework.js");

// Key AI search crawlers that govern LLM answer synthesis
const AI_BOTS = ["OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"];

/**
 * Parse robots.txt into rule groups.
 *
 * A group is one or more consecutive `User-agent:` lines followed by its rules;
 * the next `User-agent:` after a rule line starts a new group. This has to be a
 * real parser rather than a regex: the previous implementation searched forward
 * from a bot's User-agent line for the next `Disallow:` anywhere in the file,
 * which happily crossed group boundaries. On a robots.txt that allows a bot
 * explicitly and disallows some unrelated crawler further down, it attributed
 * that unrelated `Disallow: /` to the allowed bot and reported it as Blocked.
 */
function parseRobots(content) {
  const groups = [];
  let current = null;
  let lastLineWasAgent = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!match) continue;

    const field = match[1].toLowerCase();
    const value = match[2].trim();

    if (field === "user-agent") {
      // Consecutive User-agent lines share one group's rules.
      if (current === null || !lastLineWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      if (current === null) continue; // rule before any User-agent: ignored
      current.rules.push({ type: field, path: value });
      lastLineWasAgent = false;
    }
  }
  return groups;
}

/**
 * Decide whether a group's rules permit crawling the site root.
 * Longest matching path wins; Allow beats Disallow at equal length, per Google's
 * documented precedence. An empty `Disallow:` means "allow everything".
 */
function rootAccessForGroup(group) {
  let longestDisallow = null;
  let longestAllow = null;

  for (const rule of group.rules) {
    if (rule.path === "") continue; // `Disallow:` with no value allows all
    if (!"/".startsWith(rule.path)) continue; // rule does not cover the root
    if (rule.type === "disallow") {
      if (longestDisallow === null || rule.path.length > longestDisallow.length) {
        longestDisallow = rule.path;
      }
    } else if (longestAllow === null || rule.path.length > longestAllow.length) {
      longestAllow = rule.path;
    }
  }

  if (longestDisallow === null) return true;
  if (longestAllow !== null && longestAllow.length >= longestDisallow.length) return true;
  return false;
}

/**
 * Resolve one bot's access, preferring a group naming it explicitly over the
 * catch-all `*` group. Multiple groups naming the same agent are merged.
 */
function botAccess(groups, bot) {
  const target = bot.toLowerCase();
  const collect = (name) => {
    const matched = groups.filter(g => g.agents.includes(name));
    if (matched.length === 0) return null;
    return { agents: [name], rules: matched.flatMap(g => g.rules) };
  };

  const specific = collect(target);
  if (specific) return rootAccessForGroup(specific) ? "Allowed" : "Blocked";

  const wildcard = collect("*");
  if (wildcard) return rootAccessForGroup(wildcard) ? "Allowed (Default)" : "Blocked (by *)";

  return "Allowed (No matching rule)";
}

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

  // 1. Framework detection.
  // detect-framework.js exports detectProject, not detectFramework, and returns
  // { framework: <id string>, label, detected } — not a nested object. The old
  // call destructured a name the module never exported, so every lookup threw
  // TypeError, was swallowed by the catch, and every site in every comparison
  // reported "Unknown" — which also cost each of them the 15-point framework
  // bonus in the health score below.
  try {
    const fw = detectProject(resolved, { searchSubdirs: true });
    if (fw && fw.detected) {
      result.framework = fw.label || fw.framework || "Detected";
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

      const robotGroups = parseRobots(content);
      for (const bot of AI_BOTS) {
        result.aiBots[bot] = botAccess(robotGroups, bot);
      }
      break;
    }
  }

  if (!result.hasRobots) {
    // A Next.js app can generate robots.txt from a route handler, in which case
    // no static file exists but the site absolutely has one. Reporting "Missing
    // robots.txt" for those sites is a false negative — the dynamic sitemap
    // equivalent was already handled below, robots was not.
    const robotsRoutes = [
      "app/robots.ts", "app/robots.js",
      "src/app/robots.ts", "src/app/robots.js",
      "app/robots.txt/route.ts", "src/app/robots.txt/route.ts"
    ].map(r => path.join(resolved, r));

    const robotsRoute = robotsRoutes.find(p => fs.existsSync(p));
    if (robotsRoute) {
      result.hasRobots = true;
      result.robotsSource = "dynamic";
      result.robotsSizeBytes = -1;
      // What that route emits is only knowable from the deployed response, so
      // abstain rather than guess. A wrong "Allowed" here is worse than "Unknown".
      for (const bot of AI_BOTS) {
        result.aiBots[bot] = "Unknown (dynamic)";
      }
      result.issues.push(
        `robots.txt is generated at runtime by ${path.relative(resolved, robotsRoute)} — verify AI crawler rules against the deployed /robots.txt`
      );
    } else {
      for (const bot of AI_BOTS) {
        result.aiBots[bot] = "Allowed (No robots.txt)";
      }
      result.issues.push("Missing robots.txt");
    }
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
    // Next.js route-generated sitemap. The src/app/ variant is as common as the
    // app/ one and was previously missed, so src-layout projects were reported
    // as having no sitemap at all.
    const sitemapRoutes = [
      "app/sitemap.ts", "app/sitemap.js",
      "src/app/sitemap.ts", "src/app/sitemap.js",
      "app/sitemap.xml/route.ts", "src/app/sitemap.xml/route.ts"
    ].map(r => path.join(resolved, r));

    if (sitemapRoutes.some(p => fs.existsSync(p))) {
      result.hasSitemap = true;
      result.sitemapUrlCount = -1; // Dynamic generator; URL count unknown statically
    } else {
      result.issues.push("Missing sitemap.xml");
    }
  }

  // 4. HTML Scan (check representative HTML/template files)
  // Sampling five files at depth 3 and concluding "no schema / no canonical" is
  // a coin flip on any real app — road-trip/web has 25 files carrying JSON-LD and
  // scored 0 because none landed in the first five. These are small source files
  // read offline, so scan broadly enough for the answer to mean something.
  const htmlFiles = findHtmlFiles(resolved, 400);
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
      // Paired <script type="application/ld+json">…</script> carries its JSON
      // inline. React sources far more often emit a SELF-CLOSING tag:
      //   <script type="application/ld+json" dangerouslySetInnerHTML={{__html: …}} />
      // which has no closing tag, so the paired-tag regex missed it entirely and
      // reported "Schema.org: Missing" for sites with dozens of JSON-LD blocks.
      const schemaMatches = content.match(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      );
      const hasLdJson = /application\/ld\+json/i.test(content);

      if (hasLdJson) {
        result.hasSchema = true;
        // For self-closing tags the object is built elsewhere in the file, so
        // widen the search to the whole source rather than claiming none.
        const scope = schemaMatches ? schemaMatches.join("\n") : content;
        if (!schemaMatches) result.schemaSource = "dynamic";

        const typeMatch = scope.match(/["']?@type["']?\s*:\s*["']([A-Za-z0-9]+)["']/g);
        if (typeMatch) {
          for (const tm of typeMatch) {
            const t = tm.split(":")[1].replace(/["'\s]/g, "");
            if (t) foundSchemaTypes.add(t);
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
const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "out", "coverage", "vendor", "__tests__"
]);

function findHtmlFiles(dir, maxCount) {
  const matched = [];
  function walk(curr, depth) {
    if (depth > 8 || matched.length >= maxCount) return;
    let entries;
    try {
      entries = fs.readdirSync(curr, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
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
  renderTerminalTable,
  // exported for unit tests
  parseRobots,
  botAccess
};

if (require.main === module) {
  main();
}
