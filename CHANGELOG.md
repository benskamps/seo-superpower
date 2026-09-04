# Changelog

All notable changes to **seo-superpower** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning convention (see [DEVELOPING.md](DEVELOPING.md#releasing)): bugfixes and
small additions ship as patch releases (`0.3.x`); new skills ship as minor releases
(`0.x.0`). The canonical version lives in
[`.claude-plugin/plugin.json`](.claude-plugin/plugin.json).

## [Unreleased]

## [0.5.1] — 2026-09-04

Correctness pass on the v0.5.0 toolchain. Four defects where a tool reported a
confident `[PASS]` on input it had not actually checked. Total skills: 18.

### Fixed

- **hreflang: a missing self-referential link silently disabled the reciprocity check** (`scripts/hreflang-tool.js`) — The self-reference test was used as the *guard* around the reciprocity loop rather than as an assertion of its own, so a cluster with both defects reported `[PASS] All hreflang links are fully compliant, reciprocal, and syntax-valid`. Both checks are now independent, and a missing self-reference is reported as `missing_self_reference`.
- **hreflang: region subtags were never validated** (`scripts/hreflang-tool.js`, `scripts/iso-codes.js`) — Only the language half of a tag was checked; the region half was uppercased and accepted unread, so `en-UK`, `en-XX` and `en-ZZ` all passed clean. Regions are now checked against the 249 officially assigned ISO 3166-1 alpha-2 codes, with withdrawn (`AN`, `YU`, `SU`) and never-assigned (`UK`, `EU`, `UN`) codes rejected and the correct code suggested — `en-UK` → `en-GB`. UN M.49 numeric areas (`es-419`) remain valid.
- **decay sweep: every failure mode was indistinguishable from "healthy"** (`scripts/decay-automation.js`, `.github/workflows/decay-sweep.yml`) — No data source, a missing data file, and a data file whose rows carried the wrong field names all printed `[PASS] No decaying pages detected. All content is performing within normal bounds.` and exited 0. The scheduled workflow ran the first of those weekly, so the cron could not have gone red if the runner were completely broken. `--data` is now required, all three cases exit 2 with an actionable message, and partially-unreadable inputs report a skip count instead of quietly dropping rows.
- **hreflang: one broken reciprocal pair emitted one error per group membership** — a single non-reciprocal link produced three identical error lines. Each pair is now reported once.
- **cross-site-compare: the AI-crawler check reported correctly-configured sites as Blocked** (`scripts/cross-site-compare.js`) — bot access was matched with `User-agent:\s*<bot>[\s\S]*?Disallow:\s*(.*)`, which searches forward across group boundaries for the next `Disallow:` anywhere in the file. On a robots.txt that explicitly allows the AI crawlers and then disallows one unrelated scraper, that unrelated `Disallow: /` was attributed to every allowed bot above it. `brokenbranch.dev` — which allows `OAI-SearchBot` and `PerplexityBot` by name — was reported as blocking both. robots.txt is now parsed into real rule groups, with longest-match precedence and Allow winning ties.
- **cross-site-compare: framework detection never worked** (`scripts/cross-site-compare.js`) — the module imported `detectFramework`, a name `detect-framework.js` does not export, and read a nested `fw.framework.label` that does not exist. Every lookup threw `TypeError`, the surrounding `catch` swallowed it, and every site in every comparison reported `Unknown` — which also silently cost each site the 15-point framework bonus in its health score. Now calls `detectProject` and reads the documented shape.

### Added

- **`scripts/iso-codes.js`** — Generated ISO reference tables: 249 assigned ISO 3166-1 alpha-2 regions, 183 assigned ISO 639-1 languages, 203 ISO 15924 script subtags, plus deprecated/reserved classifications with successor codes. Derived from the runtime's bundled ICU/CLDR data rather than transcribed by hand; the plugin needs no ICU at runtime.
- **`test/iso-codes.test.js`** — Re-derives the tables from ICU on every run and fails if the committed file drifts, so the tables are a re-runnable claim rather than an assertion. Skips cleanly on a reduced-ICU Node.
- **Script subtag support** — `zh-Hans`, `zh-Hant-TW`, `sr-Latn-RS` are validated against ISO 15924 and canonicalised (`zh-hans` → `zh-Hans`). Previously the tag was returned uncanonicalised.
- **Full ISO 639-1 language coverage** — the old hard-coded 71-code subset raised a bogus "rare code" warning for assigned languages including `nb`, `nn`, `gu`, `mt`, `lb`, `fo`, `gd`, `or` and `as`. Deprecated codes (`iw`, `in`, `jw`, `mo`, `sh`) are now rejected with the modern equivalent.
- **`fixtures/decay/`** — Committed decaying and stable impression fixtures backing the workflow self-test.
- **Decay sweep CI self-test** — `.github/workflows/decay-sweep.yml` now asserts that the runner detects a decaying page (exit 1), passes clean data (exit 0), and refuses to report health with no data source (exit 2). The live sweep runs only when a real export is wired, and says so loudly when it is not.
- **45 regression tests** (248 → 293 Node tests) covering every case above, including the three decay inputs that previously read as healthy.

### Changed

- `skills/generating-hreflang/SKILL.md` — documents exactly what the validator enforces, and adds `en-UK` to the anti-patterns list.

## [0.5.0] — 2026-09-04

Foundational charter, multi-language/hreflang support, cross-site portfolio comparison, automated content decay sweeps, and pure stdlib verification toolchain. Total skills: 18.

### Added

- **Foundational Product Charter** (`soul.md`) — Establishes the 5 Inviolable Tenets: The Dev Loop Mandate (PRs over dashboards), The $0 Wedge (Free-Tier Law), Ruthless Empirical Pragmatism (facts over fads), The 1-Call Rule & Triage Discipline, and Deterministic Core & Trust Boundaries.
- **Multi-Language & hreflang Skill** (`skills/generating-hreflang/SKILL.md`) + CLI tool (`scripts/hreflang-tool.js`) — 18th skill in the registry. Pure Node.js stdlib tool for international SEO: validates BCP 47 codes, self-referential links, reciprocal link symmetry, and x-default fallback targets. Generates HTML `<link rel="alternate">`, XML sitemaps, and Next.js `metadata.alternates`. 10 unit tests.
- **Cross-Site Portfolio Comparison Engine** (`scripts/cross-site-compare.js`) — Compares 2+ sites or audit JSONs side-by-side: tech stack fingerprint, health score, robots.txt, AI search bot accessibility (`OAI-SearchBot`, `PerplexityBot`), sitemap bounds, and JSON-LD schema richness. Supports terminal tables, markdown, and JSON. 6 unit tests.
- **Automated Content Decay Sweep** (`scripts/decay-automation.js`, `.github/workflows/decay-sweep.yml`, `hooks/seo-decay-check.json`) — Automates weekly detection of decaying pages (>20% YoY / 90-day loss), tracks `last_decay_sweep` in `.seoconfig.json`, and activates the Claude Code decay hook with real automation.
- **Offline Stdlib Verification Toolchain** — `schema-quick.py` (Python stdlib JSON-LD validator for 11 schema types), `schema-check.js` (Node.js stdlib JSON-LD validator), `baseline-check.js --dir` (offline directory auditor), `seo-lint.js` (pre-commit placeholder and SEO tag linter), and `check.py` (cross-platform readiness checker). Runs in <5 seconds with zero external dependencies.
- **Competitor Codebase Mirror** (`scripts/codebase-mirror.js`) + `mirroring-competitor-codebases` — Moat #4 from [VISION.md](VISION.md). Reads the HTML both sites serve and reverse-engineers each side's *template*: schema types, heading shape, internal links, meta coverage, and client-shell vs SSR detection. Swapping sides yields no false gaps; ranked by severity × SERP delta. 38 unit tests.
- **Rendering as a first-class SEO gap axis** — A page delivered as an empty `<div id="root">` plus scripts is scored `client-shell` and reported at high severity. AI-search crawlers do not execute JS, so that page is invisible to them regardless of copy quality.
- **`/seo mirror` & `/seo hreflang`** — New routing intents in `commands/seo.md`.

### Notes

- Total skill count is now 18.
- All core scripts remain 100% pure standard library in Node.js 18+ and Python 3.10+, requiring zero npm or pip package installations.


## [0.4.0] — 2026-07-23

Makes the checks that gate routing executable, and closes a hole in the AI-citation
promise. Findings from the four-site dogfood pass in `DOGFOOD-2026-07-23.md`.

### Added

- **Executable framework detection** (`scripts/detect-framework.js`) — `seo-bootstrap`
  Steps 1–2 were a prose table a model eyeballed; they are now one deterministic,
  stdlib-only script that reports the framework, the template directory, the canonical
  site URL (and where it came from), and a present/missing verdict for sitemap, robots,
  OG image and JSON-LD at framework-idiomatic paths. Supports Next.js App Router,
  Next.js Pages Router, Astro, SvelteKit, and a Vite + React Router static fallback;
  exits `0`/`1`/`2` and speaks `--json`. Unit-tested against real project fixtures
  (`fixtures/`, `test/detect-framework.test.js`, 41 tests) so detection can no longer
  drift from what the templates actually support.
- **Monorepo support in detection** — when the root `package.json` has no framework, the
  detector searches conventional app directories (`web/`, `apps/*`, `site/`, …) two levels
  deep, skipping `node_modules/` and build output, and reports `detectedIn`. Found by
  dogfooding: a real repo whose Next app lives in `web/` previously reported `unknown` and
  silently downgraded the user to the static fallback.
- **`templates/nextjs/`, `templates/astro/`, `templates/sveltekit/`** — the framework
  templates `seo-bootstrap` Step 3 has instructed users to copy since the initial commit.
  They had never actually been written; `templates/` contained one unrelated file. Each
  directory ships its files plus a README mapping template to destination path.
- **`README.md` → "Supported frameworks"** — an honest matrix of what is detected, what
  templates ship per framework, and an explicit not-detected list (Nuxt, Remix, SolidStart,
  Eleventy, Hugo, Jekyll, `package.json`-less static sites).

- **Executable Pass A** (`scripts/baseline-check.js`) — the meta-router's 10-point
  baseline health check was a prose checklist whose *tally* gated a branch
  ("≥8/10 → skip bootstrap, route to growth"). Ten fuzzy conditions counted by a
  model, driving a routing decision. It is now one deterministic, stdlib-only
  script: fetches `/`, `/robots.txt` and the declared sitemap, parses head tags
  and JSON-LD (counting blocks that actually *parse*, not merely appear),
  resolves robots.txt groups per spec (most-specific agent, longest-path rule,
  Allow wins ties), scores Pass A, and returns the route in its exit code
  (`0` healthy / `1` incomplete / `2` unfetchable). Speaks `--json`.
  54 unit tests, all hermetic — no network in CI.
- **AI *citation* readiness, distinct from AI-bot naming** — `baseline-check.js`
  reports whether retrieval crawlers can *effectively* reach a site rather than
  whether their names appear in `robots.txt`. An unnamed bot inherits
  `User-agent: *`; a permissive wildcard means allowed-by-luck, which breaks
  silently the day someone tightens it. Surfaced as its own block in the report.

- **Brief-to-PR flow** (`scripts/brief-assembly.js`) + `generating-content-briefs`
  skill — the `/seo brief "<topic>"` moat. Turns a topic (+ optional keyword/URL)
  into a research-grounded `CONTENT_BRIEF.md` (target keyword + intent, the
  striking-distance angle from your GSC, a headline moat of title + H2 outline
  with 40–50 word AIO-answer stubs, entities/PAA questions, internal-link
  suggestions ranked from your own repo content, and a competitor-median ±20%
  word-count target) **plus a `draft: true` content file**, then prints the
  draft-to-PR wiring (branch → commit → `gh pr create` with the brief as the PR
  body). The brief ASSEMBLY is a pure, deterministic, fully unit-tested core
  (`test/brief-assembly.test.js`, 31 tests incl. a real temp-dir content scan);
  the live GSC/SERP data and the draft's prose are documented seams (`--gsc`,
  `--serp`, and the writer) — no LLM/network call in the deterministic core, so
  green CI can't hide a stub. Reuses the `finding-underserved-keywords`
  striking-distance method (in code) and composes `analyzing-content-gaps` for
  the SERP diff. Routed via `/seo brief` (repointed from `analyzing-content-gaps`,
  which stays reachable via `/seo gap`). Brings the shipped skill count to 16.
- **GEO Diff Bot** (`scripts/geo-diff-bot.js`) + `tracking-citation-diffs` skill —
  daily AI-citation diff correlated to the git commit that caused each change.
  Diffs two `geo-check` snapshots into gained/lost/unchanged citations, then
  git-blames the content files that changed in the window to attribute each
  gained/lost citation to the content commit(s) that plausibly caused it — or
  flags it `external` (model update / competitor / crawl refresh) when no
  content changed in the repo. Pure, offline, deterministic engine (no LLM
  calls); the live snapshot fetch remains the existing `geo_track` MCP tool.
  Fully unit-tested (`test/geo-diff-bot.test.js`, incl. against a real temp
  git repo). Routed via `/seo geo-diff`. Brings the shipped skill count to 15.
- `geo_track` now stamps each snapshot with the current git commit (`commit`
  field), enabling the Diff Bot's commit correlation. Null outside a git repo
  (the Diff Bot degrades gracefully to a diff-only report).

### Fixed

- **`OAI-SearchBot` was absent from the entire repository.** Per OpenAI's crawler
  docs it "is used to surface websites in search results in ChatGPT's search
  features," and sites blocking it "will not be shown in ChatGPT search answers."
  `templates/robots-ai-bots.txt` shipped `GPTBot` (training-only) and
  `ChatGPT-User` but not the search bot — two of OpenAI's three tokens — while
  giving Anthropic's three-bot split full coverage. For a plugin whose headline
  promise is AI citation, this was the load-bearing omission. The template is now
  grouped by crawler **job** (retrieval / user / training) rather than by vendor,
  because the job determines whether blocking costs citations; `OAI-SearchBot`
  and `Perplexity-User` added, legacy `anthropic-ai` demoted to a note.
  Found by dogfooding: all three healthy sites in `DOGFOOD-2026-07-23.md` had
  the same hole in production.
- **Sitemap size limit was ~100× too strict.** `auditing-technical-seo` checked
  "sitemap < 500 KiB (Google's hard cap)" in two places. 500 KiB is the
  **robots.txt** parse cap; a single sitemap's limits are 50,000 URLs / 50 MB
  uncompressed. The skill's own `SOURCES.md` had both facts right and separate,
  and `generating-programmatic-seo` stated the correct limit — the plugin
  contradicted itself, with the wrong number in the path that runs on every
  audited site. Corrected in both places and locked by a regression test
  asserting a 600 KiB sitemap is legal and the two constants differ.
- **One PSI key, two names.** `scripts/psi-quick.py` read `PSI_API_KEY` while
  `.mcp.json` wired `PAGESPEED_API_KEY`; a user who followed `MCP_SETUP.md` and
  set only the latter got a silent "CWV skipped" with nothing explaining why.
  `load_api_key()` now accepts either, canonical name first, in both env and
  `.env` lookup.
- **Router no longer treats an 8/10 as unqualified good news.** All ten Pass A
  checks weigh one point, but a missing canonical and a missing AI-bot policy
  are not worth the same as a duplicate `<h1>`. The threshold is unchanged (a
  product decision, not a bug), but the skill now requires naming those two
  misses plainly instead of burying them in a cleanup bullet.
- **Dangling template references shipped silently for months.** `scripts/ci-validate.py`
  advertised a "no dangling references" smoke test but only ever read manifests, commands
  and hook configs — never a `SKILL.md` body, which is the text users actually execute. It
  now resolves in-repo paths referenced from skill bodies (including brace sets like
  `templates/{nextjs,astro,sveltekit}/`) and fails on any that are missing or empty.
  67 → 74 checks.
- **`metadataBase` could resolve to the wrong origin.** Detection originally scanned
  forward from the word `metadataBase` for the next URL in the file, which on a real repo
  returned a `nextjs.org` docs link sitting in a comment. It now parses the two real shapes
  (`new URL("literal")` and `new URL(IDENT)` resolved against a same-file `const`) and
  reports `null` otherwise, so the skill asks rather than ships a wrong canonical.

### Documentation

- **Adopter onboarding path** — `QUICKSTART.md` (five-minute path from install to
  first audit), `skills/REGISTRY.md` (the one-line-per-skill index), and
  `MCP_SERVERS.md` (bundled-tool navigator). Marketplace + README repointed at
  them (#6).
- **Per-skill adopter READMEs** — a short "what this does / when it fires" README
  in each core skill directory so the plugin reads well browsed straight on
  GitHub, not just through the meta-router (#7, #8, #9).
- `CHANGELOG.md` (this file) — reconstructed history from `v0.1.0` onward.
- `CONTRIBUTING.md` — the skill-contribution path, repo layout, validation
  expectations, and PR conventions.

### Tests

- Unit tests for the `seo-decay-check` hook scripts (`test/decay-check.test.js`),
  wired into CI (#10).
- Unit tests for `scripts/psi-quick.py`'s pure functions
  (`test/test_psi_quick.py`), wired into CI (#11).

## [0.3.1] — 2026-05-12

Closes the demo-grade gap surfaced by the 2026-05-12 dogfood pass against
[vibecrafting.ai](https://vibecrafting.ai) (see `DOGFOOD-2026-05-12.md`).
Time-to-first-signal is no longer gated on the `/seo-setup` OAuth wizard.

### Added

- **No-MCP audit path** — `/seo audit <url>` quick path that needs no OAuth.
  Routes to the No-MCP fallback in the meta-router (curl robots/sitemap +
  head-tag parse + AI-bot stanza check + partial `SEO_AUDIT.md`).
- `scripts/psi-quick.py` — PageSpeed Insights helper. Reads `PSI_API_KEY`,
  prints LCP/INP/CLS/TTFB, prefers CrUX field data with Lighthouse-lab
  fallback. `--json` for machine output. Exit codes `0/1/2/3`.
- `templates/robots-ai-bots.txt` — paste-ready AI-bot stanza.
- `DEVELOPING.md` — maintainer-facing dogfood mode (`--plugin-dir`, symlink
  with Windows caveat, manual `Read` fallback) plus the release process.
- `SEO_AUDIT_OUTPUT` env var — redirects audit output away from foreign repos.
- Pass A "already-healthy" branch in the `seo-superpower` meta-router — healthy
  sites skip bootstrap and route straight to growth.

### Changed

- `skills/auditing-technical-seo/SKILL.md` — adds the No-MCP fallback section.
- `commands/seo.md` — adds the `/seo audit <url>` argument pattern.
- `.gitignore` added to keep `.kickoff.md` and ephemeral `SEO_AUDIT.md` out of
  the tree.

### Post-release docs

- CI added after this release: GitHub Actions plugin + skill validator, a
  dangling-reference smoke test, and MCP server import smoke tests
  (`.github/workflows/ci.yml`, `scripts/ci-validate.py`).
- Truth pass on README badges/status; launch-plan and enrichment KB docs.

## [0.3.0] — 2026-04-27

Completes the v3 roadmap — the 12-skill registry is now complete. Built via 6
parallel build agents.

### Added

- **5 new skills:**
  - `researching-keywords-pre-launch` — cold-start keyword discovery via 5 free
    signals (search-surface, Trends, Reddit/HN/IH, competitor SERP overlap, LLM
    query patterns). Runs at bootstrap before GSC has data.
  - `planning-topic-clusters` — pillar + spoke architecture (3–5K pillar /
    1.5–2.5K spokes / 8–15 spokes per pillar).
  - `analyzing-content-gaps` — competitor SERP diff with entity extraction across
    7 axes. Foundation for the "Competitor Codebase Mirror" feature.
  - `building-eeat-and-authority` — E-E-A-T playbook with Person/Organization
    schema, off-page authority moves, solo-founder paths, YMYL gates.
  - `generating-programmatic-seo` — template + data + LLM enrichment with 4
    quality gates. Foundation for the "Programmatic Page Forge" feature.
- **`schema-validate` MCP server** — working Python (FastMCP, ~640 LOC). Tools:
  `validate_jsonld`, `extract_schema_from_html`, `validate_url_schema`,
  `check_required_fields`. Uses `pyld` + `extruct` with Google rich-result field
  checks for 9 types. Auto-enabled in `.mcp.json`.

### Changed

- Meta-router gains 5 new intent → skill mappings.
- `/seo` command gains 7 new explicit intents (cold-start, clusters, gap, eeat,
  programmatic, brief, scale).
- `VISION.md` marks 12/12 skills shipped; README updated.
- **vibecrafting.ai** replaces roadtripper.ai as the public example domain across
  all skill content.

## [0.2.0] — 2026-04-27

Ships the v2 roadmap via 6 parallel build agents.

### Added

- **5 new skills:**
  - `optimizing-on-page` — per-page workhorse (title/meta/H/internal links/alt
    text) with pixel-width title rules and featured-snippet capture.
  - `adding-schema-markup` — JSON-LD decision tree, `@graph` pattern, validator
    flow.
  - `optimizing-for-generative-engines` — the GEO moat: 7 citation patterns with
    per-platform tuning (ChatGPT / Perplexity / Claude / Gemini).
  - `refreshing-stale-content` — decay detection at >20% YoY impressions with an
    IndexNow-ping refresh playbook.
  - `setting-up-seo-measurement` — GSC verification, sitemap submission, GA4 vs
    Plausible, Bing Webmaster, IndexNow.
- **`geo-check` MCP server** — working Python (FastMCP, ~560 LOC). Three async
  tools: `geo_check`, `geo_track`, `geo_diff`. Polls Anthropic, OpenAI,
  Perplexity Sonar, and Gemini with `asyncio.gather` fan-out and per-call cost
  logging. Auto-enabled in `.mcp.json`.
- `hooks/seo-decay-check.json` — documented spec for the SessionStart nudge,
  `/seo refresh` trigger, and disabled-by-default automation paths.

### Changed

- Meta-router and `/seo` command updated with the new intents (refresh, on-page,
  schema, geo).
- `VISION.md` marks v2 complete; README updated to 9 skills.

## [0.1.1] — 2026-04-27

Adds the dead-easy install path for non-technical users.

### Added

- `/seo-setup` — conversational 5-minute installer wizard. Opens browser tabs at
  exact Google Cloud URLs, takes minimal input, and validates each step.
- `scripts/check.sh` — readiness verification with green/red per check.
- `scripts/wire-credentials.sh` — safe env writer (gsc / psi / check).
- `INSTALL.md` — leads with the easy path; DIY path linked secondarily.

### Changed

- README + `VISION.md` surface `/seo-setup` as the entry point.

## [0.1.0] — 2026-04-27

Initial release.

### Added

- Plugin manifest (`.claude-plugin/plugin.json` + `marketplace.json`).
- **4 skills:** `seo-superpower` (meta-router), `seo-bootstrap`,
  `auditing-technical-seo`, `finding-underserved-keywords` (migrated from its
  standalone repo).
- Single slash command: `/seo` (with optional intent argument).
- MCP integration via `.mcp.json`: `gsc`, `pagespeed` (active);
  `lighthouse-local`, `geo-check`, `schema-validate` (stubs, planned for v2/v3).
- Framework templates for Next.js / Astro / SvelteKit.
- `MCP_SETUP.md` for the credential bootstrap.
- `VISION.md` roadmap (v1 shipped / v2 / v3).

[Unreleased]: https://github.com/benskamps/seo-superpower/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/benskamps/seo-superpower/releases/tag/v0.3.1
[0.3.0]: https://github.com/benskamps/seo-superpower/releases/tag/v0.3.0
[0.2.0]: https://github.com/benskamps/seo-superpower/releases/tag/v0.2.0
[0.1.1]: https://github.com/benskamps/seo-superpower/releases/tag/v0.1.1
[0.1.0]: https://github.com/benskamps/seo-superpower/releases/tag/v0.1.0
