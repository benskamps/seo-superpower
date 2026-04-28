---
name: generating-programmatic-seo
description: Use when generating hundreds or thousands of unique landing pages from a structured data source (Supabase table, CSV, Sanity collection) — city pages, category pages, "[X] for [Y]" matrices, integration pages, directory listings. Wires data + template + LLM enrichment + per-page schema + sitemap inclusion + internal-link graph, with quality gates that keep output on the Tripadvisor/Zapier side and away from Google's scaled-content-abuse policy. Auto-triggers on "programmatic SEO", "generate landing pages from data", "scale content", "city pages", "category pages", "[X] for [Y] pages", or "directory site SEO".
---

# Generating Programmatic SEO

## Overview

Programmatic SEO is a 10× traffic lever when done well and a manual-action target when done badly. Tripadvisor runs ~700M indexed pages and pulls 226M monthly organic visits off cuisine × city × neighborhood combinations; Zapier turns ~5,000 tools into ~50,000 integration pages [1]. The line between that and Google's scaled-content-abuse penalty [2] is exactly three things: **uniqueness page-to-page, intent-fit per query, and depth per page**. Not "filling cells of a matrix with templated phrases."

Since Google folded the Helpful Content system into the core algorithm in March 2024 and shipped scaled-content-abuse alongside it, enforcement is intent- and outcome-based, regardless of whether pages were written by humans, AI, or templates [2][3]. Pure-template pSEO is dead. Template + data + LLM enrichment + quality gates is the surviving pattern [4][5].

## When to Use

- You have a structured data source with rows that map to real searcher intent
- You've validated demand for the resulting URLs (run `analyzing-content-gaps` or `researching-keywords-pre-launch` first)
- You're generating ≥50 pages (under that, hand-write them)
- Stack is Next.js, Astro, or SvelteKit

**Don't use for:** brand-new sites with no audience signal, queries you haven't validated, or "the matrix is interesting" — interesting matrix ≠ search demand.

---

## The 4 Quality Gates

Every generated page must clear all four. If a row can't, it doesn't get a page.

| Gate | Bar | Why |
|---|---|---|
| **Uniqueness** | ≥60% non-template content page-to-page | Below this, Google clusters/dedupes or classifies as scaled-content abuse [4][5] |
| **Word count** | ≥400 substantive words (not boilerplate) | Sub-400 reads as thin; 500+ is safer for competitive verticals [4] |
| **Schema** | Page-type-appropriate JSON-LD | Eligible for rich results, ~2× more likely cited by AI engines |
| **Internal-link membership** | Parent hub + 3 siblings + 1 pillar | Orphaned pages don't get crawled or ranked [6] |

Template can be 40% of the page; the remaining 60% must come from row-specific data + LLM enrichment.

---

## The Generation Flow

1. **Identify the data source.** Audit it: does every row have enough fields to drive 400+ unique words? Three fields with one being the title isn't a page.
2. **Identify the template route.** Next.js: `app/[city]/[category]/page.tsx`. Astro: `src/pages/[...slug].astro`. SvelteKit: `src/routes/[city]/[category]/+page.svelte`.
3. **Define template structure.** Three zones: static (≤40%, nav/footer/scaffolding), data-driven (per-row fields, tables, photos), LLM-enriched (200–400 words per row).
4. **Generate enrichment per row.** This is the difference between thin and valuable. Prompt Claude with the row's actual fields for a 200–400 word section that references specific data points (not generic phrases), compares to 1–2 sibling rows where relevant, and includes one quotable stat-with-source line. **Cache the output** — don't regenerate on every build.
5. **Inject schema per page** (hand off to `adding-schema-markup`): `LocalBusiness` for city pages, `Product` for products, `ItemList` for hubs, `Service` for service-area, `BreadcrumbList` everywhere.
6. **Sitemap auto-include.** 50,000 URLs per sitemap is the hard limit [7]; above that, use a sitemap index. Next.js `generateSitemaps` returns the shards [8].
7. **Internal-link graph.** Each page links to parent hub (1), 3 siblings (lateral), 1 pillar (descending). Generate in the template, not by hand.
8. **Quality gate run BEFORE merge.** Sample 20 random pages: word count ≥ 400, uniqueness ≥ 60% vs. nearest sibling, schema validates, 5+ internal links per the rule. If <17/20 pass, fix the template before shipping any.

---

## Stack-Specific Patterns

- **Next.js:** `generateStaticParams` for the top ~20% of rows (highest demand) + `dynamicParams = true` for the long tail; ISR `revalidate: 86400` (24h) for travel/local, `604800` (7d) for stable directories [8].
- **Astro:** `getStaticPaths` with content collections or Supabase fetch; `output: 'hybrid'` with selective prerendering. `@astrojs/sitemap` shards automatically.
- **SvelteKit:** `load` + `prerender = true` for the build-time set, `entries` to enumerate; long tail renders on-demand and edge-caches.

## Pre-flight Checklist

- Are pages live BEFORE submitting to Google? Never sitemap unfinished pages — low-quality classification sticks.
- Does each page have a unique value prop, not just a template fill?
- Will the data stay fresh? Stale programmatic decays fast — pair with `refreshing-stale-content`.
- Within hosting budget? 1,000 pages × 24h ISR ≠ free on Vercel — budget egress and invocation costs first.
- Did you run the 20-page sample QA?
- Did you submit the sitemap to GSC after deploy?

## Common Mistakes

- **Pure templating.** No LLM enrichment = thin = scaled-content-abuse risk [2].
- **Generating for queries with no demand.** "We have data for it" ≠ "people search for it."
- **No internal-link graph.** Every page becomes an orphan [6].
- **Schema that doesn't match content.** `LocalBusiness` on a non-local page is worse than no schema.
- **Ignoring the helpful-content signal.** Obviously templated reads as a negative quality signal post-2024 [3].
- **Shipping before sample-checking 20 pages.** The template will have a bug. You won't catch it from 3.
- **Pre-rendering all 50k pages.** Costs $$$ and most get <1 visit/month — `dynamicParams` + ISR is the win [8].

## Quick Reference — Data Source × Template Patterns

| Data source | Template route | Schema |
|---|---|---|
| Supabase: cities × services | `/[service]/[city]` | `LocalBusiness` + `Service` |
| CSV: products × use-cases | `/[product]/for/[use-case]` | `Product` + `FAQPage` |
| Sanity: integrations | `/integrations/[a]/[b]` | `SoftwareApplication` |
| Supabase: vendors × categories | `/[category]/[vendor]` | `LocalBusiness` + `Review` |
| JSON: locations × topics | `/[location]/guides/[topic]` | `Article` + `Place` |

## Lifecycle

**Growth → Mature.** Don't try this in the Initial phase — you don't yet know which queries to target, and pSEO without demand validation is the fastest path to a manual action. Validate with `researching-keywords-pre-launch` and `analyzing-content-gaps` first.

## What Next

- **`adding-schema-markup`** — per-page JSON-LD matched to page type
- **`analyzing-content-gaps`** — confirm the queries are unaddressed
- **`refreshing-stale-content`** — pSEO pages decay; build the maintenance loop before the first goes stale
- **`optimizing-on-page`** — template quality is per-page quality at scale

## Sources

Full citations and verification tags in [SOURCES.md](SOURCES.md).
