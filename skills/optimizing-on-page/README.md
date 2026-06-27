# optimizing-on-page

A [Claude Code](https://claude.com/claude-code) skill that does the per-page SEO surgery — title and meta, the H1/H2 spine, internal links and anchor text, alt text, and featured-snippet capture — and ships one focused PR per URL.

## What it does

The per-page workhorse. Where `auditing-technical-seo` works at the site level and `finding-underserved-keywords` decides *what* to target, this skill executes the per-URL work: rewrite the title (under ~600px, keyword in the first 30–35 chars, no brand-doubling), tighten the meta (140–155 chars), fix the H1/H2 hierarchy, front-load a 40–50 word featured-snippet answer, weave in 2–5 contextual internal links per 1,000 words with varied descriptive anchors, and sweep alt text. It checks intent match against the live SERP and ranks gaps by impact (title > meta > H1 > snippet paragraph > H2/H3 > internal links > alt text).

## When to use

- "Optimize this page" / "fix the SEO on `/blog/foo`"
- A single blog post, landing page, or doc page needs polish
- `finding-underserved-keywords` produced a keyword cluster to integrate into one page
- A page ranks position 5–15 but the title/snippet is the bottleneck
- An internal-linking or alt-text sweep was requested for one URL

Don't use it for site-wide audits (`auditing-technical-seo`), pre-launch setup (`seo-bootstrap`), JSON-LD work (`adding-schema-markup`), or keyword discovery (`finding-underserved-keywords`).

## How it's invoked

Takes a URL or a markdown/MDX/route file path. Auto-triggers on "optimize this page", "fix the SEO on this URL", "polish this blog post", "title and meta", "improve internal linking", or "alt text audit." Or invoke it directly:

> Optimize the on-page SEO for /blog/capsule-wardrobe.

## What you get

One PR per URL (title `seo: optimize on-page for /<slug>`), with each change shown as a before/after diff plus the rule it satisfies — title/meta, H1/H2 spine, snippet paragraph, internal links and anchors, alt text. A `lighthouse-mcp` SEO baseline is captured when available (the pass is treated as the floor, not the ceiling). No drive-by site-wide changes.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
