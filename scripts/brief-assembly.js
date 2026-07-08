#!/usr/bin/env node
/**
 * scripts/brief-assembly.js — the deterministic core of `/seo brief`.
 *
 * Turns a topic (+ whatever keyword / SERP / GSC data the live seams gathered)
 * into a *structured content brief object*, then renders two artifacts that make
 * "brief to merged PR" a real pipeline rather than a doc:
 *
 *   1. classifyIntent()        — pure: keyword -> search intent + content format.
 *   2. strikingDistance()      — pure: GSC rows -> position 5–15 opportunities,
 *                                the "striking distance" angle (same methodology
 *                                as finding-underserved-keywords, in code here).
 *   3. rankInternalLinks()     — pure: repo content index + brief entities ->
 *                                ranked internal-link suggestions from your OWN
 *                                pages (token-overlap score, deterministic).
 *   4. deriveWordCountTarget() — pure: competitor median (or format default) ->
 *                                a ±20% word-count floor/target/ceiling.
 *   5. buildOutline()          — pure: entities + PAA questions + format ->
 *                                the headline moat (title + H2 outline with
 *                                AIO-answer stubs).
 *   6. assembleBrief()         — pure: composes 1–5 into one brief object.
 *   7. renderBriefMarkdown()   — CONTENT_BRIEF.md (the reviewable brief).
 *   8. renderDraftMarkdown()   — a draft content file in framework-agnostic
 *                                frontmatter + the H2 skeleton, ready to fill
 *                                and open as a PR.
 *   9. scanContentDir()        — the ONE impure edge: walk a content dir and
 *                                read each page's title + headings into an index
 *                                rankInternalLinks can score. Real, not a stub;
 *                                unit-tested against a temp dir.
 *  10. assembleFromInputs()    — orchestrates: load seam JSON -> brief -> files.
 *
 * WHAT IS BUILT vs A SEAM
 *   The ASSEMBLY is fully built and unit-tested against deterministic fixtures:
 *   given a topic + keyword-data + PAA questions + competitor entities + a repo
 *   content index, `assembleBrief` produces the same structured brief every time.
 *   The three inputs that need the outside world are documented SEAMS the live
 *   `/seo brief` run fills (all already-shipped tools in this plugin):
 *     - target keyword + striking-distance rows  <- your GSC (gsc MCP)
 *     - PAA questions + competitor entities/H2s   <- live SERP (firecrawl, via
 *                                                    analyzing-content-gaps)
 *     - the draft's PROSE                          <- the LLM writing to the brief
 *   Those are passed in as JSON (or scanned, for the content index). No live LLM
 *   or network call happens in this file — that is the trust boundary the tests
 *   hold, so green CI never hides a stub.
 *
 * Node stdlib only — no package.json, no deps. Exports pure functions for
 * `node --test`; runs as a CLI when invoked directly.
 *
 * CLI:
 *   node scripts/brief-assembly.js --topic "<topic>" [options]
 *     --keyword <kw>        target keyword (default: derived from topic)
 *     --url <url>           the page this brief targets (for internal-link dedupe)
 *     --gsc <rows.json>     GSC query rows [{query,position,impressions,clicks}]
 *     --serp <serp.json>    { entities:[...], questions:[...], h2s:[...],
 *                             medianWordCount:N, aioPresent:bool }
 *     --content-index <j>   prebuilt content index [{path,title,headings,slug}]
 *     --scan <dir>          scan a content dir into an index (instead of --content-index)
 *     --out-dir <dir>       where to write the draft (default: content/)
 *     --brief-out <path>    CONTENT_BRIEF.md path (default: ./CONTENT_BRIEF.md)
 *     --json <out.json>     also write the raw brief object as JSON
 *     --no-draft            write only the brief, skip the draft scaffold
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Words that never carry topical signal — dropped before scoring/keyword work.
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "for", "to", "of", "in", "on", "at",
  "by", "with", "from", "is", "are", "be", "how", "what", "why", "when", "which",
  "your", "you", "my", "we", "our", "this", "that", "it", "as", "do", "does",
]);

// Intent-signal tokens. Order matters: transactional beats commercial beats
// navigational; anything else is informational (the safe default).
const INTENT_SIGNALS = [
  ["transactional", ["buy", "price", "pricing", "cost", "cheap", "deal", "coupon", "discount", "order", "subscription", "quote", "hire"]],
  ["commercial", ["best", "top", "review", "reviews", "vs", "versus", "comparison", "compare", "alternative", "alternatives", "tool", "tools", "software", "service", "services"]],
  ["navigational", ["login", "log", "signin", "sign", "dashboard", "docs", "documentation", "download", "pricing-page", "account"]],
];

// Format defaults by intent — the shape the SERP usually rewards.
const FORMAT_WORD_DEFAULTS = {
  "how-to": { min: 1000, target: 1500, max: 1800 },
  listicle: { min: 1200, target: 1700, max: 2200 },
  comparison: { min: 1400, target: 2000, max: 2600 },
  guide: { min: 1500, target: 2200, max: 2800 },
  faq: { min: 800, target: 1200, max: 1600 },
};

// ---------------------------------------------------------------------------
// tokenization helpers (pure)
// ---------------------------------------------------------------------------

function tokenize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

function contentTokens(str) {
  return tokenize(str).filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "untitled";
}

function titleCase(str) {
  const small = new Set(["a", "an", "the", "and", "or", "for", "to", "of", "in", "on", "vs", "with"]);
  const words = String(str || "").trim().split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i !== 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// 1. Intent + format classification (pure)
// ---------------------------------------------------------------------------

/**
 * Classify search intent and pick the content format from a keyword.
 * Deterministic keyword heuristics only — no model call. Returns the intent,
 * the format the SERP usually rewards, and the signal token that decided it
 * (so the brief can explain itself honestly).
 */
function classifyIntent(keyword) {
  const tokens = tokenize(keyword);
  const tokenSet = new Set(tokens);
  let intent = "informational";
  let signal = null;
  for (const [name, signals] of INTENT_SIGNALS) {
    const hit = signals.find((s) => tokenSet.has(s));
    if (hit) {
      intent = name;
      signal = hit;
      break;
    }
  }

  // Format is a finer read than intent: a "how to X" is informational but wants
  // a how-to shape; "best X" is commercial and wants a listicle; "X vs Y" wants
  // a comparison. Fall back to intent-appropriate defaults.
  let format;
  const joined = ` ${tokens.join(" ")} `;
  if (/\bhow\b/.test(joined) || tokenSet.has("tutorial") || tokenSet.has("guide")) {
    format = /\bhow\b/.test(joined) ? "how-to" : "guide";
  } else if (tokenSet.has("vs") || tokenSet.has("versus") || tokenSet.has("comparison") || tokenSet.has("compare") || tokenSet.has("alternative") || tokenSet.has("alternatives")) {
    format = "comparison";
  } else if (tokenSet.has("best") || tokenSet.has("top") || tokens.some((t) => /^\d+$/.test(t))) {
    format = "listicle";
  } else if (intent === "commercial") {
    format = "listicle";
  } else if (intent === "transactional") {
    format = "guide";
  } else {
    format = "guide";
  }

  return { intent, format, signal };
}

// ---------------------------------------------------------------------------
// 2. Striking-distance angle (pure) — the finding-underserved-keywords method
// ---------------------------------------------------------------------------

/**
 * Find "striking distance" queries in GSC rows: position roughly 5–15 — close
 * enough to page 1 that small edits move them, far enough that they get almost
 * no clicks today. Sorted by impressions desc (biggest upside first).
 *
 * This is the finding-underserved-keywords methodology encoded as code. `rows`
 * is whatever the gsc MCP handed us: [{query, position, impressions, clicks}].
 * Pure + deterministic; the GSC pull itself is the seam.
 *
 * @param {object} [opts]
 * @param {number} [opts.minPos=5]
 * @param {number} [opts.maxPos=15]
 */
function strikingDistance(rows, { minPos = 5, maxPos = 15 } = {}) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && typeof r.position === "number" && r.position >= minPos && r.position <= maxPos)
    .map((r) => ({
      query: String(r.query || "").trim(),
      position: r.position,
      impressions: Number(r.impressions) || 0,
      clicks: Number(r.clicks) || 0,
    }))
    .filter((r) => r.query)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position);
}

// ---------------------------------------------------------------------------
// 3. Internal-link ranking (pure) — from the repo's OWN content
// ---------------------------------------------------------------------------

/**
 * Rank a repo's existing pages by topical relevance to this brief, so the brief
 * suggests real internal links to pages you already have. Score = token overlap
 * between (page title + headings) and (keyword + entities), Jaccard-ish but
 * weighted by raw overlap so richer pages surface. Pure + deterministic.
 *
 * @param {object[]} index    - [{path, title, headings:[...], slug}]
 * @param {object} focus      - {keyword, entities:[...]}
 * @param {object} [opts]
 * @param {string} [opts.excludePath] - the target page itself (don't self-link)
 * @param {number} [opts.limit=5]
 * @returns {object[]} [{path, title, anchor, score, overlap:[...]}]
 */
function rankInternalLinks(index, focus, { excludePath = null, limit = 5 } = {}) {
  if (!Array.isArray(index)) return [];
  const focusTokens = new Set([
    ...contentTokens(focus && focus.keyword),
    ...((focus && focus.entities) || []).flatMap((e) => contentTokens(e)),
  ]);
  if (focusTokens.size === 0) return [];

  const scored = [];
  for (const page of index) {
    if (!page || typeof page.path !== "string") continue;
    if (excludePath && normPath(page.path) === normPath(excludePath)) continue;
    const pageTokens = new Set([
      ...contentTokens(page.title),
      ...((page.headings || []).flatMap((h) => contentTokens(h))),
    ]);
    if (pageTokens.size === 0) continue;
    const overlap = [...focusTokens].filter((t) => pageTokens.has(t));
    if (overlap.length === 0) continue;
    // Weighted: overlap count is the driver; normalize lightly by page breadth
    // so a giant page doesn't win on noise alone.
    const score = Number((overlap.length / Math.sqrt(pageTokens.size)).toFixed(4));
    scored.push({
      path: page.path,
      title: page.title || page.slug || page.path,
      anchor: suggestAnchor(page, overlap),
      score,
      overlap: overlap.sort(),
    });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function suggestAnchor(page, overlap) {
  // Prefer an anchor made of the shared tokens (descriptive anchor text beats a
  // bare title), else fall back to the page title.
  if (overlap && overlap.length) return overlap.slice(0, 4).join(" ");
  return page.title || page.slug || "";
}

function normPath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

// ---------------------------------------------------------------------------
// 4. Word-count target (pure)
// ---------------------------------------------------------------------------

/**
 * Derive a word-count floor/target/ceiling. If we have a competitor median from
 * the SERP, anchor to it at ±20% (the analyzing-content-gaps depth rule — match
 * the SERP's proven depth, don't skyscraper). Otherwise fall back to a
 * format-appropriate default. Pure.
 */
function deriveWordCountTarget(format, medianWordCount) {
  const median = Number(medianWordCount);
  if (Number.isFinite(median) && median > 0) {
    return {
      min: Math.round(median * 0.8),
      target: Math.round(median),
      max: Math.round(median * 1.2),
      basis: `competitor median (${Math.round(median)} words, ±20%)`,
    };
  }
  const d = FORMAT_WORD_DEFAULTS[format] || FORMAT_WORD_DEFAULTS.guide;
  return { min: d.min, target: d.target, max: d.max, basis: `${format} format default` };
}

// ---------------------------------------------------------------------------
// 5. Outline / headline moat (pure)
// ---------------------------------------------------------------------------

/**
 * Build the headline moat: a title, a few title candidates, and an H2 outline
 * with an AIO-answer stub per section. Deterministic given the topic, keyword,
 * format, PAA questions and must-cover entities. This is assembly, not prose —
 * the stubs are placeholders the writer (the LLM seam) fills.
 */
function buildOutline({ topic, keyword, format, questions = [], entities = [] }) {
  const kw = (keyword || topic || "").trim();
  const cleanQuestions = dedupeStrings(questions).slice(0, 6);
  const cleanEntities = dedupeStrings(entities);

  const title = pickTitle(kw, format);
  const titleCandidates = titleVariants(kw, format);

  const outline = [];
  // Lead section: the definitional / intent-answering H2 (AIO citation target).
  outline.push({
    h2: leadHeading(kw, format),
    aioAnswerStub: `Answer "${leadHeading(kw, format)}" in 40–50 words, front-loaded, plain-language. This is the AIO/featured-snippet target — put the direct answer first, elaborate after.`,
    covers: cleanEntities.slice(0, 3),
  });

  // One H2 per People-Also-Ask question (each is a sub-intent the SERP rewards).
  for (const q of cleanQuestions) {
    outline.push({
      h2: asHeading(q),
      aioAnswerStub: `Direct 40–50 word answer to "${asHeading(q)}", then supporting detail.`,
      covers: [],
    });
  }

  // Entity-coverage sections for must-cover entities not already tied to a
  // question — table stakes per the content-gap axes.
  const usedEntities = new Set(outline.flatMap((s) => s.covers.map((c) => c.toLowerCase())));
  const remaining = cleanEntities.filter((e) => !usedEntities.has(e.toLowerCase()));
  if (remaining.length) {
    outline.push({
      h2: format === "listicle" ? "Key options and how they compare" : "What to know: the essentials",
      aioAnswerStub: "Cover each must-have entity below with a sentence or two; these are table stakes the top-3 all include.",
      covers: remaining.slice(0, 8),
    });
  }

  // Always close with an FAQ block — literal Q&A has high AI-citation density.
  if (cleanQuestions.length) {
    outline.push({
      h2: "FAQ",
      aioAnswerStub: "Repeat each PAA question as a literal Q&A pair (FAQPage schema candidate — hand to adding-schema-markup).",
      covers: [],
    });
  }

  return { title, titleCandidates, outline };
}

function leadHeading(kw, format) {
  const t = kw || "the topic";
  if (format === "how-to") return `How to ${stripLead(t, /^how to /i)}`;
  if (format === "comparison") return `${titleCase(t)}: which should you choose?`;
  if (format === "listicle") return `${titleCase(t)}: the short list`;
  return `What is ${t}?`;
}

function pickTitle(kw, format) {
  const t = titleCase(kw || "Untitled");
  const year = "2026";
  if (format === "how-to") return `${t}: A Step-by-Step Guide (${year})`;
  if (format === "listicle") return `${t}: The Options That Actually Work (${year})`;
  if (format === "comparison") return `${t} — An Honest Comparison (${year})`;
  return `${t}: The Complete Guide (${year})`;
}

function titleVariants(kw, format) {
  const t = titleCase(kw || "Untitled");
  const base = [
    pickTitle(kw, format),
    `${t}: What Builders Actually Need to Know`,
    `A Practical Guide to ${t}`,
  ];
  return dedupeStrings(base);
}

function asHeading(q) {
  const s = String(q || "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1) + (/[?.!]$/.test(s) ? "" : "?");
}

function stripLead(str, re) {
  return String(str || "").replace(re, "").trim();
}

function dedupeStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const s of arr || []) {
    const v = String(s || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 6. assembleBrief — the pure composition
// ---------------------------------------------------------------------------

/**
 * Compose a full structured brief object from already-gathered inputs. PURE:
 * same inputs -> same brief, no I/O, no model, no network. This is the function
 * the whole moat rests on and the one the tests pin hardest.
 *
 * @param {object} input
 * @param {string} input.topic
 * @param {string} [input.keyword]        target keyword (defaults to topic)
 * @param {string} [input.url]            the target page (excluded from links)
 * @param {object[]} [input.gscRows]      GSC rows for the striking-distance angle
 * @param {object} [input.serp]           {entities, questions, h2s, medianWordCount, aioPresent}
 * @param {object[]} [input.contentIndex] repo pages for internal-link ranking
 * @returns {object} the brief
 */
function assembleBrief(input = {}) {
  const topic = String(input.topic || "").trim();
  if (!topic) throw new Error("assembleBrief: `topic` is required");
  const keyword = String(input.keyword || topic).trim();
  const serp = input.serp || {};

  const { intent, format, signal } = classifyIntent(keyword);
  const striking = strikingDistance(input.gscRows || []);
  // The angle: the strongest striking-distance query that isn't just the target
  // keyword restated — that's the "you already almost rank for this" wedge.
  const angleRow = striking.find((r) => r.query.toLowerCase() !== keyword.toLowerCase()) || striking[0] || null;

  const entities = dedupeStrings(serp.entities || []);
  const questions = dedupeStrings(serp.questions || []);

  const { title, titleCandidates, outline } = buildOutline({
    topic, keyword, format, questions, entities,
  });

  const wordCountTarget = deriveWordCountTarget(format, serp.medianWordCount);
  const internalLinks = rankInternalLinks(
    input.contentIndex || [],
    { keyword, entities },
    { excludePath: input.url || null, limit: 5 },
  );

  const slug = slugify(keyword);

  return {
    topic,
    targetKeyword: keyword,
    intent,
    format,
    intentSignal: signal,
    angle: {
      strikingDistance: angleRow,
      note: angleRow
        ? `"${angleRow.query}" sits at position ${round1(angleRow.position)} with ${angleRow.impressions} impressions — striking distance. Weave it in; you already almost rank.`
        : "No GSC striking-distance data supplied — brief is SERP/entity-driven only. Re-run with --gsc once the page has ~90 days of data.",
    },
    title,
    titleCandidates,
    outline,
    entities,
    questions,
    internalLinks,
    wordCountTarget,
    aioPresent: Boolean(serp.aioPresent),
    slug,
    draftPath: null, // filled by the writer when a draft is emitted
    generatedAt: null, // stamped by the CLI, not the pure core (keeps it pure)
  };
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

// ---------------------------------------------------------------------------
// 7. renderBriefMarkdown — CONTENT_BRIEF.md
// ---------------------------------------------------------------------------

function renderBriefMarkdown(brief) {
  const b = brief;
  const L = [];
  L.push(`# Content Brief: ${b.title}`);
  L.push("");
  L.push(`> Topic: **${b.topic}** · Target keyword: **${b.targetKeyword}** · Intent: **${b.intent}** · Format: **${b.format}**`);
  if (b.generatedAt) L.push(`> Generated: ${b.generatedAt}`);
  L.push("");

  L.push("## The angle");
  L.push("");
  L.push(b.angle.note);
  L.push("");

  L.push("## Title (headline moat)");
  L.push("");
  L.push(`**${b.title}**`);
  L.push("");
  if (b.titleCandidates.length > 1) {
    L.push("Alternatives:");
    for (const t of b.titleCandidates.slice(1)) L.push(`- ${t}`);
    L.push("");
  }

  L.push("## Outline");
  L.push("");
  L.push(`Target length: **${b.wordCountTarget.target} words** (${b.wordCountTarget.min}–${b.wordCountTarget.max}, ${b.wordCountTarget.basis}).`);
  L.push("");
  let i = 1;
  for (const s of b.outline) {
    L.push(`### ${i}. ${s.h2}`);
    L.push(`- _AIO stub:_ ${s.aioAnswerStub}`);
    if (s.covers && s.covers.length) L.push(`- _Must cover:_ ${s.covers.join(", ")}`);
    L.push("");
    i += 1;
  }

  L.push("## Entities to cover");
  L.push("");
  if (b.entities.length) {
    for (const e of b.entities) L.push(`- [ ] ${e}`);
  } else {
    L.push("_No entities supplied — run the SERP diff (analyzing-content-gaps) to populate._");
  }
  L.push("");

  L.push("## Questions to answer (People-Also-Ask)");
  L.push("");
  if (b.questions.length) {
    for (const q of b.questions) L.push(`- [ ] ${asHeading(q)}`);
  } else {
    L.push("_No PAA questions supplied — run the SERP diff to populate._");
  }
  L.push("");

  L.push("## Internal links (from your existing content)");
  L.push("");
  if (b.internalLinks.length) {
    for (const link of b.internalLinks) {
      L.push(`- [\`${link.path}\`] — anchor: "${link.anchor}" _(overlap: ${link.overlap.join(", ")})_`);
    }
  } else {
    L.push("_No internal-link candidates — supply a content index (--scan <dir> or --content-index)._");
  }
  L.push("");

  L.push("## AI Overview");
  L.push("");
  L.push(b.aioPresent
    ? "Competitors appear in the AI Overview for this query. Front-load a question-phrased H2 with a 40–50 word definition-format answer to compete for the citation."
    : "No AI Overview detected (or not checked). Still write answer-first — it wins featured snippets and future AIO eligibility.");
  L.push("");

  return L.join("\n");
}

// ---------------------------------------------------------------------------
// 8. renderDraftMarkdown — the draft content file (the PR artifact)
// ---------------------------------------------------------------------------

/**
 * Render a framework-agnostic draft markdown file: YAML frontmatter + the H2
 * skeleton with AIO-answer stubs as HTML comments. `draft: true` keeps it out
 * of production builds until a human finishes the prose. This is the file the
 * draft-to-PR path commits.
 */
function renderDraftMarkdown(brief) {
  const b = brief;
  const L = [];
  L.push("---");
  L.push(`title: "${escapeYaml(b.title)}"`);
  L.push(`description: "TODO: 150–160 char meta description targeting '${escapeYaml(b.targetKeyword)}'."`);
  L.push(`slug: "${b.slug}"`);
  L.push(`keyword: "${escapeYaml(b.targetKeyword)}"`);
  L.push("draft: true");
  L.push(`date: "${b.generatedAt || "TODO"}"`);
  L.push("---");
  L.push("");
  L.push(`# ${b.title}`);
  L.push("");
  L.push(`<!-- BRIEF: intent=${b.intent} format=${b.format} target=${b.wordCountTarget.target}w (${b.wordCountTarget.min}-${b.wordCountTarget.max}) -->`);
  L.push(`<!-- ANGLE: ${stripComment(b.angle.note)} -->`);
  L.push("");
  for (const s of b.outline) {
    L.push(`## ${s.h2}`);
    L.push("");
    L.push(`<!-- ${stripComment(s.aioAnswerStub)} -->`);
    if (s.covers && s.covers.length) {
      L.push(`<!-- cover: ${s.covers.join(", ")} -->`);
    }
    L.push("");
    L.push("TODO: write this section.");
    L.push("");
  }
  if (b.internalLinks.length) {
    L.push("<!-- Internal links to weave in naturally:");
    for (const link of b.internalLinks) {
      L.push(`     - ${link.path}  (anchor: "${link.anchor}")`);
    }
    L.push("-->");
    L.push("");
  }
  return L.join("\n");
}

function escapeYaml(str) {
  return String(str || "").replace(/"/g, '\\"');
}

function stripComment(str) {
  // HTML comments can't contain "--"; soften any double-dash in stubs.
  return String(str || "").replace(/--+/g, "—").replace(/-->/g, "→");
}

// ---------------------------------------------------------------------------
// 9. scanContentDir — the one impure edge (real, tested against a temp dir)
// ---------------------------------------------------------------------------

const CONTENT_EXTS = new Set([".md", ".mdx", ".markdown"]);

/**
 * Walk a content directory and build an index of {path, title, headings, slug}
 * from each markdown file's frontmatter title + `#`/`##` headings. This is the
 * ONLY function in this file that touches the filesystem; it is deliberately
 * small, dependency-free, and unit-tested against a real temp dir so it is not
 * a stub. The *live SERP/GSC/LLM* work stays out of here.
 *
 * @param {string} dir
 * @param {object} [opts]
 * @param {number} [opts.maxFiles=500]
 * @returns {object[]} content index
 */
function scanContentDir(dir, { maxFiles = 500 } = {}) {
  const index = [];
  let root;
  try {
    root = fs.statSync(dir);
  } catch {
    return index;
  }
  if (!root.isDirectory()) return index;

  const stack = [dir];
  while (stack.length && index.length < maxFiles) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === ".git" || ent.name.startsWith(".")) continue;
        stack.push(full);
      } else if (CONTENT_EXTS.has(path.extname(ent.name).toLowerCase())) {
        try {
          const rec = parseContentFile(fs.readFileSync(full, "utf8"), path.relative(dir, full));
          index.push(rec);
        } catch {
          /* skip unreadable file */
        }
      }
    }
  }
  index.sort((a, b) => a.path.localeCompare(b.path));
  return index;
}

/**
 * Parse a single markdown file's text into a content-index record. Pure — split
 * out from scanContentDir so it is directly unit-testable without a filesystem.
 */
function parseContentFile(text, relPath) {
  const lines = String(text || "").split(/\r?\n/);
  let title = null;
  let slug = null;
  const headings = [];

  // Frontmatter title/slug (simple key: value, same shape ci-validate parses).
  if (lines[0] && lines[0].trim() === "---") {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") break;
      const m = /^(title|slug)\s*:\s*(.+)$/.exec(lines[i]);
      if (m) {
        const val = m[2].trim().replace(/^["']|["']$/g, "");
        if (m[1] === "title") title = val;
        else slug = val;
      }
    }
  }
  // Markdown headings (#, ##, ###). The first H1 doubles as title if no FM title.
  for (const line of lines) {
    const hm = /^(#{1,3})\s+(.+?)\s*#*$/.exec(line);
    if (hm) {
      const text2 = hm[2].trim();
      headings.push(text2);
      if (!title && hm[1] === "#") title = text2;
    }
  }
  const norm = normPath(relPath);
  return {
    path: norm,
    title: title || slug || norm,
    slug: slug || slugify(title || norm),
    headings,
  };
}

// ---------------------------------------------------------------------------
// 10. Orchestrator — inputs (JSON/scan) -> brief -> files
// ---------------------------------------------------------------------------

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

/**
 * Build a brief from CLI-shaped inputs and (optionally) write the artifacts.
 * Returns { brief, briefMarkdown, draftMarkdown }. The `write` flag + paths let
 * tests exercise the pure assembly without touching disk.
 */
function assembleFromInputs(opts) {
  const gscRows = opts.gsc ? readJson(opts.gsc) : [];
  const serp = opts.serp ? readJson(opts.serp) : {};
  let contentIndex = [];
  if (opts.contentIndex) contentIndex = readJson(opts.contentIndex);
  else if (opts.scan) contentIndex = scanContentDir(opts.scan);

  const brief = assembleBrief({
    topic: opts.topic,
    keyword: opts.keyword,
    url: opts.url,
    gscRows,
    serp,
    contentIndex,
  });

  const stamp = opts.now || new Date().toISOString().slice(0, 10);
  brief.generatedAt = stamp;

  const wantDraft = opts.draft !== false;
  if (wantDraft) {
    const outDir = opts.outDir || "content";
    brief.draftPath = normPath(path.join(outDir, `${brief.slug}.md`));
  }

  const briefMarkdown = renderBriefMarkdown(brief);
  const draftMarkdown = wantDraft ? renderDraftMarkdown(brief) : null;

  return { brief, briefMarkdown, draftMarkdown };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { draft: true, outDir: "content", briefOut: "CONTENT_BRIEF.md" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--topic": opts.topic = argv[++i]; break;
      case "--keyword": opts.keyword = argv[++i]; break;
      case "--url": opts.url = argv[++i]; break;
      case "--gsc": opts.gsc = argv[++i]; break;
      case "--serp": opts.serp = argv[++i]; break;
      case "--content-index": opts.contentIndex = argv[++i]; break;
      case "--scan": opts.scan = argv[++i]; break;
      case "--out-dir": opts.outDir = argv[++i]; break;
      case "--brief-out": opts.briefOut = argv[++i]; break;
      case "--json": opts.jsonOut = argv[++i]; break;
      case "--no-draft": opts.draft = false; break;
      case "-h": case "--help": opts.help = true; break;
      default:
        if (a && a.startsWith("--")) opts._unknown = a;
        break;
    }
  }
  return opts;
}

const USAGE = [
  'Usage: node scripts/brief-assembly.js --topic "<topic>" [options]',
  "",
  "  Assemble a research-grounded content brief + a draft content file from a",
  "  topic and whatever GSC/SERP data the live seams gathered. Writes",
  "  CONTENT_BRIEF.md and (unless --no-draft) a draft under --out-dir.",
  "",
  "Options:",
  "  --keyword <kw>       target keyword (default: the topic)",
  "  --url <url>          the target page (excluded from internal-link suggestions)",
  "  --gsc <rows.json>    GSC rows [{query,position,impressions,clicks}] (seam: gsc MCP)",
  "  --serp <serp.json>   {entities,questions,h2s,medianWordCount,aioPresent} (seam: firecrawl)",
  "  --content-index <j>  prebuilt content index [{path,title,headings,slug}]",
  "  --scan <dir>         scan a content dir into an index instead",
  "  --out-dir <dir>      draft output dir (default: content/)",
  "  --brief-out <path>   CONTENT_BRIEF.md path (default: ./CONTENT_BRIEF.md)",
  "  --json <out.json>    also write the raw brief object as JSON",
  "  --no-draft           write only the brief",
  "  -h, --help           show this help",
].join("\n");

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    process.stdout.write(USAGE + "\n");
    return 0;
  }
  if (!opts.topic) {
    process.stderr.write("brief-assembly: --topic is required\n\n" + USAGE + "\n");
    return 1;
  }

  let result;
  try {
    result = assembleFromInputs(opts);
  } catch (e) {
    process.stderr.write(`brief-assembly: ${e.message}\n`);
    return 1;
  }

  const { brief, briefMarkdown, draftMarkdown } = result;

  try {
    fs.mkdirSync(path.dirname(path.resolve(opts.briefOut)), { recursive: true });
    fs.writeFileSync(opts.briefOut, briefMarkdown, "utf8");
    process.stdout.write(`brief  -> ${opts.briefOut}\n`);

    if (draftMarkdown != null) {
      const draftAbs = path.resolve(brief.draftPath);
      fs.mkdirSync(path.dirname(draftAbs), { recursive: true });
      fs.writeFileSync(draftAbs, draftMarkdown, "utf8");
      process.stdout.write(`draft  -> ${brief.draftPath}\n`);
    }

    if (opts.jsonOut) {
      fs.mkdirSync(path.dirname(path.resolve(opts.jsonOut)), { recursive: true });
      fs.writeFileSync(opts.jsonOut, JSON.stringify(brief, null, 2), "utf8");
      process.stdout.write(`json   -> ${opts.jsonOut}\n`);
    }
  } catch (e) {
    process.stderr.write(`brief-assembly: could not write output: ${e.message}\n`);
    return 1;
  }

  // Suggest the draft-to-PR wiring (the skill runs these; printing them makes the
  // pipeline legible from the CLI too).
  process.stdout.write("\nNext — open the draft-to-PR:\n");
  process.stdout.write(`  git checkout -b content/${brief.slug}\n`);
  process.stdout.write(`  git add ${brief.draftPath || ""} ${opts.briefOut}\n`);
  process.stdout.write(`  git commit -m "content(brief): ${brief.targetKeyword}"\n`);
  process.stdout.write(`  gh pr create --title "content: ${brief.title}" --body-file ${opts.briefOut}\n`);
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = {
  tokenize,
  contentTokens,
  slugify,
  titleCase,
  classifyIntent,
  strikingDistance,
  rankInternalLinks,
  deriveWordCountTarget,
  buildOutline,
  assembleBrief,
  renderBriefMarkdown,
  renderDraftMarkdown,
  scanContentDir,
  parseContentFile,
  assembleFromInputs,
  FORMAT_WORD_DEFAULTS,
};
