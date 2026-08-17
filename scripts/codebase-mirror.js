#!/usr/bin/env node
/**
 * scripts/codebase-mirror.js — the Competitor Codebase Mirror.
 *
 * VISION.md moat #4: "Scrapes a competitor's HTML, reverse-engineers their
 * schema/heading/link patterns, writes 'things they do you don't' ranked by
 * SERP delta."
 *
 * This is the deterministic, offline core of that demo:
 *
 *   1. extractSignals()  — pure: one page's HTML -> an implementation
 *                          fingerprint (schema types, heading shape, link
 *                          architecture, meta coverage, rendering mode, stack).
 *   2. summarizeSite()   — pure: N page fingerprints -> per-site *rates*
 *                          (what fraction of pages do this), not anecdotes.
 *   3. findGaps()        — pure, DIRECTIONAL: only patterns THEY ship that YOU
 *                          don't. A thing you do and they don't is not a gap.
 *   4. rankGaps()        — pure: severity x SERP delta -> ranked impact list.
 *   5. loadPages()       — the fetch step (live HTTP or local HTML files),
 *                          robots.txt-gated, injectable for tests.
 *   6. runMirror()       — orchestrates 2-4 into one report.
 *   7. formatReport()    — human-readable render for the CLI.
 *
 * WHAT IS BUILT vs A SEAM
 *   Built and unit-tested: everything above, against deterministic HTML
 *   fixtures (`fixtures/codebase-mirror/`). No LLM anywhere, no judgment calls
 *   at runtime — every gap comes from a named threshold constant below.
 *
 *   Seams (documented, not faked):
 *     - WHICH pages to compare. This tool mirrors the URLs you hand it. Picking
 *       the competitor's ranking pages is the SERP step — `analyzing-content-gaps`
 *       (Firecrawl SERP scrape) or your own GSC data.
 *     - The SERP delta used for ranking. Positions come from GSC via
 *       `finding-underserved-keywords`, passed in with `--serp <file.json>`.
 *       With no positions the ranking degrades to severity-only and SAYS SO
 *       (`serp: "unknown"` + a warning). It never invents a position.
 *
 * HONESTY ABOUT WHAT THIS SEES
 *   This reads the HTML a crawler gets. It does not read the competitor's
 *   source repo — "codebase mirror" means reverse-engineering the *shipped*
 *   implementation (what their templates emit), which is exactly what a search
 *   or answer engine judges them on. Client-rendered content that never lands
 *   in the HTML is invisible here — and that is the point: it is invisible to
 *   the crawler too, which is why `rendering` is one of the gap axes.
 *
 * POLITENESS
 *   Live fetches honour the competitor's robots.txt for our user-agent (reusing
 *   the robots group resolver from scripts/baseline-check.js — most-specific
 *   group wins, longest path rule wins, Allow breaks ties) and rate-limit to one
 *   request per origin per --delay ms. A disallowed page is skipped with a
 *   warning, never fetched anyway.
 *
 * Node stdlib only — no package.json, no deps. Exports pure functions for
 * `node --test`; runs as a CLI when invoked directly.
 *
 * CLI:
 *   node scripts/codebase-mirror.js --ours <url|file>... --theirs <url|file>...
 *     [--serp <positions.json>] [--json <out.json>] [--fail-on-high]
 *     [--delay <ms>] [--timeout <ms>]
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseRobots, isAllowed } = require("./baseline-check.js");

const UA = "seo-superpower-codebase-mirror/1.0 (+https://github.com/benskamps/seo-superpower)";
const DEFAULT_TIMEOUT_MS = 15000;
/** One request per origin per this many ms. Politeness, not performance. */
const DEFAULT_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Thresholds. Every gap this tool reports traces to one of these constants.
// They are deliberately conservative: a "gap" should mean a *pattern*, not one
// page's accident, so most rules need the competitor to do the thing on at
// least half their sampled pages.
// ---------------------------------------------------------------------------

/** A schema type counts as "their pattern" at >= this share of their pages. */
const SCHEMA_PATTERN_RATE = 0.5;
/** Rate-delta (theirs - ours) needed to call a coverage axis a gap. */
const COVERAGE_GAP_DELTA = 0.3;
/** Question-heading rate delta needed to flag the AIO-answer-shape gap. */
const QUESTION_HEADING_GAP_DELTA = 0.25;
/** Their median internal links must be this multiple of ours, AND ... */
const INTERNAL_LINK_GAP_RATIO = 1.5;
/** ... at least this many more links, before internal-link depth is a gap. */
const INTERNAL_LINK_GAP_ABSOLUTE = 5;
/** Their median word count must exceed ours by this multiple to flag depth. */
const DEPTH_GAP_RATIO = 1.25;
/** Their server-rendered rate minus ours, to flag the rendering gap. */
const RENDERING_GAP_DELTA = 0.5;
/** Below this many words in the delivered HTML, a page is a client-side shell. */
const CLIENT_SHELL_WORD_FLOOR = 50;

const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 };

/**
 * SERP-delta multipliers. `delta` = ourPosition - theirPosition, so a positive
 * delta means they outrank us. The multiplier encodes how much weight to give
 * their patterns as evidence: if they beat us decisively, copy the pattern; if
 * we already outrank them, their pattern is weak evidence, not a mandate.
 */
const SERP_MULTIPLIERS = [
  { minDelta: 10, multiplier: 2.0, label: "they outrank you decisively" },
  { minDelta: 3, multiplier: 1.5, label: "they outrank you clearly" },
  { minDelta: 0.0001, multiplier: 1.2, label: "they edge you out" },
  { minDelta: -Infinity, multiplier: 0.75, label: "you already outrank them" },
];
const SERP_UNKNOWN_MULTIPLIER = 1.0;

/** Anchor texts that carry no topical signal. Lowercased, punctuation-stripped. */
const GENERIC_ANCHORS = new Set([
  "click here", "here", "read more", "learn more", "more", "this", "link",
  "continue reading", "see more", "details", "view", "go", "download",
]);

/** Markup fingerprints -> framework. First hit wins; `generator` meta beats all. */
const STACK_FINGERPRINTS = [
  { framework: "next.js", re: /__NEXT_DATA__|\/_next\/static/ },
  { framework: "astro", re: /astro-island|\/_astro\/|data-astro-/ },
  { framework: "sveltekit", re: /__sveltekit|\/_app\/immutable\// },
  { framework: "nuxt", re: /__NUXT__|\/_nuxt\// },
  { framework: "gatsby", re: /___gatsby|\/page-data\// },
  { framework: "wordpress", re: /\/wp-content\/|\/wp-includes\// },
  { framework: "hugo", re: /<meta[^>]+name=["']generator["'][^>]+content=["']Hugo/i },
];

// ---------------------------------------------------------------------------
// 1. Signal extraction (pure)
// ---------------------------------------------------------------------------

function firstMatch(html, re) {
  const m = re.exec(html);
  return m ? m[1].trim() : null;
}

/** Strip tags + collapse whitespace + decode the handful of entities that matter. */
function textOf(fragment) {
  return String(fragment == null ? "" : fragment)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#0*39;|&apos;|&rsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Visible body text word count — scripts, styles, and <head> excluded. */
function bodyWordCount(html) {
  const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  const body = bodyMatch ? bodyMatch[1] : html.replace(/<head[\s\S]*?<\/head>/i, "");
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const text = textOf(stripped);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Collect the *page-level* JSON-LD types: the @type of each top-level node and
 * of each `@graph` member — and nothing deeper.
 *
 * Deliberately not recursive. A FAQPage contains Question nodes and a
 * BreadcrumbList contains ListItem nodes; recursing would report "they ship
 * Question schema and you don't" as a finding separate from "they ship FAQPage
 * and you don't", which is the same gap counted twice. What a page is marked up
 * *as* lives at the top level.
 */
function collectTypes(node, out) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
    return;
  }
  const t = node["@type"];
  if (typeof t === "string") out.push(t);
  else if (Array.isArray(t)) for (const x of t) if (typeof x === "string") out.push(x);
  if (Array.isArray(node["@graph"])) {
    for (const item of node["@graph"]) collectTypes(item, out);
  }
}

/** Pull `dateModified` out of any JSON-LD block, if present. */
function findDateModified(node) {
  if (node === null || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findDateModified(item);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node.dateModified === "string" && node.dateModified.trim()) {
    return node.dateModified.trim();
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") {
      const hit = findDateModified(value);
      if (hit) return hit;
    }
  }
  return null;
}

function normalizeAnchor(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Reverse-engineer one page's shipped implementation.
 *
 * @param {string} html raw HTML as a crawler receives it
 * @param {string|null} url the page URL (used to classify internal vs external
 *   links). When absent, the page's own `<link rel=canonical>` supplies the
 *   origin; with neither, absolute links count as external and relative ones as
 *   internal, which is the conservative read.
 */
function extractSignals(html, url = null) {
  const src = typeof html === "string" ? html : "";

  // --- meta ---------------------------------------------------------------
  const title = firstMatch(src, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    firstMatch(src, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) ??
    firstMatch(src, /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonical =
    firstMatch(src, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ??
    firstMatch(src, /<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const robotsMeta = firstMatch(src, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const generator = firstMatch(src, /<meta[^>]+name=["']generator["'][^>]*content=["']([^"']*)["']/i);
  const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(src);
  const hasOgImage = /<meta[^>]+property=["']og:image["']/i.test(src);
  const hasTwitterCard = /<meta[^>]+name=["']twitter:card["']/i.test(src);
  const hreflangCount = (src.match(/<link[^>]+rel=["']alternate["'][^>]+hreflang=/gi) || []).length;

  // --- schema -------------------------------------------------------------
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = ldRe.exec(src)) !== null) blocks.push(m[1]);
  const types = [];
  let valid = 0;
  let dateModified = null;
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block.trim());
      valid++;
      collectTypes(parsed, types);
      dateModified = dateModified || findDateModified(parsed);
    } catch {
      /* malformed block: counted in blocks, not in valid */
    }
  }

  // --- headings -----------------------------------------------------------
  const headings = { h1: [], h2: [], h3: [] };
  const hRe = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  while ((m = hRe.exec(src)) !== null) {
    const text = textOf(m[2]);
    if (text) headings[`h${m[1]}`].push(text);
  }
  const subHeadings = headings.h2.concat(headings.h3);
  const questionHeadings = subHeadings.filter((h) => /\?\s*$/.test(h) ||
    /^(how|what|why|when|where|which|who|can|do|does|is|are|should)\b/i.test(h)).length;

  // --- links --------------------------------------------------------------
  const selfHost = hostOf(url) || hostOf(canonical);
  let internal = 0;
  let external = 0;
  let genericAnchors = 0;
  let descriptiveAnchors = 0;
  const internalTargets = new Set();
  const aRe = /<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = aRe.exec(src)) !== null) {
    const href = m[1].trim();
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
    const absolute = /^https?:\/\//i.test(href);
    let isInternal;
    if (absolute) {
      isInternal = selfHost !== null && hostOf(href) === selfHost;
    } else {
      isInternal = true; // relative href -> same site by definition
    }
    if (isInternal) {
      internal++;
      internalTargets.add(href.split("#")[0]);
    } else {
      external++;
    }
    const anchor = normalizeAnchor(textOf(m[2]));
    if (!anchor) continue;
    if (GENERIC_ANCHORS.has(anchor)) genericAnchors++;
    else descriptiveAnchors++;
  }

  // --- media --------------------------------------------------------------
  const imgTags = src.match(/<img\b[^>]*>/gi) || [];
  const imagesWithAlt = imgTags.filter((t) => /\balt=["'][^"']+["']/i.test(t)).length;

  // --- stack + rendering --------------------------------------------------
  let framework = "unknown";
  const evidence = [];
  if (generator) {
    evidence.push(`generator: ${generator}`);
    const g = generator.toLowerCase();
    for (const name of ["next.js", "astro", "sveltekit", "nuxt", "gatsby", "hugo", "wordpress", "eleventy", "jekyll"]) {
      if (g.includes(name)) { framework = name; break; }
    }
  }
  if (framework === "unknown") {
    for (const fp of STACK_FINGERPRINTS) {
      if (fp.re.test(src)) { framework = fp.framework; evidence.push(`markup fingerprint: ${fp.framework}`); break; }
    }
  }
  const words = bodyWordCount(src);
  const scriptCount = (src.match(/<script\b/gi) || []).length;
  const rendering = words < CLIENT_SHELL_WORD_FLOOR && scriptCount > 0 ? "client-shell" : "server-html";

  return {
    url: url || canonical || null,
    meta: {
      title,
      titleLength: title ? title.length : 0,
      description,
      descriptionLength: description ? description.length : 0,
      canonical,
      robotsMeta,
      noindex: robotsMeta ? /noindex/i.test(robotsMeta) : false,
      hasOgTitle,
      hasOgImage,
      hasTwitterCard,
      hreflangCount,
    },
    schema: {
      blocks: blocks.length,
      valid,
      types: Array.from(new Set(types)).sort(),
    },
    headings: {
      h1: headings.h1,
      h2: headings.h2,
      h3: headings.h3,
      counts: { h1: headings.h1.length, h2: headings.h2.length, h3: headings.h3.length },
      questionHeadings,
    },
    links: {
      internal,
      external,
      uniqueInternal: internalTargets.size,
      genericAnchors,
      descriptiveAnchors,
    },
    media: { images: imgTags.length, imagesWithAlt },
    content: { words, scripts: scriptCount, rendering },
    stack: { framework, evidence },
    freshness: { dateModified },
  };
}

// ---------------------------------------------------------------------------
// 2. Site summary (pure)
// ---------------------------------------------------------------------------

function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function rate(count, total) {
  return total ? Number((count / total).toFixed(4)) : 0;
}

/**
 * Fold N page fingerprints into per-site *rates*. Rates, not totals: a site with
 * 12 sampled pages and one with 3 must stay comparable, and "they do X on every
 * page" is a pattern while "they did X once" is an anecdote.
 */
function summarizeSite(signals, label = "site") {
  const pages = signals.length;
  const typeCounts = new Map();
  for (const s of signals) {
    for (const t of new Set(s.schema.types)) {
      typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    }
  }
  const schemaTypeRates = {};
  for (const [type, count] of Array.from(typeCounts.entries()).sort()) {
    schemaTypeRates[type] = rate(count, pages);
  }

  const frameworkCounts = {};
  for (const s of signals) {
    frameworkCounts[s.stack.framework] = (frameworkCounts[s.stack.framework] || 0) + 1;
  }
  const framework = Object.entries(frameworkCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  const images = signals.reduce((n, s) => n + s.media.images, 0);
  const imagesWithAlt = signals.reduce((n, s) => n + s.media.imagesWithAlt, 0);
  const anchors = signals.reduce((n, s) => n + s.links.genericAnchors + s.links.descriptiveAnchors, 0);
  const descriptive = signals.reduce((n, s) => n + s.links.descriptiveAnchors, 0);
  const subHeadings = signals.reduce((n, s) => n + s.headings.counts.h2 + s.headings.counts.h3, 0);
  const questionHeadings = signals.reduce((n, s) => n + s.headings.questionHeadings, 0);

  return {
    label,
    pages,
    schemaTypeRates,
    schemaRate: rate(signals.filter((s) => s.schema.valid > 0).length, pages),
    descriptionRate: rate(signals.filter((s) => s.meta.description).length, pages),
    canonicalRate: rate(signals.filter((s) => s.meta.canonical).length, pages),
    ogRate: rate(signals.filter((s) => s.meta.hasOgTitle && s.meta.hasOgImage).length, pages),
    hreflangRate: rate(signals.filter((s) => s.meta.hreflangCount > 0).length, pages),
    serverRenderedRate: rate(signals.filter((s) => s.content.rendering === "server-html").length, pages),
    freshnessRate: rate(signals.filter((s) => s.freshness.dateModified).length, pages),
    questionHeadingRate: rate(questionHeadings, subHeadings),
    altRate: rate(imagesWithAlt, images),
    descriptiveAnchorRate: rate(descriptive, anchors),
    medianInternalLinks: median(signals.map((s) => s.links.internal)),
    medianWords: median(signals.map((s) => s.content.words)),
    medianH2: median(signals.map((s) => s.headings.counts.h2)),
    framework: framework ? framework[0] : "unknown",
  };
}

// ---------------------------------------------------------------------------
// 3. Gap finding (pure, DIRECTIONAL)
// ---------------------------------------------------------------------------

function gap({ id, axis, label, theirs, ours, severity, evidence, handoff }) {
  return { id, axis, label, theirs, ours, severity, evidence, handoff };
}

function pct(x) {
  return `${Math.round(x * 100)}%`;
}

/**
 * "Things they do you don't." Direction is the whole contract: a pattern YOU
 * ship and they don't is never reported here, because this report exists to be
 * acted on, and acting on it means adding what's missing. (Your own wins belong
 * in a different report; inverting the diff would make every row ambiguous.)
 */
function findGaps(ours, theirs) {
  const gaps = [];

  // --- rendering: the highest-leverage codebase gap there is ---------------
  if (theirs.serverRenderedRate - ours.serverRenderedRate >= RENDERING_GAP_DELTA) {
    gaps.push(gap({
      id: "rendering",
      axis: "rendering",
      label: "Content ships in the HTML",
      theirs: pct(theirs.serverRenderedRate),
      ours: pct(ours.serverRenderedRate),
      severity: "high",
      evidence:
        `${pct(theirs.serverRenderedRate)} of their sampled pages deliver body content in the ` +
        `initial HTML vs ${pct(ours.serverRenderedRate)} of yours. Pages that arrive as an empty ` +
        `client shell are largely invisible to AI-search crawlers, which do not execute your JS.`,
      handoff: "auditing-technical-seo",
    }));
  }

  // --- schema types they template that you never emit ----------------------
  for (const [type, theirRate] of Object.entries(theirs.schemaTypeRates)) {
    if (theirRate < SCHEMA_PATTERN_RATE) continue;
    const ourRate = ours.schemaTypeRates[type] || 0;
    if (ourRate >= theirRate) continue;
    const absent = ourRate === 0;
    if (!absent && theirRate - ourRate < COVERAGE_GAP_DELTA) continue;
    gaps.push(gap({
      id: `schema:${type}`,
      axis: "schema",
      label: `${type} schema`,
      theirs: pct(theirRate),
      ours: pct(ourRate),
      severity: absent ? "high" : "medium",
      evidence: absent
        ? `They emit ${type} JSON-LD on ${pct(theirRate)} of sampled pages; you emit it on none. ` +
          `This is a templated pattern, not a one-off page.`
        : `They emit ${type} on ${pct(theirRate)} of pages, you on ${pct(ourRate)} — their template ` +
          `covers cases yours misses.`,
      handoff: "adding-schema-markup",
    }));
  }

  // --- heading shape: the AIO answer surface -------------------------------
  if (theirs.questionHeadingRate - ours.questionHeadingRate >= QUESTION_HEADING_GAP_DELTA) {
    gaps.push(gap({
      id: "question-headings",
      axis: "headings",
      label: "Question-phrased subheadings",
      theirs: pct(theirs.questionHeadingRate),
      ours: pct(ours.questionHeadingRate),
      severity: "medium",
      evidence:
        `${pct(theirs.questionHeadingRate)} of their H2/H3s are phrased as questions vs ` +
        `${pct(ours.questionHeadingRate)} of yours. Question-phrased headings followed by a direct ` +
        `answer are the shape AI Overviews and answer engines lift.`,
      handoff: "optimizing-for-generative-engines",
    }));
  }

  // --- internal-link architecture -----------------------------------------
  if (
    theirs.medianInternalLinks >= ours.medianInternalLinks * INTERNAL_LINK_GAP_RATIO &&
    theirs.medianInternalLinks - ours.medianInternalLinks >= INTERNAL_LINK_GAP_ABSOLUTE
  ) {
    gaps.push(gap({
      id: "internal-links",
      axis: "links",
      label: "Internal-link density",
      theirs: `${theirs.medianInternalLinks} median`,
      ours: `${ours.medianInternalLinks} median`,
      severity: "medium",
      evidence:
        `Their pages carry a median of ${theirs.medianInternalLinks} internal links vs your ` +
        `${ours.medianInternalLinks}. Denser internal linking is how a template signals topical ` +
        `structure — it is a layout decision, not a writing one.`,
      handoff: "planning-topic-clusters",
    }));
  }

  if (theirs.descriptiveAnchorRate - ours.descriptiveAnchorRate >= COVERAGE_GAP_DELTA) {
    gaps.push(gap({
      id: "anchor-text",
      axis: "links",
      label: "Descriptive anchor text",
      theirs: pct(theirs.descriptiveAnchorRate),
      ours: pct(ours.descriptiveAnchorRate),
      severity: "low",
      evidence:
        `${pct(theirs.descriptiveAnchorRate)} of their anchors carry topical text vs ` +
        `${pct(ours.descriptiveAnchorRate)} of yours ("read more", "click here" carry none).`,
      handoff: "optimizing-on-page",
    }));
  }

  // --- meta coverage -------------------------------------------------------
  const coverageAxes = [
    { key: "descriptionRate", id: "meta-description", label: "Meta descriptions", handoff: "optimizing-on-page", severity: "medium" },
    { key: "canonicalRate", id: "canonical", label: "Canonical tags", handoff: "auditing-technical-seo", severity: "medium" },
    { key: "ogRate", id: "open-graph", label: "Open Graph title + image", handoff: "seo-bootstrap", severity: "low" },
    { key: "hreflangRate", id: "hreflang", label: "hreflang alternates", handoff: "auditing-technical-seo", severity: "low" },
    { key: "altRate", id: "image-alt", label: "Image alt text", handoff: "optimizing-on-page", severity: "low" },
    { key: "freshnessRate", id: "freshness", label: "dateModified in schema", handoff: "refreshing-stale-content", severity: "medium" },
  ];
  for (const axis of coverageAxes) {
    const theirRate = theirs[axis.key];
    const ourRate = ours[axis.key];
    if (theirRate - ourRate < COVERAGE_GAP_DELTA) continue;
    gaps.push(gap({
      id: axis.id,
      axis: "meta",
      label: axis.label,
      theirs: pct(theirRate),
      ours: pct(ourRate),
      severity: axis.severity,
      evidence: `${axis.label} on ${pct(theirRate)} of their sampled pages vs ${pct(ourRate)} of yours.`,
      handoff: axis.handoff,
    }));
  }

  // --- depth, last and deliberately low ------------------------------------
  if (ours.medianWords > 0 && theirs.medianWords >= ours.medianWords * DEPTH_GAP_RATIO) {
    gaps.push(gap({
      id: "depth",
      axis: "content",
      label: "Page depth",
      theirs: `${theirs.medianWords} words median`,
      ours: `${ours.medianWords} words median`,
      severity: "low",
      evidence:
        `Their median page is ${theirs.medianWords} words vs your ${ours.medianWords}. Ranked LAST ` +
        `on purpose: adding words without adding the entities and structure above is the skyscraper ` +
        `trap. Close the schema/heading gaps first, then re-measure.`,
      handoff: "analyzing-content-gaps",
    }));
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// 4. Ranking by SERP delta (pure)
// ---------------------------------------------------------------------------

/**
 * Normalize the `--serp` payload. Accepts:
 *   { "query": "...", "ours": {"position": 14.2}, "theirs": {"position": 3.1} }
 * or the flat shorthand { "ours": 14.2, "theirs": 3.1 }.
 * Anything else (or nothing) yields a known:false verdict — never a guess.
 */
function normalizeSerp(input) {
  if (!input || typeof input !== "object") {
    return { known: false, reason: "no SERP positions supplied" };
  }
  const read = (side) => {
    const v = input[side];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v && typeof v === "object" && typeof v.position === "number" && Number.isFinite(v.position)) {
      return v.position;
    }
    return null;
  };
  const oursPos = read("ours");
  const theirsPos = read("theirs");
  if (oursPos === null || theirsPos === null) {
    return { known: false, reason: "SERP file is missing a numeric position for ours and/or theirs" };
  }
  const delta = Number((oursPos - theirsPos).toFixed(2));
  const bucket = SERP_MULTIPLIERS.find((b) => delta >= b.minDelta);
  return {
    known: true,
    query: typeof input.query === "string" ? input.query : null,
    oursPosition: oursPos,
    theirsPosition: theirsPos,
    delta,
    multiplier: bucket.multiplier,
    verdict: bucket.label,
  };
}

/**
 * Rank gaps by impact = severity weight x SERP multiplier. With no SERP data the
 * multiplier is a flat 1.0 and every row is tagged `serp: "unknown"`, so a
 * severity-only ordering can never be mistaken for a SERP-informed one.
 */
function rankGaps(gaps, serp) {
  const s = serp && serp.known ? serp : { known: false };
  const multiplier = s.known ? s.multiplier : SERP_UNKNOWN_MULTIPLIER;
  const ranked = gaps.map((g) => ({
    ...g,
    serp: s.known ? s.verdict : "unknown",
    impact: Number((SEVERITY_WEIGHT[g.severity] * multiplier).toFixed(2)),
  }));
  const order = { high: 0, medium: 1, low: 2 };
  ranked.sort((a, b) =>
    b.impact - a.impact || order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));
  return ranked;
}

// ---------------------------------------------------------------------------
// 5. Page loading — the only step that touches the network
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isUrl(target) {
  return /^https?:\/\//i.test(String(target || "").trim());
}

async function fetchText(url, { fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,*/*" },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: null, text: "", error: String(err && err.message) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load a side's pages. Targets are either http(s) URLs (fetched, robots-gated,
 * rate-limited per origin) or local file paths (read straight off disk — the
 * offline demo path the fixtures use). Returns `{signals, warnings}`; a target
 * that cannot be loaded becomes a warning, never a silent zero.
 */
async function loadPages(targets, {
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  delayMs = DEFAULT_DELAY_MS,
  respectRobots = true,
  readFile = (p) => fs.readFileSync(p, "utf8"),
} = {}) {
  const signals = [];
  const warnings = [];
  const robotsByOrigin = new Map();
  let lastFetchAt = 0;

  for (const target of targets) {
    if (!isUrl(target)) {
      try {
        signals.push(extractSignals(readFile(target), null));
      } catch (e) {
        warnings.push(`could not read ${target}: ${e.message}`);
      }
      continue;
    }

    const url = new URL(target);
    if (respectRobots) {
      if (!robotsByOrigin.has(url.origin)) {
        const res = await fetchText(url.origin + "/robots.txt", { fetchImpl, timeoutMs });
        // parseRobots returns {groups, sitemaps}; isAllowed wants the groups array.
        // A missing/unfetchable robots.txt parses to zero groups = allow all,
        // which matches how crawlers treat a 404.
        robotsByOrigin.set(url.origin, parseRobots(res.ok ? res.text : "").groups);
      }
      const groups = robotsByOrigin.get(url.origin);
      if (!isAllowed(groups, UA, url.pathname)) {
        warnings.push(`skipped ${target}: robots.txt disallows this path for our user-agent`);
        continue;
      }
    }

    const since = Date.now() - lastFetchAt;
    if (delayMs > 0 && lastFetchAt > 0 && since < delayMs) await sleep(delayMs - since);
    const res = await fetchText(target, { fetchImpl, timeoutMs });
    lastFetchAt = Date.now();
    if (!res.ok || !res.text) {
      warnings.push(`could not fetch ${target}${res.status ? ` (HTTP ${res.status})` : ""}`);
      continue;
    }
    signals.push(extractSignals(res.text, target));
  }

  return { signals, warnings };
}

// ---------------------------------------------------------------------------
// 6. Orchestration (pure)
// ---------------------------------------------------------------------------

function runMirror({
  ourSignals,
  theirSignals,
  serp = null,
  ourLabel = "you",
  theirLabel = "competitor",
  warnings = [],
}) {
  const allWarnings = warnings.slice();
  const ours = summarizeSite(ourSignals, ourLabel);
  const theirs = summarizeSite(theirSignals, theirLabel);
  const serpVerdict = normalizeSerp(serp);
  if (!serpVerdict.known) {
    allWarnings.push(
      `ranked by severity only — ${serpVerdict.reason}. Supply --serp with GSC positions ` +
      `(see finding-underserved-keywords) for a SERP-weighted ranking.`,
    );
  }
  if (ourSignals.length < 2 || theirSignals.length < 2) {
    allWarnings.push(
      "fewer than 2 pages sampled on at least one side — rates are anecdotes at this sample size; " +
      "mirror 3-5 comparable page types per side.",
    );
  }

  const gaps = rankGaps(findGaps(ours, theirs), serpVerdict);
  const totals = { high: 0, medium: 0, low: 0 };
  for (const g of gaps) totals[g.severity]++;

  return {
    schema_version: 1,
    ours,
    theirs,
    serp: serpVerdict,
    gaps,
    totals,
    warnings: allWarnings,
  };
}

// ---------------------------------------------------------------------------
// 7. Report rendering
// ---------------------------------------------------------------------------

function formatReport(report) {
  const { ours, theirs, serp, gaps, totals, warnings } = report;
  const lines = [];
  lines.push(`Codebase Mirror — ${ours.label} vs ${theirs.label}`);
  lines.push(`  pages sampled: ${ours.pages} yours / ${theirs.pages} theirs`);
  lines.push(`  stack: ${ours.framework} (yours) vs ${theirs.framework} (theirs)`);
  if (serp.known) {
    const q = serp.query ? ` for "${serp.query}"` : "";
    lines.push(
      `  SERP delta${q}: you ${serp.oursPosition} / them ${serp.theirsPosition} ` +
      `(${serp.delta > 0 ? "+" : ""}${serp.delta} — ${serp.verdict}, weight x${serp.multiplier})`,
    );
  } else {
    lines.push("  SERP delta: unknown — severity-only ranking");
  }
  lines.push("");

  if (!gaps.length) {
    lines.push("No patterns found that they ship and you don't. Either you match their");
    lines.push("implementation or the sample is too small — widen the page set before");
    lines.push("concluding there is nothing to copy.");
  } else {
    lines.push(
      `${gaps.length} thing(s) they do you don't ` +
      `(${totals.high} high / ${totals.medium} medium / ${totals.low} low):`,
    );
    for (const g of gaps) {
      lines.push("");
      lines.push(`  [${g.severity.toUpperCase()}  impact ${g.impact}]  ${g.label}  (${g.axis})`);
      lines.push(`      them ${g.theirs}   you ${g.ours}`);
      for (const line of wrap(g.evidence, 74)) lines.push(`      ${line}`);
      lines.push(`      → hand off to \`${g.handoff}\``);
    }
  }

  if (warnings.length) {
    lines.push("");
    lines.push("warnings:");
    for (const w of warnings) {
      const [first, ...rest] = wrap(w, 74);
      lines.push(`  ! ${first}`);
      for (const line of rest) lines.push(`    ${line}`);
    }
  }
  return lines.join("\n");
}

function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if ((current + " " + word).length <= width) current += " " + word;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    ours: [], theirs: [], serpPath: null, jsonOut: null, failOnHigh: false,
    delayMs: DEFAULT_DELAY_MS, timeoutMs: DEFAULT_TIMEOUT_MS,
    ourLabel: "you", theirLabel: "competitor", noRobots: false, help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ours") opts.ours.push(argv[++i]);
    else if (a === "--theirs") opts.theirs.push(argv[++i]);
    else if (a === "--serp") opts.serpPath = argv[++i];
    else if (a === "--json") opts.jsonOut = argv[++i];
    else if (a === "--fail-on-high") opts.failOnHigh = true;
    else if (a === "--delay") opts.delayMs = Number(argv[++i]);
    else if (a === "--timeout") opts.timeoutMs = Number(argv[++i]);
    else if (a === "--label-ours") opts.ourLabel = argv[++i];
    else if (a === "--label-theirs") opts.theirLabel = argv[++i];
    else if (a === "--no-robots") opts.noRobots = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else return { ...opts, error: `unknown argument: ${a}` };
  }
  return opts;
}

const USAGE = [
  "Usage: node scripts/codebase-mirror.js --ours <url|file>... --theirs <url|file>... [options]",
  "",
  "  Reverse-engineer a competitor's shipped implementation (schema, heading",
  "  shape, link architecture, meta coverage, rendering mode) and report the",
  "  patterns THEY ship that YOU don't, ranked by SERP delta.",
  "",
  "  --ours / --theirs take either an http(s) URL (fetched, robots.txt-gated,",
  "  one request per origin per --delay ms) or a local HTML file. Repeat each",
  "  flag once per page; 3-5 comparable page types per side is the useful shape.",
  "",
  "Options:",
  "  --serp <file.json>   GSC positions: {\"query\":\"…\",\"ours\":{\"position\":14.2},",
  "                       \"theirs\":{\"position\":3.1}}. Without it, ranking is",
  "                       severity-only and every row is tagged serp: unknown.",
  "  --json <out.json>    also write the full structured report as JSON",
  "  --fail-on-high       exit 1 if any high-severity gap is found (CI gate)",
  "  --delay <ms>         per-origin politeness delay (default 1000)",
  "  --timeout <ms>       per-request timeout (default 15000)",
  "  --label-ours <name>  label for your side (default: you)",
  "  --label-theirs <n>   label for their side (default: competitor)",
  "  --no-robots          skip the robots.txt gate (only for pages you own)",
  "  -h, --help           show this help",
].join("\n");

async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.error) {
    process.stderr.write(`codebase-mirror: ${opts.error}\n\n${USAGE}\n`);
    return 1;
  }
  if (opts.help || !opts.ours.length || !opts.theirs.length) {
    process.stdout.write(USAGE + "\n");
    return opts.help ? 0 : 1;
  }

  const loadOpts = {
    timeoutMs: opts.timeoutMs,
    delayMs: opts.delayMs,
    respectRobots: !opts.noRobots,
  };
  const oursLoaded = await loadPages(opts.ours, loadOpts);
  const theirsLoaded = await loadPages(opts.theirs, loadOpts);

  if (!oursLoaded.signals.length || !theirsLoaded.signals.length) {
    process.stderr.write("codebase-mirror: could not load any pages for at least one side.\n");
    for (const w of oursLoaded.warnings.concat(theirsLoaded.warnings)) {
      process.stderr.write(`  ! ${w}\n`);
    }
    return 1;
  }

  let serp = null;
  if (opts.serpPath) {
    try {
      serp = JSON.parse(fs.readFileSync(opts.serpPath, "utf8"));
    } catch (e) {
      process.stderr.write(`codebase-mirror: could not read --serp ${opts.serpPath}: ${e.message}\n`);
      return 1;
    }
  }

  const report = runMirror({
    ourSignals: oursLoaded.signals,
    theirSignals: theirsLoaded.signals,
    serp,
    ourLabel: opts.ourLabel,
    theirLabel: opts.theirLabel,
    warnings: oursLoaded.warnings.concat(theirsLoaded.warnings),
  });

  process.stdout.write(formatReport(report) + "\n");

  if (opts.jsonOut) {
    try {
      const out = path.resolve(opts.jsonOut);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
      process.stdout.write(`\nreport written to ${opts.jsonOut}\n`);
    } catch (e) {
      process.stderr.write(`codebase-mirror: could not write --json ${opts.jsonOut}: ${e.message}\n`);
      return 1;
    }
  }

  return opts.failOnHigh && report.totals.high > 0 ? 1 : 0;
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

module.exports = {
  extractSignals,
  summarizeSite,
  findGaps,
  rankGaps,
  normalizeSerp,
  loadPages,
  runMirror,
  formatReport,
  median,
  textOf,
  bodyWordCount,
  SCHEMA_PATTERN_RATE,
  COVERAGE_GAP_DELTA,
  QUESTION_HEADING_GAP_DELTA,
  INTERNAL_LINK_GAP_RATIO,
  INTERNAL_LINK_GAP_ABSOLUTE,
  DEPTH_GAP_RATIO,
  RENDERING_GAP_DELTA,
  CLIENT_SHELL_WORD_FLOOR,
  SEVERITY_WEIGHT,
  SERP_MULTIPLIERS,
};
