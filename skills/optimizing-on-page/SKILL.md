---
name: optimizing-on-page
description: Use when optimizing a single page for SEO — fixing title and meta, tightening H1/H2 hierarchy, improving internal linking and anchor text, auditing alt text, capturing featured snippets, or aligning a page with search intent. Auto-triggers on "optimize this page", "fix the SEO on this URL", "polish this blog post", "title and meta", "improve internal linking", "alt text audit". Per-page workhorse — takes a URL or markdown/MDX file path, ships ONE focused PR with title/meta/H/link/alt edits. Pairs with finding-underserved-keywords (feeds keywords in), auditing-technical-seo (clears blockers first), and adding-schema-markup (hands JSON-LD off).
---

# Optimizing On-Page

## Overview

The per-page workhorse. While `auditing-technical-seo` works at the site level and `finding-underserved-keywords` decides *what* to target, this skill executes the per-URL surgery: rewrite the title, tighten the meta, fix the H1/H2 spine, weave in internal links with descriptive anchor text, sweep alt text, and front-load a featured-snippet-capable answer. One URL in, one focused PR out. No site-wide refactors, no Notion docs.

## When to use

- "Optimize this page" / "fix the SEO on `/blog/foo`"
- A single blog post, landing page, or doc page needs polish
- `finding-underserved-keywords` produced a keyword cluster to integrate into one page
- A page ranks position 5–15 but the title/snippet is the bottleneck
- An internal-linking or alt-text sweep was requested for one URL
- You inherited a markdown/MDX file and need to ship it SEO-tight

**Don't use for:** site-wide audits (`auditing-technical-seo`), pre-launch setup (`seo-bootstrap`), JSON-LD work (`adding-schema-markup`), or keyword discovery (`finding-underserved-keywords`).

## What this skill checks

- **Title tag** — under ~600px (~50–60 chars), primary keyword in first 30–35 chars, no brand-doubling [1].
- **Meta description** — 140–155 chars (mobile truncates ~120) [2]; intent-aligned, value prop early.
- **H1** — exactly one per page, ≤60 chars, distinct from `<title>` (no H1=title duplication), reads like a headline not a keyword string [3].
- **H2/H3 nesting** — logical hierarchy, no level skipping (H1→H3), H2s mirror search-intent sub-questions [3].
- **Featured-snippet readiness** — direct ~40–50 word answer in the first paragraph of the relevant section, ideally under an H2 phrased as the question [6].
- **Internal links** — 2–5 contextual links per 1,000 words, descriptive anchor text (not "click here"), majority in body (top 30%), under 150 total page links [4].
- **Anchor-text variety** — ~15–25% exact match, ~30–40% partial, ~25–35% semantic [4]. No single anchor repeated to the same destination.
- **Alt text** — descriptive, 50–125 chars, no "image of", `alt=""` for decorative; no keyword stuffing [5].
- **Intent match** — page type (informational / commercial / transactional) matches what live SERP shows for the primary query.

## The optimization flow

1. **Read the page.** If a file path: open the markdown/MDX (or `.tsx`/`.astro`/`.svelte` route). If a URL: fetch the live HTML. Extract current `<title>`, meta description, headings tree, link graph, image alts.
2. **Pull keyword context.** If `finding-underserved-keywords` ran recently and produced a striking-distance cluster for this URL, load it. If not, ask the user for the primary query (one question, then move).
3. **Lighthouse SEO baseline.** Call `lighthouse-mcp` and capture pass/fail on the 8 SEO audits (title, meta, alt, link text, indexability, robots, canonical, hreflang) [7]. Lighthouse pass is the floor, not the ceiling.
4. **Rank gaps by impact.** Order: title > meta > H1 > featured-snippet paragraph > H2/H3 spine > internal links > alt text. Title/meta drive CTR on impressions you already earn — biggest dollar-per-edit.
5. **Propose edits as diffs.** For each gap, show before/after side-by-side with the rule it satisfies. No prose explanations longer than the edit itself.
6. **Open ONE PR** for this URL. Title: `seo: optimize on-page for /<slug>`. Body lists each change + the rule. No drive-by site-wide changes.

## Anti-patterns / common mistakes

- **Brand-doubling in title** — `Trip to Yosemite | Roadtripper | Roadtripper` (the bug we hit on Roadtripper trip pages). Brand goes once, at the end, separated by `|` or `—`.
- **Clickbait titles** — Google rewrites them, killing your CTR control.
- **H1 = page title** — verbatim duplication wastes a heading slot; H1 should expand or rephrase.
- **Keyword stuffing alt text or H2s** — alt becomes spam signal; H2s lose snippet eligibility.
- **Generic alt text** ("image", "photo", "logo") — fails accessibility AND AI-citation crawlers [5].
- **"Click here" / "learn more" anchors** — kills accessibility, gives Google nothing [4].
- **Too many internal links** (>150 page total or >10 to same destination) — dilutes equity.
- **Intent mismatch** — adding transactional CTAs to an informational page Google ranks for "how does X work".
- **Editing without checking the live SERP** — what currently ranks tells you the intent contract.

## Quick reference — if I want X, change Y

| Goal | Edit | Rule |
|---|---|---|
| More clicks on existing impressions | Title + meta description | <600px / 140–155 chars [1][2] |
| Featured snippet capture | Add 40–50 word answer under question-phrased H2 | First paragraph, definition format [6] |
| Higher topical authority | H2/H3 spine + internal links | Logical nesting, descriptive anchors [3][4] |
| AI-search citations (ChatGPT/Claude/Perplexity) | Alt text + FAQ block + clear H-spine | Crawlable text, no JS-only content [5] |
| Fix a CTR-dead page (pos 1–10, no clicks) | Rewrite title + meta only | Don't touch body |
| Fix a content-gap page (pos 5–15, low clicks) | Weave keywords into H2/H3/body | Hand off from `finding-underserved-keywords` |

## Lifecycle awareness

- **New page (0–3 mo):** Get the title, meta, H1, and one featured-snippet paragraph right at publish. Add 3–5 internal links from authority pages. Don't optimize for queries yet — there's no GSC data to listen to.
- **Growth page (3–12 mo):** This is the sweet spot. Pair with `finding-underserved-keywords` output. Weave striking-distance terms into H2/H3, body, alt, anchor text. Rewrite meta if CTR is below the position-expected baseline.
- **Mature page (12+ mo):** Decay defense. Refresh title/meta if SERP intent has shifted. Re-check featured-snippet paragraph against the current top result. Audit internal links — broken or stale destinations leak equity. Update `<lastmod>`-relevant content for AI-citation freshness.

## What next

- **JSON-LD missing or stale?** Hand off to `adding-schema-markup` (Article/BlogPosting/FAQPage as appropriate).
- **No keyword data driving the edit?** Run `finding-underserved-keywords` first, then come back here.
- **Other pages need the same treatment?** Loop this skill per URL — one PR per page keeps reviews tight.

Citations and verification tags in [SOURCES.md](SOURCES.md).
