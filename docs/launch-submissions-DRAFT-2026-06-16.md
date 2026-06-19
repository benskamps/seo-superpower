# Awesome-List Submissions — DRAFT (staged for Ben to send)

**Status: DRAFT ONLY. Outward submission is Ben's call.** Nothing in this file has been forked, opened, or submitted. Each entry below is written in the exact format the target list requires, verified against that list's live README / CONTRIBUTING / issue-form on 2026-06-16.

## Verified product facts (the single source of truth for every entry below)

| Fact | Value | Source |
|---|---|---|
| Name | seo-superpower | `.claude-plugin/plugin.json` |
| Version | **v0.3.1** | `plugin.json`, README badge |
| Repo (public) | https://github.com/benskamps/seo-superpower | confirmed public via `gh` |
| License | MIT | `LICENSE`, `plugin.json` |
| Author | Benjamin Schippers (`benskamps`) | `plugin.json` |
| Skills | **14 total** (12 child skills + `seo-bootstrap` + `seo-superpower` meta-router) | `ls skills/` = 14 dirs; README header + skills badge both say 14 |
| MCP servers | **4 active** (`gsc`, `pagespeed`, `geo-check`, `schema-validate`) + 1 opt-in fallback (`lighthouse-local`, disabled by default) | `.mcp.json` declares 5; lighthouse-local has `"disabled": true` |
| First public commit | 2026-04-27 (~7 weeks old as of 2026-06-16) | `git log --reverse` |
| Status | Pre-launch, dogfooded on vibecrafting.ai (2026-05-12), **no users yet** | README status line |

### ⚠️ Two corrections vs. the kickoff brief — read before sending
1. **Skill count is 14, not 13.** The brief said "13 skills" but the README truth-pass (merged PR #2 for v0.3.1), the README skills badge, and `ls skills/` all agree on **14** (the `seo-superpower` meta-router is the 14th). Every entry below uses 14. If Ben wants to advertise "12 child skills" that is also defensible, but 14-total is the on-disk truth.
2. **MCP servers: "4 bundled" is correct as written** — 4 are active (`gsc`, `pagespeed`, `geo-check`, `schema-validate`). There is a 5th, `lighthouse-local`, but it ships `disabled: true` as an opt-in PSI-quota fallback, so "4" is the honest headline number. (Note: the LAUNCH_PLAN.md thread copy says "4 MCP tools: GSC, PageSpeed Insights, GEO tracker, schema validator" — that matches.)

---

## Install snippet (referenced by several entries)

```
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower@benskamps-marketplace
/seo-setup
```

---

# TARGET 1 — VoltAgent/awesome-agent-skills

- **Repo:** https://github.com/VoltAgent/awesome-agent-skills
- **Format source:** its `CONTRIBUTING.md` (verified 2026-06-16)
- **Required entry format:** `- **[author/skill-name](https://github.com/author/repo/path)** - Short description, 10 words or fewer`
- **Section to add under:** `Community Skills` → **Marketing** subcategory (existing peers there: `AgriciDaniel/claude-seo`, `BrianRWagner/ai-marketing-skills`). Add to the **end** of that subcategory.
- **PR title (their required convention):** `Add skill: benskamps/seo-superpower`

### Exact entry (drop at end of Community Skills → Marketing)
```markdown
- **[benskamps/seo-superpower](https://github.com/benskamps/seo-superpower)** - SEO + GEO for Claude Code; ships fixes as PRs, free-tier only
```
(Description = 13 words. Their hard cap is "10 words or fewer." A compliant ≤10-word fallback:)
```markdown
- **[benskamps/seo-superpower](https://github.com/benskamps/seo-superpower)** - SEO + GEO plugin that ships fixes as PRs
```
**→ Use the second (≤10-word) line to satisfy their rule.**

### 🚩 BLOCKER — likely rejected right now, hold this one
VoltAgent's CONTRIBUTING.md states: *"Skill must have real community usage… Brand new skills that were just created are not accepted. Give your skill time to mature and gain users before submitting."* seo-superpower is pre-launch with **no users yet**. This submission will probably be declined on the maturity bar. **Recommendation: do NOT send to VoltAgent until after launch traction exists (some installs / stars / usage).** Send the other three first; circle back here once there's adoption to point at.

### PR body (when eventually sent)
> Adds `benskamps/seo-superpower` to Community Skills → Marketing. A Claude Code plugin for end-to-end SEO + Generative Engine Optimization (GEO): one `/seo` command runs the bootstrap → audit → underserved-keyword → refresh loop and ships fixes as PRs. 14 skills, 4 bundled MCP servers (GSC, PageSpeed, GEO citation tracker, schema validator), free-tier Google APIs only — no DataForSEO, no paid SaaS. MIT-licensed, public repo. Links verified.

---

# TARGET 2 — ComposioHQ/awesome-claude-plugins

- **Repo:** https://github.com/ComposioHQ/awesome-claude-plugins
- **Format source:** README "Contributing" section + live entry samples (verified 2026-06-16)
- **Required entry format (external-repo style, matches their non-vendored entries):** `- [name](https://github.com/owner/repo) - Description.`
- **Section to add under:** No SEO/marketing category exists. Best fit is **`### DevOps & Performance`** (it already holds audit/perf/cost tools like `audit-project`, `aws-cost-saver`, `perf`). Alternative: **`### Developer Productivity`**. *Format assumption: a content/SEO tool has no perfect home here; DevOps & Performance is the closest by analogy to the existing "audit-project" entry. Flag to maintainer in the PR that a "Marketing & SEO" category may be warranted.*
- **Contribution mechanism:** Fork → add entry to README → PR. (No PR-title convention enforced; use a conventional one.)
- **PR title:** `Add seo-superpower to DevOps & Performance`

### Exact entry (drop at end of `### DevOps & Performance`)
```markdown
- [seo-superpower](https://github.com/benskamps/seo-superpower) - End-to-end SEO + Generative Engine Optimization (GEO) for technical builders. One `/seo` command runs bootstrap, audit, underserved-keyword discovery, and content refresh — shipping fixes as PRs. 14 skills, 4 bundled MCP servers (GSC, PageSpeed, GEO citation tracker, schema validator). Free-tier Google APIs only — no DataForSEO, no paid SaaS.
```

### PR body
> Adds **seo-superpower** under DevOps & Performance. It's an end-to-end SEO + GEO plugin for Claude Code: `/seo` auto-detects your site's lifecycle phase (just shipped / stalled / decaying), runs the right diagnostic in parallel (Lighthouse + GSC), and opens a PR with the fix — sitemap, robots.txt, JSON-LD schema, striking-distance keyword work. 14 skills, 4 bundled MCP servers (gsc, pagespeed, geo-check, schema-validate), runs entirely on free-tier Google Search Console + PageSpeed Insights. MIT-licensed, public, addresses a real use case (SEO that ships as code instead of a dashboard), and doesn't duplicate any existing plugin in the list. Tested / dogfooded on vibecrafting.ai. (Maintainer note: if you'd consider a "Marketing & SEO" category, this would seed it — happy to add the heading in this PR.)

---

# TARGET 3 — ComposioHQ/awesome-claude-skills

- **Repo:** https://github.com/ComposioHQ/awesome-claude-skills
- **Format source:** README "Business & Marketing" section + Contributing (verified 2026-06-16)
- **Required entry format:** `- [Display Name](https://github.com/owner/repo) - Description. *By [@handle](https://github.com/handle)*`
- **Section to add under:** **`### Business & Marketing`** (direct precedent there: `Brand Build Skills` — a SEO-inclusive skill library). Add alphabetically or at end.
- **Contribution mechanism:** Fork → add entry to README → PR.
- **PR title:** `Add seo-superpower skill (Business & Marketing)`

> Note: this list is skill-oriented. The brief mentioned "submit each major skill individually," but this list's actual convention is **one entry per repo/skill-pack** (e.g. `Brand Build Skills` = a 59-skill library as a single entry). So submit seo-superpower as **one entry for the whole pack**, not 14 separate rows. (`finding-underserved-keywords` has its own standalone repo — see the optional second entry below.)

### Exact entry (drop in `### Business & Marketing`)
```markdown
- [seo-superpower](https://github.com/benskamps/seo-superpower) - End-to-end SEO + Generative Engine Optimization (GEO) plugin: 14 skills covering bootstrap, technical audit, keyword research, topic clusters, schema, E-E-A-T, programmatic SEO, content refresh, and AI-search citation tracking. Ships fixes as PRs. Runs on free-tier Google Search Console + PageSpeed only. *By [@benskamps](https://github.com/benskamps)*
```

### Optional second entry (the standalone child-skill repo)
seo-superpower mirrors one skill to its own public repo. If submitting the granular skill too:
```markdown
- [finding-underserved-keywords](https://github.com/benskamps/finding-underserved-keywords) - Mines Google Search Console for striking-distance keywords (positions 5–15) you already rank for but never mention, then opens a content-refresh PR. *By [@benskamps](https://github.com/benskamps)*
```
*(Verify this repo is current before sending — it's referenced from the seo-superpower README skills table.)*

### PR body
> Adds **seo-superpower** to Business & Marketing. A Claude Code SEO + GEO plugin: `/seo` runs an audit→fix loop and opens PRs (sitemap, schema, striking-distance keywords, content refresh) instead of producing a dashboard. 14 skills, 4 bundled MCP servers. Free-tier Google APIs only. MIT. Real use case, no duplication of existing entries, dogfooded on vibecrafting.ai. Follows the list's external-repo + `*By [@handle]*` format.

---

# TARGET 4 — hesreallyhim/awesome-claude-code

- **Repo:** https://github.com/hesreallyhim/awesome-claude-code
- **Format source:** the repo is **CSV-driven** (`THE_RESOURCES_TABLE.csv` generates the README) and **`pull_request_creation_policy: collaborators_only`** — so direct README PRs from forks are NOT accepted.
- **⚠️ Submission mechanism is an ISSUE FORM, not a PR.** Open a new issue using their **"Recommend a resource"** template (`.github/ISSUE_TEMPLATE/recommend-resource.yml`). Fill these fields:
- **Star count correction:** the brief said 8.7k stars; the live repo is now **~46.6k stars**. Still the highest-reach target — prioritize it.

### Issue-form field values (copy into the "Recommend a resource" template)
| Form field | Value |
|---|---|
| **Display Name** | `seo-superpower` |
| **Category** | `Agent Skills` (their note: they currently lump "plugins" under Agent Skills) |
| **Sub-Category** | `General` (no SEO sub-category exists) |
| **Primary Link** | `https://github.com/benskamps/seo-superpower` |
| **Author Name** | `benskamps` |
| **Author Link** | `https://github.com/benskamps` |
| **License** | `MIT` |
| **Description** (1–3 sentences, no emojis, descriptive not promotional, do not address the reader) | *(see below)* |
| **Validate Claims** (mandatory for plugins/skills) | *(see below)* |
| **Specific Task(s)** | *(see below)* |
| **Specific Prompt(s)** | *(see below)* |

**Description (drop in verbatim):**
```
A Claude Code plugin for SEO and Generative Engine Optimization. The /seo command detects a site's lifecycle phase, runs Lighthouse and Google Search Console diagnostics in parallel, and opens a pull request with the fixes rather than producing a report. It bundles 14 skills and four MCP servers (Search Console, PageSpeed Insights, an AI-citation tracker, and a JSON-LD schema validator) and runs entirely on free-tier Google APIs.
```

**Validate Claims (mandatory field):**
```
Install the plugin in any Next.js, Astro, or SvelteKit repo and run /seo bootstrap. It will detect the framework and open a single PR adding a sitemap, robots.txt, an Organization JSON-LD block, and OG metadata — verifiable by reviewing the diff, no external account required. The schema-validate MCP can then be run offline against the generated JSON-LD to confirm rich-result eligibility.
```

**Specific Task(s):**
```
Ask Claude to bootstrap SEO on a freshly scaffolded Next.js site and open a PR with the baseline SEO files.
```

**Specific Prompt(s):**
```
/seo bootstrap
```

### Checklist confirmations (all satisfiable)
- [x] Not previously submitted (verify by searching the repo's issues first)
- [x] Over one week since first public commit — first commit 2026-04-27, ~7 weeks old ✅
- [x] All links working & public ✅
- [ ] No other open issues in that repo from this account — **Ben to confirm before opening**
- [x] Human-submitted

---

## Send order recommendation (highest reach + lowest friction first)
1. **hesreallyhim/awesome-claude-code** (~46.6k stars, issue-form, no maturity gate — repo is 7 weeks old which clears their 1-week rule). Highest reach, fully eligible now.
2. **ComposioHQ/awesome-claude-skills** (active 2026 list, clean fit in Business & Marketing, simple fork-and-PR).
3. **ComposioHQ/awesome-claude-plugins** (active 2026 list; offer to seed a Marketing/SEO category in the PR).
4. **VoltAgent/awesome-agent-skills** — **HOLD until post-launch.** Their CONTRIBUTING explicitly rejects brand-new, no-usage skills. Resubmit once there's adoption to point at.

## Open items for Ben before sending
- Confirm `finding-underserved-keywords` standalone repo is current (it's linked from the README skills table) before including the optional Target-3 entry.
- Confirm no pre-existing open issue under `benskamps` on hesreallyhim/awesome-claude-code (their checklist requires zero other open issues).
- Decide whether to lead the descriptions with "14 skills / 4 MCP servers" (done here) or trim for brevity per each list's house style.
