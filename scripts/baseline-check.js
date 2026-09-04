#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * scripts/baseline-check.js — deterministic Pass A baseline health check.
 *
 * Why this exists: `skills/seo-superpower/SKILL.md` step 4 ("Pass A") is a
 * 10-item checklist an LLM eyeballs, and the *router* gates on the count:
 * ">=8/10 -> skip bootstrap, route to growth work". A fuzzy tally driving a
 * branch is the same failure mode `scripts/detect-framework.js` was written to
 * kill in seo-bootstrap Steps 1-2 — a prose table that drifted silently for
 * months. Same cure: one deterministic script, real fetches, real parsing.
 *
 * Two facts the prose got wrong, fixed here at the source:
 *
 *   1. Sitemap size. SKILL.md checked "sitemap < 500 KiB". 500 KiB is the
 *      *robots.txt* parse cap. A single sitemap's real limit is 50,000 URLs or
 *      50 MB uncompressed. The old check was ~100x too strict and would flag
 *      healthy sitemaps as broken. (The repo's own SOURCES.md had this right;
 *      only the SKILL.md prose conflated them.)
 *
 *   2. AI-bot roster. The roster omitted OAI-SearchBot. Per OpenAI's own docs,
 *      OAI-SearchBot "is used to surface websites in search results in
 *      ChatGPT's search features" and sites that block it "will not be shown in
 *      ChatGPT search answers". For a plugin whose headline promise is AI
 *      citation, that is the single most load-bearing user-agent, and naming
 *      GPTBot (a *training* bot) does not substitute for it.
 *
 * Because of (2) this script does not grep for user-agent strings. It
 * implements robots.txt group resolution the way the spec describes it —
 * most-specific matching group wins, longest matching path rule wins, Allow
 * breaks ties — so it reports whether a crawler can *effectively* reach the
 * site, not merely whether someone typed its name.
 *
 * Usage:
 *   node scripts/baseline-check.js <url> [--json] [--timeout=ms]
 *
 * Exit codes:
 *   0  baseline healthy (>=8/10) — router should skip bootstrap
 *   1  baseline incomplete (<8/10) — router should audit/bootstrap
 *   2  bad usage, or the site could not be fetched at all
 *
 * Node stdlib only (global fetch, Node 18+) — no package.json, no deps.
 * Run tests with:  node --test
 */

// ---------------------------------------------------------------------------
// Constants — every number here traces to a primary source. Do not "tidy"
// these without re-reading the citation; the whole point of this file is that
// these stopped being vibes.
// ---------------------------------------------------------------------------

/** Single sitemap hard limits. Google Search Central, "Build and submit a sitemap". */
const SITEMAP_MAX_URLS = 50000;
const SITEMAP_MAX_BYTES = 50 * 1024 * 1024; // 50 MB uncompressed

/** robots.txt parse cap. Google, "How Google interprets the robots.txt specification". */
const ROBOTS_MAX_BYTES = 500 * 1024; // 500 KiB

/**
 * Retrieval/search crawlers — these decide whether you can be *cited* in an AI
 * answer. Blocking one of these removes you from that engine's answers.
 */
const RETRIEVAL_BOTS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"];

/** Training-corpus crawlers — blocking these does not affect citation. */
const TRAINING_BOTS = ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Applebot-Extended"];

/** User-initiated fetch agents — fire when a human asks the assistant to open a page. */
const USER_AGENT_BOTS = ["ChatGPT-User", "Claude-User", "Perplexity-User"];

/** The roster Pass A counts "named" against. */
const ALL_AI_BOTS = [...RETRIEVAL_BOTS, ...TRAINING_BOTS, ...USER_AGENT_BOTS];

/** Pass A requires an explicit policy on at least this many AI crawlers. */
const AI_BOT_NAMED_THRESHOLD = 3;

/** Router gate: >= this many of 10 checks means "past bootstrap". */
const HEALTHY_THRESHOLD = 8;

/** Critical architectural checks for --strict blocker mode. */
const CRITICAL_CHECKS = ["canonical", "aibots", "robots", "sitemap"];

const DEFAULT_TIMEOUT_MS = 15000;
const UA = "seo-superpower-baseline-check/1.0 (+https://github.com/benskamps/seo-superpower)";

// ---------------------------------------------------------------------------
// robots.txt parsing + group resolution
//
// Deliberately a real implementation of the matching rules rather than a
// substring search, because "is GPTBot mentioned" and "can GPTBot fetch /" are
// different questions and only the second one predicts anything.
// ---------------------------------------------------------------------------

/**
 * Parse robots.txt into groups. A group is one or more consecutive
 * `User-agent:` lines followed by their rules. Blank lines and comments are
 * ignored; unknown directives are collected but not interpreted.
 *
 * Returns { groups: [{ agents: string[], rules: [{type, path}] }], sitemaps: string[] }
 */
function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  if (typeof text !== "string") return { groups, sitemaps };

  let current = null;
  let lastLineWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      // Consecutive user-agent lines share one rule block.
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      if (value) current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }

    lastLineWasAgent = false;

    if (field === "sitemap") {
      // Sitemap is a non-group directive — valid anywhere in the file.
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === "allow" || field === "disallow") {
      if (!current) continue; // rule before any user-agent — ignored, per spec
      current.rules.push({ type: field, path: value });
    }
  }

  return { groups, sitemaps };
}

/**
 * Find the group that applies to `agent`. Google's rule: the most specific
 * matching user-agent token wins (longest match), and `*` is the fallback.
 * Matching is case-insensitive and prefix-based on the token.
 */
function groupForAgent(groups, agent) {
  const needle = String(agent).toLowerCase();
  let best = null;
  let bestLen = -1;
  let wildcard = null;

  for (const group of groups) {
    for (const token of group.agents) {
      if (token === "*") {
        if (!wildcard) wildcard = group;
        continue;
      }
      // A record matches if the agent name starts with the token.
      if (needle.startsWith(token) && token.length > bestLen) {
        best = group;
        bestLen = token.length;
      }
    }
  }

  return best || wildcard || null;
}

/**
 * Does a robots.txt path pattern match `urlPath`? Supports the two wildcards
 * Google honours: `*` (any run of characters) and `$` (end anchor).
 */
function pathMatches(pattern, urlPath) {
  if (pattern === "") return false; // empty Disallow means "allow everything"
  let regex = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") regex += ".*";
    else if (ch === "$" && i === pattern.length - 1) regex += "$";
    else regex += ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  try {
    return new RegExp("^" + regex).test(urlPath);
  } catch {
    return false;
  }
}

/**
 * Can `agent` fetch `urlPath`? Longest matching rule wins; Allow beats Disallow
 * on an exact-length tie; no matching rule means allowed.
 */
function isAllowed(groups, agent, urlPath = "/") {
  const group = groupForAgent(groups, agent);
  if (!group) return true;

  let verdict = true;
  let bestLen = -1;

  for (const rule of group.rules) {
    if (!pathMatches(rule.path, urlPath)) continue;
    const len = rule.path.length;
    if (len > bestLen) {
      bestLen = len;
      verdict = rule.type === "allow";
    } else if (len === bestLen && rule.type === "allow") {
      verdict = true; // Allow wins ties
    }
  }

  return verdict;
}

/** Is this agent explicitly named (own group, not just covered by `*`)? */
function isNamed(groups, agent) {
  const needle = String(agent).toLowerCase();
  return groups.some((g) => g.agents.some((t) => t !== "*" && needle.startsWith(t)));
}

/**
 * Full AI-crawler report: who is named, who can actually reach the site, and —
 * the question that matters for GEO — which citation-driving retrieval bots are
 * effectively blocked.
 */
function analyzeAiBots(groups) {
  const named = ALL_AI_BOTS.filter((b) => isNamed(groups, b));
  const blockedRetrieval = RETRIEVAL_BOTS.filter((b) => !isAllowed(groups, b, "/"));
  const allowedRetrieval = RETRIEVAL_BOTS.filter((b) => isAllowed(groups, b, "/"));
  return {
    named,
    namedCount: named.length,
    missing: ALL_AI_BOTS.filter((b) => !named.includes(b)),
    retrievalNamed: RETRIEVAL_BOTS.filter((b) => isNamed(groups, b)),
    retrievalAllowed: allowedRetrieval,
    retrievalBlocked: blockedRetrieval,
    citationReady: blockedRetrieval.length === 0,
  };
}

// ---------------------------------------------------------------------------
// HTML head parsing — regex-based on purpose. We are checking for presence and
// shape of a handful of tags across arbitrary third-party HTML; a real parser
// would be a dependency, and this file has none.
// ---------------------------------------------------------------------------

function firstMatch(html, re) {
  const m = re.exec(html);
  return m ? m[1].trim() : null;
}

function parseHead(html) {
  if (typeof html !== "string") html = "";

  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = firstMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
  ) ?? firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonical = firstMatch(
    html,
    /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i,
  ) ?? firstMatch(html, /<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const viewport = firstMatch(
    html,
    /<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']*)["']/i,
  );
  const robotsMeta = firstMatch(
    html,
    /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i,
  );

  // JSON-LD blocks: count them, and count how many actually parse.
  const jsonLdBlocks = [];
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html)) !== null) jsonLdBlocks.push(m[1]);

  let jsonLdValid = 0;
  const jsonLdTypes = [];
  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block.trim());
      jsonLdValid++;
      collectTypes(parsed, jsonLdTypes);
    } catch {
      /* invalid block — counted in jsonLdCount but not jsonLdValid */
    }
  }

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;

  return {
    title,
    titleLength: title ? title.length : 0,
    description,
    descriptionLength: description ? description.length : 0,
    canonical,
    viewport,
    robotsMeta,
    noindex: robotsMeta ? /noindex/i.test(robotsMeta) : false,
    jsonLdCount: jsonLdBlocks.length,
    jsonLdValid,
    jsonLdTypes,
    h1Count,
  };
}

/** Walk a parsed JSON-LD value and collect every @type seen (handles @graph). */
function collectTypes(node, out) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
    return;
  }
  const t = node["@type"];
  if (typeof t === "string") out.push(t);
  else if (Array.isArray(t)) for (const x of t) if (typeof x === "string") out.push(x);
  if (Array.isArray(node["@graph"])) collectTypes(node["@graph"], out);
}

// ---------------------------------------------------------------------------
// Sitemap parsing
// ---------------------------------------------------------------------------

function parseSitemap(text, byteLength) {
  const isXml = typeof text === "string" && /<(urlset|sitemapindex)\b/i.test(text);
  const isIndex = typeof text === "string" && /<sitemapindex\b/i.test(text);
  const urlCount = typeof text === "string" ? (text.match(/<loc\b/gi) || []).length : 0;
  return {
    isXml,
    isIndex,
    urlCount,
    bytes: byteLength,
    overUrlLimit: urlCount > SITEMAP_MAX_URLS,
    overByteLimit: typeof byteLength === "number" && byteLength > SITEMAP_MAX_BYTES,
  };
}

// ---------------------------------------------------------------------------
// Pass A scoring — the 10 checks from skills/seo-superpower/SKILL.md step 4,
// in the same order, so the script and the prose stay auditable against
// each other.
// ---------------------------------------------------------------------------

function scoreBaseline({ robots, sitemap, head, https }) {
  const items = [
    {
      id: "robots",
      label: "robots.txt 200 + non-empty + Sitemap: line",
      pass: Boolean(robots.ok && robots.nonEmpty && robots.sitemaps.length > 0),
      detail: !robots.ok
        ? `HTTP ${robots.status ?? "error"}`
        : !robots.nonEmpty
          ? "empty file"
          : robots.sitemaps.length === 0
            ? "no Sitemap: line"
            : `${robots.sitemaps.length} sitemap ref(s)`,
    },
    {
      id: "sitemap",
      label: "sitemap.xml 200 + valid XML + >0 URLs",
      pass: Boolean(sitemap.ok && sitemap.isXml && sitemap.urlCount > 0),
      detail: !sitemap.ok
        ? `HTTP ${sitemap.status ?? "error"}`
        : !sitemap.isXml
          ? "not valid sitemap XML"
          : `${sitemap.urlCount} URL(s)${sitemap.isIndex ? " (index)" : ""}`,
    },
    {
      id: "title",
      label: "<title> present",
      pass: Boolean(head.title),
      detail: head.title ? `${head.titleLength} chars` : "missing",
    },
    {
      id: "description",
      label: "<meta name=description> present",
      pass: Boolean(head.description),
      detail: head.description ? `${head.descriptionLength} chars` : "missing",
    },
    {
      id: "canonical",
      label: "<link rel=canonical> present",
      pass: Boolean(head.canonical),
      detail: head.canonical || "missing",
    },
    {
      id: "viewport",
      label: "<meta name=viewport> present",
      pass: Boolean(head.viewport),
      detail: head.viewport || "missing",
    },
    {
      id: "jsonld",
      label: "at least one valid JSON-LD block",
      pass: head.jsonLdValid > 0,
      detail:
        head.jsonLdCount === 0
          ? "none"
          : `${head.jsonLdValid}/${head.jsonLdCount} valid` +
            (head.jsonLdTypes.length ? ` — ${[...new Set(head.jsonLdTypes)].join(", ")}` : ""),
    },
    {
      id: "https",
      label: "HTTPS + valid certificate",
      pass: Boolean(https),
      detail: https === "local" ? "local directory audit (skipped)" : (https ? "ok" : "fetch over HTTPS failed"),
    },
    {
      id: "h1",
      label: "exactly one <h1>",
      pass: head.h1Count === 1,
      detail: `${head.h1Count} found`,
    },
    {
      id: "aibots",
      label: `AI-bot policy on >=${AI_BOT_NAMED_THRESHOLD} crawlers`,
      pass: robots.aiBots.namedCount >= AI_BOT_NAMED_THRESHOLD,
      detail:
        robots.aiBots.namedCount === 0
          ? "no AI crawler named"
          : `${robots.aiBots.namedCount} named — ${robots.aiBots.named.join(", ")}`,
    },
  ];

  const passed = items.filter((i) => i.pass).length;
  const blockers = items.filter((i) => CRITICAL_CHECKS.includes(i.id) && !i.pass).map((i) => i.id);
  return {
    items,
    passed,
    total: items.length,
    healthy: passed >= HEALTHY_THRESHOLD,
    blockers,
    strictPass: passed >= HEALTHY_THRESHOLD && blockers.length === 0,
  };
}

function routeFor(result, aiBots) {
  if (result.healthy) {
    return {
      decision: "growth",
      skill: "finding-underserved-keywords (GSC data) or planning-topic-clusters (no GSC)",
      why: `${result.passed}/${result.total} baseline checks pass — past bootstrap`,
    };
  }
  const failing = result.items.filter((i) => !i.pass).map((i) => i.id);
  const structural = failing.some((f) => ["robots", "sitemap", "jsonld"].includes(f));
  return {
    decision: structural ? "bootstrap" : "audit",
    skill: structural ? "seo-bootstrap" : "auditing-technical-seo",
    why: `${result.passed}/${result.total} baseline checks pass — failing: ${failing.join(", ")}`,
  };
}

// ---------------------------------------------------------------------------
// I/O shell
// ---------------------------------------------------------------------------

function normalizeUrl(input) {
  let u = String(input || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "*/*" },
    });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      text: body,
      bytes: Buffer.byteLength(body, "utf8"),
      finalUrl: res.url,
    };
  } catch (err) {
    return { ok: false, status: null, text: "", bytes: 0, error: String(err && err.message) };
  } finally {
    clearTimeout(timer);
  }
}

async function runBaseline(rawUrl, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error(`unparseable URL: ${rawUrl}`);

  const origin = url.origin;
  const [homeRes, robotsRes] = await Promise.all([
    fetchText(origin + "/", timeoutMs),
    fetchText(origin + "/robots.txt", timeoutMs),
  ]);

  const robotsParsed = parseRobots(robotsRes.ok ? robotsRes.text : "");
  const aiBots = analyzeAiBots(robotsParsed.groups);

  // Prefer a sitemap the site actually declares; fall back to the conventional path.
  const declared = robotsParsed.sitemaps[0];
  const sitemapUrl = declared || origin + "/sitemap.xml";
  const sitemapRes = await fetchText(sitemapUrl, timeoutMs);
  const sitemapParsed = parseSitemap(sitemapRes.ok ? sitemapRes.text : "", sitemapRes.bytes);

  const head = parseHead(homeRes.ok ? homeRes.text : "");

  const robots = {
    ok: robotsRes.ok,
    status: robotsRes.status,
    nonEmpty: robotsRes.ok && robotsRes.text.trim().length > 0,
    bytes: robotsRes.bytes,
    overSizeLimit: robotsRes.bytes > ROBOTS_MAX_BYTES,
    sitemaps: robotsParsed.sitemaps,
    groups: robotsParsed.groups,
    aiBots,
  };

  const sitemap = { ok: sitemapRes.ok, status: sitemapRes.status, url: sitemapUrl, ...sitemapParsed };

  const result = scoreBaseline({ robots, sitemap, head, https: homeRes.ok });
  const route = routeFor(result, aiBots);

  return { url: origin, homeStatus: homeRes.status, robots, sitemap, head, result, route, aiBots };
}

function runBaselineDir(rawDir, { strict = false } = {}) {
  const dirPath = path.resolve(rawDir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`directory not found: ${rawDir}`);
  }

  // 1. robots.txt (check root then public/)
  const robotsCandidates = [
    path.join(dirPath, "robots.txt"),
    path.join(dirPath, "public", "robots.txt"),
  ];
  const robotsPath = robotsCandidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  let robotsText = "";
  let robotsBytes = 0;
  let robotsOk = false;
  let robotsStatus = 404;

  if (robotsPath) {
    try {
      robotsText = fs.readFileSync(robotsPath, "utf8");
      robotsBytes = Buffer.byteLength(robotsText, "utf8");
      robotsOk = true;
      robotsStatus = 200;
    } catch {
      robotsStatus = 500;
    }
  }

  const robotsParsed = parseRobots(robotsOk ? robotsText : "");
  const aiBots = analyzeAiBots(robotsParsed.groups);

  // 2. sitemap.xml (check declared filename, root sitemap.xml, then public/)
  const sitemapCandidates = [];
  if (robotsParsed.sitemaps.length > 0) {
    const declared = robotsParsed.sitemaps[0];
    try {
      const u = new URL(declared, "http://localhost");
      const filename = path.basename(u.pathname);
      if (filename) {
        sitemapCandidates.push(path.join(dirPath, filename));
        sitemapCandidates.push(path.join(dirPath, "public", filename));
      }
    } catch {}
  }
  sitemapCandidates.push(path.join(dirPath, "sitemap.xml"));
  sitemapCandidates.push(path.join(dirPath, "public", "sitemap.xml"));

  const sitemapPath = sitemapCandidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  let sitemapText = "";
  let sitemapBytes = 0;
  let sitemapOk = false;
  let sitemapStatus = 404;

  if (sitemapPath) {
    try {
      sitemapText = fs.readFileSync(sitemapPath, "utf8");
      sitemapBytes = Buffer.byteLength(sitemapText, "utf8");
      sitemapOk = true;
      sitemapStatus = 200;
    } catch {
      sitemapStatus = 500;
    }
  }

  const sitemapParsed = parseSitemap(sitemapOk ? sitemapText : "", sitemapBytes);

  // 3. index.html (root then public/)
  const htmlCandidates = [
    path.join(dirPath, "index.html"),
    path.join(dirPath, "public", "index.html"),
  ];
  const htmlPath = htmlCandidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
  let htmlText = "";
  let homeStatus = 404;

  if (htmlPath) {
    try {
      htmlText = fs.readFileSync(htmlPath, "utf8");
      homeStatus = 200;
    } catch {
      homeStatus = 500;
    }
  }

  const head = parseHead(homeStatus === 200 ? htmlText : "");

  const robots = {
    ok: robotsOk,
    status: robotsStatus,
    nonEmpty: robotsOk && robotsText.trim().length > 0,
    bytes: robotsBytes,
    overSizeLimit: robotsBytes > ROBOTS_MAX_BYTES,
    sitemaps: robotsParsed.sitemaps,
    groups: robotsParsed.groups,
    aiBots,
  };

  const sitemap = {
    ok: sitemapOk,
    status: sitemapStatus,
    url: sitemapPath || path.join(dirPath, "sitemap.xml"),
    ...sitemapParsed,
  };

  const result = scoreBaseline({ robots, sitemap, head, https: "local" });
  const route = routeFor(result, aiBots);

  return {
    url: dirPath,
    isLocalDir: true,
    homeStatus,
    robots,
    sitemap,
    head,
    result,
    route,
    aiBots,
  };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function report(r, { strict = false } = {}) {
  const lines = [];
  lines.push(`Baseline — ${r.url}${r.isLocalDir ? " [local directory audit]" : ""}`);
  lines.push("");
  const statusLabel = r.result.healthy ? "HEALTHY" : "INCOMPLETE";
  lines.push(`Pass A: ${r.result.passed}/${r.result.total}  ${statusLabel}`);
  if (strict) {
    lines.push(`Strict mode: ${r.result.strictPass ? "PASS (no critical blockers)" : "FAIL (critical blockers present)"}`);
  }
  lines.push("");
  for (const item of r.result.items) {
    lines.push(`  ${item.pass ? "PASS" : "FAIL"}  ${item.label}`);
    lines.push(`        ${item.detail}`);
  }
  lines.push("");

  if (r.result.blockers && r.result.blockers.length > 0) {
    lines.push(`Blockers (${r.result.blockers.length} critical check(s) failing):`);
    for (const b of r.result.blockers) {
      lines.push(`  ❌ ${b}`);
    }
    lines.push("");
  }

  // GEO citation readiness — the part the old prose check could not answer.
  lines.push("AI citation readiness (retrieval bots — these decide if you can be cited):");
  for (const bot of RETRIEVAL_BOTS) {
    const allowed = r.aiBots.retrievalAllowed.includes(bot);
    const named = r.aiBots.retrievalNamed.includes(bot);
    lines.push(
      `  ${allowed ? "ALLOWED" : "BLOCKED"}  ${bot}${named ? "" : "  (not named — inherits User-agent: *)"}`,
    );
  }
  if (!r.aiBots.citationReady) {
    lines.push("");
    lines.push(`  WARNING: ${r.aiBots.retrievalBlocked.join(", ")} blocked — you cannot be cited by that engine.`);
  }
  lines.push("");

  if (r.robots.overSizeLimit) {
    lines.push(`  WARNING: robots.txt is ${r.robots.bytes} bytes — over Google's ${ROBOTS_MAX_BYTES}-byte parse cap.`);
  }
  if (r.sitemap.overUrlLimit) {
    lines.push(`  WARNING: sitemap has ${r.sitemap.urlCount} URLs — over the ${SITEMAP_MAX_URLS} limit. Use a sitemap index.`);
  }
  if (r.sitemap.overByteLimit) {
    lines.push(`  WARNING: sitemap is ${r.sitemap.bytes} bytes — over the ${SITEMAP_MAX_BYTES}-byte limit.`);
  }

  lines.push(`Route: ${r.route.decision} -> ${r.route.skill}`);
  lines.push(`       ${r.route.why}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const strict = args.includes("--strict");
  const timeoutArg = args.find((a) => a.startsWith("--timeout="));
  const timeoutMs = timeoutArg ? Number(timeoutArg.split("=")[1]) || DEFAULT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

  const dirIdx = args.indexOf("--dir");
  let dirTarget = null;
  if (dirIdx !== -1 && args[dirIdx + 1] && !args[dirIdx + 1].startsWith("--")) {
    dirTarget = args[dirIdx + 1];
  } else {
    const dirArg = args.find((a) => a.startsWith("--dir="));
    if (dirArg) dirTarget = dirArg.split("=")[1];
  }

  const nonFlagArgs = args.filter((a) => !a.startsWith("--") && (dirIdx === -1 || a !== args[dirIdx + 1]));
  const target = dirTarget || nonFlagArgs[0];

  if (!target) {
    process.stderr.write("usage: node scripts/baseline-check.js <url> [--json] [--strict] [--timeout=ms]\n       node scripts/baseline-check.js --dir <path> [--json] [--strict]\n");
    return 2;
  }

  let isDir = Boolean(dirTarget);
  if (!isDir) {
    try {
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        isDir = true;
      }
    } catch {}
  }

  let r;
  try {
    if (isDir) {
      r = runBaselineDir(target, { strict });
    } else {
      r = await runBaseline(target, { timeoutMs });
    }
  } catch (err) {
    process.stderr.write(`baseline-check: ${err.message}\n`);
    return 2;
  }

  if (r.homeStatus === null || (isDir && r.homeStatus === 404 && !r.robots.ok && !r.sitemap.ok)) {
    process.stderr.write(`baseline-check: could not find or fetch target ${target}\n`);
    return 2;
  }

  process.stdout.write((json ? JSON.stringify(r, null, 2) : report(r, { strict })) + "\n");
  const passCondition = strict ? r.result.strictPass : r.result.healthy;
  return passCondition ? 0 : 1;
}

if (require.main === module) {
  main(process.argv).then((code) => process.exit(code));
}

module.exports = {
  parseRobots,
  groupForAgent,
  pathMatches,
  isAllowed,
  isNamed,
  analyzeAiBots,
  parseHead,
  collectTypes,
  parseSitemap,
  scoreBaseline,
  routeFor,
  normalizeUrl,
  runBaseline,
  runBaselineDir,
  report,
  CRITICAL_CHECKS,
  SITEMAP_MAX_URLS,
  SITEMAP_MAX_BYTES,
  ROBOTS_MAX_BYTES,
  RETRIEVAL_BOTS,
  TRAINING_BOTS,
  USER_AGENT_BOTS,
  ALL_AI_BOTS,
  HEALTHY_THRESHOLD,
  main,
};
