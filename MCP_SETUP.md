# MCP Setup — get the SEO Superpower running in 15 minutes

This plugin uses Model Context Protocol (MCP) servers to actually *do* things — pull GSC query data, run PageSpeed audits, validate schema, poll AI engines for citations. Skills are reference docs that tell Claude *what* to do; MCPs are the hands.

## Prereqs

- `uv` ≥ 0.5 — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Node ≥ 20 — `node -v`
- Python ≥ 3.11 — for the optional GEO-check and schema-validate servers

## 1. Google Cloud project (one-time, ~5 min)

1. Open https://console.cloud.google.com → **New project**: `seo-superpower`
2. Enable APIs:
   - https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   - https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
3. **GSC OAuth client** — APIs & Services → Credentials → Create Credentials → **OAuth client ID** → application type **Desktop app** → download JSON. Save to `~/.openclaw/gsc_client_secret.json`.
4. **PageSpeed API key** — same Credentials page → Create Credentials → API Key → restrict to "PageSpeed Insights API". Copy.

## 2. Wire up `~/.openclaw/.env`

Append:

```bash
GSC_OAUTH_CLIENT_SECRETS_FILE="$HOME/.openclaw/gsc_client_secret.json"
PAGESPEED_API_KEY="AIza..."
# Optional, for GEO MCP (v2):
PERPLEXITY_API_KEY="pplx-..."
```

`ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are presumed already present.

## 3. Install plugin

```
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower
```

`.mcp.json` auto-registers `gsc` and `pagespeed`. The `lighthouse-local`, `geo-check`, and `schema-validate` MCPs ship disabled — flip `disabled: false` in `.mcp.json` to enable.

## 4. Verify (paste into Claude)

1. **GSC**: "list my GSC properties" → first call opens browser for OAuth → token saved to `~/.config/mcp-search-console/`. Subsequent calls are silent.
2. **PageSpeed**: "run pagespeed for https://example.com mobile" → returns score in ~10s.
3. (v2) **GEO**: "geo-check claude-citations for example.com" → returns provider matrix.
4. (v2) **Schema**: "validate this JSON-LD" with a sample → returns errors/warnings.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `redirect_uri_mismatch` | OAuth client is **Web**, not **Desktop**. Recreate as Desktop. |
| `Quota exceeded (PSI)` | Wait or [request quota increase](https://developers.google.com/speed/docs/insights/v5/get-started#quota). Or flip `lighthouse-local.disabled` to `false`. |
| `mcp-search-console: command not found` | `uvx` not on PATH — restart shell after installing `uv`. |
| Multi-property GSC | Use `get_capabilities` first; pass `siteUrl` exactly (e.g. `sc-domain:example.com`). |
| Token expired | Use the `reauthenticate` tool in `mcp-search-console`. |

## Quotas to know

| API | Free-tier limit | Per |
|---|---|---|
| Google Search Console | 50,000 rows/day, 1,200 QPM per project | [docs](https://developers.google.com/webmaster-tools/limits) |
| PageSpeed Insights | 25,000 queries/day, 240 QPM | [docs](https://developers.google.com/speed/docs/insights/v5/get-started#key) |
| Local Lighthouse (fallback) | unlimited (CPU-bound) | n/a |

## What ships in v1 vs v2

**v1 (default-enabled):** `gsc`, `pagespeed`, `lighthouse-local` (opt-in fallback).

**v2 (default-disabled):** `geo-check` (multi-LLM citation polling), `schema-validate` (offline JSON-LD validation). These ship as stubs in `mcp-servers/` and will be filled in for v2 release.

## Vendoring & licenses

| MCP | Source | License | Pinned |
|---|---|---|---|
| `mcp-search-console` | [AminForou/mcp-gsc](https://github.com/AminForou/mcp-gsc) | MIT | `==0.3.2` |
| `pagespeed-insights-mcp` | [ruslanlap/pagespeed-insights-mcp](https://github.com/ruslanlap/pagespeed-insights-mcp) | MIT | `@latest` |
| `lighthouse-mcp` | [priyankark/lighthouse-mcp](https://github.com/priyankark/lighthouse-mcp) | MIT | `@latest` |

All are MIT-licensed and pulled at install time via `uvx` / `npx` — no source vendored into this repo. If any goes stale, replace via the same `.mcp.json` entry.

See [`mcp-servers/README.md`](mcp-servers/README.md) for our own thin MCPs (geo-check, schema-validate).
