# Vision & Roadmap

**Mission:** make SEO a normal dev loop for technical builders. One command, one PR, one merged change at a time.

## The 12-skill picture

| # | Skill | Phase | Status |
|---|---|---|---|
| 1 | `setting-up-seo-measurement` | Initial | **v2 ✅** |
| 2 | `auditing-technical-seo` | Initial + cross-cutting | **v1 ✅** |
| 3 | `researching-keywords-pre-launch` | Initial | **v3 ✅** |
| 4 | `planning-topic-clusters` | Initial → Growth | **v3 ✅** |
| 5 | `analyzing-content-gaps` | Growth | **v3 ✅** |
| 6 | `optimizing-on-page` | Cross-cutting | **v2 ✅** |
| 7 | `adding-schema-markup` | Cross-cutting | **v2 ✅** |
| 8 | `optimizing-for-generative-engines` | Cross-cutting | **v2 ✅** |
| 9 | **`finding-underserved-keywords`** | Growth | **v1 (migrated) ✅** |
| 10 | `refreshing-stale-content` | Mature | **v2 ✅** |
| 11 | `building-eeat-and-authority` | Growth → Mature | **v3 ✅** |
| 12 | `generating-programmatic-seo` | Growth → Mature | **v3 ✅** |
| ★ | `seo-superpower` (meta-router) | Cross-cutting | **v1 ✅** |

**v2 status: 5/5 planned skills shipped + `geo-check` MCP working + decay-check hook documented.**

**v3 status: 5/5 planned skills shipped + `schema-validate` MCP working. 12/12 skill registry complete.**

## v1 — shipped

- Plugin scaffold (`.claude-plugin/plugin.json`, `marketplace.json`)
- Two commands: `/seo` (daily driver) + `/seo-setup` (5-min guided installer)
- 3 skills: `seo-superpower` meta-router, `seo-bootstrap`, `auditing-technical-seo`
- Migrated: `finding-underserved-keywords` from its standalone repo
- MCP integration plan (see `MCP_SETUP.md`) for `gsc-mcp` + `lighthouse-mcp`
- Helper scripts: `scripts/check.sh` (readiness verification), `scripts/wire-credentials.sh` (env writer)
- INSTALL.md leads with the click-by-click easy path
- README leads with the free-tier + dead-easy-setup wedge

**Goal:** a non-technical builder can install, run `/seo-setup` (~5 min), then `/seo` and get a working sitemap + schema + a fix-list in another 10 minutes. Total: 15 min from zero to value.

## v2 — SHIPPED ✅

- ✅ `optimizing-on-page` skill — title/meta/H/internal links per page (citation-backed)
- ✅ `adding-schema-markup` skill — JSON-LD decision tree + validation flow
- ✅ `optimizing-for-generative-engines` skill — first-class GEO with citation tracking
- ✅ `refreshing-stale-content` skill — decay detection + auto-refresh PR playbook
- ✅ `setting-up-seo-measurement` skill — GSC + GA4 + Bing + IndexNow onboarding
- ✅ Weekly decay-detection hook (opt-in, documented at `hooks/seo-decay-check.json`)
- ✅ `geo-check` MCP — working Python implementation, polls ChatGPT/Claude/Perplexity/Gemini, tracks citations with `geo_check` / `geo_track` / `geo_diff` tools

## v3 — SHIPPED ✅

- ✅ `building-eeat-and-authority` — author bios, brand mentions, original data, YMYL gates
- ✅ `generating-programmatic-seo` — template-driven page generation with 4 quality gates
- ✅ `analyzing-content-gaps` — competitor SERP diff with entity extraction
- ✅ `planning-topic-clusters` — pillar + spoke architecture, internal-link graph
- ✅ `researching-keywords-pre-launch` — cold-start keyword discovery (5 free signals)
- ✅ `schema-validate` MCP — offline JSON-LD validation against schema.org via pyld + extruct, with Google rich-result eligibility checks for 9 types

## What's beyond v3 (future)

- Cross-site comparison (multi-site portfolios)
- Markdown PDF reports via the `make-pdf` skill
- Activate the `seo-decay-check` hook with real automation (CronCreate / RemoteTrigger paths)
- Multi-language / hreflang skill

## The 5 killer features (the moat)

These are the demos no incumbent can match:

1. **Auto-PR-on-decay** — Weekly cron detects >20% impression drop in GSC, opens a refresh PR with updated copy + schema + internal links.
2. **GEO Diff Bot** — Daily polls ChatGPT/Claude/Perplexity, diffs citations vs. yesterday, correlates losses to recent commits via `git blame`.
3. **Programmatic Page Forge** — Reads your Supabase/Sanity schema, generates 500 unique location pages with schema and internal links — in an afternoon.
4. **Competitor Codebase Mirror** — Scrapes a competitor's HTML, reverse-engineers their schema/heading/link patterns, writes "things they do you don't" ranked by SERP delta.
5. **Brief-to-Merged-PR** — `/seo brief "<topic>"` → parallel SERP research → outline → MDX draft → PR with OG image. Idea-to-live in an hour.

## Honest limits

- No backlink database (use Ahrefs free trial quarterly)
- No historical SERP database
- No daily nationwide rank tracking (GSC averages only)
- No multi-user collab / agency dashboards
- Requires Claude Code

## How decisions get made

- **Skills** = reference docs Claude reads (judgment work)
- **MCPs** = repeatable tool calls Claude makes (GSC fetch, Lighthouse run)
- **Scripts** = one-time setup steps run via Bash
- **Slash commands** = entry points for the user (currently just `/seo`)

The 1-call rule: a builder should never need more than one command. Vague intent → meta-router diagnoses → child skill executes. Explicit intent → skill triggers directly.

## Contributing

See [README.md#contributing](README.md#contributing). The bar: a skill must auto-trigger on a real builder scenario the existing skills don't cover, and must work on free-tier APIs only (no DataForSEO, no paid SaaS dependencies).
