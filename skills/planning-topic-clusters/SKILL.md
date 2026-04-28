---
name: planning-topic-clusters
description: Use when planning a content architecture from a keyword map, designing pillar pages and supporting spokes, drawing an internal-link graph, deciding what to write next, building a content calendar, or reorganizing legacy posts into topical authority clusters. Triggers on "topic clusters", "content architecture", "pillar pages", "internal link graph", "what should I write next", "content calendar", "SEO content plan". Produces `CONTENT_PLAN.md` with cluster map, slugs, link matrix, and publishing order.
---

# Planning Topic Clusters

## Overview

Random blog posts are dead in 2026. Both Google's algorithms and LLM retrieval systems reward **topical authority** — the demonstrable depth of coverage on a single subject — and the cleanest way to build it is the **pillar + spoke** architecture HubSpot popularized [1][2]. The 2026 evidence is hard: clustered content drives ~30% more organic traffic and **3.2× more AI citations** than standalone posts; sites with hub-and-spoke linking see pillar AI citation rates jump from ~12% to ~41% [3][7]. Topic clusters are no longer an SEO nicety — they are the unit of content strategy.

This skill takes a clustered keyword map (output of `researching-keywords-pre-launch` or `finding-underserved-keywords`) and produces a publishing plan: pillars, spokes, URL slugs, link graph, calendar.

## The Cluster Anatomy

- **Pillar page** — the comprehensive 3,000–5,000-word guide on the broad topic. Lives at the top of the site at `/pillar-topic/`. Defines the entity. Links **down** to every spoke [4][6].
- **Spoke pages** — 1,500–2,500-word deep dives, one per sub-question. Live at `/pillar-topic/spoke-slug/` (mirrors information architecture, gives Google the hierarchy for free) [4][6].
- **Internal link graph** — every spoke links **up** to the pillar with descriptive anchor text; the pillar links **down** to every spoke; spokes link **laterally** to 2–3 sibling spokes in the same cluster. Bi-directional linking alone increases LLM citation probability by 2.7× [3].
- **Cluster size** — 8–15 spokes per pillar is the 2026 sweet spot [2][6]. Below 6 spokes the topic isn't pillar-worthy; above 15 the cluster fragments and dilutes the pillar's authority.

## The Planning Flow

1. **Take the keyword map.** Expects clusters already grouped by intent + entity from prior research. (If you only have a flat keyword list, route to `researching-keywords-pre-launch` first.)
2. **For each cluster, identify the pillar term** — broadest informational query that subsumes all the others (e.g., for vibecrafting.ai: "AI image prompt engineering" is the pillar; "midjourney negative prompts", "stable diffusion seeds", "prompt weighting syntax" are spokes).
3. **Define URL slugs** preserving the topic hierarchy: `/ai-prompt-engineering/` for the pillar, `/ai-prompt-engineering/midjourney-negative-prompts/` for each spoke.
4. **Draw the link matrix.** A who-links-to-whom table. Rows = source pages, columns = target pages. Pillar row gets a checkmark in every spoke column; every spoke row links back to the pillar plus 2–3 sibling spokes.
5. **Set the publishing order.** The 2026 consensus: **publish 2–3 foundational spokes first, then the pillar, then the remaining spokes** [9]. Reasoning: a pillar with no spokes to link to is awkward to write; a pillar with all spokes pre-built is overwhelming and delays first traffic. The 2–3 first cover the most-searched sub-questions and give the pillar real internal-link prey on day one.
6. **Output `CONTENT_PLAN.md`** to repo root: cluster map + slugs + link matrix + dated publishing schedule.

## The Cluster-Quality Test

Run these three checks before you commit to a cluster. Failing any one means re-cluster.

- **One sub-question per spoke.** Each spoke answers exactly one question of the pillar. If a spoke title needs "and" or "&", split it.
- **Pillar-can't-stand-alone.** The pillar should be impossible to write comprehensively without referencing each spoke. If a spoke could be deleted with no pillar consequence, it doesn't belong in this cluster.
- **Hard cluster boundaries.** Spokes shouldn't blur into adjacent clusters. If "midjourney negative prompts" could plausibly belong to both an AI prompts pillar *and* a midjourney pillar, you have a clustering ambiguity — pick one home and link the other from afar.

## Common Mistakes

- **Too-broad pillars** ("AI" with 50 spokes) — the cluster fragments and Google can't tell what the pillar is *about* [6].
- **Too-narrow pillars** (3 spokes) — not pillar-worthy; merge into a sibling cluster or promote a spoke to the pillar.
- **Thin spokes that should be merged** — if two spokes share >50% of their search intent, they're one spoke fighting itself for rankings (keyword cannibalization).
- **Keyword-only clustering** — clustering by literal keyword overlap misses entity and intent boundaries. Cluster by **intent + entity**, not n-gram similarity [5].
- **Forgetting to update the link graph as new spokes ship** — every new spoke needs its row added to the matrix and back-edits to 2–3 siblings. This is the #1 cluster-decay failure mode.
- **Skipping descriptive anchor text** — "click here" links don't give LLMs the semantic signal that makes the pillar citation-worthy [3][8].

## Quick Reference

```
Cluster size:    8-15 spokes per pillar (2026 sweet spot)
Pillar length:   3,000-5,000 words
Spoke length:    1,500-2,500 words
URL pattern:     /pillar-slug/spoke-slug/
Link matrix:     pillar -> all spokes; spoke -> pillar + 2-3 siblings
Publishing:      2-3 spokes -> pillar -> remaining spokes
```

## Lifecycle

- **Initial.** Plan one cluster per primary commercial intent. Don't try to map the whole site on day 1; ship one cluster, measure, expand.
- **Growth.** Add new spokes as `finding-underserved-keywords` surfaces gaps. Each new spoke triggers a back-edit pass on the pillar and on 2–3 sibling spokes to add the new internal links.
- **Mature.** Re-plan annually. Mature sites usually need to **reorganize legacy content into clusters retroactively** — sort orphaned posts into existing pillars, merge thin posts that should have been one spoke, and demote deprecated topics.

## What's Next

- `optimizing-on-page` — apply on-page SEO + GEO patterns to each pillar and spoke as it ships (covers the internal-linking execution at the page level).
- `analyzing-content-gaps` — feeds new spoke ideas into existing clusters as competitors publish.
- `building-eeat-and-authority` — author entities and trust signals matter more than ever post-March-2026 update [10]; a cluster without a credible author won't capture full topical authority.

Citations and verification tags in [SOURCES.md](SOURCES.md).
