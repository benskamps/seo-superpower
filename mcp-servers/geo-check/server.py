"""geo-check MCP server (v2 stub)

Will expose tools for polling ChatGPT / Claude / Perplexity / Gemini
to detect domain citations and track GEO visibility over time.

Status: v1 stub. Implementation lands in v2 release.

Planned tools:
  - geo_check(domain, prompts[], providers[]) -> citation matrix
  - geo_track(domain, prompt, frequency)      -> register poll
  - geo_diff(domain, since)                   -> diff vs baseline

Auth: provider keys from environment
  - ANTHROPIC_API_KEY
  - OPENAI_API_KEY
  - PERPLEXITY_API_KEY
"""

import sys


def main() -> None:
    print(
        "geo-check MCP is a v1 stub. Enable in v2 by implementing the MCP "
        "server protocol with tools geo_check, geo_track, geo_diff. See "
        "mcp-servers/README.md for the spec.",
        file=sys.stderr,
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
