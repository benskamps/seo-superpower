"""schema-validate MCP server (v2 stub)

Will expose tools for offline JSON-LD validation against schema.org
vocabulary using pyld + extruct.

Status: v1 stub. Implementation lands in v2 release.

Planned tools:
  - validate_jsonld(json_ld_string)        -> {valid, errors[], warnings[]}
  - extract_schema_from_html(html_or_url)  -> extracted JSON-LD blocks
  - validate_url_schema(url)               -> fetch + extract + validate

Dependencies (when implemented):
  - pyld
  - extruct
  - requests
"""

import sys


def main() -> None:
    print(
        "schema-validate MCP is a v1 stub. Enable in v2 by implementing the "
        "MCP server protocol with tools validate_jsonld, extract_schema_from_html, "
        "validate_url_schema. See mcp-servers/README.md for the spec.",
        file=sys.stderr,
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
