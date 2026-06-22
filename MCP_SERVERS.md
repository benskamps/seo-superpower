# MCP servers — the hands

Skills are reference docs that tell Claude *what* to do. The MCP servers below are how Claude
actually *does* it — pulling data, running scans, validating schema, and polling AI engines for
citations. This page is the one-screen navigator; each row links to the detailed README.

Five servers ship in `.mcp.json`. Two are built in this repo (`geo-check`, `schema-validate`);
three are pulled at install time via `uvx` / `npx` (no source vendored). All but `lighthouse-local`
are enabled by default.

| Server | Purpose | Tools exposed | Cost / quota | Detail |
|---|---|---|---|---|
| **`gsc`** | Pull per-page query data from your Google Search Console | (provided by `mcp-search-console`) — list properties, query analytics, sitemaps | Free — GSC free tier: 50,000 rows/day, 1,200 QPM | [MCP_SETUP.md](MCP_SETUP.md) |
| **`pagespeed`** | Run PageSpeed Insights / Lighthouse audits on a URL | (provided by `pagespeed-insights-mcp`) — run PSI for a URL + strategy | Free — PSI free tier: 25,000 queries/day, 240 QPM (needs an API key) | [MCP_SETUP.md](MCP_SETUP.md) |
| **`geo-check`** | Poll ChatGPT / Claude / Perplexity / Gemini and detect whether your domain gets cited | `geo_check`, `geo_track`, `geo_diff` | Your own LLM API keys; ~15 cheap calls/run (typically < $0.01). Missing keys are skipped, not fatal | [mcp-servers/geo-check/README.md](mcp-servers/geo-check/README.md) |
| **`schema-validate`** | Offline JSON-LD validation against schema.org + Google rich-result field checks (9 types) | `validate_jsonld`, `extract_schema_from_html`, `validate_url_schema`, `check_required_fields` | Free — runs offline (only `validate_url_schema` makes an outbound fetch). No API key | [mcp-servers/schema-validate/README.md](mcp-servers/schema-validate/README.md) |
| **`lighthouse-local`** | Local Lighthouse fallback when the PSI quota is hit | (provided by `lighthouse-mcp`) | Free — unlimited (CPU-bound). **Opt-in:** flip `disabled: false` in `.mcp.json` | [MCP_SETUP.md](MCP_SETUP.md) |

## Built here vs. pulled in

- **Built in this repo** (`mcp-servers/`): `geo-check` (~560 LOC) and `schema-validate` (~640 LOC).
  No mature upstream exists for multi-provider citation tracking or local schema validation, and
  the GEO SaaS alternatives charge $99–295/mo for the same capability. See
  [mcp-servers/README.md](mcp-servers/README.md) for the why.
- **Pulled at install time** via `uvx` / `npx`: `mcp-search-console` (`==0.3.2`),
  `pagespeed-insights-mcp` (`@latest`), `lighthouse-mcp` (`@latest`) — all MIT-licensed. The
  vendoring table and rationale live in [MCP_SETUP.md](MCP_SETUP.md).

## Get them running

Setup, API keys, env wiring, verification prompts, and a troubleshooting table:
**[MCP_SETUP.md](MCP_SETUP.md)**.

Adding or upgrading a server, or contributing your own: **[CONTRIBUTING.md](CONTRIBUTING.md)**.
