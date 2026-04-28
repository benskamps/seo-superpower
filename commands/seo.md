---
description: One-call SEO. Diagnoses the site, routes to the right skill, ships a PR or a ranked list. Use without arguments to triage from scratch, or pass a phrase like "audit", "underserved keywords", "refresh stale content", or "bootstrap".
argument-hint: "[optional intent: audit | bootstrap | underserved | refresh | brief | geo-check]"
---

You're being invoked via the `/seo` slash command. Trigger the `seo-superpower` meta-skill to diagnose and route.

If `$ARGUMENTS` is empty, run the full diagnostic flow from `seo-superpower` (live URL? GSC connected? sitemap present? Lighthouse score?) and route based on results.

If `$ARGUMENTS` contains an explicit intent, skip diagnosis and route directly:
- `audit` or `technical` → `auditing-technical-seo`
- `bootstrap` → `seo-bootstrap`
- `measure` or `setup` → `setting-up-seo-measurement`
- `underserved` or `keywords` → `finding-underserved-keywords`
- `cold-start` or `pre-launch` → `researching-keywords-pre-launch`
- `clusters` or `topics` → `planning-topic-clusters`
- `refresh` → `refreshing-stale-content`
- `on-page` or `polish` → `optimizing-on-page`
- `schema` or `json-ld` → `adding-schema-markup`
- `gap` or `competitor` → `analyzing-content-gaps`
- `eeat` or `authority` → `building-eeat-and-authority`
- `programmatic` or `scale` → `generating-programmatic-seo`
- `geo-check` or `geo` → `optimizing-for-generative-engines` (uses geo-check MCP)
- `brief` → `analyzing-content-gaps` (content brief from competitor SERP)

Follow the 1-call rule: at most one clarifying question. Default to running diagnostics in parallel when ambiguous. Output a routing report (what you found, what you're doing, what the user gets), then execute.

Persona reminder: technical founder, lives in Claude Code, wants PRs and ranked lists — not strategy decks.
