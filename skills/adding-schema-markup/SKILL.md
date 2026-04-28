---
name: adding-schema-markup
description: Use when adding JSON-LD structured data to a page — Article, BlogPosting, Product, FAQPage, HowTo, BreadcrumbList, Organization, WebSite, TouristTrip. Picks the right schema type for the page, populates required + key recommended fields from the actual content, validates against schema.org, and ships in a single PR. Triggers on "add schema", "add JSON-LD", "structured data", "rich results", "FAQ schema", "Article schema", "Product schema", "BreadcrumbList", "schema markup for [page]", or any time per-page schema is being added or audited.
---

# Adding Schema Markup

## Overview

Schema is the language Google and LLMs use to understand a page. Crawlers extract entities, relationships, and facts from JSON-LD with much higher confidence than from raw HTML. In 2026 the Google rich-result surface has narrowed sharply (HowTo retired, FAQPage limited to gov/health authority sites) [1][2], but the AI-citation upside has grown: pages with well-formed structured data are cited 2.5–3.2× more often in ChatGPT, Perplexity, and AI Overviews than unstructured pages [3][4].

The job: pick the right type, populate the required + key recommended fields **from content that actually exists on the page**, validate, ship.

## When to Use

- A new content page (article, product, itinerary) is going live
- A page already has bootstrap-level `Organization` + `WebSite` schema and now needs page-specific markup
- An audit flagged "no structured data" on important pages
- A page is getting AI-search impressions but few citations — schema gap is a likely cause

**Don't use for:** thin pages with no real content (Google penalizes schema-for-content-that-isn't-there [1]), legal/disclaimer/utility pages, or pages already covered by a route-level generator.

---

## Schema Type Decision Table

| Page type | Schema type | Notes |
|---|---|---|
| Blog post / news article | `Article` or `BlogPosting` | Use `NewsArticle` for time-sensitive news only |
| Long-form guide | `Article` + `BreadcrumbList` | Add `mainEntityOfPage` |
| Product page | `Product` + nested `Offer` (+ `AggregateRating` if real reviews exist) | Faking ratings = manual action [1] |
| FAQ section on a page | `FAQPage` | Rich-result display deprecated for non-gov/health [2], but still drives AI citations [4] |
| Step-by-step tutorial | `HowTo` | No rich result anymore [1]; still useful for LLMs |
| Site nav / breadcrumb trail | `BreadcrumbList` | Cheap, near-universal — almost always worth adding |
| Landing / home | `Organization` + `WebSite` | Already shipped by `seo-bootstrap` — don't duplicate |
| Trip / itinerary / road-trip page | `TouristTrip` + `itinerary` (`ItemList` of `TouristAttraction`) | No Google rich result, but Perplexity / AI Overviews read it [5] — relevant for roadtripper.ai-style sites |

## The Flow

1. **Identify the page type.** Read the file (`app/blog/[slug]/page.tsx`, `pages/products/[id].astro`, etc.) and the rendered content. Pick from the table above.
2. **Pick the schema type.** If unsure between two (Article vs BlogPosting), default to `Article` — it's a superset.
3. **Populate from real content.** Pull `headline`, `datePublished`, `author`, `image`, `description` from the actual page data — never invent fields. Required fields per type are documented at schema.org and Google Search Central [6][7].
4. **Wrap in one block.** Use a single `<script type="application/ld+json">` containing an `@graph` when the page has multiple entities that reference each other (Article → Author → Organization) [8]. Use separate blocks only for fully independent entities. Reuse the helper from `seo-bootstrap/templates/` so the `Organization` `@id` matches site-wide.
5. **Validate.** Run the `schema-validate` MCP if installed. Otherwise paste into [Schema Markup Validator](https://validator.schema.org/) for syntax + schema.org compliance, then [Google Rich Results Test](https://search.google.com/test/rich-results) for rich-result eligibility [9].
6. **Open one PR** per page or per route group. Commit message: `feat(seo): add <Type> schema to <route>`.

## Common Mistakes

- **`@type: "Website"` (capital S).** schema.org is case-sensitive — it's `WebSite`. Validators silently drop the wrong casing. Same trap as bootstrap.
- **Missing `@context: "https://schema.org"`.** No context, no parse.
- **JSON-LD inside `<noscript>` or rendered only client-side after hydration.** Most LLM crawlers and many SERP features read the initial HTML — schema must be in SSR output.
- **Schema for content that isn't on the page.** Inventing FAQ Q&A in JSON-LD that doesn't appear visibly is a Google manual-action target [1].
- **Faking `AggregateRating`.** Same — manual action and AI engines downgrade trust.
- **Duplicating entities across blocks** instead of using `@id` references inside an `@graph` [8].
- **Forgetting to update `dateModified`** on refreshes — AI engines lean on freshness signals [4].

## Quick Reference

```jsonc
// Article (minimum)
{ "@context":"https://schema.org","@type":"Article",
  "headline":"...", "datePublished":"2026-04-26", "author":{"@type":"Person","name":"..."} }

// Product
{ "@context":"https://schema.org","@type":"Product",
  "name":"...", "image":"...", "offers":{"@type":"Offer","price":"29","priceCurrency":"USD","availability":"https://schema.org/InStock"} }

// FAQPage
{ "@context":"https://schema.org","@type":"FAQPage",
  "mainEntity":[{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}] }

// BreadcrumbList
{ "@context":"https://schema.org","@type":"BreadcrumbList",
  "itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://..."}] }

// TouristTrip
{ "@context":"https://schema.org","@type":"TouristTrip",
  "name":"...", "itinerary":{"@type":"ItemList","itemListElement":[/* TouristAttraction entries */]},
  "provider":{"@id":"https://site.com/#org"} }
```

## Lifecycle

- **Bootstrap-time:** `Organization` + `WebSite` only, in root layout. Handled by `seo-bootstrap`.
- **Growth-time:** add page-type schema (`Article`, `Product`, `TouristTrip`) as content ships. This skill.
- **Mature / decay:** schema.org deprecates types and Google retires rich-result surfaces (HowTo gone, FAQPage display narrowed) [1][2]. Re-audit annually; remove rich-result-only schema that no longer renders, but keep AI-citation-relevant types like `FAQPage` and `HowTo` for LLM consumption [4].

## What next

Pair with `optimizing-on-page` for the full per-page polish loop (titles, H1, internal links, schema). Run `auditing-technical-seo` quarterly to catch schema drift.

## Sources

Citations [1]–[9] resolve in [SOURCES.md](SOURCES.md).
