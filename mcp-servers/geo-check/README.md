# geo-check MCP server

The **GEO Diff Bot** — polls ChatGPT, Claude, Perplexity (and optionally
Gemini) with target prompts and detects whether your domain gets cited.

This is the killer feature of `seo-superpower`: traditional SEO rank
tracking is for Google, but **Generative Engine Optimization (GEO)**
is what matters when users ask AI assistants for recommendations. This
MCP lets you measure it.

## Tools exposed

| Tool         | What it does                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| `geo_check`  | One-shot: poll providers and return a citation matrix.                       |
| `geo_track`  | Run a check + write a JSON baseline to disk (timestamped).                   |
| `geo_diff`   | Compare a fresh check against the saved baseline; tag prompts gained/lost.   |

All three accept the same core args: `domain` (str), `prompts` (list of str),
and an optional `providers` filter
(`["anthropic", "openai", "perplexity", "gemini"]`).

## Setup

```bash
cd mcp-servers/geo-check
pip install -r requirements.txt
```

### API keys

Set whichever providers you want to use. Missing keys are skipped — the run
does **not** fail.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export PERPLEXITY_API_KEY=pplx-...
export GOOGLE_API_KEY=...    # optional, for Gemini
```

### Optional model overrides

```bash
export GEO_CHECK_ANTHROPIC_MODEL=claude-sonnet-4-6
export GEO_CHECK_OPENAI_MODEL=gpt-5            # falls back to gpt-4o if missing
export GEO_CHECK_PERPLEXITY_MODEL=sonar         # or sonar-pro
export GEO_CHECK_GEMINI_MODEL=gemini-2.0-flash
```

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
`disabled: false` on the `geo-check` entry and restart Claude Code:

```json
{
  "mcpServers": {
    "geo-check": {
      "command": "python",
      "args": ["${PLUGIN_ROOT}/mcp-servers/geo-check/server.py"],
      "disabled": false,
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    }
  }
}
```

## Cost awareness

Each `geo_check` call fans out `len(providers) * len(prompts)` API calls
in parallel. With the defaults (3 providers, ~5 prompts) you're looking
at ~15 cheap calls — typically under a cent total. Each call's estimated
cost is logged to stderr like:

```
[geo-check][cost] anthropic: in=42 out=311 ~$0.00482
```

Watch your usage if you scale prompts up to dozens — it adds up.

## How citation detection works

For each (provider, prompt) we send the prompt and read back the response
body. We then run a **case-insensitive regex** for `(www\.)?<your-domain>`
across the body. For Perplexity we *also* walk the structured `citations`
array (and `search_results` for Sonar Pro) because the body sometimes uses
numbered footnotes that don't include the bare URL.

It's not perfect — a model could mention your brand without the domain —
but in practice domain mentions are a strong proxy for "the model is
aware of and links to your site" which is what GEO actually optimizes for.

## Caveats

- **No retries.** Calls fail fast and surface the error in the result
  payload. These are cheap; just re-run.
- **30s timeout per call.**
- Pricing in the cost log is a ballpark — check provider pages for the
  authoritative numbers.
- The `gpt-5` default falls back to `gpt-4o` automatically if the configured
  model isn't available on your OpenAI account.
