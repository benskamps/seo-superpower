# generating-content-briefs

A [Claude Code](https://claude.com/claude-code) skill that turns a topic into a research-grounded content brief **and** a draft content file, then opens the draft-to-PR. This is the `/seo brief` flow — the plugin's "brief to merged PR" moat.

## What it does

Takes a topic (and optionally a target keyword or URL), then:

1. Pulls the data that makes a brief real — your **GSC striking-distance** queries (what you already almost rank for), the **live top-3 SERP** (entities, People-Also-Ask questions, competitor depth), and your **own existing pages** (for internal-link suggestions).
2. Runs the deterministic assembler ([`scripts/brief-assembly.js`](../../scripts/brief-assembly.js)) to produce **`CONTENT_BRIEF.md`**: target keyword + intent, the striking-distance angle, a headline moat (title + H2 outline with 40–50 word AIO-answer stubs), entities and questions to cover, ranked internal links from your own content, and a word-count target.
3. Emits a **draft content file** (`content/<slug>.md`, `draft: true`) — the H2 skeleton with the brief baked in as comments, ready to fill.
4. Prints the **draft-to-PR** wiring (branch → commit → `gh pr create` with the brief as the PR body).

## Built vs. seam (honest)

The **assembly is fully built and unit-tested** ([`test/brief-assembly.test.js`](../../test/brief-assembly.test.js)) — intent classification, striking-distance selection, internal-link ranking, word-count targeting, outline building, and both renders are pure functions with deterministic output. The **live data** (GSC rows, SERP scrape, and the draft's prose) is passed in through documented seams; no LLM or network call lives in the deterministic core, so green CI can't hide a stub.

## When to use

- "/seo brief \<topic\>", "write me a brief for X and a draft", "turn this topic into a post"
- You want to go from a topic to a reviewable draft PR with the research baked in

Don't use it for an existing-page competitor diff only (`analyzing-content-gaps`), a striking-distance keyword list only (`finding-underserved-keywords`), on-page polish (`optimizing-on-page`), or a decay refresh (`refreshing-stale-content`). This skill *composes* the first two for its data-gathering phase.

## What you get

`CONTENT_BRIEF.md` (the reviewable brief) + `content/<slug>.md` (the `draft: true` scaffold), on a branch, in a PR whose body is the brief — so a reviewer sees the research behind the draft.

## See also

Full skill: [`SKILL.md`](SKILL.md) · citations in [`SOURCES.md`](SOURCES.md) · the assembler: [`scripts/brief-assembly.js`](../../scripts/brief-assembly.js). Lifecycle placement: [`skills/REGISTRY.md`](../REGISTRY.md).

## License

MIT — see [LICENSE](../../LICENSE).
