# seo-superpower

![version](https://img.shields.io/badge/version-0.5.0-blue) ![license](https://img.shields.io/badge/license-MIT-green) ![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-8A4FFF) ![skills](https://img.shields.io/badge/skills-18-orange) ![architecture](https://img.shields.io/badge/stdlib-100%25%20zero--deps-brightgreen) ![cost](https://img.shields.io/badge/cost-%240%20marginal-success)

**End-to-end SEO + Generative Engine Optimization (GEO) for technical builders. One command. Pure stdlib. $0 marginal cost.**

> **Status:** v0.5.0 — Leveled-up, pure stdlib offline toolchain, dogfooded on [vibecrafting.ai](https://vibecrafting.ai). All 18 skills and deterministic tools tested and active.
>
> *Part of the [Brokenbranch Lab](https://www.brokenbranch.dev/lab/).*

A [Claude Code](https://claude.com/claude-code) plugin and deterministic toolchain that turns SEO and GEO from an intimidating, SaaS-bloated chore into a normal developer workflow. Run `/seo`, get a reviewable Git Pull Request. The terminal and codebase you already live in become your SEO workspace.

- **Authoritative Ethos:** Grounded in our foundational charter [soul.md](soul.md).
- **Zero Third-Party Dependencies:** 100% standard library (Node.js 18+ and Python 3.10+). No `npm install`, no `pip install` required for core offline diagnostics.
- **Zero Paid Subscriptions:** Runs entirely on local compute plus free-tier Google Search Console and PageSpeed Insights APIs. Never requires $130–$500/month SaaS subscriptions (Ahrefs, Semrush, Surfer) or paid scraping proxies (DataForSEO).
- **PRs Over Dashboards:** Every diagnostic outputs code changes, structured data, or ranked diffs—not 80-item PDF audit checklists you will never act on.

```bash
# In Claude Code:
/seo-setup    # One-time guided wizard (~5 min) — configures free-tier GSC & PageSpeed
/seo          # Daily dev loop — diagnoses lifecycle phase, triages, and ships a PR
/seo-check    # Fast pre-deploy audit & environment readiness check (no OAuth required)
```

**Jump in:** [QUICKSTART.md](QUICKSTART.md) · [soul.md](soul.md) · [skills/REGISTRY.md](skills/REGISTRY.md) · [MCP_SERVERS.md](MCP_SERVERS.md) · [INSTALL.md](INSTALL.md)

---

## The Soul of seo-superpower

Our product philosophy is codified in [soul.md](soul.md). We adhere strictly to **Five Inviolable Tenets**:

### 1. The Dev Loop Mandate: PRs Over Dashboards
External crawlers only guess how a site works from the outside. `seo-superpower` runs inside your repository: it analyzes your real Next.js, Astro, or SvelteKit route structures, inspects Markdown/MDX frontmatter, evaluates layout components, and traces your git commit history. We don't hand you an 80-item PDF checklist; we give you an `SEO_AUDIT.md` ranked by `impact × effort` alongside a ready-to-merge Git Pull Request containing minimal, idiomatic code changes. Git is our primary interface: traffic drops trigger refresh branches, lost AI citations trigger `git blame` investigations, and topic briefs become `draft: true` scaffolds on isolated feature branches.

### 2. The Zero-Dollar Wedge: The Free-Tier Law
$0 marginal cost is a non-negotiable architectural requirement. We never require paid third-party SEO APIs (Ahrefs, Semrush, Moz, DataForSEO). If a capability cannot run on free-tier APIs (Google Search Console, PageSpeed Insights) or deterministic local compute, it does not belong in this project. Graceful degradation is our default experience: first-time builders can run comprehensive local audits, schema checks, and linting in under 60 seconds without creating accounts, generating API keys, or configuring OAuth. Value comes first; credentials unlock deeper longitudinal data later.

### 3. Ruthless Empirical Pragmatism: Facts Over Fads
No vibes-based SEO. Every threshold, parse cap, and architectural recommendation traces directly to a verified primary source: Google Search Central documentation, schema.org specifications, W3C standards, or peer-reviewed research (documented in `SOURCES.md`). When the industry chases unproven fads, we demand empirical validation (e.g. citing 500M-visit log analyses showing no AI citation lift for `llms.txt`). When specifications clarify, we lock correct rules into regression unit tests (such as Google's 50,000 URLs / 50 MB uncompressed sitemap limits versus the 500 KiB robots.txt parse cap).

### 4. The 1-Call Rule & Triage Discipline: Respect the Builder's Time
Technical founders should never navigate complex configuration menus or answer lengthy intake questionnaires. The `/seo` command diagnoses, triages, and acts. At most one clarifying question is permitted when genuine ambiguity requires it. Diagnostic passes run in parallel to establish site context, and every execution returns a predictable, compact output:
1. **What I found** (at most 3 bullets).
2. **What I'm doing next** (chosen child skill and tool).
3. **What you will get** (a PR, a ranked diff, or a concrete asset).

### 5. Deterministic Core & Trust Boundaries: Humans Stay in Control
If a check can be calculated deterministically, an LLM must never eyeball it. We do not count checklist items with prompt tokens; we run deterministic Node.js and Python scripts that emit explicit exit codes (`0`, `1`, `2`) to drive routing logic. Clear trust boundaries govern automation:
- **Automated PRs** are strictly reserved for low-risk, mechanical, high-confidence changes (canonical tags, viewport declarations, robots.txt directives, sitemap pointers, valid JSON-LD schemas).
- **Architectural migrations** (client-side rendering to SSR, image delivery pipelines, route redesigns) are documented as prioritized technical briefs for the engineering team.
- **Prose is human-authored:** Claude produces research-backed outlines, entity targets, and PAA queries into scaffolds with `draft: true`. We never hallucinate or publish synthetic content without human review.
- **Quality gates on programmatic generation:** Automated content must pass strict uniqueness (≥60%), minimum depth (≥400 words), internal link graph, and schema validation gates to prevent search spam penalties.

---

## Architectural Trinity

To keep the system robust, testable, and maintainable, every capability in `seo-superpower` is split into three clean layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. SKILLS (The Mind)                     │
│  18 Markdown playbooks defining expert judgment, lifecycle  │
│  routing, anti-patterns, and step-by-step dev workflows.    │
└──────────────────────────────┬──────────────────────────────┘
                               │ guides
┌──────────────────────────────▼──────────────────────────────┐
│                 2. TOOLS & SEAMS (The Hands)                │
│  MCP servers (gsc, pagespeed, geo-check, schema-validate)   │
│  and live fetch seams that retrieve external ground truth.   │
└──────────────────────────────┬──────────────────────────────┘
                               │ feeds
┌──────────────────────────────▼──────────────────────────────┐
│                  3. SCRIPTS (The Bedrock)                   │
│  Pure, deterministic, stdlib-only Node.js & Python tools.   │
│  Zero external dependencies. Fully unit-tested offline.     │
└─────────────────────────────────────────────────────────────┘
```

1. **Scripts (`scripts/`):** The immutable bedrock. Written in vanilla Node.js (18+) and Python (3.10+) using exclusively standard libraries. Fast, offline-first, exit-code driven, and covered by automated test suites.
2. **Tools & Seams (`mcp-servers/`):** Standalone tools that connect Claude to external reality (Search Console search queries, PageSpeed Core Web Vitals, and LLM search citations).
3. **Skills (`skills/*/SKILL.md`):** The operational intelligence. Structured markdown files that instruct Claude when and how to perform audits, assemble briefs, and generate code changes.

---

## Deterministic Bedrock CLI Tools

`seo-superpower` provides a comprehensive suite of offline-first command-line tools that run locally, in pre-commit hooks, or inside CI/CD pipelines with zero external dependencies.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              OFFLINE TOOL SUITE SUMMARY                                │
├─────────────────────────┬──────────────┬───────────────────────────────────────────────┤
│ Tool                    │ Runtime      │ Primary Purpose                               │
├─────────────────────────┼──────────────┼───────────────────────────────────────────────┤
│ schema-quick.py         │ Python 3.10+ │ Pure stdlib JSON-LD & Rich Result validator   │
│ schema-check.js         │ Node.js 18+  │ Pure stdlib Node JSON-LD validator            │
│ baseline-check.js       │ Node.js 18+  │ Deterministic Pass A site & --dir audit       │
│ seo-lint.js             │ Node.js 18+  │ Pre-commit placeholder & SEO bug linter       │
│ check.py                │ Python 3.10+ │ Cross-platform environment & credential check │
│ detect-framework.js     │ Node.js 18+  │ App framework & route structure detector      │
│ hreflang-tool.js        │ Node.js 18+  │ Syntax, reciprocal link & x-default validator │
│ cross-site-compare.js   │ Node.js 18+  │ Multi-site portfolio audit & compare matrix   │
│ decay-automation.js     │ Node.js 18+  │ Automated content decay sweep & hook runner   │
│ codebase-mirror.js      │ Node.js 18+  │ Template & SERP structure competitor diff     │
│ geo-diff-bot.js         │ Node.js 18+  │ AI citation delta & git commit correlator     │
│ ci-validate.py          │ Python 3.10+ │ Manifest, frontmatter & dangling link checker │
└─────────────────────────┴──────────────┴───────────────────────────────────────────────┘
```

### 1. Offline JSON-LD Schema Validators (`schema-quick.py` & `schema-check.js`)

Validates JSON-LD syntax, schema.org context, case-sensitive `@type` naming (e.g. catching `faqpage` or `Website` instead of `FAQPage` or `WebSite`), and Google Rich Result required and recommended fields.

Supports 11 major schema types: **Article**, **BlogPosting**, **Product**, **FAQPage**, **BreadcrumbList**, **Organization**, **HowTo**, **Recipe**, **Event**, **JobPosting**, and **WebSite**.

#### Python Stdlib Validator (`scripts/schema-quick.py`)
```bash
# Validate local file (JSON-LD or HTML with embedded <script type="application/ld+json">)
python scripts/schema-quick.py --file path/to/page.html

# Human-readable formatted output
python scripts/schema-quick.py path/to/schema.json --text

# Validate inline JSON string
python scripts/schema-quick.py --json '{"@context":"https://schema.org","@type":"Article","headline":"SEO Guide","author":{"@type":"Person","name":"Jane"},"image":"https://example.com/img.jpg","datePublished":"2026-01-01"}'

# Pipe from stdin or fetch live URL
cat schema.json | python scripts/schema-quick.py
python scripts/schema-quick.py --url https://example.com
```

#### Node.js Stdlib Validator (`scripts/schema-check.js`)
```bash
# Validate local file or directory output
node scripts/schema-check.js --file ./dist/index.html

# Validate with text report
node scripts/schema-check.js --file schema.json --text

# Direct inline JSON validation
node scripts/schema-check.js --json '{"@context":"https://schema.org","@type":"WebSite","name":"My Site","url":"https://example.com"}'
```

#### Exit Codes & Output Example
- `0`: Valid schema, 0 errors, 0 warnings (rich-result eligible and clean).
- `1`: Valid schema syntax and required fields present, but has warnings (missing recommended fields).
- `2`: Schema errors: invalid JSON syntax, missing `@context`, mis-cased `@type`, missing required fields, or unreadable input.

```
$ python scripts/schema-quick.py fixtures/codebase-mirror/ours/home.html --text
Schema Validation Result: WARNINGS
Schema Types Detected: WebSite

Warnings (1):
  ⚠️  root (WebSite): missing recommended field 'potentialAction'

✅ Valid JSON-LD syntax and required fields present (rich-result eligible).
```

---

### 2. Pre-Deploy Static Directory & Site Auditor (`baseline-check.js`)

Performs a deterministic, spec-compliant 10-point Pass A health check. Unlike external crawlers, it supports **both live URLs and local build directories** (`--dir`).

Key Capabilities:
- **Specification-compliant robots.txt parser:** Enforces the 500 KiB robots parse cap, tracks specific user-agent precedence, and evaluates the critical AI citation retrieval roster (**OAI-SearchBot**, **Claude-SearchBot**, **PerplexityBot**), training bots (**GPTBot**, **ClaudeBot**, **CCBot**), and user bots.
- **Sitemap verification:** Validates XML against Google's real limits (50,000 URLs / 50 MB uncompressed), checks for absolute HTTPS URLs, and checks sitemap discovery in robots.txt.
- **Head metadata verification:** Validates canonical tags, title presence and length, meta description, viewport tag, single `<h1>` tag, and JSON-LD structured data blocks.

#### Usage
```bash
# Pre-deploy local build directory audit (e.g. dist, out, build, public)
node scripts/baseline-check.js --dir ./dist

# Machine-readable JSON output for CI pipelines
node scripts/baseline-check.js --dir ./out --json

# Strict mode (requires >=8/10 score AND zero critical blockers)
node scripts/baseline-check.js --dir ./dist --strict

# Live URL audit
node scripts/baseline-check.js https://example.com --timeout=5000
```

#### Exit Codes & Output Example
- `0`: Baseline healthy (score ≥ 8/10; in `--strict` mode, requires zero blockers).
- `1`: Baseline incomplete or failing (< 8/10 or has critical blockers).
- `2`: Fatal error (unreachable target or missing directory).

```
$ node scripts/baseline-check.js --dir ./dist
Baseline — ./dist [local directory audit]

Pass A: 10/10  HEALTHY

  PASS  robots.txt 200 + non-empty + Sitemap: line
        1 sitemap ref(s)
  PASS  sitemap.xml 200 + valid XML + >0 URLs
        1 URL(s)
  PASS  <title> present
        44 chars
  PASS  <meta name=description> present
        109 chars
  PASS  <link rel=canonical> present
        https://example.com/
  PASS  <meta name=viewport> present
        width=device-width, initial-scale=1
  PASS  at least one valid JSON-LD block
        1/1 valid — WebSite
  PASS  HTTPS + valid certificate
        local directory audit (skipped)
  PASS  exactly one <h1>
        1 found
  PASS  AI-bot policy on >=3 crawlers
        3 named — OAI-SearchBot, Claude-SearchBot, GPTBot

AI citation readiness (retrieval bots — these decide if you can be cited):
  ALLOWED  OAI-SearchBot
  ALLOWED  Claude-SearchBot
  ALLOWED  PerplexityBot  (not named — inherits User-agent: *)

Route: growth -> finding-underserved-keywords (GSC data) or planning-topic-clusters (no GSC)
       10/10 baseline checks pass — past bootstrap
```

---

### 3. SEO Asset & Placeholder Linter (`seo-lint.js`)

A zero-dependency pre-commit and CI guardrail that prevents disastrous SEO regressions before they ship to production.

Scans project files (`.html`, `.tsx`, `.jsx`, `.astro`, `.svelte`, `.vue`, `.md`, `.mdx`, `.xml`, `.json`) for:
1. **Unreplaced template tokens:** Catches forgotten scaffold placeholders like `REPLACE-WITH-CANONICAL-ORIGIN`, `REPLACE-WITH-SITE-NAME`, and `REPLACE-WITH-DEFAULT-DESCRIPTION`.
2. **Accidental production `noindex`:** Detects `<meta name="robots" content="noindex">` on production routes (safely exempting 404 error pages, admin consoles, and staging templates).
3. **Relative URLs in critical SEO assets:** Flags non-absolute URLs in sitemaps (`<loc>/path</loc>`) and canonical links (`<link rel="canonical" href="/path">`).
4. **Schema.org casing defects:** Flags mis-cased types before search engines reject them (e.g. `product` -> `Product`, `faqpage` -> `FAQPage`).

#### Usage
```bash
# Scan entire project
node scripts/seo-lint.js .

# Scan specific directory or build output
node scripts/seo-lint.js ./src
node scripts/seo-lint.js ./dist

# Machine-readable JSON output for pre-commit hooks
node scripts/seo-lint.js . --json
```

#### Exit Codes & Output Example
- `0`: Clean! 0 issues found across all scanned files.
- `1`: Lint issues found (placeholders, accidental noindex, relative URLs, schema casing).
- `2`: Runtime error (invalid directory or unreadable file).

```
$ node scripts/seo-lint.js ./src
SEO Lint: 2 issue(s) found across 42 file(s):

  src/routes/about.html:14:22 [no-placeholder-tokens]
    Unreplaced placeholder token 'REPLACE-WITH-CANONICAL-ORIGIN' must be resolved before deployment.
  src/routes/pricing.html:8:5 [no-accidental-noindex]
    Accidental noindex directive '<meta name="robots" content="noindex">' found in production template.
```

---

### 4. Cross-Platform Readiness Checker (`check.py`)

A pure Python 3 standard library environment and prerequisite checker. Runs natively on **Windows**, **macOS**, and **Linux** without requiring bash, WSL, or external packages. Replaces and supersedes legacy shell scripts.

Verifies:
1. Configuration `.env` location (`~/.config/seo-superpower/.env` or `~/.openclaw/.env`).
2. Google Search Console OAuth client secrets JSON file.
3. PageSpeed Insights API key configuration.
4. Toolchain availability and version gates: `uvx`, `node` (>= 18), `python3` (>= 3.10), and `git`.
5. Optional live PageSpeed API network connectivity.

#### Usage
```bash
# Standard interactive check with ANSI color output
python scripts/check.py

# Offline / CI check (skips external network requests)
python scripts/check.py --no-network

# Machine-readable JSON output
python scripts/check.py --json

# Plain text output without ANSI color escapes
python scripts/check.py --no-color
```

#### Output Example
```
$ python scripts/check.py --no-network
=== SEO Superpower Readiness Check ===

[OK] Env file: ~/.config/seo-superpower/.env
[OK] GSC client secrets file: ~/.config/seo-superpower/gsc_client_secret.json
[OK] PAGESPEED_API_KEY set (AIzaSyA...)
[OK] uvx available (uvx 0.10.8)
[OK] node v22.23.2 (>= 18)
[OK] python 3.11.9 (>= 3.10)
[OK] git version 2.52.0

=== Summary ===
Pass: 7   Fail: 0   Warn: 0
System is ready for full SEO Superpower execution!
```

---

### 5. Multi-Language & hreflang Validator & Generator (`hreflang-tool.js`)

A pure Node.js stdlib utility for international SEO. Validates BCP 47 language codes (ISO 639-1) and regional subtags (ISO 3166-1 alpha-2), detects self-referential links, enforces `x-default` catch-all targets, verifies bidirectional reciprocal links, and generates framework-ready tags.

```bash
# Validate alternate links in local HTML file
node scripts/hreflang-tool.js --validate ./dist/es/index.html

# Verify bidirectional reciprocal links across all language variants
node scripts/hreflang-tool.js --reciprocal en:https://example.com/ es:https://example.com/es/ de:https://example.com/de/

# Generate HTML alternate tags with x-default
node scripts/hreflang-tool.js --generate en:https://example.com/ es:https://example.com/es/ --x-default https://example.com/

# Generate Next.js App Router metadata alternates
node scripts/hreflang-tool.js --generate en:https://example.com/ fr:https://example.com/fr/ --format nextjs

# Machine-readable JSON output
node scripts/hreflang-tool.js --validate ./dist/index.html --json
```

#### Exit Codes
- `0`: Valid hreflang syntax, reciprocal links confirmed, and x-default present.
- `1`: Validation warnings or reciprocal errors found (missing reciprocal backlink, invalid language code, missing x-default).
- `2`: Bad arguments or syntax error.

---

### 6. Cross-Site Portfolio Comparison Engine (`cross-site-compare.js`)

Compares multiple web properties or local build directories side-by-side in a single diagnostic matrix. Evaluates tech stack fingerprints, SEO health score, robots.txt status, AI search bot accessibility (`OAI-SearchBot`, `PerplexityBot`), sitemap limits, and structured data schemas.

```bash
# Compare multiple project build directories
node scripts/cross-site-compare.js ./apps/marketing/dist ./apps/docs/dist

# Compare baseline audit JSON outputs
node scripts/cross-site-compare.js ./audit-site-a.json ./audit-site-b.json

# Format as GitHub-flavored Markdown table (ideal for PR summaries and CI)
node scripts/cross-site-compare.js ./site1 ./site2 --format markdown

# Machine-readable JSON comparison matrix
node scripts/cross-site-compare.js ./site1 ./site2 --json
```

---

### 7. Content Decay Sweep Automation (`decay-automation.js`)

Automates weekly content decay triage by inspecting Search Console impression trajectories and historical snapshots. Flags pages suffering >20% decay, identifies striking-distance keyword drop-offs, updates state in `.seoconfig.json`, and integrates directly with scheduled GitHub Actions (`.github/workflows/decay-sweep.yml`) and Claude Code event hooks (`hooks/seo-decay-check.json`).

```bash
# Execute standard automated decay sweep
node scripts/decay-automation.js

# Custom decay threshold percentage and custom config path
node scripts/decay-automation.js --threshold-pct 25 --config ./.seoconfig.json

# Dry-run mode (runs full analysis without updating timestamp state)
node scripts/decay-automation.js --dry-run
```

---

## Commands & User Flow

`seo-superpower` provides two core slash commands in Claude Code:

### 1. `/seo` — The Unified Diagnostic & Action Engine
Runs the full diagnostic flow, triages site maturity, and routes directly to the highest-leverage task. You can run `/seo` with no arguments, or pass an explicit intent:

```bash
/seo                           # Auto-diagnose phase, triage, and open a PR
/seo audit <url>               # Fast no-OAuth audit (<60s). Ideal first-time entry point!
/seo bootstrap                 # Generate sitemaps, robots.txt, OG image, and JSON-LD
/seo underserved               # GSC query analysis for high-opportunity striking-distance keywords
/seo brief "<topic>"           # Generate research-backed brief and open a draft PR (draft: true)
/seo mirror <url>              # Reverse-engineer competitor templates, schema, and heading models
/seo hreflang                  # Validate alternate tags, reciprocal links, and x-default targets
/seo refresh                   # Detect decaying content (>20% loss) and prepare refresh PR
/seo geo-check                 # Benchmark domain citations across ChatGPT, Claude, Perplexity, Gemini
/seo geo-diff                  # Diff two citation snapshots and correlate changes to git commits
```

### 2. `/seo-check` & `/seo-setup`
- **`/seo-check`**: Fast verification check. Evaluates environment readiness (`python scripts/check.py`), runs the baseline audit (`node scripts/baseline-check.js`), and executes the SEO asset linter (`node scripts/seo-lint.js`).
- **`/seo-setup`**: Guided, interactive 5-minute wizard. Opens browser tabs directly to Google Cloud Console, configures OAuth for Google Search Console, generates desktop client secrets, sets your PageSpeed Insights API key, and validates readiness click-by-click.

---

## Supported Web Frameworks

`/seo bootstrap` automatically detects your project's framework and route layout using `scripts/detect-framework.js` (tested against deterministic fixtures in `fixtures/`):

```bash
node scripts/detect-framework.js .          # Human-readable report
node scripts/detect-framework.js . --json   # Machine-readable output
```

| Framework | Detection Signature | Generated Production Artifacts |
|---|---|---|
| **Next.js** (App Router) | `next` + `app/` directory | `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, layout `metadataBase` + JSON-LD |
| **Next.js** (Pages Router) | `next` + `pages/` directory | `pages/sitemap.xml.ts` (`getServerSideProps`), static `public/robots.txt`, Head tags |
| **Astro** | `astro` in dependencies | `@astrojs/sitemap` integration, `public/robots.txt`, `src/components/SeoHead.astro` |
| **SvelteKit** | `@sveltejs/kit` in dependencies | `src/routes/sitemap.xml/+server.ts`, `static/robots.txt`, `<svelte:head>` SEO block |
| **Vite + React Router** | `react-router-dom` (no meta-framework) | Static `public/robots.txt`, `public/sitemap.xml`, HTML Head fallbacks |

*Monorepo Support:* If the root `package.json` does not contain a recognized meta-framework, `detect-framework.js` recursively scans subdirectories (`apps/*`, `web/`, `site/`, etc.) two levels deep, identifies the relevant workspace app, and reports its path.

---

## Shipped Skills (All 18 Skills Included)

The complete suite of 18 skills (1 meta-router + 17 specialized playbooks) is fully implemented and active:

| Skill | Lifecycle Phase | Trigger Phrases | Key Deliverable |
|---|---|---|---|
| **`seo-superpower`** | Meta-router | Vague intent, `/seo` | Diagnoses site phase, selects skill, outputs routing plan |
| **`setting-up-seo-measurement`** | Initial | "verify GSC", "set up Search Console", "measure SEO" | Step-by-step Search Console verification & DNS records |
| **`seo-bootstrap`** | Initial | "set up SEO", "add sitemap", "I just shipped" | Framework-native sitemap, robots.txt, OG image, and JSON-LD PR |
| **`researching-keywords-pre-launch`** | Initial | "what should I write about", "cold-start SEO" | Clustered `KEYWORD_MAP.md` from PAA, Autocomplete, Reddit demand |
| **`auditing-technical-seo`** | Initial / Maintenance | "audit my site", "Core Web Vitals", "why aren't we ranking" | Ranked `SEO_AUDIT.md` by `impact × effort` with fix diffs |
| **`planning-topic-clusters`** | Initial → Growth | "topic clusters", "pillar page", "content architecture" | Cluster architecture with pillar and supporting post plan |
| **`optimizing-on-page`** | Cross-cutting | "polish this page", "title and meta", "internal linking" | Exact diff for `<title>`, description, headers, and internal anchors |
| **`adding-schema-markup`** | Cross-cutting | "add schema", "JSON-LD", "FAQ schema", "rich results" | Rich-result eligible JSON-LD components validated via stdlib tools |
| **`generating-hreflang`** | Cross-cutting / Initial → Growth | "hreflang", "international SEO", "multilingual", "x-default" | Syntax validation, reciprocal links, and framework-native alternate tags |
| **`optimizing-for-generative-engines`** | Cross-cutting | "GEO", "ChatGPT citations", "AI Overview", "track AI search" | Quotable answer capsules, citation tables, author entity markup |
| **`tracking-citation-diffs`** | Cross-cutting / Mature | "citation diff", "did my PR win citations", "GEO diff" | Correlates AI citation movement to specific git commits via `geo-diff-bot.js` |
| **`analyzing-content-gaps`** | Growth | "why does X outrank us", "content gap", "SERP diff" | Heading, topic, and entity gap analysis against top 3 ranking URLs |
| **`generating-content-briefs`** | Growth | "/seo brief", "brief to PR", "write brief and draft" | Comprehensive brief + opening a production draft PR (`draft: true`) |
| **`mirroring-competitor-codebases`** | Growth → Mature | "mirror their codebase", "reverse-engineer their SEO" | Codebase template diff ranking missing schema, links, and structure |
| **`finding-underserved-keywords`** | Growth → Mature | "GSC analysis", "striking distance", "impression gap" | High-impression keywords ranking positions 8–20 ready for optimization |
| **`building-eeat-and-authority`** | Growth → Mature | "E-E-A-T", "author bios", "build authority", "YMYL" | Author entity schemas, Wikidata/sameAs link chains, fact citations |
| **`generating-programmatic-seo`** | Growth → Mature | "programmatic SEO", "scale content", "city pages from data" | Pattern templates passing strict uniqueness (≥60%) and depth gates |
| **`refreshing-stale-content`** | Mature | "traffic is dropping", "content decay", "refresh post" | Refresh PR updating decayed copy, `dateModified`, and IndexNow ping |

---

## Bundled MCP Servers (`mcp-servers/`)

Model Context Protocol (MCP) servers act as the "hands" that connect Claude to external services:

- **`gsc`** (`mcp-search-console`): Interfaces with Google Search Console API. Retrieves search analytics, query clicks, impressions, average positions, and indexing status.
- **`pagespeed`** (`pagespeed-insights-mcp`): Connects to Google PageSpeed Insights. Retrieves lab Lighthouse audits, field Core Web Vitals (LCP, INP, CLS), and optimization opportunities.
- **`geo-check`**: Custom built in this repository (`mcp-servers/geo-check/server.py`). Queries ChatGPT, Claude, Perplexity, and Gemini to track whether your domain is cited for strategic category queries.
- **`schema-validate`**: Custom built in this repository (`mcp-servers/schema-validate/server.py`). Deep Python validation using `pyld` and `extruct` with Google Rich Result eligibility testing.
- **`lighthouse-local`**: Local headless Chrome Lighthouse runner for environments without external PageSpeed API access.

---

## Installation & Setup

### Quick Install in Claude Code
```bash
# Add marketplace and install plugin
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower@benskamps-marketplace

# Run guided setup wizard
/seo-setup
```

### Fast-Track Without Credentials
You do not need to configure credentials to start using `seo-superpower`. Run:
```bash
# Perform a static baseline audit on your local build output right now:
node scripts/baseline-check.js --dir ./dist

# Lint your project for placeholders and missing tags:
node scripts/seo-lint.js .

# Run a quick audit on any public URL:
/seo audit https://example.com
```

Documentation:
- [QUICKSTART.md](QUICKSTART.md) — 5-minute first prompts.
- [INSTALL.md](INSTALL.md) — Detailed installation walkthrough.
- [MCP_SETUP.md](MCP_SETUP.md) — Manual credential configuration guide.

---

## Automated Verification & CI Suite

Every script, validator, and skill in `seo-superpower` is guarded by comprehensive offline unit tests and static analysis. Tests run in under 5 seconds with zero network calls:

```bash
# 1. Run Node.js unit tests (248 tests across all scripts & fixtures)
node --test test/*.test.js

# 2. Run Python unit tests (47 tests across schema & CI validators)
python -m unittest discover -s test

# 3. Run comprehensive CI integrity validation (92 structural checks)
python scripts/ci-validate.py
```

### What `ci-validate.py` Checks:
1. **Skill Frontmatter:** Validates YAML frontmatter blocks (`name` and `description`) across all 18 skills.
2. **Command Frontmatter:** Validates descriptions on all commands in `commands/`.
3. **Manifest Integrity:** Validates `.claude-plugin/plugin.json` and `marketplace.json` schema and paths.
4. **Reference Integrity:** Proves there are zero dangling links:
   - MCP server entrypoint paths resolve to physical files on disk.
   - Skill routing targets (`commands/seo.md` → `skills/<name>/`) resolve to existing directories.
   - Skill body references to scripts and templates resolve to real files.
   - Hook scripts (`hooks/*.json`) map to existing executable scripts.

---

## The Bar for Contributors

Every pull request to `seo-superpower` must uphold our charter in [soul.md](soul.md):

1. **Solves a Real Builder Scenario:** Skills and features must address concrete developer workflows.
2. **100% Free-Tier Compatible:** Zero paid API dependencies. Local compute plus free Google APIs.
3. **Deterministic & Unit-Tested:** Math, routing, and parsing logic must live in stdlib scripts accompanied by offline unit tests in `test/`.
4. **Ends in a Pull Request:** If a feature only generates static advice without leading to an actionable diff or code asset, it is incomplete.

---

## License

MIT © [Benjamin Schippers](https://github.com/benskamps). See [LICENSE](LICENSE) for details.
Built on empirical SEO research and community insights documented in [SOURCES.md](SOURCES.md).
