#!/usr/bin/env python3
"""psi-quick.py — quick PageSpeed Insights CWV fetch.

No MCP, no OAuth. Reads PSI_API_KEY from env (or ~/.config/seo-superpower/.env,
with ~/.openclaw/.env as a silent fallback), hits the
public PageSpeed Insights v5 API, prints LCP / INP / CLS / TTFB. Prefers
CrUX field data (loadingExperience) when present; falls back to lab data
(lighthouseResult.audits) and flags which it used.

Usage:
    python scripts/psi-quick.py <url> [--strategy mobile|desktop] [--json]

Exit codes:
    0 — success (data printed)
    1 — missing PSI_API_KEY
    2 — HTTP / API error
    3 — URL missing or invalid args
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"


def load_api_key() -> str | None:
    """Look up PSI_API_KEY in env, then the .env files (default path first)."""
    key = os.environ.get("PSI_API_KEY")
    if key:
        return key.strip()

    # Documented default first, then ~/.openclaw/.env as a silent fallback.
    env_paths = [
        Path.home() / ".config" / "seo-superpower" / ".env",
        Path.home() / ".openclaw" / ".env",
    ]
    for env_path in env_paths:
        if not env_path.is_file():
            continue
        try:
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("PSI_API_KEY"):
                    _, _, val = line.partition("=")
                    val = val.strip().strip("'\"")
                    if val:
                        return val
        except OSError:
            pass
    return None


def fetch_psi(url: str, strategy: str, api_key: str) -> dict[str, Any]:
    params = [
        ("url", url),
        ("key", api_key),
        ("strategy", strategy),
        ("category", "PERFORMANCE"),
        ("category", "SEO"),
    ]
    full = f"{PSI_ENDPOINT}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(full, headers={"User-Agent": "seo-superpower/psi-quick"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def parse_field_data(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Return CrUX field metrics if loadingExperience has them, else None."""
    exp = payload.get("loadingExperience") or {}
    metrics = exp.get("metrics") or {}
    if not metrics:
        return None

    def pct(name: str, divisor: float = 1.0) -> float | None:
        m = metrics.get(name)
        if not m or "percentile" not in m:
            return None
        return round(m["percentile"] / divisor, 3)

    return {
        "source": "field",  # CrUX field data, p75
        "lcp_s": pct("LARGEST_CONTENTFUL_PAINT_MS", 1000.0),
        "inp_ms": pct("INTERACTION_TO_NEXT_PAINT") or pct("EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT"),
        "cls": pct("CUMULATIVE_LAYOUT_SHIFT_SCORE", 100.0),
        "ttfb_ms": pct("EXPERIMENTAL_TIME_TO_FIRST_BYTE") or pct("FIRST_CONTENTFUL_PAINT_MS"),
        "overall_category": exp.get("overall_category"),
    }


def parse_lab_data(payload: dict[str, Any]) -> dict[str, Any]:
    """Lab fallback from lighthouseResult.audits."""
    audits = (payload.get("lighthouseResult") or {}).get("audits") or {}

    def num(audit_id: str) -> float | None:
        a = audits.get(audit_id) or {}
        val = a.get("numericValue")
        if val is None:
            return None
        return round(val, 3)

    return {
        "source": "lab",  # Lighthouse lab run, single sample
        "lcp_s": (num("largest-contentful-paint") or 0) / 1000.0 if audits.get("largest-contentful-paint") else None,
        "inp_ms": num("interaction-to-next-paint") or num("total-blocking-time"),
        "cls": num("cumulative-layout-shift"),
        "ttfb_ms": num("server-response-time"),
    }


def extract_metrics(payload: dict[str, Any]) -> dict[str, Any]:
    field = parse_field_data(payload)
    if field is not None:
        return field
    return parse_lab_data(payload)


def render_human(url: str, strategy: str, metrics: dict[str, Any]) -> str:
    src = metrics.get("source", "?")
    src_label = "CrUX field data (p75)" if src == "field" else "Lighthouse lab (single sample)"
    lines = [
        f"PageSpeed Insights — {url} [{strategy}]",
        f"Source: {src_label}",
    ]
    if metrics.get("overall_category"):
        lines.append(f"Overall: {metrics['overall_category']}")

    def fmt(label: str, val: Any, unit: str) -> str:
        if val is None:
            return f"  {label:<6} —"
        return f"  {label:<6} {val} {unit}"

    lines.extend(
        [
            fmt("LCP", metrics.get("lcp_s"), "s"),
            fmt("INP", metrics.get("inp_ms"), "ms"),
            fmt("CLS", metrics.get("cls"), ""),
            fmt("TTFB", metrics.get("ttfb_ms"), "ms"),
        ]
    )
    if src == "lab":
        lines.append("  (field data not available — site may be new or low-traffic)")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="psi-quick.py",
        description="Quick PageSpeed Insights fetch — no MCP, no OAuth.",
    )
    parser.add_argument("url", nargs="?", help="Target URL (must include scheme).")
    parser.add_argument(
        "--strategy",
        choices=["mobile", "desktop"],
        default="mobile",
        help="PSI strategy (default: mobile).",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output.")
    args = parser.parse_args(argv)

    if not args.url:
        parser.print_usage(sys.stderr)
        print("error: url is required", file=sys.stderr)
        return 3

    api_key = load_api_key()
    if not api_key:
        print(
            "error: PSI_API_KEY not set (env or ~/.config/seo-superpower/.env). "
            "Get one free at https://developers.google.com/speed/docs/insights/v5/get-started",
            file=sys.stderr,
        )
        return 1

    try:
        payload = fetch_psi(args.url, args.strategy, api_key)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:500]
        print(f"error: HTTP {e.code} from PSI — {body}", file=sys.stderr)
        return 2
    except urllib.error.URLError as e:
        print(f"error: network error — {e.reason}", file=sys.stderr)
        return 2

    metrics = extract_metrics(payload)

    if args.json:
        out = {
            "url": args.url,
            "strategy": args.strategy,
            **metrics,
        }
        print(json.dumps(out, indent=2))
    else:
        print(render_human(args.url, args.strategy, metrics))
    return 0


if __name__ == "__main__":
    sys.exit(main())
