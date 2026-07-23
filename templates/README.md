# templates/

Source files `skills/seo-bootstrap` copies into a user's project once
`scripts/detect-framework.js` has identified the framework and audited which SEO
assets are missing.

| Directory | Framework ids |
|---|---|
| `nextjs/` | `nextjs-app`, `nextjs-pages` |
| `astro/` | `astro` |
| `sveltekit/` | `sveltekit` |
| _(none)_ | `vite-react-router` — static `public/` fallback, no template dir |

`robots-ai-bots.txt` at this level is a separate artifact: the AI-crawler allowlist
used by `optimizing-for-generative-engines`, not part of the bootstrap flow.

## Rules

1. **Never overwrite.** Only write files the audit reported missing.
2. **Substitute every `REPLACE-WITH-*` token** before committing. A shipped
   `REPLACE-WITH-CANONICAL-ORIGIN` is worse than no sitemap at all.
3. **One commit, one PR**: `feat(seo): bootstrap sitemap, robots, OG, and JSON-LD`.

`scripts/ci-validate.py` asserts that every template directory referenced from a
`SKILL.md` body exists on disk and is non-empty. These directories were referenced
by `seo-bootstrap` for months before anyone wrote them; that check exists so the
same class of dangling instruction cannot ship again.
