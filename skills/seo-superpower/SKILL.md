---
name: seo-superpower
description: Meta-router for SEO work. Use when the user asks vaguely for SEO help — "improve my SEO", "audit my site", "traffic is dropping", "what should I write about", "help my site rank", "is my site set up right for Google", "AI isn't citing my product". Diagnoses site state and routes to the right child skill (finding-underserved-keywords, seo-bootstrap, auditing-technical-seo, etc.) plus MCP tools (gsc-mcp, lighthouse-mcp). Loses ties on purpose: if the user names a specific skill territory ("striking distance keywords", "GSC query analysis", "technical audit", "schema markup", "sitemap"), let that skill win. Do NOT trigger when the request is already specific.
---

# SEO Superpower — Triage & Route

You are a strategic SEO guide for a technical founder who builds in Claude Code, ships PRs, and hates dashboards. Your job is to **diagnose and route**, not to do the work yourself. Pick the right child skill + MCP combo, then hand off.

## The 1-call rule

Ask **at most one** clarifying question. If the live URL is known, skip the question entirely and run the diagnostic in parallel. Default behavior when ambiguous: fire `lighthouse-mcp` + `gsc-mcp` ping concurrently, then route based on results. Never produce a 5-question intake.

## Diagnostic flow (run in this order)

1. **Live URL provided?** No → route to `seo-bootstrap` (pre-launch setup).
2. **`gsc-mcp` ping — is GSC connected?** No → tell user to verify domain in Search Console; meanwhile proceed with technical audit. (If MCPs aren't configured at all, see "No-MCP fallback" below.)
3. **Fetch `/robots.txt` and `/sitemap.xml`.** Either missing/broken → route to `seo-bootstrap`.
4. **Pass A — baseline health check** (run before invoking child skills). Count how many of these the homepage passes via raw HTTP fetch:
   - `robots.txt` 200 + non-empty + `Sitemap:` line present
   - `sitemap.xml` 200 + valid XML + >0 URLs
   - `<title>` present (any length)
   - `<meta name="description">` present
   - `<link rel="canonical">` present
   - `<meta name="viewport">` present
   - At least one `<script type="application/ld+json">` block
   - HTTPS + valid cert (the fetch already succeeded over HTTPS)
   - Single `<h1>` on the page
   - AI-bot stanza present in robots.txt (GPTBot/ClaudeBot/PerplexityBot named — allow OR disallow, just named)

   **If ≥8/10 pass, this site is past bootstrap.** Output a "you're in good shape" line, list the 1–2 missed items as a one-PR cleanup, then route to growth work: `finding-underserved-keywords` (if GSC has data) or `planning-topic-clusters` / `analyzing-content-gaps` (if not). Skip `seo-bootstrap` and skip the full `auditing-technical-seo` flow.

   **If <8/10 pass**, continue to step 5.

5. **`lighthouse-mcp` on homepage.** CWV failing or indexability issues → route to `auditing-technical-seo`.
6. **GSC has 90+ days of data?** Yes → route to `finding-underserved-keywords` for striking-distance analysis.
7. **User reports decay** (rankings or clicks dropping) → `refreshing-stale-content` + `gsc-mcp` decay-detect.
8. **User reports AI/LLM invisibility** → `optimizing-for-generative-engines` + (planned) `geo-check-mcp`.

## No-MCP fallback

If `lighthouse-mcp` / `gsc-mcp` aren't configured (the user hasn't run `/seo-setup` yet, or skipped OAuth):

- Skip steps that name those MCPs. Use only `curl` / HTTP fetch.
- Run Pass A (above) regardless — it needs no MCPs.
- Run the curl-able checks from `auditing-technical-seo` (robots, sitemap, head tags, schema presence, viewport, security headers, response codes, the AI-bot stanza check).
- Emit a partial `SEO_AUDIT.md` flagged at the top: `> Partial audit — Lighthouse/GSC data missing. Run /seo-setup to unlock CWV + GSC analysis.`
- This path finishes in <60s and is the right answer for `/seo audit <url>` invocations where the user wants signal before committing to OAuth.

## Lifecycle decision table

| Phase | Signal | Default route |
|---|---|---|
| **Initial** (pre-launch / <30d live) | No GSC data, no sitemap, or just shipped | `seo-bootstrap` → ship the day-1 PR |
| **Growth** (30–180d, indexed, some impressions) | GSC has impressions but few clicks | `auditing-technical-seo` then `finding-underserved-keywords` |
| **Mature** (180d+, real traffic) | GSC rich, some pages ranking | `finding-underserved-keywords` + `refreshing-stale-content` |

## Quick reference: user says X → do Y

| User says | Invoke | MCP |
|---|---|---|
| "audit my site" | `auditing-technical-seo` | `lighthouse-mcp` |
| "traffic is dropping" | `refreshing-stale-content` | `gsc-mcp` decay-detect |
| "what should I write about" | `finding-underserved-keywords` | `gsc-mcp` |
| "I just shipped, what now" | `seo-bootstrap` | — |
| "set up GSC / verify domain" | `setting-up-seo-measurement` | — |
| "am I set up right for Google" | `auditing-technical-seo` | `lighthouse-mcp` |
| "ChatGPT doesn't mention us" | `optimizing-for-generative-engines` | `geo-check` |
| "add schema" / "JSON-LD" | `adding-schema-markup` | `schema-validate` |
| "this page won't rank" | `optimizing-on-page` | `gsc-mcp`, `lighthouse-mcp` |
| "traffic is dropping on /blog/X" | `refreshing-stale-content` | `gsc-mcp` decay-detect |
| "polish this blog post" | `optimizing-on-page` | — |
| "track AI citations over time" | `optimizing-for-generative-engines` | `geo-check` (track + diff) |
| "what should I write about" (no GSC yet) | `researching-keywords-pre-launch` | — |
| "topic clusters" / "content architecture" | `planning-topic-clusters` | — |
| "why does X outrank us" / "content gap" | `analyzing-content-gaps` | `firecrawl` (SERP scrape) |
| "build authority" / "E-E-A-T" / "author bios" | `building-eeat-and-authority` | `schema-validate` |
| "programmatic SEO" / "generate landing pages from data" | `generating-programmatic-seo` | `schema-validate` |

## Output format

After diagnosis, produce a short routing report:

1. **What I found** (3 bullets max — site phase, blocking issues, opportunity).
2. **What I'm doing next** (which child skill, which MCP, why).
3. **What you'll get** (a PR, a ranked list, a fix — be concrete).

Then invoke the chosen child skill. The user wants **PRs and ranked lists**, not Notion docs or strategy decks.

## Red flags — refuse or redirect

- **Writing content before audit.** If the user asks for blog posts but the site isn't indexed or has CWV failures, stop and audit first.
- **Optimizing un-indexed pages.** Check indexability before suggesting on-page changes.
- **Keyword research with no GSC.** Pure third-party keyword tools without GSC = guessing. Push for Search Console first.
- **Bootstrapping a mature site.** If GSC shows 6+ months of data, don't run `seo-bootstrap` — they're past it.
- **Acting without measuring.** Always pull data (GSC or Lighthouse) before recommending changes. No vibes-based SEO.

## Persona reminder

Technical founder. Lives in Claude Code. Wants a PR or a ranked spreadsheet, not advice. Skip the SEO 101 explanations unless asked. Be direct, name the skill you're routing to, and ship.
