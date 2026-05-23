# seo-superpower — Knowledge Base

**Generated:** 2026-05-22 (night-shift R2 enrichment, 2 sub-agents)
**Status:** Public Claude Code plugin (github.com/benskamps/seo-superpower), v0.3.0 shipping v3 roadmap. This KB grounds v3 launch + post-launch direction. Depth in `docs/enrichment-2026-05-22/`.

## Shards

| Shard | Subdomain | Sources |
|---|---|---|
| [geo-landscape.md](docs/enrichment-2026-05-22/geo-landscape.md) | GEO landscape 2026 — AI search citation, AIO/AI Mode state, agentic search, llms.txt verdict | 33 sources, Princeton paper A-tier |
| [plugin-ecosystem.md](docs/enrichment-2026-05-22/plugin-ecosystem.md) | CC plugin distribution, marketplace dynamics, competitor positioning, release mechanics | 10 sources |

## Cross-shard load-bearing facts

**GEO landscape (these reshape v3's substance):**

1. **🚨 Reddit overtook Wikipedia as #1 AI citation source** (40.1% vs 26.3% per Jun 2025 cross-platform study; Reddit citation share grew 73% Oct 2025 → Jan 2026). The "47.9% Wikipedia" framing in existing `SOURCES.md` is stale.
2. **Google launched "Community Perspectives" in AI Overviews on 2026-05-07** — pulls Reddit/forum quotes inline. Plus 4 other AIO/AI-Mode updates the same week. This is *fresh* material the April enrichment missed.
3. **🔑 Agentic search is the May 2026 doctrine shift.** Mike King's patent analysis + iPullRank essays argue every major engine now does query fan-out (6-8 synthetic queries per user query). **Implication**: optimize for the planner's follow-ups, not just the surface query. **Recommended new skill/MCP**: `query-fan-out` simulator (Gemini-API-backed, free tier; Qforia is iPullRank's reference).
4. **llms.txt verdict tightened to "skip unless you're a docs site."** SERanking 300k-domain study: no measurable citation lift. 500M AI-bot-visit analysis: only 408 requested llms.txt. **Don't ship an llms.txt generator skill.**
5. **AIO CTR rebounded** (Seer: 1.76% → 0.61% → 2.4% by Feb 2026) and **AI-referred conversion is 14.2% vs 2.8% organic** (5.1× advantage). The "AIO killed organic" panic was transient.
6. **Entity graph (Wikidata QID + Crunchbase + Schema sameAs chain)** is the prerequisite layer for citation likelihood — 3-6 month establishment timeline. **Recommended new skill**: `establishing-entity-presence`.
7. **LinkedIn became ChatGPT's 5th-most-cited source** Dec 2025 → Feb 2026. Sweet spot: 500-2000 word articles. Missing B2B track.

**Plugin ecosystem (these reshape v3's launch):**

8. **🚨 Version coherence is broken right now**: `plugin.json` says `0.3.1`, `VISION.md` says "v3 SHIPPED ✅". Marketplace users see the literal version field. **Either bump to `1.0.0` (since v3-the-roadmap shipped) or rename internal phases.** Highest-leverage cleanup before v3 launch.
9. **Two real competitors**: `claude-seo` (AgriciDaniel, 25 skills + 18 agents, requires paid DataForSEO) and `SearchFit SEO` (11 skills + 3 agents, 6,096 installs, SaaS). seo-superpower's wedge is real and defensible: **free-tier + open-source + dev-first kickoff**.
10. **Official marketplace UI now shows context-cost + last-updated + "will install" preview** (CC v2.1.143+). 13 skills × ~100 tokens of frontmatter = ~1,300 always-on. Audit descriptions; lazy-load in skill bodies.
11. **No `seo` / `marketing` / `content` category exists in the official enum.** Best fit is `productivity`.
12. **Install counts ARE publicly visible** (`feature-dev`: 89,000+; SearchFit: 6,096). Track it as a competitive metric.
13. **Three official Anthropic marketplaces**: `claude-plugins-official` (editorial), `claude-plugins-community` (automated validation, in-app submission form), `claude-code-plugins` (demo). **Target: community marketplace.**
14. **Free distribution surfaces**: add `claude-code-plugin` GitHub topic; PR to `ComposioHQ/awesome-claude-plugins`; PR to `quemsah/awesome-claude-plugins` (automated indexer).
15. **`SessionStart` hook printing a kickoff message is the single highest-ROI plugin addition** for v3 onboarding.

## v3 release checklist (compressed from plugin-ecosystem shard §11)

**Pre-release hygiene:**
- [ ] Reconcile `plugin.json` version with VISION.md. Pick: bump to `1.0.0` OR rename phases internally.
- [ ] Audit all 13 skill descriptions — slim frontmatter, push detail into bodies.
- [ ] Category: set to `productivity` (until SEO/marketing enum exists).

**Discoverability:**
- [ ] Add `claude-code-plugin` GitHub topic.
- [ ] PR to `awesome-claude-plugins` indexes.
- [ ] Submit to `claude-plugins-community` marketplace.

**Onboarding:**
- [ ] Add `SessionStart` hook with kickoff message.
- [ ] README: "smallest first win" demo above the fold.
- [ ] Demo GIF or short video.

**Content / GEO substance:**
- [ ] Update `SOURCES.md` with the Reddit-overtook-Wikipedia number.
- [ ] Add `query-fan-out` simulator skill/MCP (or document as v3.1).
- [ ] Add `establishing-entity-presence` skill (Wikidata + Crunchbase + sameAs chain).
- [ ] Drop or deprecate any `llms.txt` skill — net-negative recommendation.
- [ ] Add LinkedIn B2B track (500-2000 word articles, ChatGPT #5 source).

**Skill audit (from shard §10 of geo-landscape):**
- [ ] For each of the 13 existing skills, mark: keep / edit / deprecate. Rationale per skill is in the shard.

## Recommended next moves

**Land before v3 ships:**
1. Fix the version coherence (`plugin.json` vs VISION.md). Single highest-impact cleanup.
2. Audit `SOURCES.md` and refresh with the Reddit + Community Perspectives + agentic-search facts.
3. Add the `SessionStart` kickoff hook.

**Land with v3:**
4. Two new skills: `query-fan-out` and `establishing-entity-presence`.
5. Deprecate any llms.txt generator skill (or mark as docs-sites-only).
6. Add LinkedIn B2B skill.

**Post-launch:**
7. Discoverability blast: GitHub topic + awesome-list PRs + community-marketplace submission.
8. Track install count + AI citations to scarecares.com / vibecrafting.ai (Ben's preferred public examples).

## Tensions to honor

- **Free vs paid wedge**: claude-seo and SearchFit both lean on paid API tiers (DataForSEO, etc.). seo-superpower's free-tier + open-source posture IS the moat. Resist any "v3 requires API key" creep.
- **Comprehensive vs focused**: 13 skills is already in the heavy zone. Adding 2-3 (fan-out, entity, LinkedIn) is fine; adding 8 more is bloat.
- **Trend-chasing vs canonical**: GEO is fluid. v3 should encode the May 2026 doctrine; v3.x should reserve room for the next pivot (agentic-everything seems inevitable).

## Provenance

Night-shift R2 enrichment 2026-05-22. Sub-agents: 2 × general-purpose. 43 unique sources between them, including the Princeton GEO paper, iPullRank, Profound, Mike King, Aleyda Solis. IN-USE.md in place; skills/, agents/, MCP server code, .claude-plugin/ untouched.
