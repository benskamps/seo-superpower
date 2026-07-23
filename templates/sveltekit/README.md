# SvelteKit templates

Used by `skills/seo-bootstrap` Step 3 after `scripts/detect-framework.js` reports
`framework: "sveltekit"`. Only write the files the audit flagged missing; never overwrite.

| Template | Destination | Notes |
|---|---|---|
| `sitemap.xml.server.ts` | `src/routes/sitemap.xml/+server.ts` | Auto-routed. Replace the hardcoded `routes` array with the real route source. |
| `robots.txt` | `static/robots.txt` | `static/` is served at the site root. |
| `layout.seo.svelte` | merge into `src/routes/+layout.svelte` | Root layout only — per-page schema is a later skill's job. |

OG image: static 1200x630 PNG under 1MB at `static/og.png`.

Syntax note: these use Svelte 5 runes (`$props`, `$derived`) and `$app/state`.
On Svelte 4 / SvelteKit 1, use `export let`, `$:` and `$app/stores` (`$page.url`).
Check `svelte` in the project's `package.json` before pasting.

Verify: `npm run build && npm run preview`, then `curl -sI localhost:4173/sitemap.xml`.
