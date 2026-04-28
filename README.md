# seo-superpower

**End-to-end SEO + Generative Engine Optimization for technical builders. One command. Free-tier only.**

A [Claude Code](https://claude.com/claude-code) plugin that turns SEO from "thing I'll learn someday" into a normal dev loop. Run `/seo`, get a PR. The terminal you already live in becomes your SEO dashboard.

**For non-technical users:** the `/seo-setup` wizard walks you through everything click-by-click in 5 minutes. No prior SEO or cloud experience needed.

```bash
/seo-setup    # one-time, ~5 min — opens browser tabs, takes you click-by-click
/seo          # daily — diagnoses and ships
```

That's it. After setup, just type `/seo`. The plugin figures out your site's lifecycle phase (just shipped? indexed but stalled? mature and decaying?), runs the right diagnostic in parallel, and routes you to the right action — usually a PR.

---

## Why this exists

Other Claude SEO tools require paid APIs (DataForSEO, $60+/mo). The SaaS giants (Ahrefs, Surfer, Semrush) cost $130–500/mo and live outside your editor. Builders who *just shipped* don't have either, so they ship without SEO and lose 6 months of compounding traffic.

**seo-superpower runs entirely on free-tier Google Search Console + PageSpeed Insights.** Zero subscriptions. Zero leaving Claude Code. The work shows up as PRs you review, not a Notion doc you ignore.

## What you get

| Phase | Command | What ships |
|---|---|---|
| **Day 1** (just shipped) | `/seo bootstrap` | PR with sitemap, robots.txt, OG image, JSON-LD schema. Framework auto-detected (Next.js / Astro / SvelteKit). |
| **Week 1** (pre-rankings) | `/seo audit` | Prioritized fix list ranked by traffic-impact × fix-effort. Lighthouse + indexability + schema. |
| **Month 2+** (have GSC data) | `/seo underserved` | Striking-distance keyword opportunities you already rank for, pulled from your GSC. |
| **Mature** (decay risk) | `/seo refresh` | Auto-detects pages losing >20% impressions. Ships a refresh PR. |
| **Always-on** | `/seo geo-check` | Polls ChatGPT / Perplexity / Claude for citations of your site. Tracks share over time. |

Or just run `/seo` with no argument. It diagnoses your phase and picks for you.

## Skills included (13 total — full registry shipped)

| Skill | Lifecycle phase | Triggers on |
|---|---|---|
| `seo-superpower` (meta-router) | Cross-cutting | Vague SEO requests |
| `setting-up-seo-measurement` | Initial | "verify GSC", "set up Search Console", "measure SEO" |
| `seo-bootstrap` | Initial | "set up SEO", "add sitemap", "I just shipped" |
| `researching-keywords-pre-launch` | Initial | "what should I write about" (no GSC yet), "cold-start SEO" |
| `auditing-technical-seo` | Initial + cross-cutting | "audit my site", "Core Web Vitals", "why isn't my site ranking" |
| `planning-topic-clusters` | Initial → Growth | "topic clusters", "content architecture", "pillar pages" |
| `optimizing-on-page` | Cross-cutting | "polish this page", "title and meta", "internal linking" |
| `adding-schema-markup` | Cross-cutting | "add schema", "JSON-LD", "FAQ schema", "rich results" |
| `optimizing-for-generative-engines` | Cross-cutting | "GEO", "ChatGPT citations", "AI Overview", "track AI search" |
| `analyzing-content-gaps` | Growth | "why does X outrank us", "content gap", "content brief" |
| [`finding-underserved-keywords`](https://github.com/benskamps/finding-underserved-keywords) | Growth + Mature | "GSC analysis", "striking distance keywords", impression/CTR gaps |
| `building-eeat-and-authority` | Growth → Mature | "E-E-A-T", "author bios", "build authority", "YMYL" |
| `generating-programmatic-seo` | Growth → Mature | "programmatic SEO", "scale content", "city pages from data" |
| `refreshing-stale-content` | Mature | "traffic is dropping", "content decay", "refresh old post" |

Plus `hooks/seo-decay-check.json` — a weekly content-decay detection hook that surfaces nudges on session start and runs on demand via `/seo refresh`.

The full 12-skill registry from [VISION.md](VISION.md) is shipped. Beyond v3: cross-site comparison, multi-language hreflang, decay-check automation activation.

## MCP tools bundled

- **`gsc`** — pulls per-page query data from your Google Search Console (vendored from `AminForou/mcp-gsc==0.3.2`)
- **`pagespeed`** — runs PageSpeed Insights / Lighthouse audits (vendored from `pagespeed-insights-mcp`)
- **`geo-check`** — polls ChatGPT, Claude, Perplexity, and Gemini for citations of your domain. Built in this repo. Tools: `geo_check`, `geo_track`, `geo_diff` for baseline + delta tracking
- **`schema-validate`** — offline JSON-LD validation against schema.org via `pyld` + `extruct`, with Google rich-result eligibility checks for 9 types (Article, Product, FAQPage, HowTo, BreadcrumbList, Organization, Recipe, Event, JobPosting). Built in this repo
- **`lighthouse-local`** — local Lighthouse fallback when PSI quota's hit (opt-in)

These are how Claude actually *does* the work — pulling data, running scans, validating, tracking AI citations. Skills are reference docs that tell Claude *what* to do; MCPs are the hands.

## Install (5 minutes, no SEO knowledge needed)

```bash
# In Claude Code:
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower
/seo-setup
```

`/seo-setup` is a guided wizard that walks you through Google Cloud + API setup **click-by-click**. It opens the right URLs, takes minimal input, and validates everything before declaring done. You don't need to know what an OAuth client is.

When the wizard says ✅ — type `/seo` in any project. That's the whole product.

Full install guide: [INSTALL.md](INSTALL.md). DIY/manual path: [MCP_SETUP.md](MCP_SETUP.md).

## The wedge

Versus dashboards (Ahrefs, Surfer, Semrush, Frase):
- **In-codebase context** — Claude reads your actual MDX, your real schema components, your tone from prior posts. Surfer can't.
- **PRs not reports** — fixes ship as code, not as a checklist you'll never act on.
- **GEO-native** — built for the AI-search era (12–18% of informational queries already, 527% YoY growth). Not a retrofitted module.
- **Scheduled agents** — weekly cron detects content decay and opens refresh PRs. Ahrefs alerts; this fixes.
- **$0 marginal cost** — runs on free-tier GSC + PSI. No subscription.

## Honest limits

- No backlink database (use Ahrefs free trial for that quarterly).
- No historical SERP data — you only see what your GSC has.
- No multi-user collab / agency dashboards. This is a solo-builder tool.
- Requires Claude Code. No web UI.

## Contributing

Skills are markdown files. Add one in `skills/<your-skill>/SKILL.md`, follow the frontmatter convention (see existing skills), open a PR. The bar: your skill should auto-trigger on a real SEO scenario the existing skills don't already cover.

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, improve it. Built on top of the SEO Wins thread that started this and dozens of cited sources from the SEO/GEO community (see each skill's `SOURCES.md`).
