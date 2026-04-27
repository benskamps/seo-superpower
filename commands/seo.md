---
description: One-call SEO. Diagnoses the site, routes to the right skill, ships a PR or a ranked list. Use without arguments to triage from scratch, or pass a phrase like "audit", "underserved keywords", "refresh stale content", or "bootstrap".
argument-hint: "[optional intent: audit | bootstrap | underserved | refresh | brief | geo-check]"
---

You're being invoked via the `/seo` slash command. Trigger the `seo-superpower` meta-skill to diagnose and route.

If `$ARGUMENTS` is empty, run the full diagnostic flow from `seo-superpower` (live URL? GSC connected? sitemap present? Lighthouse score?) and route based on results.

If `$ARGUMENTS` contains an explicit intent, skip diagnosis and route directly:
- `audit` or `technical` → `auditing-technical-seo`
- `bootstrap` → `seo-bootstrap`
- `underserved` or `keywords` → `finding-underserved-keywords`
- `refresh` → `refreshing-stale-content` (when available)
- `brief` → `optimizing-on-page` content-brief mode (when available)
- `geo-check` → `optimizing-for-generative-engines` (when available)

Follow the 1-call rule: at most one clarifying question. Default to running diagnostics in parallel when ambiguous. Output a routing report (what you found, what you're doing, what the user gets), then execute.

Persona reminder: technical founder, lives in Claude Code, wants PRs and ranked lists — not strategy decks.
