# Sources — generating-content-briefs

Verification tags:
- **[verified]** — primary source, confirmed in 2026, used directly for a claim in SKILL.md
- **[corroborating]** — secondary source supporting the same claim
- **[methodology]** — describes a technique referenced in the skill

This skill is the *pipeline* around two already-sourced skills — it inherits their
research and adds the brief-assembly + draft-to-PR wiring. For the SERP-diff and
AIO evidence, see [`analyzing-content-gaps/SOURCES.md`](../analyzing-content-gaps/SOURCES.md);
for the striking-distance method and content-decay data, see
[`finding-underserved-keywords/SOURCES.md`](../finding-underserved-keywords/SOURCES.md).
The sources below cover the claims unique to this skill.

---

## [1] Striking-distance keywords — the position 5–15 opportunity

**finding-underserved-keywords/SKILL.md + SOURCES.md** (in this repo)

[methodology] The `strikingDistance()` function encodes this skill's own documented
method: GSC queries where a page ranks roughly position 5–15 are close enough to
page 1 that small on-page edits move them, but get almost no clicks today. The
brief-assembler reuses that definition in code (position >= 5 and <= 15, ranked by
impressions) so the brief's "angle" is grounded in what the page already almost
ranks for rather than a guess.

---

## [2] Answer-first structure wins featured snippets and AI Overview citations

**Digital Applied — "Featured Snippets in the AI Overview Era: 2026 Guide"**
https://www.digitalapplied.com/blog/featured-snippets-ai-overview-era-optimization-2026

[verified] AI Overviews average ~157 words and cite 8–13 sources; the pages cited
are disproportionately those that front-load a direct 40–50 word answer under a
question-phrased heading — the same structure that wins featured snippets. Source
for the AIO-answer stubs the outline places under each PAA-derived H2, and for the
"front-load a 40–50 word answer" instruction in both the brief and the draft
scaffold. (Same primary source as analyzing-content-gaps [3].)

---

## [3] Match the SERP's proven depth — don't skyscraper

**SERPreach — "The Skyscraper Technique: Does It Still Work in 2026?"**
https://serpreach.com/the-skyscraper-technique/

[verified] "Make it longer" no longer works; padding word count without adding
entities makes a page worse. Source for `deriveWordCountTarget()` anchoring to the
competitor median at ±20% (match proven depth) rather than always aiming higher,
and for the brief ordering entity/question coverage ahead of raw length.

---

## [4] Content briefs as the unit of AI-assisted content production

**Trysight — "Clearscope Vs Frase Alternatives: Complete 2026 Guide"**
https://www.trysight.ai/blog/clearscope-vs-frase-alternatives

[methodology] Clearscope, Frase, and Surfer all converge on the same brief shape:
target keyword + intent, entity/topic coverage list, question coverage, heading
outline, and a word-count target derived from the SERP. This skill produces the
same structured brief — the differentiator is that it assembles it from your *own*
GSC + repo data and lands it as a draft PR in your codebase, not a SaaS document.

---

## [5] Descriptive, varied internal-link anchors

**optimizing-on-page/SKILL.md + SOURCES.md** (in this repo)

[methodology] `rankInternalLinks()` suggests anchors built from the tokens shared
between the new page and an existing page, because descriptive anchor text (not
bare titles or "click here") is what carries topical signal — the same rule
`optimizing-on-page` applies when it weaves links into a finished page.
