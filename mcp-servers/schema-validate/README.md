# schema-validate MCP server

The **Schema Validator** — parses, validates, and extracts structured data
(JSON-LD, microdata, RDFa, OpenGraph, Twitter cards) from HTML pages or
raw JSON-LD strings. Checks Google Search Central required + recommended
fields for rich-result eligibility.

This MCP turns "is my schema markup any good?" from a manual round-trip
through the [Rich Results Test](https://search.google.com/test/rich-results)
into an inline check Claude Code can run on demand.

## Tools exposed

| Tool                       | What it does                                                                  |
| -------------------------- | ----------------------------------------------------------------------------- |
| `validate_jsonld`          | Parse + validate a JSON-LD string. Returns errors, warnings, `@type`, expanded form. |
| `extract_schema_from_html` | Extract every structured-data syntax from HTML (or fetch the URL first).      |
| `validate_url_schema`      | Convenience: fetch URL, extract JSON-LD blocks, validate each, summarize.     |
| `check_required_fields`    | Score a parsed JSON-LD dict against Google rich-result rules for 9 types.    |

## Setup

```bash
cd mcp-servers/schema-validate
pip install -r requirements.txt
```

No API keys or env vars required — this MCP runs fully offline (with one
exception: `validate_url_schema` and `extract_schema_from_html(fetch_url=True)`
make outbound HTTPS requests to fetch the target page).

## Running standalone (for testing)

```bash
python server.py
```

This starts the MCP server on stdio. Most useful via the MCP inspector:

```bash
npx @modelcontextprotocol/inspector python server.py
```

## Wiring into Claude Code

The plugin's `.mcp.json` already references this server. Flip
`disabled: false` on the `schema-validate` entry and restart Claude Code:

```json
{
  "mcpServers": {
    "schema-validate": {
      "command": "python",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-servers/schema-validate/server.py"],
      "disabled": false
    }
  }
}
```

## Supported rich-result types

`check_required_fields` and the per-type checks inside `validate_jsonld` know
about the following Google rich-result types:

- `Article` (required: `headline`)
- `Product` (required: `name`; needs at-least-one of `review` / `aggregateRating` / `offers`)
- `FAQPage` (required: `mainEntity`)
- `HowTo` (required: `name`, `step`)
- `BreadcrumbList` (required: `itemListElement`)
- `Organization` (required: `name`)
- `Recipe` (required: `name`, `image`)
- `Event` (required: `name`, `startDate`, `location`)
- `JobPosting` (required: `title`, `description`, `datePosted`, `hiringOrganization`, `jobLocation`)

Other schema.org types validate at the parse + context-expansion level only.

## How validation works

1. **Parse** the JSON-LD string with `json.loads`. Parse errors become hard errors.
2. **Context check**: warn if `@context` doesn't reference schema.org.
3. **Expand** with `pyld.jsonld.expand()` — the canonical schema.org check. If
   the context can't be fetched, we warn and proceed with shallow validation.
4. **Per-type checks**: for the 9 supported rich-result types, walk the field
   list from Google Search Central docs. Required missing → error.
   Recommended missing → warning. At-least-one rules → error if unmet.

## Caveats

- **The 9-type mapping is hardcoded.** Updates to Google's rules require a
  code change here. Source: <https://developers.google.com/search/docs/appearance/structured-data>.
- **`pyld` fetches schema.org once per process.** First call may be slow on
  cold start. Air-gapped environments will see the warning "JSON-LD context
  expansion failed" — validation still proceeds, but is shallow.
- **No retries on URL fetches.** 30s timeout. Re-run on transient failure.
- **`extruct` returns OpenGraph and Twitter cards as dicts**, not lists.
  We normalize them into single-element lists for a consistent return shape.
