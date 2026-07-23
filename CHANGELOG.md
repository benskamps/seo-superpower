# Changelog

All notable changes to **seo-superpower** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning convention (see [DEVELOPING.md](DEVELOPING.md#releasing)): bugfixes and
small additions ship as patch releases (`0.3.x`); new skills ship as minor releases
(`0.x.0`). The canonical version lives in
[`.claude-plugin/plugin.json`](.claude-plugin/plugin.json).

## [Unreleased]

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

### Fixed

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
