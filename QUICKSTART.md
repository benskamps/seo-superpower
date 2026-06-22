# Quickstart — your first SEO PR in 5 minutes

You've installed the plugin (if not, that's the 5-minute part — see [INSTALL.md](INSTALL.md)).
This page is the *what do I type now* sheet. Pick the row that matches your site and paste the prompt.

```bash
# One-time, ~5 min — opens browser tabs, takes you click-by-click:
/seo-setup
# After that, the whole product is one command:
/seo
```

`/seo` with no argument diagnoses your site's lifecycle phase and picks for you.
The three sections below are what happens when you want to drive it yourself.

---

## 1. Day 1 — a fresh site

You just shipped (or are about to). No Search Console history yet. Goal: be crawlable, indexable,
and rich-result-eligible from the start.

**Type:**

```
/seo bootstrap
```

or in plain words: *"I just shipped my site, set up SEO"* / *"add a sitemap and robots.txt"*.

**You get:** a single PR with a `sitemap.xml`, `robots.txt`, an OG image, and JSON-LD schema —
framework auto-detected (Next.js / Astro / SvelteKit), and only the pieces you're missing get
generated. Review the diff, merge, done.

**While you're here (no GSC needed yet):**

| You want | Type | You get |
|---|---|---|
| Ideas for what to write | `/seo` → *"what should I write about, no GSC data yet"* | A clustered `KEYWORD_MAP.md` from autocomplete / People-Also-Ask / Reddit demand mining ([`researching-keywords-pre-launch`](skills/researching-keywords-pre-launch/SKILL.md)) |
| A content architecture | *"plan topic clusters for my site"* | `CONTENT_PLAN.md` — pillars, spokes, slugs, link matrix, publish order ([`planning-topic-clusters`](skills/planning-topic-clusters/SKILL.md)) |
| Schema on a specific page | *"add Article schema to /blog/x"* | A PR with validated JSON-LD ([`adding-schema-markup`](skills/adding-schema-markup/SKILL.md)) |

---

## 2. An existing site

Live, indexed, maybe ranking — but you've never run an SEO pass, or something feels off.
Goal: find what's holding the site back, ranked by impact.

**Type:**

```
/seo audit
```

or *"audit my site"* / *"why isn't my site ranking"* / *"check Core Web Vitals"*.

**You get:** a prioritized `SEO_AUDIT.md` — crawlability, indexability, rendering, Core Web Vitals
(via PageSpeed), schema, AI-search readiness (GPTBot / ClaudeBot / PerplexityBot), and meta basics —
each fix ranked by traffic-impact × fix-effort, plus a low-risk fix PR for the safe wins
([`auditing-technical-seo`](skills/auditing-technical-seo/SKILL.md)).

**Have a few months of GSC data?**

| You want | Type | You get |
|---|---|---|
| Quick keyword wins | `/seo underserved` | Striking-distance keywords you already rank for but under-click, pulled from your GSC ([`finding-underserved-keywords`](skills/finding-underserved-keywords/SKILL.md)) |
| Polish one page | *"optimize the SEO on /pricing"* | One focused PR: title, meta, H-hierarchy, internal links, alt text ([`optimizing-on-page`](skills/optimizing-on-page/SKILL.md)) |
| Beat a competitor | *"why does competitor.com outrank us for [query]"* | `CONTENT_BRIEF.md` with the entity/H2/schema gaps ranked by impact ([`analyzing-content-gaps`](skills/analyzing-content-gaps/SKILL.md)) |

---

## 3. After setup — the always-on loop

Once you're set up, the day-to-day is two recurring moves: keep AI engines citing you, and catch
pages before they decay.

| You want | Type | You get |
|---|---|---|
| Track AI citations | `/seo geo-check` | A provider × prompt matrix — does ChatGPT / Claude / Perplexity / Gemini cite your domain? Tracked over time with a baseline + delta ([`optimizing-for-generative-engines`](skills/optimizing-for-generative-engines/SKILL.md)) |
| Catch content decay | `/seo refresh` | Auto-detects pages losing >20% impressions in GSC and ships a refresh PR — updated copy, `dateModified`, internal links, IndexNow ping ([`refreshing-stale-content`](skills/refreshing-stale-content/SKILL.md)) |
| Build long-term authority | *"build E-E-A-T / author bios"* | An authority plan + trust-signal PRs ([`building-eeat-and-authority`](skills/building-eeat-and-authority/SKILL.md)) |
| Scale pages from data | *"programmatic SEO from my Supabase table"* | A data → template → schema → sitemap pipeline with quality gates ([`generating-programmatic-seo`](skills/generating-programmatic-seo/SKILL.md)) |

The `hooks/seo-decay-check.json` hook also nudges you on session start when a weekly decay scan
finds something worth a `/seo refresh`.

---

## Where to go next

- **Full setup walkthrough** → [INSTALL.md](INSTALL.md) (easy path) or [MCP_SETUP.md](MCP_SETUP.md) (DIY).
- **Every skill at a glance** → [skills/REGISTRY.md](skills/REGISTRY.md).
- **What the MCP servers do** → [MCP_SERVERS.md](MCP_SERVERS.md).
- **Just type `/seo`** — when in doubt, run it with no argument and let it triage.
