# `mcp-servers/`

Two thin Python MCP servers we own (no good upstream exists). Both ship as stubs in v1, default-disabled in `.mcp.json`. Implementation lands in v2.

## `geo-check/`

**Purpose:** poll ChatGPT / Claude / Perplexity / Gemini with target prompts and detect whether a domain gets cited. Output: provider × prompt matrix of citation hits.

**Why we build it ourselves:** no mature MCP exists for multi-provider citation tracking. Existing GEO SaaS (Profound, AthenaHQ, Otterly) charge $99–295/mo for this exact capability. ~150–200 LOC for a working stub.

**Tools to expose:**
- `geo_check(domain, prompts[], providers[])` → `{provider: {prompt: {cited: bool, context: str}}}`
- `geo_track(domain, prompt, frequency)` → registers a daily/weekly poll
- `geo_diff(domain, since)` → diffs current citations vs. baseline

**Auth:** uses provider keys from `~/.openclaw/.env` (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`).

## `schema-validate/`

**Purpose:** offline JSON-LD validation against schema.org vocabulary.

**Why we build it ourselves:** Google's Rich Results Test has no public API. Schema Markup Validator (validator.schema.org) is unofficial and rate-limited. `pyld` + `extruct` give us correct local validation.

**Tools to expose:**
- `validate_jsonld(json_ld_string)` → `{valid: bool, errors: [], warnings: []}`
- `extract_schema_from_html(html_or_url)` → returns extracted JSON-LD blocks
- `validate_url_schema(url)` → fetches URL, extracts JSON-LD, validates

**Dependencies:** `pyld`, `extruct`, `requests`.

## Why not vendor source?

We pull `mcp-search-console`, `pagespeed-insights-mcp`, and `lighthouse-mcp` at install time via `uvx`/`npx`. Three reasons:
1. Faster to update (just bump version in `.mcp.json`)
2. No license-tracking burden for us
3. Smaller plugin repo

The two MCPs in *this* directory are ones we own — no upstream to depend on.

## Status

| Server | v1 | v2 target |
|---|---|---|
| `geo-check/server.py` | stub | working multi-provider polling |
| `schema-validate/server.py` | stub | full JSON-LD validation |
