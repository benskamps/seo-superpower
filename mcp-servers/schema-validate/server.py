"""schema-validate MCP server (v1)

Validates JSON-LD against schema.org vocabulary and extracts structured
data from URLs/HTML. Sister to the `geo-check` MCP — same FastMCP shape.

Tools exposed:
  - validate_jsonld(json_ld_string)
      Parse + expand a JSON-LD string, surface errors/warnings.
  - extract_schema_from_html(html_or_url, fetch_url)
      Extract JSON-LD / microdata / RDFa / OG / Twitter from HTML or URL.
  - validate_url_schema(url)
      Convenience: fetch URL, pull JSON-LD blocks, validate each.
  - check_required_fields(json_ld_dict, type)
      Check Google's required + recommended fields for rich-result types.

Standalone test:
    python server.py
(That starts the MCP server on stdio. Useful for `mcp dev` style smoke tests.)

Notes / quirks:
  * Built against the official `mcp` Python SDK using the `FastMCP` helper.
    Install with: pip install -r requirements.txt
  * `pyld` performs context expansion against schema.org. The library will
    fetch `https://schema.org/` once and cache it in-process. Offline runs
    will warn but still proceed with shallow validation.
  * The required-fields mapping is hardcoded for 9 common rich-result types
    (Article, Product, FAQPage, HowTo, BreadcrumbList, Organization, Recipe,
    Event, JobPosting). It mirrors Google Search Central documentation and
    must be updated by hand when Google revises the rules.
  * `extruct` returns OpenGraph and Twitter as flat dicts (not lists). We
    normalize them into single-element lists for a consistent return shape.
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
from typing import Any
from urllib.parse import urlparse

import httpx

try:
    import extruct
except ImportError:  # pragma: no cover
    extruct = None  # type: ignore[assignment]

try:
    from pyld import jsonld
except ImportError:  # pragma: no cover
    jsonld = None  # type: ignore[assignment]

from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Constants & config
# ---------------------------------------------------------------------------

DEFAULT_TIMEOUT_SECONDS = 30.0
SCHEMA_ORG_PREFIXES = (
    "http://schema.org/",
    "https://schema.org/",
    "http://schema.org",
    "https://schema.org",
)

# Google Search Central required + recommended fields for rich-result types.
# Source: https://developers.google.com/search/docs/appearance/structured-data
# This mapping is intentionally conservative — only fields Google explicitly
# calls out in the documentation. Update by hand when Google revises rules.
GOOGLE_RICH_RESULT_FIELDS: dict[str, dict[str, list[str]]] = {
    "Article": {
        "required": ["headline"],
        # NewsArticle/BlogPosting have stricter rules; Article itself is lax.
        # `image`, `datePublished`, `author` are required for AMP/top-stories
        # eligibility and strongly recommended otherwise.
        "recommended": [
            "image", "datePublished", "dateModified", "author", "publisher",
        ],
    },
    "Product": {
        "required": ["name"],
        # Google requires at least ONE of: review, aggregateRating, offers.
        # We track them as recommended and surface the "at-least-one" rule
        # via rich_result_eligible logic below.
        "recommended": [
            "image", "description", "sku", "brand", "offers",
            "aggregateRating", "review",
        ],
    },
    "FAQPage": {
        "required": ["mainEntity"],
        "recommended": [],
    },
    "HowTo": {
        "required": ["name", "step"],
        "recommended": [
            "image", "totalTime", "estimatedCost", "supply", "tool",
        ],
    },
    "BreadcrumbList": {
        "required": ["itemListElement"],
        "recommended": [],
    },
    "Organization": {
        "required": ["name"],
        "recommended": [
            "url", "logo", "sameAs", "contactPoint", "address",
        ],
    },
    "Recipe": {
        "required": ["name", "image"],
        "recommended": [
            "author", "datePublished", "description", "prepTime", "cookTime",
            "totalTime", "recipeYield", "recipeIngredient", "recipeInstructions",
            "nutrition", "aggregateRating", "video",
        ],
    },
    "Event": {
        "required": ["name", "startDate", "location"],
        "recommended": [
            "endDate", "description", "image", "offers", "performer",
            "organizer", "eventStatus", "eventAttendanceMode",
        ],
    },
    "JobPosting": {
        "required": [
            "title", "description", "datePosted", "hiringOrganization",
            "jobLocation",
        ],
        "recommended": [
            "baseSalary", "employmentType", "validThrough", "applicantLocationRequirements",
            "jobLocationType",
        ],
    },
}

# Types where Google requires at-least-one of a set of fields. We surface
# this as a warning when none of the alternates is present.
AT_LEAST_ONE_RULES: dict[str, list[list[str]]] = {
    "Product": [["review", "aggregateRating", "offers"]],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_schema_prefix(value: str) -> str:
    """Turn 'https://schema.org/Article' into 'Article'."""
    for prefix in SCHEMA_ORG_PREFIXES:
        if value.startswith(prefix):
            return value[len(prefix):].lstrip("/")
    return value


def _extract_type(parsed: Any) -> str | None:
    """Pull a usable @type out of a parsed JSON-LD doc.

    Handles strings, lists ([Type1, Type2] -> Type1), and stripped schema.org
    URI prefixes from expanded form.
    """
    if isinstance(parsed, list) and parsed:
        return _extract_type(parsed[0])
    if not isinstance(parsed, dict):
        return None
    t = parsed.get("@type") or parsed.get("type")
    if isinstance(t, list) and t:
        t = t[0]
    if isinstance(t, str):
        return _strip_schema_prefix(t)
    return None


def _has_field(node: dict[str, Any], field: str) -> bool:
    """Check if a JSON-LD node has a non-empty value for `field`.

    Schema.org keys may appear bare (`headline`) or namespaced (`schema:headline`,
    `https://schema.org/headline`) — we check all three.
    """
    candidates = [
        field,
        f"schema:{field}",
        f"http://schema.org/{field}",
        f"https://schema.org/{field}",
    ]
    for key in candidates:
        if key in node:
            v = node[key]
            if v in (None, "", [], {}):
                continue
            return True
    return False


def _is_schema_org_context(parsed: Any) -> bool:
    """True if @context references schema.org (string, list, or dict form)."""
    if not isinstance(parsed, dict):
        return False
    ctx = parsed.get("@context")
    if ctx is None:
        return False
    if isinstance(ctx, str):
        return "schema.org" in ctx
    if isinstance(ctx, list):
        return any(
            (isinstance(c, str) and "schema.org" in c)
            or (isinstance(c, dict) and any("schema.org" in str(v) for v in c.values()))
            for c in ctx
        )
    if isinstance(ctx, dict):
        return any("schema.org" in str(v) for v in ctx.values())
    return False


# ---------------------------------------------------------------------------
# Core validation
# ---------------------------------------------------------------------------

def _validate_jsonld_impl(json_ld_string: str) -> dict[str, Any]:
    """Shared implementation used by both validate_jsonld and validate_url_schema."""
    errors: list[str] = []
    warnings: list[str] = []

    # Parse step.
    try:
        parsed = json.loads(json_ld_string)
    except json.JSONDecodeError as e:
        return {
            "valid": False,
            "errors": [f"JSON parse error: {e.msg} at line {e.lineno} col {e.colno}"],
            "warnings": [],
            "type": None,
            "expanded": {},
        }

    # Context check.
    if not _is_schema_org_context(parsed if isinstance(parsed, dict) else (parsed[0] if isinstance(parsed, list) and parsed else {})):
        warnings.append(
            "@context does not reference schema.org — validation will be shallow"
        )

    # Type extraction.
    extracted_type = _extract_type(parsed)
    if extracted_type is None:
        errors.append("Missing @type — JSON-LD must declare a type for rich-result eligibility")

    # Expansion via pyld. This is the canonical schema.org validation step:
    # if the context is wrong or unreachable, pyld will raise.
    expanded: list[Any] | dict[str, Any] = []
    if jsonld is not None:
        try:
            expanded = jsonld.expand(parsed)
        except Exception as e:  # pyld raises a JsonLdError subclass
            warnings.append(
                f"JSON-LD context expansion failed ({type(e).__name__}): "
                "check @context URL is reachable. Continuing with shallow validation."
            )
    else:
        warnings.append("pyld not installed — skipping context expansion")

    # Per-type field checks (uses the parsed form, not expanded, for simplicity).
    node = parsed[0] if isinstance(parsed, list) and parsed else parsed
    if extracted_type and isinstance(node, dict):
        rules = GOOGLE_RICH_RESULT_FIELDS.get(extracted_type)
        if rules:
            for field in rules.get("required", []):
                if not _has_field(node, field):
                    errors.append(
                        f"Missing required field '{field}' for {extracted_type}"
                    )
            for group in AT_LEAST_ONE_RULES.get(extracted_type, []):
                if not any(_has_field(node, f) for f in group):
                    errors.append(
                        f"{extracted_type} requires at least one of: {', '.join(group)}"
                    )
            for field in rules.get("recommended", []):
                if not _has_field(node, field):
                    warnings.append(
                        f"Missing recommended field '{field}' for {extracted_type}"
                    )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "type": extracted_type,
        "expanded": expanded if isinstance(expanded, (list, dict)) else [],
    }


def _check_required_fields_impl(
    json_ld_dict: dict[str, Any], type_override: str | None = None,
) -> dict[str, Any]:
    """Shared logic for the check_required_fields tool."""
    declared = type_override or _extract_type(json_ld_dict) or ""
    declared = _strip_schema_prefix(declared)

    rules = GOOGLE_RICH_RESULT_FIELDS.get(declared)
    if rules is None:
        return {
            "type": declared or None,
            "required_present": [],
            "required_missing": [],
            "recommended_present": [],
            "recommended_missing": [],
            "rich_result_eligible": False,
            "note": (
                f"No Google rich-result mapping for type '{declared}'. "
                f"Supported types: {sorted(GOOGLE_RICH_RESULT_FIELDS.keys())}"
            ),
        }

    required_present: list[str] = []
    required_missing: list[str] = []
    recommended_present: list[str] = []
    recommended_missing: list[str] = []

    for field in rules.get("required", []):
        if _has_field(json_ld_dict, field):
            required_present.append(field)
        else:
            required_missing.append(field)

    for field in rules.get("recommended", []):
        if _has_field(json_ld_dict, field):
            recommended_present.append(field)
        else:
            recommended_missing.append(field)

    # At-least-one rule: if defined and unmet, treat as a missing required group.
    at_least_one_unmet: list[str] = []
    for group in AT_LEAST_ONE_RULES.get(declared, []):
        if not any(_has_field(json_ld_dict, f) for f in group):
            at_least_one_unmet.append(f"one of [{', '.join(group)}]")

    eligible = not required_missing and not at_least_one_unmet

    result = {
        "type": declared,
        "required_present": required_present,
        "required_missing": required_missing + at_least_one_unmet,
        "recommended_present": recommended_present,
        "recommended_missing": recommended_missing,
        "rich_result_eligible": eligible,
    }
    return result


# ---------------------------------------------------------------------------
# HTML / URL extraction
# ---------------------------------------------------------------------------

def _normalize_extracted(raw: dict[str, Any]) -> dict[str, list[Any]]:
    """`extruct` returns OG as a list of dicts in `uniform=True` mode.
    Normalize every key to a consistent list-of-dicts shape."""
    def as_list(v: Any) -> list[Any]:
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, dict):
            return [v] if v else []
        return [v]

    return {
        "json_ld": as_list(raw.get("json-ld")),
        "microdata": as_list(raw.get("microdata")),
        "opengraph": as_list(raw.get("opengraph")),
        "twitter": [],  # filled in by _extract_all from a separate regex pass
        "rdfa": as_list(raw.get("rdfa")),
    }


# extruct does not extract `twitter:*` meta tags — they're not part of any
# of its supported syntaxes. Pull them out ourselves with a tiny regex over
# the page <head>. Good enough for the common case (single-line tags).
_TWITTER_META_RE = re.compile(
    r"""<meta\s+[^>]*?(?:name|property)\s*=\s*["'](twitter:[^"']+)["']"""
    r"""[^>]*?content\s*=\s*["']([^"']*)["']""",
    re.IGNORECASE,
)
_TWITTER_META_RE_REV = re.compile(
    r"""<meta\s+[^>]*?content\s*=\s*["']([^"']*)["']"""
    r"""[^>]*?(?:name|property)\s*=\s*["'](twitter:[^"']+)["']""",
    re.IGNORECASE,
)


def _extract_twitter_cards(html: str) -> list[dict[str, str]]:
    """Pull `<meta name="twitter:*" content="...">` tags out of HTML.
    Returns a single-element list `[{"twitter:card": "summary", ...}]` if
    any tags found, else []."""
    found: dict[str, str] = {}
    for key, val in _TWITTER_META_RE.findall(html):
        found[key.lower()] = val
    # Also handle reversed attribute order (content-before-name).
    for val, key in _TWITTER_META_RE_REV.findall(html):
        found.setdefault(key.lower(), val)
    return [found] if found else []


async def _fetch_html(url: str) -> str:
    """Fetch HTML over HTTPS. Sets a friendly UA so well-behaved sites don't 403."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; schema-validate-mcp/1.0; "
            "+https://github.com/benskamps/seo-superpower)"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        r = await client.get(url, timeout=DEFAULT_TIMEOUT_SECONDS)
        r.raise_for_status()
        return r.text


def _extract_all(html: str, base_url: str | None = None) -> dict[str, list[Any]]:
    """Run extruct against an HTML string and return the normalized payload."""
    if extruct is None:
        return {
            "json_ld": [], "microdata": [], "opengraph": [],
            "twitter": [], "rdfa": [],
            "_error": "extruct not installed",  # type: ignore[dict-item]
        }
    # extruct supports json-ld, microdata, opengraph, rdfa, dublincore, and
    # microformat — but NOT twitter cards. We extract twitter:* meta tags
    # via a small dedicated regex pass below.
    raw = extruct.extract(
        html,
        base_url=base_url,
        syntaxes=["json-ld", "microdata", "opengraph", "rdfa"],
        uniform=True,
    )
    payload = _normalize_extracted(raw)
    payload["twitter"] = _extract_twitter_cards(html)
    return payload


# ---------------------------------------------------------------------------
# MCP server + tool definitions
# ---------------------------------------------------------------------------

mcp = FastMCP("schema-validate")


@mcp.tool()
async def validate_jsonld(json_ld_string: str) -> dict[str, Any]:
    """Validate a JSON-LD string against schema.org vocabulary.

    Parses, expands via pyld, and checks Google rich-result required +
    recommended fields for the declared @type.

    Args:
        json_ld_string: Raw JSON-LD as a string (e.g. the contents of a
            <script type="application/ld+json"> block).

    Returns:
        {
          "valid": bool,
          "errors": [str],     # parse errors, missing required fields
          "warnings": [str],   # missing recommended fields, deprecated types
          "type": str | None,  # extracted @type
          "expanded": list     # JSON-LD expanded form (debug aid)
        }
    """
    return _validate_jsonld_impl(json_ld_string)


@mcp.tool()
async def extract_schema_from_html(
    html_or_url: str, fetch_url: bool = False,
) -> dict[str, Any]:
    """Extract structured data (JSON-LD / microdata / RDFa / OG / Twitter).

    Args:
        html_or_url: Either an HTML string OR a URL. If `fetch_url=True`
            we treat the input as a URL, fetch it via httpx, and extract
            from the response body.
        fetch_url: When True, treat `html_or_url` as a URL to fetch.

    Returns:
        {
          "json_ld": [dict], "microdata": [dict], "opengraph": [dict],
          "twitter": [dict], "rdfa": [dict],
          "url": str | None
        }
    """
    url: str | None = None
    if fetch_url:
        url = html_or_url
        # Sanity check we actually got a URL, not a wall of HTML.
        parsed_url = urlparse(url)
        if parsed_url.scheme not in ("http", "https"):
            return {
                "json_ld": [], "microdata": [], "opengraph": [],
                "twitter": [], "rdfa": [], "url": url,
                "error": f"fetch_url=True but '{url[:80]}...' is not http(s)",
            }
        try:
            html = await _fetch_html(url)
        except httpx.HTTPStatusError as e:
            return {
                "json_ld": [], "microdata": [], "opengraph": [],
                "twitter": [], "rdfa": [], "url": url,
                "error": f"HTTP {e.response.status_code} fetching {url}",
            }
        except Exception as e:  # noqa: BLE001 — surface anything as a result
            return {
                "json_ld": [], "microdata": [], "opengraph": [],
                "twitter": [], "rdfa": [], "url": url,
                "error": f"{type(e).__name__}: {e}",
            }
    else:
        html = html_or_url

    payload = _extract_all(html, base_url=url)
    payload["url"] = url
    return payload


@mcp.tool()
async def validate_url_schema(url: str) -> dict[str, Any]:
    """Fetch a URL, extract every JSON-LD block, and validate each.

    Args:
        url: HTTPS URL to a page that may contain JSON-LD.

    Returns:
        {
          "url": str,
          "blocks_found": int,
          "blocks": [{type, valid, errors[], warnings[]}],
          "summary": str
        }
    """
    try:
        html = await _fetch_html(url)
    except httpx.HTTPStatusError as e:
        return {
            "url": url, "blocks_found": 0, "blocks": [],
            "summary": f"HTTP {e.response.status_code} fetching {url}",
            "error": True,
        }
    except Exception as e:  # noqa: BLE001
        return {
            "url": url, "blocks_found": 0, "blocks": [],
            "summary": f"{type(e).__name__}: {e}",
            "error": True,
        }

    extracted = _extract_all(html, base_url=url)
    json_ld_blocks = extracted.get("json_ld", [])

    blocks: list[dict[str, Any]] = []
    valid_count = 0
    error_examples: list[str] = []
    for block in json_ld_blocks:
        # Each block from extruct is already a parsed dict. Re-serialize so
        # we go through the same validation path as raw strings.
        result = _validate_jsonld_impl(json.dumps(block))
        block_summary = {
            "type": result["type"],
            "valid": result["valid"],
            "errors": result["errors"],
            "warnings": result["warnings"],
        }
        blocks.append(block_summary)
        if result["valid"]:
            valid_count += 1
        elif result["errors"]:
            # Preserve a short error tag for the summary line.
            t = result["type"] or "?"
            first = result["errors"][0]
            # e.g. "Article missing 'author'"
            error_examples.append(f"{t}: {first}")

    n = len(blocks)
    if n == 0:
        summary = "0 JSON-LD blocks found on page"
    else:
        bad = n - valid_count
        if bad == 0:
            summary = f"{n} block{'s' if n != 1 else ''}: all valid"
        else:
            ex = f" ({error_examples[0]})" if error_examples else ""
            summary = (
                f"{n} blocks: {valid_count} valid, {bad} with errors{ex}"
            )

    return {
        "url": url,
        "blocks_found": n,
        "blocks": blocks,
        "summary": summary,
    }


@mcp.tool()
async def check_required_fields(
    json_ld_dict: dict[str, Any], type: str | None = None,
) -> dict[str, Any]:
    """Check Google's required + recommended fields for rich-result eligibility.

    Supports: Article, Product, FAQPage, HowTo, BreadcrumbList,
    Organization, Recipe, Event, JobPosting.

    Args:
        json_ld_dict: Parsed JSON-LD as a dict.
        type: Optional explicit @type override (e.g. force-check against
            "Recipe" even if the dict's @type is something else).

    Returns:
        {
          "type": str,
          "required_present": [str],
          "required_missing": [str],
          "recommended_present": [str],
          "recommended_missing": [str],
          "rich_result_eligible": bool
        }
    """
    return _check_required_fields_impl(json_ld_dict, type_override=type)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    """Run the MCP server over stdio (the transport Claude Code uses)."""
    mcp.run()


if __name__ == "__main__":
    main()
