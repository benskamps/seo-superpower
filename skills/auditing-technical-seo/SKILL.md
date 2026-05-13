---
name: auditing-technical-seo
description: Use when running a technical SEO audit, debugging Core Web Vitals regressions, checking indexability, validating schema and sitemaps, diagnosing why a site isn't ranking, or preparing a site for AI-search visibility (GPTBot, ClaudeBot, PerplexityBot). Covers crawlability, indexability, rendering, Core Web Vitals, schema, AI-search readiness, mobile, security, and meta basics. Lifecycle-aware — pre-launch, growth, mature. Produces a prioritized SEO_AUDIT.md and a low-risk fix PR.
---

# Auditing Technical SEO

## Overview

Technical SEO is the foundation. Content strategy, keyword work, and link building all assume that Google, Bing, and AI-search crawlers can actually fetch, render, and trust your pages. If any of those fail, nothing else compounds. In 2026 that surface is wider than it used to be: Core Web Vitals are still the user-experience signal Google measures at the **75th percentile** with thresholds **LCP < 2.5s, INP < 200ms, CLS < 0.1** [1], and a new tier of AI crawlers — GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended — now decides whether your content shows up in ChatGPT, Claude, and Perplexity answers [2][3].

## What this skill checks

- **Crawlability:** `robots.txt` parses cleanly, no accidental site-wide `Disallow: /`, sitemap referenced as absolute URL, sitemap reachable and valid, file under 500 KiB (Google's hard cap) [6][7].
- **Indexability:** GSC index coverage cross-referenced via `gsc-mcp`, canonical tags consistent and self-referential where appropriate, hreflang correct on i18n sites, no duplicate content via tracking parameters, no `noindex` on pages that should rank [5].
- **Rendering:** SSR/SSG vs CSR-only routes (CSR-only pages are largely invisible to GPTBot/ClaudeBot/PerplexityBot, which do not execute JS reliably), critical content not hidden behind hydration [2][3].
- **Core Web Vitals:** LCP, INP, CLS, TTFB measured at p75 via `lighthouse-mcp` (PageSpeed Insights / CrUX field data) [1].
- **Schema:** JSON-LD present in `<head>` or root layout, types valid against schema.org (Article, BlogPosting, Organization, FAQPage, BreadcrumbList, Product as appropriate), validates via `validator.schema.org` [4].
- **AI-search readiness:** `robots.txt` makes a deliberate choice on GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended (allow or block — both are valid; absence is the bug) [2][3]. `llms.txt` presence noted but not required: adoption is ~10% of domains and effect on AI citations is unproven [8].
- **Mobile:** viewport meta present, mobile-friendly via PSI mobile run.
- **Security:** HTTPS only, HSTS header, no mixed content, valid certificate.
- **Meta basics:** unique `<title>` (50–60 chars) and `meta description` (150–160 chars) per page; Lighthouse SEO category flags these explicitly [5].

## The audit flow

**1. Gather.** Read repo files: `package.json` (framework detection), `app/robots.ts` or `public/robots.txt`, `app/sitemap.ts` or `public/sitemap.xml`, `app/layout.tsx` (or Astro `Layout.astro` / SvelteKit `+layout.svelte`) for `<head>` schema, `next.config.js` / `astro.config.mjs` / `svelte.config.js` for redirect/rewrite rules. Then fetch the live site's `/robots.txt`, `/sitemap.xml`, `/llms.txt`. Call `lighthouse-mcp` for PSI on the homepage and 2–3 representative inner pages (mobile + desktop). Call `gsc-mcp` if connected for index coverage and submitted-sitemap status.

**2. Cross-reference.** Does the deployed sitemap match what GSC has on file? Are CSR-only routes leaking into the sitemap? Does `robots.txt` block any URL that's also in the sitemap (the classic conflict) [7]? Are GSC-reported "Discovered – currently not indexed" URLs concentrated in one route group?

**3. Write `SEO_AUDIT.md`** to repo root. Findings ranked by **traffic-impact × fix-effort** in a quadrant — high-impact / low-effort first.

**4. Open ONE PR** with the highest-confidence, low-risk fixes only: adding viewport meta, adding missing meta descriptions, adding `Sitemap:` line to `robots.txt`, adding explicit GPTBot/ClaudeBot allow-or-block stanza, adding root `Organization` JSON-LD. Leave architectural calls (CSR → SSR migration, image pipeline rework) for human decision in the audit doc.

## No-MCP fallback

When `lighthouse-mcp` and `gsc-mcp` aren't configured (user hasn't run `/seo-setup`, or invoked via `/seo audit <url>`), run the **no-OAuth quick path**. This finishes in <60s and produces a partial audit that's still useful — Lighthouse/GSC sections are flagged as missing rather than fabricated.

**What to do:**

1. **Fetch static resources** via `curl` / HTTP GET (no auth):
   - `GET /robots.txt` — check 200, non-empty, `Sitemap:` line present, AI-bot stanza (GPTBot / ClaudeBot / Claude-SearchBot / PerplexityBot / Google-Extended named — allow or disallow, just named).
   - `GET /sitemap.xml` — check 200, parses as XML, >0 URLs, file <500 KiB.
   - `GET /` (homepage) plus 2 inner pages discovered from the sitemap (a content page + a category/listing page if present).

2. **Parse head tags** on each fetched page:
   - `<title>` present, length 50–60 chars ideal.
   - `<meta name="description">` present, length 150–160 chars ideal.
   - `<link rel="canonical">` present, self-referential or sensible.
   - `<meta name="viewport">` present.
   - `<script type="application/ld+json">` count ≥ 1, JSON parses without error.
   - Exactly one `<h1>` per page.
   - `<meta name="robots">` not `noindex` on pages that should rank.

3. **AI-bot readiness check** — `robots.txt` mentions at least three of: `GPTBot`, `ClaudeBot`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended`. Absence is the bug, not the directive — both `Allow:` and `Disallow:` are valid choices. If missing, reference `templates/robots-ai-bots.txt` as a paste-ready starting point.

4. **Core Web Vitals** — if `PSI_API_KEY` is set in env (or `~/.openclaw/.env`), call `scripts/psi-quick.py <url>` (CrUX field data preferred, lab fallback flagged). If no key, **skip CWV** and note it in the output rather than guessing.

5. **Emit a partial `SEO_AUDIT.md`** with this banner at the top:

   ```
   > **Partial audit — Lighthouse/GSC data missing.** Run `/seo-setup` to unlock CWV + GSC analysis. Static checks below were run without OAuth.
   ```

Everything else in `SEO_AUDIT.md` follows the normal output schema below. Findings that depended on Lighthouse or GSC become explicit gaps ("CWV not measured — gated on `/seo-setup`") rather than fake data.

## Output path — `SEO_AUDIT_OUTPUT` env var

By default, `SEO_AUDIT.md` is written to the repo root (`./SEO_AUDIT.md`). When auditing a foreign repo (e.g., dogfooding against a user's site without committing the audit to their tree), set `SEO_AUDIT_OUTPUT` to redirect:

```bash
SEO_AUDIT_OUTPUT=~/audits/example-2026-05-12.md /seo audit https://example.com
```

Common patterns:
- `./SEO_AUDIT.md` (default) — commit alongside the fix PR.
- `~/audits/<domain>-<date>.md` — keep audits in a personal archive, don't pollute the target repo.
- `/tmp/SEO_AUDIT.md` — throwaway / demo runs.

Add `SEO_AUDIT.md` to the target repo's `.gitignore` if the audit is meant to be ephemeral.

## Output format — `SEO_AUDIT.md` shape

```
# SEO Audit — example.com — 2026-04-26

## Quadrant
                 LOW EFFORT          HIGH EFFORT
HIGH IMPACT  | Add meta descriptions | Migrate /blog to SSR
LOW IMPACT   | Tidy llms.txt         | Refactor schema graph

## Findings

### [P0] Sitemap not referenced in robots.txt
Severity: high · Effort: 5 min · Confidence: 100%
Fix: Add `Sitemap: https://example.com/sitemap.xml` to `app/robots.ts`.

### [P0] LCP 4.1s on /pricing (p75 mobile)
Severity: high · Effort: medium · Confidence: 90%
Cause: hero image not preloaded, no priority hint.
Fix: <Image priority fetchPriority="high" /> on hero.

### [P1] No GPTBot/ClaudeBot stanza in robots.txt
Severity: medium · Effort: 2 min · Confidence: 100%
Decision required: allow or block? Both are valid choices.
```

## Lifecycle awareness

Mirroring the lifecycle pattern in `finding-underserved-keywords`:

- **Initial (pre-launch / first 3 months):** focus on indexability, schema, sitemap correctness, canonical hygiene, robots.txt sanity. Core Web Vitals data isn't statistically meaningful yet — CrUX needs traffic.
- **Growth (3–12 months):** add CWV regressions and mobile-friendliness; cross-reference GSC index coverage to catch routes silently dropping out.
- **Mature (12+ months):** decay defense — schema drift (types deprecated upstream at schema.org), CWV regressions from third-party script creep, sitemap bloat from old URLs, AI-crawler policy review as new bots emerge.

## Common mistakes

- Running the audit before the site is deployed — most checks need a live URL.
- Conflating crawlability with rankings — fixing robots.txt won't lift a thin-content page.
- Skipping mobile — Google indexes mobile-first; desktop-only Lighthouse misses real failures.
- Blocking AI-search bots without realizing — broad `Disallow: /` against `User-agent: *` blocks ClaudeBot too [3].
- Treating Lighthouse SEO score as the audit — it's 8 pass/fail checks, not a strategy [5].

## Common false positives

- Lighthouse flagging "image elements do not have explicit width and height" on the LCP image when it's *intentionally* the hero — that's correct architecture, not a bug.
- Schema.org validator "warnings" that are recommendations, not errors — distinguish before opening a PR.
- PSI showing CWV "needs improvement" on a brand-new page — CrUX field data is sparse; lab data only at this stage.
- `llms.txt` missing — flag as suggestion only; no measurable AI-citation effect yet [8].

Citations and verification tags in [SOURCES.md](SOURCES.md).
