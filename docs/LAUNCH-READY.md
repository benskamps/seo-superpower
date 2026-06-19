# LAUNCH-READY — seo-superpower

**Status: COPY-FINAL, BEN-GATED. Nothing here has been posted, forked, opened, or sent.**
Every block below is paste-and-send. The actual outreach (HN post, awesome-list PRs, DMs) is Ben's to fire — a Night Shift builder is not authorized to post in Ben's voice or open PRs to other people's repos.

This file consolidates the three outreach surfaces into one:
1. **Show HN** — exact title + body.
2. **Awesome-list PRs** — the specific repos, the exact entry line, the PR text (from `docs/launch-submissions-DRAFT-2026-06-16.md`, which remains the detailed source).
3. **3 named DMs** — @leeerob, @rauchg, @alexalbert__, copy-final.

**Verified product facts** (single source of truth — from the DRAFT, confirmed on disk):
- Name: `seo-superpower` · Version: **v0.3.1** · License: MIT · Author: `benskamps`
- Repo: https://github.com/benskamps/seo-superpower (public)
- **14 skills** (12 child + `seo-bootstrap` + `seo-superpower` meta-router) · **4 active MCP servers** (gsc, pagespeed, geo-check, schema-validate) + 1 opt-in disabled (lighthouse-local)
- First public commit 2026-04-27 (~7 weeks old) · Pre-launch, dogfooded on vibecrafting.ai, **no users yet**

Install snippet (used in several blocks):
```
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower@benskamps-marketplace
/seo-setup
```

---

## 1 — SHOW HN (paste into https://news.ycombinator.com/submit)

**Title** (76 chars — under HN's 80 limit):
```
Show HN: SEO for developers – Claude Code plugin that ships fixes as PRs
```

**URL field:**
```
https://github.com/benskamps/seo-superpower
```

**Text field (first comment — post immediately after submitting):**
```
I'm a solo builder who kept shipping sites with zero SEO because the tooling
all lives outside the editor — Ahrefs/Surfer/Semrush are $130–500/mo and the
"strategy" ends up in a Notion doc nobody opens. So I built the SEO loop into
the place I already work: Claude Code.

seo-superpower is a plugin. You run /seo, and instead of a dashboard you get a
pull request — sitemap, robots.txt, JSON-LD schema, OG metadata, or a
content-refresh that weaves in striking-distance keywords (the ones you already
rank 5–15 for but never mention). It auto-detects your site's lifecycle phase
(just shipped / indexed-but-stalled / mature-and-decaying) and runs the right
diagnostic — Lighthouse + Google Search Console in parallel.

It runs entirely on free-tier Google APIs (Search Console + PageSpeed Insights).
No DataForSEO, no paid SaaS, $0/mo. 14 skills, 4 bundled MCP servers
(GSC, PageSpeed, an AI-citation/GEO tracker, a JSON-LD schema validator).

The part I haven't seen elsewhere: GEO (Generative Engine Optimization). It
polls ChatGPT/Perplexity/Claude/Gemini for citations of your domain and tracks
the delta over time, so when your AI-search visibility drops you can correlate
it to a recent commit.

It's MIT-licensed and the skills are just markdown — PRs to add one are welcome.
Pre-launch and honest about it: dogfooded on my own site (vibecrafting.ai), no
users yet. I'd genuinely love feedback on the PR-instead-of-dashboard thesis and
on whether the free-tier-only constraint holds up for real sites.
```

**Timing note for Ben:** post 9 AM ET Tue/Wed; reply to every comment in the first 30 min (velocity in hour 1 is everything).

---

## 2 — AWESOME-LIST PRs

> Full per-list detail (required formats, sections, blockers, checklist confirmations) lives in `docs/launch-submissions-DRAFT-2026-06-16.md`. This is the condensed fire-list. **Send order: 1 → 2 → 3; HOLD 4 until post-launch traction.**

### 2.1 — hesreallyhim/awesome-claude-code  ⭐ SEND FIRST (~46.6k stars, highest reach, fully eligible)
- **Mechanism: ISSUE FORM, not a PR** (repo is CSV-driven + `collaborators_only` PRs). Open the "Recommend a resource" issue template.
- Field values:
  - Display Name: `seo-superpower`
  - Category: `Agent Skills` · Sub-Category: `General`
  - Primary Link: `https://github.com/benskamps/seo-superpower`
  - Author Name: `benskamps` · Author Link: `https://github.com/benskamps` · License: `MIT`
  - **Description** (verbatim):
    ```
    A Claude Code plugin for SEO and Generative Engine Optimization. The /seo command detects a site's lifecycle phase, runs Lighthouse and Google Search Console diagnostics in parallel, and opens a pull request with the fixes rather than producing a report. It bundles 14 skills and four MCP servers (Search Console, PageSpeed Insights, an AI-citation tracker, and a JSON-LD schema validator) and runs entirely on free-tier Google APIs.
    ```
  - **Validate Claims** (verbatim):
    ```
    Install the plugin in any Next.js, Astro, or SvelteKit repo and run /seo bootstrap. It will detect the framework and open a single PR adding a sitemap, robots.txt, an Organization JSON-LD block, and OG metadata — verifiable by reviewing the diff, no external account required. The schema-validate MCP can then be run offline against the generated JSON-LD to confirm rich-result eligibility.
    ```
  - **Specific Task(s):** `Ask Claude to bootstrap SEO on a freshly scaffolded Next.js site and open a PR with the baseline SEO files.`
  - **Specific Prompt(s):** `/seo bootstrap`
- **Ben to confirm first:** no other open issue under `benskamps` in that repo (their checklist requires zero).

### 2.2 — ComposioHQ/awesome-claude-skills  (SEND SECOND)
- Mechanism: Fork → add entry to README → PR. Section: `### Business & Marketing`.
- **PR title:** `Add seo-superpower skill (Business & Marketing)`
- **Exact entry:**
  ```markdown
  - [seo-superpower](https://github.com/benskamps/seo-superpower) - End-to-end SEO + Generative Engine Optimization (GEO) plugin: 14 skills covering bootstrap, technical audit, keyword research, topic clusters, schema, E-E-A-T, programmatic SEO, content refresh, and AI-search citation tracking. Ships fixes as PRs. Runs on free-tier Google Search Console + PageSpeed only. *By [@benskamps](https://github.com/benskamps)*
  ```
- **PR body:**
  > Adds **seo-superpower** to Business & Marketing. A Claude Code SEO + GEO plugin: `/seo` runs an audit→fix loop and opens PRs (sitemap, schema, striking-distance keywords, content refresh) instead of producing a dashboard. 14 skills, 4 bundled MCP servers. Free-tier Google APIs only. MIT. Real use case, no duplication of existing entries, dogfooded on vibecrafting.ai. Follows the list's external-repo + `*By [@handle]*` format.

### 2.3 — ComposioHQ/awesome-claude-plugins  (SEND THIRD)
- Mechanism: Fork → add entry to README → PR. Section: `### DevOps & Performance` (no SEO category yet; offer to seed one).
- **PR title:** `Add seo-superpower to DevOps & Performance`
- **Exact entry:**
  ```markdown
  - [seo-superpower](https://github.com/benskamps/seo-superpower) - End-to-end SEO + Generative Engine Optimization (GEO) for technical builders. One `/seo` command runs bootstrap, audit, underserved-keyword discovery, and content refresh — shipping fixes as PRs. 14 skills, 4 bundled MCP servers (GSC, PageSpeed, GEO citation tracker, schema validator). Free-tier Google APIs only — no DataForSEO, no paid SaaS.
  ```
- **PR body:**
  > Adds **seo-superpower** under DevOps & Performance. It's an end-to-end SEO + GEO plugin for Claude Code: `/seo` auto-detects your site's lifecycle phase, runs the right diagnostic in parallel (Lighthouse + GSC), and opens a PR with the fix — sitemap, robots.txt, JSON-LD schema, striking-distance keyword work. 14 skills, 4 bundled MCP servers (gsc, pagespeed, geo-check, schema-validate), runs entirely on free-tier Google Search Console + PageSpeed Insights. MIT-licensed, public, addresses a real use case (SEO that ships as code instead of a dashboard), and doesn't duplicate any existing plugin in the list. Tested / dogfooded on vibecrafting.ai. (Maintainer note: if you'd consider a "Marketing & SEO" category, this would seed it — happy to add the heading in this PR.)

### 2.4 — VoltAgent/awesome-agent-skills  🚩 HOLD until post-launch
- Their CONTRIBUTING explicitly rejects brand-new, no-usage skills ("Give your skill time to mature and gain users"). seo-superpower is pre-launch with no users. **Do not send until there's adoption to point at.** When ready: PR title `Add skill: benskamps/seo-superpower`, section Community Skills → Marketing, ≤10-word entry:
  ```markdown
  - **[benskamps/seo-superpower](https://github.com/benskamps/seo-superpower)** - SEO + GEO plugin that ships fixes as PRs
  ```

---

## 3 — DIRECT DMs (3 named, copy-final)

> Warm DM, not cold pitch. Send each as a single message with the repo link. Don't mass-blast — space them out; lead with the angle each person actually cares about.

### 3.1 — @leeerob (Lee Robinson, Vercel) — angle: any new Next.js site rankable in 5 min
```
Hey Lee — built a Claude Code plugin you might like the shape of: /seo on a
fresh Next.js repo opens a single PR with sitemap, robots.txt, Organization
JSON-LD, and OG metadata — auto-detects the framework, runs entirely on
free-tier Google Search Console + PageSpeed (no Ahrefs, no paid SaaS). The thesis
is "SEO ships as a PR you review, not a dashboard you ignore." MIT, repo here:
github.com/benskamps/seo-superpower — would love your read on the DX.
```

### 3.2 — @rauchg (Guillermo Rauch, Vercel) — angle: GEO / AI-search cannibalizing clicks
```
Hi Guillermo — you've been right that AI search is eating organic click traffic.
I built a Claude Code plugin with a GEO (Generative Engine Optimization) tracker
that polls ChatGPT/Perplexity/Claude/Gemini for citations of your domain and
diffs the delta over time — so when AI-search visibility drops you can correlate
it to a specific commit. It also does the classic SEO loop as PRs, free-tier
Google APIs only. github.com/benskamps/seo-superpower — curious what you think of
the GEO-diff angle.
```

### 3.3 — @alexalbert__ (Alex Albert, Anthropic DevRel) — angle: community-built Claude Code plugin
```
Hey Alex — built a Claude Code plugin that turns SEO into a normal dev loop:
/seo detects your site's lifecycle phase, runs Lighthouse + Google Search
Console in parallel, and opens a PR with the fix instead of a report. 14 skills,
4 bundled MCP servers, free-tier Google APIs only, MIT. Pre-launch but fully
working and dogfooded. github.com/benskamps/seo-superpower — thought it might fit
the community plugins you spotlight.
```

---

## Open items for Ben before firing (carried from the DRAFT)
- Confirm `finding-underserved-keywords` standalone repo is current before including the optional Target-3 second entry.
- Confirm no pre-existing open issue under `benskamps` on hesreallyhim/awesome-claude-code.
- Decide whether to lead descriptions with "14 skills / 4 MCP servers" or trim per each list's house style.
- Pick a Show HN day (Tue/Wed, 9 AM ET) and clear the first hour for replies.
