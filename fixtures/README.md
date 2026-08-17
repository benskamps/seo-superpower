# fixtures — minimal test fixtures

Two sets live here: project skeletons for the framework detector, and served-HTML
pages for the Codebase Mirror.

## Framework skeletons

Tiny, dependency-free project skeletons used by `test/detect-framework.test.js` to
exercise `scripts/detect-framework.js` against real folder shapes instead of prose.

Nothing here is installed or built. Each fixture is only as large as the signals
the detector reads: a `package.json`, the framework config file, and whichever SEO
assets the scenario needs present or absent.

| Fixture | Shape | Exercises |
|---|---|---|
| `astro-minimal` | `astro` dep, no `site:`, no SEO assets | Astro detection + all four assets missing + missing canonical URL |
| `astro-complete` | `site:` + `@astrojs/sitemap` + robots + og + JSON-LD | Integration-based sitemap detection; bootstrap must no-op |
| `sveltekit-minimal` | `@sveltejs/kit` in devDeps | devDependency detection + SvelteKit asset paths |
| `nextjs-app-minimal` | `next` + `app/` | App Router branch |
| `nextjs-pages-minimal` | `next` + `pages/` only | Pages Router branch |
| `vite-rr-minimal` | `react-router-dom`, no meta-framework | static `public/` fallback |
| `monorepo-next` | non-framework root, Next app in `web/` | monorepo subdirectory search + `detectedIn` |
| `bare-no-pkg` | no `package.json` | unknown / graceful bail |
| `broken-pkg` | unparseable `package.json` | malformed input does not throw |

Scenarios that need a `node_modules/` or `dist/` decoy (proving the search skips them)
build it in a temp directory inside the test instead — `node_modules/` is gitignored, so a
committed fixture would silently vanish in CI and the test would pass for the wrong reason.

These directories intentionally have no `package.json` at the repo root above them —
the repo is dependency-free and the suite runs with a bare `node --test`.

## `codebase-mirror/` — served HTML for the Competitor Codebase Mirror

Hand-written HTML pages used by `test/codebase-mirror.test.js` to exercise
`scripts/codebase-mirror.js` against realistic markup instead of synthetic strings.
Two fictional invoicing products, three comparable page types each:

| Side | Pages | Shape it encodes |
|---|---|---|
| `codebase-mirror/ours/` | `home.html`, `guide.html`, `pricing.html` | A marketing home rendered server-side; the guide and pricing pages ship as client-side shells (`<div id="root">` + scripts). No Article/FAQPage schema, no OG tags, no `alt` text, statement-phrased H2s. |
| `codebase-mirror/theirs/` | `home.html`, `guide.html`, `pricing.html` | Every page server-rendered with Article + BreadcrumbList + FAQPage JSON-LD (`dateModified` present), OG tags, question-phrased H2s, descriptive anchors, dense internal linking, `alt` on every image. |

The asymmetry is the point: the pair exercises every gap axis at once (rendering,
schema, heading shape, internal links, meta coverage, freshness) and doubles as the
zero-setup demo in `skills/mirroring-competitor-codebases/README.md`. `theirs/home.html`
also nests `Question` inside `FAQPage` and `ListItem` inside `BreadcrumbList`, which is
what pins the "page-level JSON-LD types only" rule — recursing would report the same
gap twice.
