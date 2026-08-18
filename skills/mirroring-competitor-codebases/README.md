# mirroring-competitor-codebases — the Competitor Codebase Mirror

A [Claude Code](https://claude.com/claude-code) skill (part of [`seo-superpower`](https://github.com/benskamps/seo-superpower)) that reverse-engineers what a competitor's **template** emits and reports the patterns they ship that you don't.

Rank trackers tell you *that* a competitor beats you. Content tools tell you what their page *says*. This tells you what their codebase *does* — the JSON-LD block, the heading shape, the internal-link footer, whether the page arrives as HTML at all — and which of those you are missing.

## What it does

Given a handful of comparable pages from each side:

1. **Extracts** an implementation fingerprint per page from the HTML a crawler receives — page-level JSON-LD types, H1/H2/H3 shape, internal vs external links and anchor quality, meta coverage, image alt, `dateModified`, framework fingerprint, and whether body content is in the HTML or behind a client-side shell.
2. **Folds** each side into per-page **rates** — "they do this on 100% of pages" is a template; "they did it once" is an anecdote.
3. **Diffs in one direction** — only what they ship and you don't. Swap the sides and none of the same rows come back; that direction contract is unit-tested.
4. **Ranks** by `severity × SERP delta`, with a hand-off to the skill that fixes each class of gap.

## Why it matters

- **Template gaps are cheap to close and site-wide.** One PR that adds `FAQPage` to a layout fixes every page at once — a different economics from rewriting prose page by page.
- **The rendering row catches the expensive one.** A page that arrives as an empty `<div id="root">` is invisible to AI-search crawlers, which do not run your JS. That is a build decision, and nothing in a content audit surfaces it.
- **It refuses to fake the ranking.** With no GSC positions supplied, every row is tagged `serp: "unknown"` and the report says it is severity-ordered — it never invents a position to look more informed than it is.

## Quick start

Against the shipped fixtures, with no setup at all:

```bash
node scripts/codebase-mirror.js \
  --ours   fixtures/codebase-mirror/ours/home.html \
  --ours   fixtures/codebase-mirror/ours/guide.html \
  --theirs fixtures/codebase-mirror/theirs/home.html \
  --theirs fixtures/codebase-mirror/theirs/guide.html
```

Against real sites, with the SERP delta that makes the ranking mean something:

```bash
node scripts/codebase-mirror.js \
  --ours   https://yoursite.com/ --ours   https://yoursite.com/pricing \
  --theirs https://competitor.com/ --theirs https://competitor.com/pricing \
  --serp .claude/seo/serp-positions.json \
  --json .claude/seo/codebase-mirror.json
```

Example output:

```
Codebase Mirror — ledgerly.example vs billfold.example
  pages sampled: 3 yours / 3 theirs
  stack: unknown (yours) vs astro (theirs)
  SERP delta for "invoicing software for freelancers": you 14.2 / them 3.1 (+11.1 — they outrank you decisively, weight x2)

10 thing(s) they do you don't (4 high / 4 medium / 2 low):

  [HIGH  impact 6]  Content ships in the HTML  (rendering)
      them 100%   you 33%
      100% of their sampled pages deliver body content in the initial HTML vs
      33% of yours. Pages that arrive as an empty client shell are largely
      invisible to AI-search crawlers, which do not execute your JS.
      → hand off to `auditing-technical-seo`

  [HIGH  impact 6]  FAQPage schema  (schema)
      them 100%   you 0%
      They emit FAQPage JSON-LD on 100% of sampled pages; you emit it on none.
      This is a templated pattern, not a one-off page.
      → hand off to `adding-schema-markup`
```

Or just ask Claude, in a repo with the plugin installed:

> Mirror competitor.com against our site and tell me what their templates emit that ours don't.

## Options

| Flag | Meaning |
|---|---|
| `--ours` / `--theirs` | A page URL or a local HTML file. Repeat once per page; 3–5 comparable page types per side. |
| `--serp <file.json>` | GSC positions (`{"query":…,"ours":{"position":14.2},"theirs":{"position":3.1}}`). Without it: severity-only ranking, every row tagged `serp: unknown`. |
| `--json <out>` | Also write the full structured report as JSON. |
| `--fail-on-high` | Exit 1 if any high-severity gap is found — a CI gate. |
| `--delay <ms>` | Per-origin politeness delay (default 1000). |
| `--timeout <ms>` | Per-request timeout (default 15000). |
| `--label-ours` / `--label-theirs` | Names used in the report header. |
| `--no-robots` | Skip the robots.txt gate. Only for pages you own. |

## Etiquette

Live fetches honour the competitor's `robots.txt` for this tool's user-agent (a disallowed path is skipped with a warning, not fetched anyway) and rate-limit to one request per origin per `--delay` ms. It reads only what a crawler receives. **Copy patterns, never content** — emitting the schema type they emit is fine; reusing their prose is duplicate content that both Google and AI systems penalize.

## Tests

Signal extraction, the site summary, the gap rules, the SERP ranking, the robots gate, and the CLI are all unit-tested (`test/codebase-mirror.test.js`, run via `node --test`) against hand-written HTML fixtures in `fixtures/codebase-mirror/ours/home.html` and `fixtures/codebase-mirror/theirs/home.html`. No test touches the network.

## Related skills

- **`analyzing-content-gaps`** — the per-query prose diff. This skill is the template diff; run both when a competitor beats you on a query that matters.
- **`adding-schema-markup`**, **`auditing-technical-seo`**, **`optimizing-for-generative-engines`**, **`planning-topic-clusters`**, **`optimizing-on-page`** — where each gap row hands off.
