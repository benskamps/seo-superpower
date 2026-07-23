#!/usr/bin/env node
"use strict";

/**
 * scripts/detect-framework.js — deterministic framework detection + SEO asset audit.
 *
 * Why this exists: `skills/seo-bootstrap/SKILL.md` Step 1 and Step 2 used to be a
 * prose table an LLM eyeballed. That is unverifiable and drifts silently — the
 * Astro/SvelteKit rows were "supported" for months while the templates they
 * pointed at did not exist. This script makes detection a real, testable thing:
 * one function over a project directory, no network, no deps.
 *
 * Usage:
 *   node scripts/detect-framework.js [projectDir] [--json]
 *
 * Exit codes:
 *   0  a supported framework was detected
 *   1  no supported framework detected (unknown project shape)
 *   2  bad usage / unreadable directory
 *
 * Node stdlib only (node:fs, node:path) — no package.json, no deps.
 * Run tests with:  node --test
 */

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Small filesystem helpers (all sync, all forgiving — a missing file is just
// "not present", never a throw, because we run against arbitrary user repos).
// ---------------------------------------------------------------------------

function exists(p) {
  try {
    fs.statSync(p);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/**
 * Read and parse package.json. Returns { deps, raw } where `deps` merges
 * dependencies + devDependencies (a framework is just as real in devDeps —
 * Astro and SvelteKit both land there in the official templates).
 * Returns null when there is no readable/parseable package.json.
 */
function readPackageJson(dir) {
  const text = readText(path.join(dir, "package.json"));
  if (text === null) return null;
  let pkg;
  try {
    pkg = JSON.parse(text);
  } catch {
    return null;
  }
  if (pkg === null || typeof pkg !== "object" || Array.isArray(pkg)) return null;
  const deps = Object.assign(
    {},
    pkg.dependencies && typeof pkg.dependencies === "object" ? pkg.dependencies : {},
    pkg.devDependencies && typeof pkg.devDependencies === "object" ? pkg.devDependencies : {},
  );
  return { deps, raw: pkg };
}

/** First existing path from a list of repo-relative candidates, else null. */
function firstExisting(dir, candidates) {
  for (const rel of candidates) {
    if (exists(path.join(dir, rel))) return rel;
  }
  return null;
}

/** Find a config file by basename + any of these extensions. */
function findConfig(dir, base, exts = ["js", "mjs", "cjs", "ts", "mts"]) {
  for (const ext of exts) {
    const rel = `${base}.${ext}`;
    if (isFile(path.join(dir, rel))) return rel;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Framework detection
// ---------------------------------------------------------------------------

/**
 * Ordered detection rules. Order matters: Next's App/Pages router split is
 * decided by folder shape, and the Vite+React-Router fallback must only fire
 * when no real meta-framework is present.
 *
 * Each rule returns a framework id or null.
 */
function detectFrameworkId(dir, deps) {
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name);

  if (has("next")) {
    // App Router wins when both exist — that is the 2026 default path, and a
    // migrating repo keeps `pages/` around for legacy routes.
    const hasApp = isDir(path.join(dir, "app")) || isDir(path.join(dir, "src", "app"));
    const hasPages = isDir(path.join(dir, "pages")) || isDir(path.join(dir, "src", "pages"));
    if (hasApp) return "nextjs-app";
    if (hasPages) return "nextjs-pages";
    // `next` in deps but neither folder: still Next, assume the modern path.
    return "nextjs-app";
  }

  if (has("astro")) return "astro";
  if (has("@sveltejs/kit")) return "sveltekit";

  if (has("react-router-dom") || has("react-router")) return "vite-react-router";

  return null;
}

/** Human-facing label + the templates/ directory that serves this framework. */
const FRAMEWORK_META = {
  "nextjs-app": { label: "Next.js (App Router)", templates: "templates/nextjs" },
  "nextjs-pages": { label: "Next.js (Pages Router)", templates: "templates/nextjs" },
  astro: { label: "Astro", templates: "templates/astro" },
  sveltekit: { label: "SvelteKit", templates: "templates/sveltekit" },
  "vite-react-router": { label: "Vite + React Router", templates: null },
  unknown: { label: "Unknown", templates: null },
};

// ---------------------------------------------------------------------------
// Canonical site URL — the thing that silently breaks every generated sitemap
// when it is missing. Each framework declares it in a different place.
// ---------------------------------------------------------------------------

const SITE_URL_RE = /https?:\/\/[^\s"'`,)]+/;

/**
 * Pull the canonical origin out of a Next `metadataBase` declaration.
 *
 * Dogfooding caught the naive version of this: "find `metadataBase`, then take
 * the next URL in the file" happily returned a docs link out of a comment forty
 * lines later. Two real shapes are supported, and anything else returns null so
 * the skill asks the user rather than shipping a wrong origin:
 *
 *   metadataBase: new URL("https://site.com")   -> literal
 *   metadataBase: new URL(SITE_URL)             -> resolve SITE_URL in this file
 *
 * The identifier form is resolved against `const IDENT = ...` in the same file,
 * which also covers the very common
 * `const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://site.com"`.
 */
function extractMetadataBase(text) {
  const literal = text.match(/metadataBase\s*:\s*new\s+URL\s*\(\s*["'`](https?:\/\/[^"'`]+)["'`]/);
  if (literal) return literal[1];

  const ident = text.match(/metadataBase\s*:\s*new\s+URL\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/);
  if (ident) {
    const decl = new RegExp(
      `(?:const|let|var)\\s+${ident[1]}\\s*(?::[^=]+)?=\\s*([^;\\n]+)`,
    ).exec(text);
    if (decl) {
      const m = decl[1].match(SITE_URL_RE);
      if (m) return m[0];
    }
  }
  return null;
}

function detectSiteUrl(dir, frameworkId) {
  // Astro: `site:` in astro.config.*
  if (frameworkId === "astro") {
    const cfg = findConfig(dir, "astro.config");
    if (cfg) {
      const text = readText(path.join(dir, cfg)) || "";
      const m = text.match(/\bsite\s*:\s*["'`]([^"'`]+)["'`]/);
      if (m) return { url: m[1], source: cfg, key: "site" };
    }
    return { url: null, source: cfg, key: "site" };
  }

  // Next: `metadataBase` in next.config.* or app/layout.*
  if (frameworkId === "nextjs-app" || frameworkId === "nextjs-pages") {
    const candidates = [
      findConfig(dir, "next.config"),
      firstExisting(dir, [
        "app/layout.tsx",
        "app/layout.jsx",
        "src/app/layout.tsx",
        "src/app/layout.jsx",
      ]),
    ].filter(Boolean);
    for (const rel of candidates) {
      const text = readText(path.join(dir, rel)) || "";
      const url = extractMetadataBase(text);
      if (url) return { url, source: rel, key: "metadataBase" };
    }
    return { url: null, source: candidates[0] || null, key: "metadataBase" };
  }

  // SvelteKit: no first-class field — convention is a PUBLIC_SITE_URL env var
  // or an `origin` constant. Look in svelte.config.* and .env.example only.
  // We deliberately never read a real `.env`: this plugin runs inside other
  // people's repos and must not touch their secret-bearing files.
  if (frameworkId === "sveltekit") {
    const cfg = findConfig(dir, "svelte.config");
    for (const rel of [cfg, ".env.example"].filter(Boolean)) {
      const text = readText(path.join(dir, rel)) || "";
      const m = text.match(/\b(?:PUBLIC_SITE_URL|SITE_URL|origin)\s*[:=]\s*["'`]?(https?:\/\/[^\s"'`]+)/);
      if (m) return { url: m[1], source: rel, key: "PUBLIC_SITE_URL" };
    }
    return { url: null, source: cfg, key: "PUBLIC_SITE_URL" };
  }

  return { url: null, source: null, key: null };
}

// ---------------------------------------------------------------------------
// SEO asset audit — the Step 2 table, as data.
//
// Each asset lists the framework-idiomatic locations. `present` is the first
// one that exists; null means the bootstrap should generate it.
// ---------------------------------------------------------------------------

const ASSET_PATHS = {
  "nextjs-app": {
    sitemap: ["app/sitemap.ts", "app/sitemap.js", "app/sitemap.xml", "src/app/sitemap.ts", "public/sitemap.xml"],
    robots: ["app/robots.ts", "app/robots.js", "src/app/robots.ts", "public/robots.txt"],
    ogImage: ["app/opengraph-image.tsx", "app/opengraph-image.png", "src/app/opengraph-image.tsx", "public/og.png"],
    rootLayout: ["app/layout.tsx", "app/layout.jsx", "src/app/layout.tsx", "src/app/layout.jsx"],
  },
  "nextjs-pages": {
    sitemap: ["pages/sitemap.xml.ts", "pages/sitemap.xml.js", "src/pages/sitemap.xml.ts", "public/sitemap.xml"],
    robots: ["public/robots.txt"],
    ogImage: ["public/og.png", "public/og.jpg"],
    rootLayout: ["pages/_app.tsx", "pages/_app.jsx", "pages/_document.tsx", "src/pages/_app.tsx"],
  },
  astro: {
    sitemap: ["src/pages/sitemap.xml.ts", "src/pages/sitemap.xml.js", "public/sitemap.xml"],
    robots: ["public/robots.txt", "src/pages/robots.txt.ts"],
    ogImage: ["public/og.png", "public/og.jpg"],
    rootLayout: ["src/layouts/Layout.astro", "src/layouts/BaseLayout.astro"],
  },
  sveltekit: {
    sitemap: ["src/routes/sitemap.xml/+server.ts", "src/routes/sitemap.xml/+server.js", "static/sitemap.xml"],
    robots: ["static/robots.txt", "src/routes/robots.txt/+server.ts"],
    ogImage: ["static/og.png", "static/og.jpg"],
    rootLayout: ["src/routes/+layout.svelte"],
  },
  "vite-react-router": {
    sitemap: ["public/sitemap.xml"],
    robots: ["public/robots.txt"],
    ogImage: ["public/og.png", "public/og.jpg"],
    rootLayout: ["index.html"],
  },
};

/**
 * Astro's sitemap is usually not a file at all — it is the `@astrojs/sitemap`
 * integration wired into astro.config.*. Detect that too, or we will tell an
 * Astro user to generate a sitemap they already have.
 */
function astroSitemapIntegration(dir, deps) {
  if (!Object.prototype.hasOwnProperty.call(deps, "@astrojs/sitemap")) return null;
  const cfg = findConfig(dir, "astro.config");
  if (!cfg) return null;
  const text = readText(path.join(dir, cfg)) || "";
  return /@astrojs\/sitemap/.test(text) ? `${cfg} (@astrojs/sitemap)` : null;
}

const JSONLD_RE = /application\/ld\+json/;

function auditAssets(dir, frameworkId, deps) {
  const paths = ASSET_PATHS[frameworkId] || ASSET_PATHS["vite-react-router"];
  const rootLayout = firstExisting(dir, paths.rootLayout);

  let sitemap = firstExisting(dir, paths.sitemap);
  if (!sitemap && frameworkId === "astro") sitemap = astroSitemapIntegration(dir, deps);

  // JSON-LD is content, not a path: look inside whatever the root layout is.
  let jsonLd = null;
  if (rootLayout) {
    const text = readText(path.join(dir, rootLayout)) || "";
    if (JSONLD_RE.test(text)) jsonLd = rootLayout;
  }

  return {
    sitemap: { present: sitemap, expected: paths.sitemap[0] },
    robots: { present: firstExisting(dir, paths.robots), expected: paths.robots[0] },
    ogImage: { present: firstExisting(dir, paths.ogImage), expected: paths.ogImage[0] },
    jsonLd: { present: jsonLd, expected: rootLayout || paths.rootLayout[0] },
  };
}

// ---------------------------------------------------------------------------
// Monorepo search
//
// Dogfooding this against real repos is what forced this: a plain root-only
// detector reported "unknown" for a site whose Next app lives in `web/` with a
// near-empty root package.json. That is the common shape (web/, apps/web/,
// site/), and "unknown" there is a false negative that silently downgrades the
// user to the static fallback.
//
// The search is deliberately bounded — depth 2, skipping vendor/build dirs —
// so it never walks a node_modules tree in someone else's repo.
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", ".svelte-kit", ".astro", ".vercel", ".turbo",
  "dist", "build", "out", "coverage", "vendor", ".venv", "__pycache__", ".cache",
]);

/** Conventional app-directory names, searched before anything else. */
const PREFERRED_SUBDIRS = ["web", "site", "www", "app", "frontend", "client", "marketing", "docs"];

const MAX_ENTRIES_PER_LEVEL = 40;

function childDirs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const dirs = entries
    .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith("."))
    .map((e) => e.name)
    .slice(0, MAX_ENTRIES_PER_LEVEL);
  // Conventional names first, then alphabetical — makes the result deterministic.
  return dirs.sort((a, b) => {
    const ai = PREFERRED_SUBDIRS.indexOf(a);
    const bi = PREFERRED_SUBDIRS.indexOf(b);
    if (ai !== bi) return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
    return a.localeCompare(b);
  });
}

/**
 * Find the nearest subdirectory (depth <= maxDepth) that looks like a real
 * framework app. Returns an absolute path, or null.
 */
function findAppRoot(root, maxDepth = 2) {
  let frontier = [root];
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const next = [];
    for (const dir of frontier) {
      for (const name of childDirs(dir)) {
        const child = path.join(dir, name);
        const pkg = readPackageJson(child);
        if (pkg && detectFrameworkId(child, pkg.deps) !== null) return child;
        next.push(child);
      }
    }
    frontier = next;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect the framework of `dir` and audit its SEO assets.
 *
 * @param {string} dir project root
 * @returns {{
 *   framework: string, label: string, detected: boolean, templates: string|null,
 *   root: string, siteUrl: {url: string|null, source: string|null, key: string|null},
 *   assets: object, missing: string[], reason: string
 * }}
 */
function detectProject(dir, { searchSubdirs = true } = {}) {
  const requested = path.resolve(dir);

  const miss = (reason) => ({
    framework: "unknown",
    label: FRAMEWORK_META.unknown.label,
    detected: false,
    templates: null,
    root: requested,
    appRoot: requested,
    detectedIn: null,
    siteUrl: { url: null, source: null, key: null },
    assets: {},
    missing: [],
    reason,
  });

  if (!isDir(requested)) return miss("not a directory");

  // Try the requested directory itself first — the common, unambiguous case.
  let appRoot = requested;
  let pkg = readPackageJson(appRoot);
  let id = pkg === null ? null : detectFrameworkId(appRoot, pkg.deps);

  // Monorepo fallback: the app lives in web/, apps/web/, site/, ...
  if (id === null && searchSubdirs) {
    const found = findAppRoot(requested);
    if (found !== null) {
      appRoot = found;
      pkg = readPackageJson(appRoot);
      id = pkg === null ? null : detectFrameworkId(appRoot, pkg.deps);
    }
  }

  if (id === null) {
    return miss(
      pkg === null
        ? "no readable package.json"
        : "no supported framework in dependencies",
    );
  }

  const meta = FRAMEWORK_META[id];
  const assets = auditAssets(appRoot, id, pkg.deps);
  const missing = Object.keys(assets).filter((k) => !assets[k].present);
  const detectedIn = appRoot === requested ? null : path.relative(requested, appRoot).split(path.sep).join("/");

  return {
    framework: id,
    label: meta.label,
    detected: true,
    templates: meta.templates,
    root: requested,
    // Where the framework actually lives — every asset path below is relative
    // to THIS, not to `root`. In a monorepo they differ.
    appRoot,
    detectedIn,
    siteUrl: detectSiteUrl(appRoot, id),
    assets,
    missing,
    reason: "ok",
  };
}

/** Render the Step 2 audit table the skill asks for, as plain text. */
function renderReport(result) {
  const lines = [];
  lines.push(`Framework: ${result.label}${result.detected ? "" : "  (no supported framework detected)"}`);
  if (!result.detected) {
    lines.push(`Reason: ${result.reason}`);
    lines.push("Fall back to static files in public/ — see skills/seo-bootstrap/SKILL.md.");
    return lines.join("\n");
  }
  if (result.detectedIn) {
    lines.push(`App root: ${result.detectedIn}/  (monorepo — all paths below are relative to it)`);
  }
  lines.push(`Templates: ${result.templates || "(none — static public/ fallback)"}`);
  const su = result.siteUrl;
  lines.push(
    su.url
      ? `Canonical site URL: ${su.url}  (${su.key} in ${su.source})`
      : `Canonical site URL: MISSING — set ${su.key || "the site URL"}${su.source ? ` in ${su.source}` : ""} before generating`,
  );
  lines.push("");
  lines.push("| Asset    | Status  | Path |");
  lines.push("|----------|---------|------|");
  for (const [name, info] of Object.entries(result.assets)) {
    lines.push(
      info.present
        ? `| ${name} | present | ${info.present} |`
        : `| ${name} | MISSING | ${info.expected} |`,
    );
  }
  lines.push("");
  lines.push(
    result.missing.length === 0
      ? "Nothing missing — run auditing-technical-seo instead of bootstrap."
      : `Generate: ${result.missing.join(", ")}`,
  );
  return lines.join("\n");
}

module.exports = {
  detectProject,
  renderReport,
  // exported for unit tests
  detectFrameworkId,
  readPackageJson,
  detectSiteUrl,
  auditAssets,
  findAppRoot,
  FRAMEWORK_META,
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const wantJson = args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("--"));
  if (positional.length > 1) {
    process.stderr.write("usage: node scripts/detect-framework.js [projectDir] [--json]\n");
    process.exit(2);
  }
  const target = positional[0] || process.cwd();
  if (!isDir(path.resolve(target))) {
    process.stderr.write(`not a directory: ${target}\n`);
    process.exit(2);
  }
  const result = detectProject(target);
  process.stdout.write((wantJson ? JSON.stringify(result, null, 2) : renderReport(result)) + "\n");
  process.exit(result.detected ? 0 : 1);
}
