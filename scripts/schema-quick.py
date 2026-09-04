#!/usr/bin/env python3
"""schema-quick.py — fast offline JSON-LD schema validator.

Pure Python 3 standard library (no external dependencies, no MCP, no pip).
Validates JSON-LD syntax, schema.org context, case sensitivity of @type,
and Google Rich Result required/recommended fields for major schema types:
Article, BlogPosting, Product, FAQPage, BreadcrumbList, Organization,
HowTo, Recipe, Event, JobPosting, WebSite.

Usage:
    python scripts/schema-quick.py --file <path>
    python scripts/schema-quick.py --json '<json_string>'
    python scripts/schema-quick.py --url <url>
    python scripts/schema-quick.py <file_or_url_or_json>
    cat file.json | python scripts/schema-quick.py

Exit codes:
    0 — Valid schema, 0 errors, 0 warnings (clean / rich-result ready)
    1 — Valid schema syntax and required fields, but has warnings (missing recommended fields)
    2 — Errors: invalid JSON syntax, missing @context, mis-cased @type, missing required fields, or bad input
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

# Stream reconfiguration for Windows console Unicode support
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def _can_encode(char: str) -> bool:
    """Check if stdout can encode the specified character without error."""
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    try:
        char.encode(encoding)
        return True
    except (UnicodeEncodeError, LookupError):
        return False


# Canonical Schema.org type names (lowercase -> canonical casing)
CANONICAL_TYPES: dict[str, str] = {
    "article": "Article",
    "blogposting": "BlogPosting",
    "newsarticle": "NewsArticle",
    "website": "WebSite",
    "webpage": "WebPage",
    "aboutpage": "AboutPage",
    "contactpage": "ContactPage",
    "itempage": "ItemPage",
    "collectionpage": "CollectionPage",
    "profilepage": "ProfilePage",
    "organization": "Organization",
    "localbusiness": "LocalBusiness",
    "corporation": "Corporation",
    "product": "Product",
    "offer": "Offer",
    "aggregaterating": "AggregateRating",
    "review": "Review",
    "rating": "Rating",
    "faqpage": "FAQPage",
    "question": "Question",
    "answer": "Answer",
    "breadcrumblist": "BreadcrumbList",
    "listitem": "ListItem",
    "itemlist": "ItemList",
    "howto": "HowTo",
    "howtostep": "HowToStep",
    "howtosection": "HowToSection",
    "recipe": "Recipe",
    "event": "Event",
    "jobposting": "JobPosting",
    "person": "Person",
    "touristtrip": "TouristTrip",
    "searchaction": "SearchAction",
    "postaladdress": "PostalAddress",
    "imageobject": "ImageObject",
    "videoobject": "VideoObject",
    "softwareapplication": "SoftwareApplication",
}

VALID_CONTEXT_PREFIXES = (
    "https://schema.org",
    "http://schema.org",
    "https://schema.org/",
    "http://schema.org/",
)

SCRIPT_LD_JSON_RE = re.compile(
    r"<script[^>]*type=[\"']application/ld\+json[\"'][^>]*>([\s\S]*?)</script>",
    re.IGNORECASE,
)


def extract_json_ld_blocks(text: str) -> list[str]:
    """Extract raw JSON strings from <script type="application/ld+json"> or return raw text."""
    matches = SCRIPT_LD_JSON_RE.findall(text)
    if matches:
        return [m.strip() for m in matches if m.strip()]
    stripped = text.strip()
    if stripped.startswith(("{", "[")):
        return [stripped]
    return []


def validate_type_casing(given_type: str, path: str, errors: list[str]) -> str:
    """Validate that the given @type matches official schema.org casing."""
    lower = given_type.lower()
    if lower in CANONICAL_TYPES:
        canonical = CANONICAL_TYPES[lower]
        if given_type != canonical:
            errors.append(
                f"{path}: @type '{given_type}' has incorrect casing. Schema.org specifies '{canonical}'."
            )
        return canonical
    return given_type


def check_required_and_recommended(
    entity: dict[str, Any],
    canonical_type: str,
    path: str,
    errors: list[str],
    warnings: list[str],
) -> None:
    """Check required and recommended fields according to Google Rich Result specifications."""
    def req(field: str, desc: str = "") -> bool:
        val = entity.get(field)
        if val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, (list, dict)) and not val):
            msg = f"{path} ({canonical_type}): missing required field '{field}'"
            if desc:
                msg += f" ({desc})"
            errors.append(msg)
            return False
        return True

    def rec(field: str, desc: str = "") -> bool:
        val = entity.get(field)
        if val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, (list, dict)) and not val):
            msg = f"{path} ({canonical_type}): missing recommended field '{field}'"
            if desc:
                msg += f" ({desc})"
            warnings.append(msg)
            return False
        return True

    if canonical_type in ("Article", "BlogPosting", "NewsArticle"):
        req("headline")
        rec("author")
        rec("datePublished")
        rec("dateModified")
        rec("image")
        rec("publisher")

    elif canonical_type == "Product":
        req("name")
        has_offer = bool(entity.get("offers"))
        has_rating = bool(entity.get("aggregateRating"))
        has_review = bool(entity.get("review"))
        if not (has_offer or has_rating or has_review):
            errors.append(
                f"{path} ({canonical_type}): requires at least one of 'offers', 'aggregateRating', or 'review' for Google rich results"
            )
        rec("image")
        rec("description")
        rec("brand")

    elif canonical_type == "FAQPage":
        main_entity = entity.get("mainEntity")
        if not main_entity or not isinstance(main_entity, list) or len(main_entity) == 0:
            errors.append(
                f"{path} ({canonical_type}): missing required field 'mainEntity' (must be a non-empty array of Question)"
            )
        else:
            for idx, q in enumerate(main_entity):
                q_path = f"{path}.mainEntity[{idx}]"
                if not isinstance(q, dict):
                    errors.append(f"{q_path}: Question must be an object")
                    continue
                q_type = q.get("@type", "Question")
                validate_type_casing(q_type, q_path, errors)
                if not q.get("name"):
                    errors.append(f"{q_path}: missing required field 'name' (question text)")
                ans = q.get("acceptedAnswer")
                if not ans or not isinstance(ans, dict):
                    errors.append(f"{q_path}: missing required field 'acceptedAnswer' (Answer object)")
                else:
                    ans_type = ans.get("@type", "Answer")
                    validate_type_casing(ans_type, f"{q_path}.acceptedAnswer", errors)
                    if not ans.get("text"):
                        errors.append(f"{q_path}.acceptedAnswer: missing required field 'text' (answer body)")

    elif canonical_type == "BreadcrumbList":
        items = entity.get("itemListElement")
        if not items or not isinstance(items, list) or len(items) == 0:
            errors.append(
                f"{path} ({canonical_type}): missing required field 'itemListElement' (must be a non-empty array of ListItem)"
            )
        else:
            for idx, item in enumerate(items):
                item_path = f"{path}.itemListElement[{idx}]"
                if not isinstance(item, dict):
                    errors.append(f"{item_path}: ListItem must be an object")
                    continue
                item_type = item.get("@type", "ListItem")
                validate_type_casing(item_type, item_path, errors)
                if item.get("position") is None:
                    errors.append(f"{item_path}: missing required field 'position'")
                if not item.get("name") and not item.get("item"):
                    errors.append(f"{item_path}: requires 'name' or 'item'")

    elif canonical_type in ("Organization", "LocalBusiness", "Corporation"):
        if not entity.get("name") and not entity.get("legalName"):
            errors.append(f"{path} ({canonical_type}): missing required field 'name' or 'legalName'")
        rec("url")
        rec("logo")
        rec("sameAs")
        if canonical_type == "LocalBusiness":
            req("address")
            rec("telephone")

    elif canonical_type == "HowTo":
        req("name")
        if not entity.get("step") and not entity.get("itemListElement"):
            errors.append(f"{path} ({canonical_type}): requires 'step' or 'itemListElement'")
        rec("image")
        rec("totalTime")
        rec("description")

    elif canonical_type == "Recipe":
        req("name")
        req("image")
        rec("author")
        rec("datePublished")
        rec("description")
        rec("recipeIngredient")
        rec("recipeInstructions")

    elif canonical_type == "Event":
        req("name")
        req("startDate")
        req("location")
        rec("endDate")
        rec("description")
        rec("offers")
        rec("image")

    elif canonical_type == "JobPosting":
        req("title")
        req("description")
        req("datePosted")
        rec("hiringOrganization")
        rec("jobLocation")

    elif canonical_type == "WebSite":
        if not entity.get("name") and not entity.get("url"):
            errors.append(f"{path} ({canonical_type}): requires 'name' or 'url'")
        rec("url")
        rec("potentialAction")


def validate_entity(
    node: Any,
    path: str,
    inherited_context: str | None,
    errors: list[str],
    warnings: list[str],
    types_found: list[str],
) -> dict[str, Any]:
    """Validate a single JSON-LD entity or structure."""
    if not isinstance(node, dict):
        errors.append(f"{path}: expected JSON-LD entity to be an object, got {type(node).__name__}")
        return {"type": "Unknown", "valid": False, "errors": [f"{path}: not an object"]}

    # Context check
    raw_context = node.get("@context") or inherited_context
    if not raw_context:
        errors.append(f"{path}: missing '@context'. Must be 'https://schema.org'.")
    elif isinstance(raw_context, str):
        if not any(raw_context == p or raw_context.startswith(p) for p in VALID_CONTEXT_PREFIXES):
            errors.append(f"{path}: invalid '@context' '{raw_context}'. Must be 'https://schema.org'.")
    elif isinstance(raw_context, list):
        if not any(isinstance(c, str) and any(c.startswith(p) for p in VALID_CONTEXT_PREFIXES) for c in raw_context):
            errors.append(f"{path}: '@context' array must include 'https://schema.org'.")
    elif isinstance(raw_context, dict):
        pass  # Scoped context dictionary
    else:
        errors.append(f"{path}: invalid '@context' format.")

    # Graph check
    if "@graph" in node:
        graph = node["@graph"]
        if not isinstance(graph, list):
            errors.append(f"{path}: '@graph' must be an array.")
            return {"type": "@graph", "valid": False}
        context_for_graph = node.get("@context") or inherited_context
        for i, item in enumerate(graph):
            validate_entity(item, f"{path}.@graph[{i}]", context_for_graph, errors, warnings, types_found)
        return {"type": "@graph", "valid": len(errors) == 0}

    # Type check
    raw_type = node.get("@type")
    if not raw_type:
        errors.append(f"{path}: missing required field '@type'.")
        return {"type": "Unknown", "valid": False}

    current_types: list[str] = []
    if isinstance(raw_type, str):
        canonical = validate_type_casing(raw_type, path, errors)
        current_types.append(canonical)
    elif isinstance(raw_type, list):
        for idx, t in enumerate(raw_type):
            if isinstance(t, str):
                canonical = validate_type_casing(t, f"{path}.@type[{idx}]", errors)
                current_types.append(canonical)
            else:
                errors.append(f"{path}.@type[{idx}]: @type item must be a string.")
    else:
        errors.append(f"{path}: @type must be a string or array of strings.")

    for ct in current_types:
        if ct not in types_found:
            types_found.append(ct)
        check_required_and_recommended(node, ct, path, errors, warnings)

    return {
        "type": current_types[0] if current_types else "Unknown",
        "types": current_types,
        "valid": len(errors) == 0,
    }


def validate_json_ld(raw_text: str) -> dict[str, Any]:
    """Parse and validate JSON-LD from raw string or HTML snippet."""
    blocks = extract_json_ld_blocks(raw_text)
    if not blocks:
        return {
            "valid": False,
            "errors": ["No JSON-LD found in input (expected valid JSON or <script type='application/ld+json'>)"],
            "warnings": [],
            "types": [],
            "details": {"totalBlocks": 0, "entities": []},
        }

    errors: list[str] = []
    warnings: list[str] = []
    types_found: list[str] = []
    entities_details: list[dict[str, Any]] = []

    for block_idx, block_str in enumerate(blocks):
        block_path = f"block[{block_idx}]" if len(blocks) > 1 else "root"
        try:
            parsed = json.loads(block_str)
        except json.JSONDecodeError as e:
            errors.append(f"{block_path}: JSON syntax error: {e}")
            continue

        if isinstance(parsed, list):
            for i, item in enumerate(parsed):
                det = validate_entity(item, f"{block_path}[{i}]", None, errors, warnings, types_found)
                entities_details.append(det)
        elif isinstance(parsed, dict):
            det = validate_entity(parsed, block_path, None, errors, warnings, types_found)
            entities_details.append(det)
        else:
            errors.append(f"{block_path}: top-level JSON-LD must be an object or array")

    is_valid = len(errors) == 0
    return {
        "valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "types": types_found,
        "details": {
            "totalBlocks": len(blocks),
            "totalEntities": len(entities_details),
            "entities": entities_details,
        },
    }


def fetch_url(url: str, timeout: int = 15) -> str:
    """Fetch HTML content from a URL."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "seo-superpower-schema-quick/1.0 (+https://github.com/benskamps/seo-superpower)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def render_human(result: dict[str, Any]) -> str:
    """Render human-readable schema validation report."""
    supports_unicode = _can_encode("✅") and _can_encode("❌") and _can_encode("⚠️")
    pass_icon = "✅" if supports_unicode else "[PASS]"
    fail_icon = "❌" if supports_unicode else "[FAIL]"
    warn_icon = "⚠️ " if supports_unicode else "[WARN]"

    lines: list[str] = []
    status = "CLEAN (0 errors, 0 warnings)" if result["valid"] and not result["warnings"] else (
        "WARNINGS" if result["valid"] else "ERRORS FOUND"
    )
    lines.append(f"Schema Validation Result: {status}")
    types_str = ", ".join(result["types"]) if result["types"] else "none detected"
    lines.append(f"Schema Types Detected: {types_str}")
    lines.append("")

    if result["errors"]:
        lines.append(f"Errors ({len(result['errors'])}):")
        for err in result["errors"]:
            lines.append(f"  {fail_icon} {err}")
        lines.append("")

    if result["warnings"]:
        lines.append(f"Warnings ({len(result['warnings'])}):")
        for warn in result["warnings"]:
            lines.append(f"  {warn_icon} {warn}")
        lines.append("")

    if result["valid"] and not result["warnings"]:
        lines.append(f"{pass_icon} All required and recommended schema fields present and valid.")
    elif result["valid"]:
        lines.append(f"{pass_icon} Valid JSON-LD syntax and required fields present (rich-result eligible).")
    else:
        lines.append(f"{fail_icon} Invalid schema markup. Please resolve errors before shipping.")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="schema-quick.py",
        description="Fast offline JSON-LD schema validator — stdlib only, zero dependencies.",
    )
    parser.add_argument("target", nargs="?", help="Path to file, URL, or raw JSON string.")
    parser.add_argument("--file", "-f", help="Path to file containing JSON-LD or HTML.")
    parser.add_argument("--json", "-j", dest="json_input", help="Raw JSON-LD string to validate.")
    parser.add_argument("--url", "-u", help="URL to fetch and validate.")
    parser.add_argument("--format", choices=["json", "text"], default="json", help="Output format (default: json).")
    parser.add_argument("--text", action="store_true", help="Print human-readable text output instead of JSON.")

    args = parser.parse_args(argv)

    raw_content = ""

    if args.json_input:
        raw_content = args.json_input
    elif args.file:
        path = Path(args.file)
        if not path.is_file():
            print(json.dumps({"valid": False, "errors": [f"File not found: {args.file}"], "warnings": [], "types": []}, indent=2))
            return 2
        try:
            raw_content = path.read_text(encoding="utf-8")
        except OSError as e:
            print(json.dumps({"valid": False, "errors": [f"Could not read file {args.file}: {e}"], "warnings": [], "types": []}, indent=2))
            return 2
    elif args.url:
        try:
            raw_content = fetch_url(args.url)
        except Exception as e:
            print(json.dumps({"valid": False, "errors": [f"Could not fetch URL {args.url}: {e}"], "warnings": [], "types": []}, indent=2))
            return 2
    elif args.target:
        target = args.target
        if target.startswith(("http://", "https://")):
            try:
                raw_content = fetch_url(target)
            except Exception as e:
                print(json.dumps({"valid": False, "errors": [f"Could not fetch URL {target}: {e}"], "warnings": [], "types": []}, indent=2))
                return 2
        elif Path(target).is_file():
            try:
                raw_content = Path(target).read_text(encoding="utf-8")
            except OSError as e:
                print(json.dumps({"valid": False, "errors": [f"Could not read file {target}: {e}"], "warnings": [], "types": []}, indent=2))
                return 2
        elif target.strip().startswith(("{", "[", "<")):
            raw_content = target
        else:
            print(json.dumps({"valid": False, "errors": [f"Invalid target: {target} (not a file, URL, or JSON string)"], "warnings": [], "types": []}, indent=2))
            return 2
    else:
        # Read from stdin if available
        if not sys.stdin.isatty():
            raw_content = sys.stdin.read()
        else:
            parser.print_help(sys.stderr)
            return 2

    if not raw_content.strip():
        print(json.dumps({"valid": False, "errors": ["Empty input content."], "warnings": [], "types": []}, indent=2))
        return 2

    result = validate_json_ld(raw_content)

    if args.text or args.format == "text":
        print(render_human(result))
    else:
        print(json.dumps(result, indent=2))

    if not result["valid"]:
        return 2
    if result["warnings"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
