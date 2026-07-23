---
name: auditing-technical-seo
description: Use when running a technical SEO audit, debugging Core Web Vitals regressions, checking indexability, validating schema and sitemaps, diagnosing why a site isn't ranking, or preparing a site for AI-search visibility (GPTBot, ClaudeBot, PerplexityBot). Covers crawlability, indexability, rendering, Core Web Vitals, schema, AI-search readiness, mobile, security, and meta basics. Lifecycle-aware — pre-launch, growth, mature. Produces a prioritized SEO_AUDIT.md and a low-risk fix PR.
---

# Auditing Technical SEO

## Overview

Technical SEO is the foundation. Content strategy, keyword work, and link building all assume that Google, Bing, and AI-search crawlers can actually fetch, render, and trust your pages. If any of those fail, nothing else compounds. In 2026 that surface is wider than it used to be: Core Web Vitals are still the user-experience signal Google measures at the **75th percentile** with thresholds **LCP < 2.5s, INP < 200ms, CLS < 0.1** [1], and a new tier of AI crawlers — GPTBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended — now decides whether your content shows up in ChatGPT, Claude, and Perplexity answers [2][3].

## What this skill checks

- **Crawlability:** `robots.txt` parses cleanly and stays under Google's 500 KiB parse cap (bytes past it are ignored) [6]; no accidental site-wide `Disallow: /`; sitemap referenced as an absolute URL, reachable, valid, and within the single-sitemap limits of **50,000 URLs / 50 MB uncompressed** — split into a sitemap index above either [7]. Run `node scripts/baseline-check.js <url>` rather than eyeballing these.
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

1. **Run `scripts/baseline-check.js`** (`node scripts/baseline-check.js <url>`) — this does the whole static pass deterministically (fetches `/`, `/robots.txt`, and the declared sitemap; parses head tags and JSON-LD; resolves robots.txt groups; scores Pass A out of 10; emits a route). Use `--json` to consume the result. Do **not** hand-tally these checks; the script exists because the tally gates the router.

   What it checks, for reference:
   - `GET /robots.txt` — 200, non-empty, `Sitemap:` line present, under the 500 KiB parse cap [6], explicit policy on ≥3 AI crawlers.
   - `GET <declared sitemap>` — 200, parses as sitemap XML, >0 URLs, within 50,000 URLs / 50 MB [7].
   - `GET /` — title, meta description, canonical, viewport, valid JSON-LD, single `<h1>`, no stray `noindex`.

   Then fetch 2 inner pages discovered from the sitemap (a content page + a category/listing page if present) and repeat the head-tag checks on them.

2. **Judge head-tag quality.** The script reports presence and length; you judge fit. `<title>` 50–60 chars, `<meta name="description">` 150–160 chars, canonical self-referential or sensibly cross-referential, no `noindex` on a page that should rank. Presence is mechanical (scored); *quality* is the part that needs a reader.

3. **AI-bot readiness** — read the script's "AI citation readiness" block, which resolves robots.txt groups rather than grepping for names. Two distinct questions:

   - **Citation (the one that pays):** can the *retrieval* crawlers reach you — `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`? Per OpenAI's crawler docs, sites that block `OAI-SearchBot` "will not be shown in ChatGPT search answers." Naming `GPTBot` does **not** cover this: GPTBot is training-only and has no bearing on citation. Missing a retrieval bot from `robots.txt` is not automatically a failure — an unnamed bot inherits `User-agent: *`, so a permissive wildcard still lets it through — but that is luck, not policy, and it breaks the moment someone tightens the wildcard. Recommend naming them explicitly.
   - **Policy hygiene (the Pass A point):** an explicit stanza for ≥3 AI crawlers. Absence is the bug, not the directive — both `Allow:` and `Disallow:` are valid choices.

   If either is thin, reference `templates/robots-ai-bots.txt` as a paste-ready starting point.

4. **Core Web Vitals** — if `PSI_API_KEY` is set in env (or `~/.config/seo-superpower/.env`), call `scripts/psi-quick.py <url>` (CrUX field data preferred, lab fallback flagged). If no key, **skip CWV** and note it in the output rather than guessing. Thresholds are p75: **LCP < 2.5s, INP < 200ms, CLS < 0.1** [1].

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
