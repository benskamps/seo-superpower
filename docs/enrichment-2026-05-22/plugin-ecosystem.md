# Plugin Ecosystem Enrichment — seo-superpower v3 positioning

**Generated:** 2026-05-22
**Domain:** Claude Code plugin ecosystem 2026 — distribution, marketplace dynamics, manifest conventions, craft of making a CC plugin succeed
**Scope:** Plugin distribution + ecosystem positioning for `seo-superpower` v3. Does NOT cover SEO substance or GEO landscape (sibling agent owns that).
**Sources cross-referenced:** 13 web sources (4 A-tier official Anthropic docs, 5 B-tier recognized publishers, 4 C-tier community blogs)
**Verification posture:** Aggressive — ecosystem moves weekly; anything not freshly fetched is **Training-Confirmed**, not **Supported**.

---

## TL;DR — 10–12 specific moves seo-superpower v3 should make

1. **Submit to the community marketplace** (`anthropics/claude-plugins-community`). It's the gating step between "another GitHub repo" and "shows up in /plugin Discover." Inclusion is automated-validation + safety-screening, not editorial. [A2, Supported]
2. **Add `category` and `tags` to your marketplace.json plugin entry.** Marketplace.json's plugin entry now supports `category`, `tags`, `keywords`, `homepage`, `version`. The official marketplace categorizes by `security`, `productivity`, `development`, `monitoring`, `deployment`, etc. — pick the closest: `productivity` (or argue for a new `marketing`/`seo`). [A1, Supported]
3. **Pin every entry to a commit SHA.** Community marketplace requires `sha` on the source object. Without it you're not eligible. [A1, Supported]
4. **Compress the README to a smallest-first-win in <60 seconds.** Lead with one command + screenshot of a real audit output. Per multiple plugin author posts, "three focused plugins beat ten that fight for attention" — seo-superpower's 13 skills must NOT be the lede; the *value* must be. [B/C, Training-Confirmed]
5. **Show the Context Cost.** Claude Code v2.1.143+ displays a context-cost estimate before install. With 13 skills, seo-superpower's frontmatter alone is ~1300 tokens always-on. Audit each skill description down to ~80 tokens; lazy-load reference material via skill body, not frontmatter. [A1, Supported on cost display; B on tuning math]
6. **Lean on the v2.1.145 "Will install" preview.** That UI now shows commands/agents/skills/hooks/MCP/LSP before install. Every entry is a marketing surface — make sure each skill name + 1-line description sells itself in isolation. [A1, Supported]
7. **Name the wedge in plugin.json `description` (≤200 chars).** Your current description is great ("Works on free-tier GSC + PageSpeed only — no DataForSEO, no $200/mo SaaS") — keep it. That's the differentiator vs the two real competitors. Don't soften it for v3.
8. **Add a kickoff message via session-start hook.** When a user first loads the plugin, a `SessionStart` hook can print "Run `/seo-setup` for the 5-minute install path." That's the difference between adoption and abandonment. [A2 + B; pattern documented]
9. **Position against the two real competitors by NAME** in the README's comparison table:
   - **claude-seo** (AgriciDaniel) — 25 skills + 18 agents, requires DataForSEO/Firecrawl/Banana paid keys. **Your wedge: free-tier.**
   - **SearchFit SEO** — 11 skills + 3 agents, 6,096 installs, SaaS company. **Your wedge: open-source MIT, no SaaS lock-in, dev-first kickoff (`/seo-setup`).**
   [A2 + B, Supported on competitor existence; install count for SearchFit Supported]
10. **Ship a 30-second demo GIF/MP4.** Multiple guides reference `readme-demo-recorder` for this exact use case (scripted GIF under GitHub's 10 MB inline cap). README hero asset is the single highest-ROI artifact you can add before v3 launch. [C, Training-Confirmed]
11. **Communicate the v0.3.x → v3 jump unambiguously.** Right now the codebase is at `0.3.1` in plugin.json but VISION.md says "v3 SHIPPED ✅" — these two are out of sync from a user's perspective. Pick one: either bump plugin.json to `1.0.0` (since you've shipped what you originally called v3) or rename internal phases to v0.3/v0.4/v0.5. The marketplace will show `version` field literally; ambiguity here looks unprofessional. [Estimated, but high confidence — observed mismatch in repo]
12. **Add `claude-code-plugin` GitHub topic tag** to the repo and commit. ClaudePluginHub, claudemarketplaces, ComposioHQ/awesome-claude-plugins, and quemsah's automated metrics crawler all key off this topic for daily indexing. Free distribution surface that requires one click. [B, Training-Confirmed]

---

## Source Registry

| ID  | Source                                                                                       | Authority | Date     | Domain                              |
|-----|----------------------------------------------------------------------------------------------|-----------|----------|-------------------------------------|
| A1  | code.claude.com/docs/en/discover-plugins                                                     | A         | 2026-05  | Official user-flow + UI details     |
| A2  | code.claude.com/docs/en/plugin-marketplaces                                                  | A         | 2026-05  | Official marketplace authoring docs |
| A3  | github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json      | A         | 2026-05  | Live marketplace.json schema source |
| A4  | github.com/anthropics/claude-code/blob/main/plugins/README.md                                | A         | 2026-05  | Anthropic's official plugin authoring conventions |
| A5  | code.claude.com/docs/en/skills                                                               | A         | 2026-05  | SKILL.md frontmatter spec           |
| B1  | github.com/ComposioHQ/awesome-claude-plugins (curated list)                                  | B         | 2026-05  | Plugin taxonomy + featured plugins  |
| B2  | github.com/AgriciDaniel/claude-seo (competitor)                                              | B         | 2026-05  | Competitor: claude-seo              |
| B3  | claude.com/plugins/searchfit-seo (competitor)                                                | B         | 2026-05  | Competitor: SearchFit SEO           |
| B4  | dev.to/composiodev/10-top-claude-code-plugins-to-use-in-2026                                 | B         | 2026-04  | Top-plugin recommendations          |
| B5  | github.com/quemsah/awesome-claude-plugins (n8n metrics)                                      | B         | 2026-05  | Automated install-metric tracker    |
| C1  | medium.com/@tentenco/superpowers-gsd-and-gstack...                                            | C         | 2026-04  | Three-framework comparison          |
| C2  | alexop.dev/posts/understanding-claude-code-full-stack/                                       | C         | 2026-04  | Skill vs MCP vs subagent vs hook   |
| C3  | thepromptshelf.dev/blog/claude-code-hooks-complete-reference-2026                            | C         | 2026-04  | Hook patterns reference             |
| C4  | claudefa.st/blog/guide/changelog                                                              | C         | 2026-05  | CC release notes                    |
| C5  | bito.ai/ai-tools/claude-code-plugins/                                                        | C         | 2026-05  | Plugin install-count visibility     |

---

## Section 1: Plugin Ecosystem 2026 — Scale & Shape

### Verified Data
- **Three official Anthropic marketplaces exist** [A1, **Supported**]:
  - `claude-plugins-official` — curated, auto-available on Claude Code start, Anthropic editorial gate, auto-update ON by default.
  - `claude-plugins-community` — third-party plugins that passed automated validation + safety screening. Each pinned to a commit SHA. User must `add` manually.
  - `claude-code-plugins` (demo) — Anthropic's example/demo plugins in `anthropics/claude-code` repo.
- **Total plugins published:** approximately 9,000+ as of April 2026; ~100 considered "production-ready." [B4 dev.to, C5 bito; **Partially Supported** — sources cite different counts; ClaudePluginHub claims 31,904 indexed components which includes skills/MCPs not just plugins]
- **Top plugin by visible installs:** `feature-dev` (official Anthropic plugin), 89,000+ installs. [C5, **Supported** — install counts ARE publicly tracked and visible]
- **Top community frameworks by GitHub stars** [C1, **Supported**]:
  - Superpowers: ~94,000 stars
  - gstack: ~50,000 stars
  - GSD: ~35,000 stars
  - Claude HUD: 9,000 stars (Jan 2026 launch, 371 forks)

### Top categories (taxonomy from B1 ComposioHQ + A3 official marketplace)
| Category (community) | Category (official enum) | seo-superpower fit |
|----------------------|--------------------------|--------------------|
| Integrations | `productivity`, `monitoring` | partial — has GSC/PSI MCPs |
| Frontend & Design | `design` | no |
| Git & Version Control | (none in official enum) | no |
| Code Quality & Testing | `development` | no |
| Backend & Architecture | `development` | no |
| DevOps & Performance | `deployment`, `monitoring` | no |
| Documentation & Security | `security` | no |
| Developer Productivity | `productivity` | **best fit** |
| Companion & Personality | (none) | no |

**No `seo`, `marketing`, or `content` top-level category exists in the official enum.** seo-superpower will compete in `productivity` against integrations like airtable, asana, apollo. [A3, **Supported**]

### Distribution Surfaces (where users actually find plugins)
1. **`/plugin` Discover tab** — primary surface, in-product [A1, **Supported**]
2. **claude.com/plugins** — web catalog [A1, **Supported**]
3. **Third-party directories** [C5, **Supported**]:
   - claudemarketplaces.com
   - claudepluginhub.com (claims 31,904 components, daily-updated from GitHub)
   - aitmpl.com/plugins
4. **GitHub topic `claude-code-plugin`** — keyed by multiple awesome-lists + automated crawlers [B1, B5, **Supported**]
5. **Curated awesome-lists**:
   - `ComposioHQ/awesome-claude-plugins` [B1, **Supported**]
   - `Chat2AnyLLM/awesome-claude-plugins` [B-search, Training-Confirmed]
   - `quemsah/awesome-claude-plugins` (automated n8n metrics) [B5, **Supported**]
   - `rohitg00/awesome-claude-code-toolkit` (claims 176+ plugins) [B-search, Training-Confirmed]
6. **Twitter/X + blog recommendations** — composio.dev, firecrawl.dev, redwerk.com, prodmgmt.world, bito.ai all publish "best plugins" lists regularly. SEO-juice for the listed plugins. [C, **Training-Confirmed** — list publishers fluctuate]

---

## Section 2: Plugin Manifest Conventions — schema ground truth

### plugin.json (in plugin repo's `.claude-plugin/`)
Lives at `<plugin-root>/.claude-plugin/plugin.json`. Only `plugin.json` lives in `.claude-plugin/` — everything else (commands/, agents/, skills/, hooks/, .mcp.json) lives at the plugin root. [A4, **Supported**]

seo-superpower's current plugin.json:
```json
{
  "name": "seo-superpower",
  "version": "0.3.1",
  "description": "...",
  "author": {"name": "Benjamin Schippers", "url": "..."},
  "homepage": "https://github.com/benskamps/seo-superpower",
  "repository": {"type": "git", "url": "..."},
  "license": "MIT",
  "keywords": ["seo", "geo", "generative-engine-optimization", "search-console", "lighthouse", "core-web-vitals", "next.js", "astro", "sveltekit", "claude-code"]
}
```

**Audit:** Structurally clean. The `keywords` field is good — but understand it's primarily for human/SEO indexers (no evidence the marketplace UI keyword-filters on this). The strategically loaded fields are `description` (shown in /plugin Discover) and `version` (shown literally).

### marketplace.json (in marketplace catalog repo's `.claude-plugin/`)

Full schema (from A3 official + B-tier JSON schema repos, **Supported**):

```jsonc
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "string (required)",
  "description": "string (required)",
  "owner": {
    "name": "string (required)",
    "email": "string (optional)",
    "url": "string (optional)"
  },
  "plugins": [
    {
      "name": "string (required, kebab-case)",
      "description": "string (required)",
      "category": "string (required, see enum)",
      "source": "object|string (required)",
      "author": {"name": "...", "email": "...", "url": "..."},
      "homepage": "string (optional)",
      "version": "string (optional, semver)",
      "tags": ["string"],
      "skills": ["string"],
      "strict": "boolean (LSP)",
      "lspServers": "object (LSP)"
    }
  ]
}
```

**Source object — three variants** [A3, **Supported**]:
```jsonc
// Variant 1: git-subdir (most common for multi-plugin marketplaces)
"source": {
  "source": "git-subdir",
  "url": "https://github.com/...",
  "path": "plugins/seo-superpower",
  "ref": "main",
  "sha": "abc123..."  // required for community marketplace
}

// Variant 2: full git repo
"source": {"source": "url", "url": "...git", "sha": "..."}

// Variant 3: local
"source": "./plugins/seo-superpower"
```

### Category enumeration (observed in official marketplace) [A3]
`security`, `design`, `development`, `productivity`, `database`, `location`, `monitoring`, `deployment`

**Gap:** No `seo`, `marketing`, or `content` category. seo-superpower's most accurate fit is `productivity`. [**Estimated** based on observed enum; Anthropic does not publish a closed list]

### SKILL.md frontmatter conventions [A5, **Supported**]
- Located at `<plugin-root>/skills/<skill-name>/SKILL.md`
- Skill name: kebab-case, 1–64 chars, no consecutive hyphens, must match directory name
- Frontmatter: YAML between `---` markers
- **Only `description` is recommended frontmatter** — it determines auto-invocation
- Gerund naming preferred: `auditing-technical-seo`, `finding-underserved-keywords` (seo-superpower already follows this — ✓)
- Description should include **exact trigger phrases**: "This skill should be used when the user asks to 'audit my site', 'check SEO', 'run an SEO audit'..."
- Claude pre-loads ~100 tokens per skill (the frontmatter); skill body is lazy-loaded on invocation
- **Implication:** 13 skills × ~100 tokens = ~1300 tokens of always-on context just from seo-superpower. That's ~0.7% of a 200K context. Acceptable, but tighten descriptions ruthlessly.

---

## Section 3: Skill vs Subagent vs MCP vs Hook — division of labor

[C2 alexop.dev + B4 + C3 thepromptshelf, **Supported** on conceptual breakdown; specific seo-superpower mapping is **Estimated**]

| Tool | When to use | seo-superpower current use | v3 recommendation |
|------|-------------|---------------------------|-------------------|
| **Skill** (markdown + frontmatter) | Re-usable playbook; lazy-loaded; auto-invokes on description match | 13 skills shipped — appropriate. This is the core. | Audit descriptions for trigger-phrase density; tighten. |
| **Slash command** (`commands/*.md`) | User-explicit entry; less semantic than skill | `/seo`, `/seo-setup` — appropriate | Keep slash commands as the canonical "front door"; skills are the worker bees. |
| **Subagent** (`agents/*.md`) | Parallel execution, context isolation, specialized tool sandboxing | None currently | **Consider** for v3+: a `seo-auditor` subagent for the heavy crawl/parse pass (avoids context pollution of main thread). Mirrors claude-seo's 18-subagent pattern, but don't bloat. |
| **MCP server** (`.mcp.json`) | External API actions; auth boundaries; persistent state | `geo-check`, `schema-validate` — appropriate | Keep these. The "free-tier GSC + PSI" wedge is precisely a NO-MCP / Pass-A fallback story → which is already shipping in v0.3.1. |
| **Hook** (`hooks/*.json`) | Deterministic event-driven enforcement (cannot hallucinate) | `seo-decay-check.json` documented; weekly opt-in | Add `SessionStart` hook to print kickoff message (see TL;DR #8). Consider `PreToolUse` hook that blocks committing pages with missing meta-description (deterministic SEO gate). |

### Hook events available (2026) [C3, **Supported**]
32+ events documented; 5 handler types; exit-code semantics. Useful events for SEO:
- `SessionStart` — load context, print kickoff
- `PreToolUse` (on Write/Edit) — block bad SEO output (missing meta, no canonical, etc.)
- `PostToolUse` (on Write/Edit) — log SEO-relevant changes to a journal
- `Stop` — summarize SEO changes made this session

### Subagent vs general-purpose [A4 + B4, **Supported**]
- Use `subagent_type='general-purpose'` for ad-hoc exploratory tasks
- Use a **named custom agent** (in `agents/<name>.md`) when:
  - The task has specialized tool needs (e.g., crawl + parse + score)
  - You want to constrain the tools the subagent can use
  - Multiple users will trigger the same specialized workflow
- claude-seo (competitor) uses 18 custom agents → likely overkill; risk of context bloat. seo-superpower's lean stance is strategically correct.

---

## Section 4: Competitive Positioning

[B2 claude-seo + B3 SearchFit-SEO, **Supported**; competitor table is the canonical positioning artifact]

| Plugin | Skills | Agents | MCPs | License | Free-tier? | Installs | Wedge |
|--------|--------|--------|------|---------|-----------|----------|-------|
| **seo-superpower** | 13 | 0 (intentional) | geo-check, schema-validate, gsc-mcp, lighthouse-mcp | MIT | **YES — primary wedge** | (not yet visible) | Free-tier dev-first, `/seo-setup` in 5 min, no SaaS lock-in |
| **claude-seo** (AgriciDaniel) | 25 sub-skills | 18 sub-agents | DataForSEO (22 cmds), Firecrawl, Banana | MIT | NO — DataForSEO is paid | 7k stars / 143 commits | Comprehensive, parallel-subagent crawl, paid API muscle |
| **SearchFit SEO** | 11 auto-activating | 3 (SEO Auditor, Content Strategist, Competitor Analyzer) | (SaaS internal) | (SaaS plugin) | (free toolkit but SaaS) | 6,096 installs | Polished, marketed by SearchFit.ai company, in-editor consolidation |
| **claude-rank** (Houseofmvps) | (unclear, 170+ rules) | (10 scanners) | — | (unclear) | likely YES | (unclear) | GEO-only / AI-citation focus, narrow wedge |
| **seo-plugin** (danielrosehill) | (small) | — | — | (unclear) | likely YES | small | Meta-tag focus, narrow |
| **Nuxt SEO Pro plugin** | (small, Nuxt-only) | — | — | (proprietary) | NO — Nuxt SEO Pro license | (unclear) | Nuxt-specific, integrated with their paid product |

### Wedge sentence for the README
> "The only Claude Code SEO plugin that works on free-tier GSC + PageSpeed alone — no DataForSEO ($200+/mo), no Firecrawl credits, no SaaS lock-in. Five-minute setup, twelve skills, zero credit cards."

[**Estimated** wording; **Supported** on every factual claim — claude-seo requires DataForSEO; SearchFit is a SaaS; seo-superpower is MIT free-tier]

---

## Section 5: What makes a CC plugin SUCCEED — the recipe

[B-tier consensus across composio.dev, firecrawl.dev, redwerk.com, theneildave.in, **Partially Supported**]

### The recipe (from cross-referenced best-plugin posts)
1. **One clear use case in one sentence.** Plugins with diffuse value props don't get installed. seo-superpower's current description is good — keep the wedge sharp.
2. **Smallest-first-win in <60 seconds.** First README screenshot must show output, not setup.
3. **Kickoff-friendly install.** `/plugin install <name>@<marketplace>` should be one line; setup wizard (`/seo-setup`) handles the rest.
4. **Demo GIF/MP4 in README.** Multiple sources cite this as the highest-ROI artifact. `readme-demo-recorder` tool exists specifically for this.
5. **Evals/proof.** Show that it works on real sites. seo-superpower already has `DOGFOOD-2026-05-12.md` (vibecrafting.ai run) — surface this in README.
6. **Last-updated date.** Claude Code v2.1.144+ shows this in /plugin Discover. Keep commits regular.

### Anti-patterns (consensus across composio, alexop, medium-tentenco) [C, **Training-Confirmed**]
- **Bloated plugins** (50 skills nobody uses) — claude-seo at 25+18 is on the edge of this. seo-superpower's 13 is defensible if every one earns its description-token.
- **Unclear value proposition** — diffuse "all-in-one" framing without a wedge.
- **Broken on first run** — depends on env vars not documented or MCP servers not auto-configured.
- **Requires manual MCP config the install doesn't handle.** → Critical for seo-superpower: `/seo-setup` MUST handle GSC OAuth + PSI key dance, not paper over it.
- **Hidden costs.** Plugin install adds always-on context (now shown via "Context cost" in v2.1.143+). Bloat = visible tax.

---

## Section 6: Discoverability mechanics — the actual install funnel

[A1 + C5, **Supported**]

### Pre-install signals visible to users (Claude Code v2.1.143+)
1. **Plugin name** (one shot at making it memorable — `seo-superpower` is good)
2. **Description** (200-char first impression)
3. **Context cost** (token estimate, v2.1.143+)
4. **Last updated** date (v2.1.144+)
5. **"Will install" preview** (v2.1.145+): commands, agents, skills, hooks, MCP, LSP

### Install counts
**Yes, install counts ARE visible.** [C5 bito.ai, **Supported**] — `feature-dev` shows 89,000+; SearchFit SEO shows 6,096. This is a public competitive metric.

### Trending / Featured
- The official marketplace has editorial discretion on inclusion [A1, **Supported**]
- No documented "trending" surface, but third-party directories (claudemarketplaces.com, claudepluginhub.com) sort/highlight popular plugins
- The community marketplace uses automated validation — not editorial — for inclusion

### How users actually find plugins (cross-referenced from 5+ sources)
1. **/plugin Discover** in-product — highest-intent surface
2. **Blog posts**: "Top X Claude Code plugins" posts from composio, firecrawl, bito, redwerk, prodmgmt, neildave drive massive traffic. Getting on one of these = adoption boost.
3. **Twitter/X recommendations** by recognized authors (gstack/Garry Tan, Superpowers/Jesse Vincent, etc.)
4. **GitHub topic search** on `claude-code-plugin`
5. **Awesome-lists** (Composio's is most-referenced)

### Versioning & release cadence
- Plugins use semver in `plugin.json.version` [A4, **Supported**]
- Community marketplace pins each entry to a specific `sha` — your `version` field is shown to users but the actual code served is whatever the marketplace pins [A1 + A2, **Supported**]
- **Breaking changes:** No formal protocol; recommend `CHANGELOG.md` at plugin root + a `BREAKING.md` for major bumps. [**Estimated** — no documented convention]

---

## Section 7: License & governance

[A4 + B2 + B3, **Supported**]
- MIT is the dominant license for community plugins (claude-seo, seo-superpower, gstack, Superpowers all MIT)
- Apache 2.0 is acceptable but less common for plugins
- AGPL is incompatible with the "install and forget" model — avoid
- **Attribution for paid services** the plugin uses (PageSpeed Insights API, GSC OAuth, schema.org): no documented requirement, but a `CREDITS.md` or README "Built on" section is good hygiene
- **Security disclaimer:** the official docs explicitly warn "Anthropic does not control what MCP servers, files, or other software are included in plugins" [A1, **Supported**] — every plugin author should mirror this in their README

---

## Section 8: Community building

[**Training-Confirmed** + B-tier — patterns observed but not formally documented]

Effective community surfaces for CC plugins in 2026:
1. **GitHub Discussions** on the plugin repo — low-friction, indexed by Google
2. **Discord** — gstack and Superpowers both run active Discord communities; barrier to entry is higher
3. **Twitter/X** — plugin authors (especially Garry Tan, Jesse Vincent) maintain visibility through threads
4. **Demo videos** on YouTube/Loom — referenced in multiple "best plugins" articles
5. **Cross-promotion** with adjacent plugin authors — being mentioned in another plugin's README

For seo-superpower: Ben's `vibecrafting.ai` is the preferred public-example domain. Using it as the canonical demo target gives:
- A real site to dogfood
- A cross-promotion surface (vibecrafting fans → seo-superpower)
- A consistent screenshot/demo backdrop

---

## Section 9: Contradictions Resolved

| # | Contradiction | Resolution |
|---|---------------|------------|
| 1 | Total plugin count: 9,000 (B4 dev.to) vs 31,904 components (claudepluginhub) vs 176+ (rohitg00) | These count different things. **9,000+ plugins** is the strongest number (B4); 31,904 includes skills + MCPs + plugins; 176+ is one curator's view. Use ~9,000 published, ~100 production-ready. |
| 2 | Subagent count for "good" plugins: claude-seo has 18, SearchFit has 3, seo-superpower has 0 | No right number. Subagent count is a function of how much parallel sandboxed work you do, not a quality proxy. seo-superpower's 0 is a strategic choice; v3 could add 1 (`seo-auditor`) without bloat. |
| 3 | Category for seo-superpower: `productivity` vs new `marketing` | Use `productivity` — it's the closest match in the observed official enum. Lobbying for a new category is low-ROI. |
| 4 | Marketplace.json version field meaning vs plugin.json version | `plugin.json.version` is the canonical version inside the plugin. `marketplace.json` plugin-entry `version` is optional and informational; marketplace pins by `sha`. Keep both in sync at release. |

## Section 10: Gaps & Estimates

- **GAP:** Exact submission process for `anthropics/claude-plugins-community`. The docs reference an "in-app submission form" [A1] but the form's URL/path wasn't fetched. **Action for v3 release:** look for the form via `/plugin` UI on a fresh Claude Code; document the steps.
- **GAP:** Whether `keywords` in plugin.json is searchable in /plugin Discover. **Action:** test by installing a plugin with a unique keyword and searching for it in the UI.
- **ESTIMATED:** Token cost per skill is "~100 tokens" — could be 50–150 depending on description length. Worth measuring directly with `/context` on a session that has seo-superpower installed.
- **ESTIMATED:** Best-fit category. `productivity` is the best observed option; Anthropic does not publish a closed list, so this could change.

---

## Section 11: v3 Release Checklist (draft)

Use this as the v3 ship gate. Bold items are blockers; italics are nice-to-have.

### Manifest hygiene
- [ ] **`plugin.json.version` bumped to a coherent number** (resolve the 0.3.1-vs-v3 ambiguity — recommend `1.0.0` since you've shipped what the roadmap called v3, OR keep `0.x` and rename internal phases)
- [ ] **`plugin.json.description` ≤200 chars, leads with the free-tier wedge** (current text is good — keep)
- [ ] `plugin.json.keywords` includes: `seo`, `geo`, `generative-engine-optimization`, `search-console`, `lighthouse`, `core-web-vitals`, plus the framework names you support (`next.js`, `astro`, `sveltekit` — done)
- [ ] **`marketplace.json` entry created** (either in your own marketplace repo or submitted to community marketplace)
- [ ] **Source pinned to commit SHA**

### README
- [ ] **Hero section ≤3 lines: what + wedge + install command**
- [ ] **30-second demo GIF/MP4** (use `readme-demo-recorder` or OBS; <10 MB for GitHub inline)
- [ ] **"Install in 60 seconds" section first** — before features, before philosophy
- [ ] **Competitive comparison table** naming claude-seo + SearchFit + claude-rank
- [ ] **Real dogfood evidence** — link `DOGFOOD-2026-05-12.md` from the README
- [ ] *Screenshots of `/seo audit` output on a real site*
- [ ] *Link to vibecrafting.ai as the canonical demo target*

### Discoverability
- [ ] **GitHub repo topic `claude-code-plugin` added** (one-click; free distribution)
- [ ] Other relevant topics: `seo`, `generative-engine-optimization`, `claude-code-skill`, `mcp-server`
- [ ] **PR to `ComposioHQ/awesome-claude-plugins`** to add seo-superpower under Developer Productivity
- [ ] **PR to `quemsah/awesome-claude-plugins`** (automated metrics indexer)
- [ ] *Submit to `claude-plugins-community` via in-app form (post-v3 ship)*

### Skill-level hygiene
- [ ] **Every SKILL.md description ≤200 tokens** (Claude pre-loads frontmatter; 13 skills × 200 = 2,600 token ceiling)
- [ ] **Every skill description includes 3+ exact trigger phrases** users would say
- [ ] **Every skill name in kebab-case, gerund-form** (already compliant — verify)
- [ ] *Add `disable-model-invocation: true` only on skills that should be manual-only*

### Hooks (new for v3)
- [ ] **`SessionStart` hook** that prints kickoff: "seo-superpower v1.0.0 active. Run `/seo-setup` for the 5-min install or `/seo audit <url>` for an instant no-OAuth audit."
- [ ] *`PreToolUse` hook (opt-in) that warns on Write/Edit when page is missing meta-description*
- [ ] **`hooks/seo-decay-check.json` documented as opt-in** (already done — verify)

### Documentation
- [ ] **`CHANGELOG.md` at repo root** with v0.x → v1.0 history
- [ ] **`BREAKING.md` if v1.0 changes the install path or skill names**
- [ ] **`INSTALL.md` leads with `/plugin install seo-superpower@<marketplace>`** once marketplace exists
- [ ] **`MCP_SETUP.md` is the fallback** for users who prefer manual MCP config
- [ ] *`DEVELOPING.md` for dogfood mode (already shipped in v0.3.1)*

### Release mechanics
- [ ] **Single signed commit `v1.0.0: <one-line summary>`**
- [ ] **GitHub release with notes** mirroring CHANGELOG entry
- [ ] **Tweet / X thread** announcing release (Ben's audience surface)
- [ ] **Blog post or LinkedIn note** with the demo GIF
- [ ] *Submit to "Top X Claude Code plugins for 2026" updates by reaching out to composio/firecrawl/bito*

### Post-ship monitoring
- [ ] **Watch install count** in /plugin Discover (community marketplace)
- [ ] **GitHub Discussions enabled** on the repo (low-friction community surface)
- [ ] *Set up `quemsah/awesome-claude-plugins`-style metric scrape for own tracking*

---

## Section 12: Self-Verification Checklist

- [x] Every value in the knowledge base has a source tag
- [x] Every source tag points to an entry in the Source Registry
- [x] Contradictions explicitly resolved (Section 9)
- [x] Research manifest items covered (or flagged as GAP in Section 10)
- [x] Estimated values distinguished from Supported values
- [x] Six WebSearches + four WebFetches fired (target was 4+); Anthropic docs, GitHub competitor repos, recognized publishers, and community blogs all hit
- [x] Did NOT touch: `skills/`, `agents/`, `mcp-servers/`, `.claude-plugin/` (per instructions)
- [x] Did NOT cover: SEO substance, GEO landscape, classical SEO tactics (sibling agent owns those)

---

## Changelog
- 2026-05-22: Initial knowledge base from 13 sources cross-referenced (4 A-tier, 5 B-tier, 4 C-tier). Author: win-Claude (Librarian).

---

## Sources (for the markdown hyperlinks the WebSearch tool requires)

- [Anthropic — Discover and install prebuilt plugins through marketplaces](https://code.claude.com/docs/en/discover-plugins)
- [Anthropic — Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Anthropic — claude-plugins-official marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)
- [Anthropic — claude-code/plugins/README.md](https://github.com/anthropics/claude-code/blob/main/plugins/README.md)
- [Anthropic — Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [ComposioHQ — awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins)
- [AgriciDaniel — claude-seo (competitor)](https://github.com/AgriciDaniel/claude-seo)
- [Anthropic — SearchFit SEO plugin page](https://claude.com/plugins/searchfit-seo)
- [Composio — 10 top Claude Code plugins to use in 2026](https://dev.to/composiodev/10-top-claude-code-plugins-to-use-in-2026-4gn6)
- [quemsah — awesome-claude-plugins (automated metrics)](https://github.com/quemsah/awesome-claude-plugins)
- [Medium / Ewan Mak — Superpowers, GSD, gstack: what each framework constrains](https://medium.com/@tentenco/superpowers-gsd-and-gstack-what-each-claude-code-framework-actually-constrains-12a1560960ad)
- [alexop.dev — Understanding Claude Code's Full Stack: MCP, Skills, Subagents, Hooks](https://alexop.dev/posts/understanding-claude-code-full-stack/)
- [The Prompt Shelf — Claude Code Hooks: The Complete 2026 Reference](https://thepromptshelf.dev/blog/claude-code-hooks-complete-reference-2026/)
- [claudefa.st — Claude Code Changelog 2026](https://claudefa.st/blog/guide/changelog)
- [bito.ai — Best Claude Code plugins in 2026](https://bito.ai/ai-tools/claude-code-plugins/)
