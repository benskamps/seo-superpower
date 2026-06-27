# adding-schema-markup

A [Claude Code](https://claude.com/claude-code) skill that adds the right JSON-LD structured data to a page — picking the schema type, populating it from content that actually exists, validating against schema.org, and shipping in one PR.

## What it does

Schema is the language Google and LLMs use to understand a page. This skill reads the page, picks the correct type (`Article`, `BlogPosting`, `Product`, `FAQPage`, `HowTo`, `BreadcrumbList`, `Organization`, `WebSite`, `TouristTrip`), populates required + key recommended fields from real content, and wraps related entities in a single `@graph`. In 2026 Google's rich-result surface has narrowed (HowTo retired, FAQPage display limited to gov/health), but well-formed structured data drives 2.5–3.2× more AI citations — so types like `FAQPage` and `HowTo` are kept for LLM consumption even where the rich result is gone.

## When to use

- A new content page (article, product, itinerary) is going live
- A page already has bootstrap-level `Organization` + `WebSite` schema and now needs page-specific markup
- An audit flagged "no structured data" on important pages
- A page earns AI-search impressions but few citations — a schema gap is a likely cause

Don't use it on thin pages with no real content, legal/disclaimer/utility pages, or pages already covered by a route-level generator.

## How it's invoked

Auto-triggers on "add schema", "add JSON-LD", "structured data", "rich results", "FAQ schema", "Article schema", "Product schema", "BreadcrumbList", or "schema markup for [page]." Or invoke it directly:

> Add the right JSON-LD schema to /blog/capsule-wardrobe.

## What you get

One PR per page or route group (commit `feat(seo): add <Type> schema to <route>`) with the correct schema type populated only from on-page content, validated against schema.org via the `schema-validate` MCP when installed (with a [Schema Markup Validator](https://validator.schema.org/) + [Google Rich Results Test](https://search.google.com/test/rich-results) fallback). No invented FAQ entries or faked `AggregateRating` — both are Google manual-action targets.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
