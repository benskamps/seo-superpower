# seo-superpower

**End-to-end SEO + Generative Engine Optimization for technical builders. One command. Free-tier only.**

A [Claude Code](https://claude.com/claude-code) plugin that turns SEO from "thing I'll learn someday" into a normal dev loop. Run `/seo`, get a PR. The terminal you already live in becomes your SEO dashboard.

```bash
/seo
```

That's it. The plugin figures out your site's lifecycle phase (just shipped? indexed but stalled? mature and decaying?), runs the right diagnostic in parallel, and routes you to the right action — usually a PR.

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

## Skills included

| Skill | Lifecycle phase | Triggers on |
|---|---|---|
| `seo-superpower` (meta-router) | Cross-cutting | Vague SEO requests |
| `seo-bootstrap` | Initial | "set up SEO", "add sitemap", "I just shipped" |
| `auditing-technical-seo` | Initial + cross-cutting | "audit my site", "Core Web Vitals", "why isn't my site ranking" |
| [`finding-underserved-keywords`](https://github.com/benskamps/finding-underserved-keywords) | Growth + Mature | "GSC analysis", "striking distance keywords", impression/CTR gaps |

More coming (see [VISION.md](VISION.md)): on-page optimization, schema markup, GEO optimization, content refresh automation, content briefs, programmatic SEO.

## MCP tools bundled

- **`gsc-mcp`** — pulls per-page query data from your Google Search Console (vendored from a verified upstream; see [MCP_SETUP.md](MCP_SETUP.md))
- **`lighthouse-mcp`** — runs PageSpeed Insights / Lighthouse audits

These are how Claude actually *does* the work — pulling data, running scans, validating. Skills are reference docs that tell Claude *what* to do; MCPs are the hands.

## Install

```bash
# In Claude Code:
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower

# Then in any repo:
/seo
```

For MCP credential setup (GSC OAuth + PageSpeed API key), see [MCP_SETUP.md](MCP_SETUP.md). Budget: ~10 minutes one-time.

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
