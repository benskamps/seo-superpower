# Skill registry

Every skill in the plugin, sourced from each `SKILL.md` frontmatter so it stays correct.
The meta-router (`seo-superpower`) is listed first — it's the one that fires on vague requests
and routes to the rest. The other 13 are listed by where they fall in a site's lifecycle.

> 14 skills total. "Triggers on" is a short read of each skill's `description`; the full trigger
> phrasing lives in the linked `SKILL.md`. Lifecycle phases: **Initial** (pre-launch / day 1) →
> **Growth** (ranking, have GSC data) → **Mature** (decay defense). "Cross-cutting" skills apply
> at any phase.

| Skill | Slug | Triggers on | Lifecycle phase | What it ships |
|---|---|---|---|---|
| [seo-superpower](seo-superpower/SKILL.md) (meta-router) | `seo-superpower` | Vague SEO asks: "improve my SEO", "audit my site", "help my site rank", "AI isn't citing us" | Cross-cutting | Diagnoses site state, routes to the right child skill + MCP tools. Loses ties to specific skills on purpose. |
| [setting-up-seo-measurement](setting-up-seo-measurement/SKILL.md) | `setting-up-seo-measurement` | "set up Search Console", "verify domain", "submit sitemap", "GA4 setup", "measure SEO" | Initial | GSC verification, sitemap submission, GA4 / Plausible wiring, Bing Webmaster Tools, GEO-tracking groundwork. |
| [seo-bootstrap](seo-bootstrap/SKILL.md) | `seo-bootstrap` | "set up SEO", "add sitemap", "add robots.txt", "I just shipped a site" | Initial | One PR: sitemap, robots.txt, OG image, JSON-LD schema. Auto-detects Next.js / Astro / SvelteKit; only fills gaps. |
| [researching-keywords-pre-launch](researching-keywords-pre-launch/SKILL.md) | `researching-keywords-pre-launch` | "what should I write about" (no GSC yet), "cold-start SEO", "keyword research from scratch" | Initial | Clustered `KEYWORD_MAP.md` from autocomplete / PAA / Trends / Reddit-HN demand mining + AI-search query patterns. |
| [auditing-technical-seo](auditing-technical-seo/SKILL.md) | `auditing-technical-seo` | "audit my site", "Core Web Vitals", "why isn't my site ranking", "AI-search readiness" | Initial + cross-cutting | Prioritized `SEO_AUDIT.md` (crawl, index, render, CWV, schema, AI-bots, meta) + a low-risk fix PR. |
| [planning-topic-clusters](planning-topic-clusters/SKILL.md) | `planning-topic-clusters` | "topic clusters", "content architecture", "pillar pages", "what should I write next", "content calendar" | Initial → Growth | `CONTENT_PLAN.md` — cluster map, slugs, internal-link matrix, publishing order. |
| [optimizing-on-page](optimizing-on-page/SKILL.md) | `optimizing-on-page` | "optimize this page", "title and meta", "improve internal linking", "alt text audit" | Cross-cutting | One focused PR per page: title/meta, H1/H2 hierarchy, internal links + anchors, alt text, snippet capture. |
| [adding-schema-markup](adding-schema-markup/SKILL.md) | `adding-schema-markup` | "add schema", "JSON-LD", "FAQ schema", "rich results", "structured data" | Cross-cutting | A PR with the right schema type, populated + validated against schema.org. |
| [optimizing-for-generative-engines](optimizing-for-generative-engines/SKILL.md) | `optimizing-for-generative-engines` | "GEO", "get cited in ChatGPT", "Perplexity ranking", "AI Overview", "make this LLM-citable" | Cross-cutting | LLM-citability edits + AI-citation tracking; citation-decay defense on mature pages. |
| [analyzing-content-gaps](analyzing-content-gaps/SKILL.md) | `analyzing-content-gaps` | "content gap", "why does X outrank us", "competitor SERP", "content brief" | Growth | `CONTENT_BRIEF.md` — top-3 SERP diff (entities, H2s, schema, depth, freshness, AIO) ranked by impact. |
| [finding-underserved-keywords](finding-underserved-keywords/SKILL.md) | `finding-underserved-keywords` | "GSC analysis", "striking-distance keywords", impression/CTR gaps, "content refresh" | Growth + Mature | Low-hanging keyword opportunities from your GSC data, GEO-integrated. (Also a standalone repo.) |
| [building-eeat-and-authority](building-eeat-and-authority/SKILL.md) | `building-eeat-and-authority` | "E-E-A-T", "author bios", "build authority", "thought leadership SEO", "YMYL" | Growth → Mature | Author bios, trust signals, an authority moat plan. Long game — invest 6+ months early. |
| [generating-programmatic-seo](generating-programmatic-seo/SKILL.md) | `generating-programmatic-seo` | "programmatic SEO", "scale content", "city pages", "[X] for [Y] pages", "directory site SEO" | Growth → Mature | Data → template → LLM enrichment → per-page schema → sitemap → internal-link graph, with anti-spam quality gates. |
| [refreshing-stale-content](refreshing-stale-content/SKILL.md) | `refreshing-stale-content` | "traffic is dropping", "content decay", "refresh old post", impressions down >20% YoY | Mature | A refresh PR: updated copy, `dateModified` schema, internal links, IndexNow ping. Needs >6 months of GSC data. |

## How this list stays honest

The `name` and `description` here mirror each skill's frontmatter. CI (`scripts/ci-validate.py`)
checks that every `skills/<slug>/SKILL.md` has both fields, and that nothing references a skill
directory that doesn't exist — so a broken link in this table fails the build.

See also: [QUICKSTART.md](../QUICKSTART.md) (which prompt to type) and [MCP_SERVERS.md](../MCP_SERVERS.md)
(the tools these skills call).
