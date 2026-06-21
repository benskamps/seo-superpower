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

- `CHANGELOG.md` (this file) — reconstructed history from `v0.1.1` onward.
- `CONTRIBUTING.md` — the skill-contribution path, repo layout, validation
  expectations, and PR conventions.

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
