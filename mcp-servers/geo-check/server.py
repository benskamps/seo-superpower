"""geo-check MCP server (v1)

Detects whether a target domain gets *cited* by major LLM-powered answer
engines (ChatGPT, Claude, Perplexity, optionally Gemini) when those engines
are asked target prompts. This is the heart of "Generative Engine
Optimization" — analogous to Google rank tracking, but for the AI overviews.

Tools exposed:
  - geo_check(domain, prompts, providers): poll providers and return citation
      matrix.
  - geo_track(domain, prompts, output_path): run geo_check + write JSON
      baseline (timestamped).
  - geo_diff(domain, prompts, baseline_path): compare a fresh check against
      the saved baseline; tag prompts as gained / lost / unchanged.

Auth (env vars):
  - ANTHROPIC_API_KEY     — required for "anthropic" provider
  - OPENAI_API_KEY        — required for "openai" provider
  - PERPLEXITY_API_KEY    — required for "perplexity" provider
  - GOOGLE_API_KEY        — required for "gemini" provider (optional)

Model overrides (env vars, all optional):
  - GEO_CHECK_ANTHROPIC_MODEL    (default: claude-sonnet-4-6)
  - GEO_CHECK_OPENAI_MODEL       (default: gpt-5)
  - GEO_CHECK_PERPLEXITY_MODEL   (default: sonar)
  - GEO_CHECK_GEMINI_MODEL       (default: gemini-2.0-flash)

Standalone test:
    python server.py
(That starts the MCP server on stdio. Useful for `mcp dev` style smoke tests.)

Notes / quirks:
  * Built against the official `mcp` Python SDK using the `FastMCP` helper.
    Install with: pip install -r requirements.txt
  * No retries — these calls are cheap; fail fast and surface the error in
    the result payload so the caller can decide what to do.
  * Citation detection is intentionally simple: a case-insensitive regex for
    `(www\\.)?<domain>` anywhere in the response body. For Perplexity we ALSO
    walk the structured `citations` array because the body sometimes uses
    numbered footnotes that don't include the bare domain.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Constants & config
# ---------------------------------------------------------------------------

DEFAULT_PROVIDERS = ["anthropic", "openai", "perplexity"]
ALL_PROVIDERS = ["anthropic", "openai", "perplexity", "gemini"]

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
# Gemini's REST shape: model embedded in path, key as ?key= query param.
GEMINI_URL_TMPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

DEFAULT_MAX_TOKENS = 1024
DEFAULT_TIMEOUT_SECONDS = 30.0
SNIPPET_RADIUS = 80  # chars on each side of a match

# Rough cost estimates (USD per 1M tokens) — used for stderr cost logging.
# These are ballpark figures; users should check the provider pricing page.
COST_TABLE: dict[str, dict[str, float]] = {
    "anthropic": {"input": 3.0, "output": 15.0},   # Claude Sonnet ballpark
    "openai":    {"input": 2.5, "output": 10.0},   # GPT-5/4o ballpark
    "perplexity": {"input": 1.0, "output": 1.0},   # Sonar ballpark
    "gemini":    {"input": 0.15, "output": 0.6},   # Gemini Flash ballpark
}


def _model_for(provider: str) -> str:
    """Resolve model name from env override or sensible default."""
    return {
        "anthropic":  os.getenv("GEO_CHECK_ANTHROPIC_MODEL",  "claude-sonnet-4-6"),
        "openai":     os.getenv("GEO_CHECK_OPENAI_MODEL",     "gpt-5"),
        "perplexity": os.getenv("GEO_CHECK_PERPLEXITY_MODEL", "sonar"),
        "gemini":     os.getenv("GEO_CHECK_GEMINI_MODEL",     "gemini-2.0-flash"),
    }[provider]


def _normalize_domain(domain: str) -> str:
    """Strip protocol and trailing slashes so substring/regex match is clean."""
    d = domain.strip()
    d = re.sub(r"^https?://", "", d, flags=re.IGNORECASE)
    d = d.rstrip("/")
    return d


def _citation_match(domain: str, body: str) -> tuple[bool, str]:
    """Return (cited, snippet). Snippet is text around the match, or first
    100 chars of body if not cited."""
    if not body:
        return False, ""
    pattern = re.compile(rf"(?:www\.)?{re.escape(domain)}", re.IGNORECASE)
    m = pattern.search(body)
    if m:
        start = max(0, m.start() - SNIPPET_RADIUS)
        end = min(len(body), m.end() + SNIPPET_RADIUS)
        return True, body[start:end].strip()
    return False, body[:100].strip()


def _log_cost(provider: str, usage: dict[str, Any] | None) -> None:
    """Estimate per-call cost from usage tokens and print to stderr."""
    if not usage:
        return
    rates = COST_TABLE.get(provider)
    if not rates:
        return
    in_tok = (
        usage.get("input_tokens")
        or usage.get("prompt_tokens")
        or 0
    )
    out_tok = (
        usage.get("output_tokens")
        or usage.get("completion_tokens")
        or 0
    )
    cost = (in_tok / 1_000_000) * rates["input"] + (out_tok / 1_000_000) * rates["output"]
    print(
        f"[geo-check][cost] {provider}: in={in_tok} out={out_tok} ~${cost:.5f}",
        file=sys.stderr,
    )


# ---------------------------------------------------------------------------
# Provider clients
# ---------------------------------------------------------------------------

async def _call_anthropic(client: httpx.AsyncClient, prompt: str) -> dict[str, Any]:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return {"skipped": True, "reason": "no key"}
    model = _model_for("anthropic")
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": DEFAULT_MAX_TOKENS,
        "messages": [{"role": "user", "content": prompt}],
    }
    r = await client.post(ANTHROPIC_URL, headers=headers, json=payload,
                          timeout=DEFAULT_TIMEOUT_SECONDS)
    r.raise_for_status()
    data = r.json()
    text_parts = [
        block.get("text", "")
        for block in data.get("content", [])
        if block.get("type") == "text"
    ]
    body = "\n".join(text_parts)
    _log_cost("anthropic", data.get("usage"))
    return {"body": body, "citations": [], "raw_meta": {"model": data.get("model")}}


async def _call_openai(client: httpx.AsyncClient, prompt: str) -> dict[str, Any]:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return {"skipped": True, "reason": "no key"}
    model = _model_for("openai")
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": DEFAULT_MAX_TOKENS,
        "messages": [{"role": "user", "content": prompt}],
    }
    r = await client.post(OPENAI_URL, headers=headers, json=payload,
                          timeout=DEFAULT_TIMEOUT_SECONDS)
    # If the configured model doesn't exist (e.g. gpt-5 not yet GA in this
    # account), fall back to gpt-4o once. This keeps a fresh install useful
    # without forcing every user to set the env var.
    if r.status_code in (400, 404) and model != "gpt-4o":
        payload["model"] = "gpt-4o"
        r = await client.post(OPENAI_URL, headers=headers, json=payload,
                              timeout=DEFAULT_TIMEOUT_SECONDS)
    r.raise_for_status()
    data = r.json()
    body = data["choices"][0]["message"].get("content", "") or ""
    _log_cost("openai", data.get("usage"))
    return {"body": body, "citations": [], "raw_meta": {"model": data.get("model")}}


async def _call_perplexity(client: httpx.AsyncClient, prompt: str) -> dict[str, Any]:
    key = os.getenv("PERPLEXITY_API_KEY")
    if not key:
        return {"skipped": True, "reason": "no key"}
    model = _model_for("perplexity")
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }
    r = await client.post(PERPLEXITY_URL, headers=headers, json=payload,
                          timeout=DEFAULT_TIMEOUT_SECONDS)
    r.raise_for_status()
    data = r.json()
    body = ""
    if data.get("choices"):
        body = data["choices"][0]["message"].get("content", "") or ""
    # Perplexity returns either a flat `citations: [url, ...]` array (Sonar)
    # or a richer `search_results: [{url, title, ...}]` (Sonar Pro). Handle
    # both. We feed these URLs into the citation-detection step below.
    citations: list[str] = []
    if isinstance(data.get("citations"), list):
        citations.extend(str(x) for x in data["citations"] if x)
    if isinstance(data.get("search_results"), list):
        for sr in data["search_results"]:
            url = sr.get("url") if isinstance(sr, dict) else None
            if url:
                citations.append(str(url))
    _log_cost("perplexity", data.get("usage"))
    return {"body": body, "citations": citations,
            "raw_meta": {"model": data.get("model")}}


async def _call_gemini(client: httpx.AsyncClient, prompt: str) -> dict[str, Any]:
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        return {"skipped": True, "reason": "no key"}
    model = _model_for("gemini")
    url = GEMINI_URL_TMPL.format(model=model) + f"?key={key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": DEFAULT_MAX_TOKENS},
    }
    r = await client.post(url, headers=headers, json=payload,
                          timeout=DEFAULT_TIMEOUT_SECONDS)
    r.raise_for_status()
    data = r.json()
    body = ""
    try:
        parts = data["candidates"][0]["content"]["parts"]
        body = "\n".join(p.get("text", "") for p in parts)
    except (KeyError, IndexError):
        body = ""
    # Gemini exposes token counts under usageMetadata with different keys.
    usage_meta = data.get("usageMetadata") or {}
    usage = {
        "prompt_tokens": usage_meta.get("promptTokenCount", 0),
        "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
    }
    _log_cost("gemini", usage)
    return {"body": body, "citations": [], "raw_meta": {"model": model}}


PROVIDER_DISPATCH = {
    "anthropic": _call_anthropic,
    "openai": _call_openai,
    "perplexity": _call_perplexity,
    "gemini": _call_gemini,
}


# ---------------------------------------------------------------------------
# Core citation logic
# ---------------------------------------------------------------------------

async def _check_one(
    client: httpx.AsyncClient, provider: str, prompt: str, domain: str,
) -> dict[str, Any]:
    """Run a single (provider, prompt) call and shape the result."""
    fn = PROVIDER_DISPATCH.get(provider)
    if fn is None:
        return {
            "cited": False,
            "snippet": f"[skipped: unknown provider '{provider}']",
            "skipped": True,
        }
    try:
        out = await fn(client, prompt)
    except httpx.HTTPStatusError as e:
        snippet = f"[error: HTTP {e.response.status_code}] {e.response.text[:200]}"
        return {"cited": False, "snippet": snippet, "error": True}
    except Exception as e:  # noqa: BLE001 — surface anything as a result
        return {"cited": False, "snippet": f"[error: {type(e).__name__}: {e}]",
                "error": True}

    if out.get("skipped"):
        return {
            "cited": False,
            "snippet": "[skipped: no key]" if out.get("reason") == "no key"
                       else f"[skipped: {out.get('reason')}]",
            "skipped": True,
        }

    body = out.get("body", "") or ""
    cited, snippet = _citation_match(domain, body)

    # Perplexity special case: also check the structured citations array.
    if not cited and out.get("citations"):
        joined = "\n".join(out["citations"])
        cited_in_cites, snip_cites = _citation_match(domain, joined)
        if cited_in_cites:
            cited = True
            snippet = f"[from citations array] {snip_cites}"

    return {
        "cited": cited,
        "snippet": snippet,
        "model": out.get("raw_meta", {}).get("model"),
    }


async def _geo_check_impl(
    domain: str, prompts: list[str], providers: list[str] | None,
) -> dict[str, dict[str, dict[str, Any]]]:
    """Shared implementation used by all three exposed tools."""
    if not providers:
        providers = list(DEFAULT_PROVIDERS)
    domain = _normalize_domain(domain)

    started = time.monotonic()
    print(
        f"[geo-check] domain={domain} prompts={len(prompts)} "
        f"providers={providers}",
        file=sys.stderr,
    )

    async with httpx.AsyncClient() as client:
        tasks: list[asyncio.Task] = []
        keys: list[tuple[str, str]] = []  # (provider, prompt) parallel to tasks
        for provider in providers:
            for prompt in prompts:
                keys.append((provider, prompt))
                tasks.append(asyncio.create_task(
                    _check_one(client, provider, prompt, domain)
                ))
        results = await asyncio.gather(*tasks, return_exceptions=False)

    matrix: dict[str, dict[str, dict[str, Any]]] = {p: {} for p in providers}
    for (provider, prompt), result in zip(keys, results):
        matrix[provider][prompt] = result

    elapsed = time.monotonic() - started
    print(f"[geo-check] done in {elapsed:.2f}s", file=sys.stderr)
    return matrix


def _summary_line(matrix: dict[str, dict[str, dict[str, Any]]]) -> str:
    parts = []
    label = {"anthropic": "Claude", "openai": "ChatGPT",
             "perplexity": "Perplexity", "gemini": "Gemini"}
    for provider, prompts in matrix.items():
        hits = sum(1 for r in prompts.values() if r.get("cited"))
        parts.append(f"{label.get(provider, provider)}: {hits}/{len(prompts)}")
    return ", ".join(parts)


# ---------------------------------------------------------------------------
# MCP server + tool definitions
# ---------------------------------------------------------------------------

mcp = FastMCP("geo-check")


@mcp.tool()
async def geo_check(
    domain: str,
    prompts: list[str],
    providers: list[str] | None = None,
) -> dict[str, Any]:
    """Poll LLM providers with `prompts` and check if `domain` is cited.

    Args:
        domain: Bare domain (e.g. "example.com"); protocol/trailing slash OK.
        prompts: List of natural-language prompts to send to each provider.
        providers: Subset of ["anthropic","openai","perplexity","gemini"].
            Defaults to all three of the first set.

    Returns:
        {
          "domain": "...",
          "providers": [...],
          "results": {provider: {prompt: {cited, snippet, ...}}},
          "summary": "ChatGPT: 2/3, Claude: 1/3, ..."
        }
    """
    matrix = await _geo_check_impl(domain, prompts, providers)
    return {
        "domain": _normalize_domain(domain),
        "providers": providers or DEFAULT_PROVIDERS,
        "results": matrix,
        "summary": _summary_line(matrix),
    }


@mcp.tool()
async def geo_track(
    domain: str,
    prompts: list[str],
    output_path: str = ".claude/seo/geo-baseline.json",
    providers: list[str] | None = None,
) -> dict[str, Any]:
    """Run a geo_check and persist the results to disk as a baseline.

    Args:
        domain: Bare domain.
        prompts: Prompts to evaluate.
        output_path: Where to write JSON. Created if missing. Default
            `.claude/seo/geo-baseline.json` (relative to cwd).
        providers: Subset of providers; defaults to anthropic/openai/perplexity.

    Returns:
        {"path": "...", "timestamp": "...", "summary": "...", "hits": {...}}
    """
    matrix = await _geo_check_impl(domain, prompts, providers)
    timestamp = datetime.now(timezone.utc).isoformat()
    payload = {
        "schema_version": 1,
        "domain": _normalize_domain(domain),
        "timestamp": timestamp,
        "providers": providers or DEFAULT_PROVIDERS,
        "prompts": prompts,
        "results": matrix,
    }
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    hits = {
        provider: sum(1 for r in by_prompt.values() if r.get("cited"))
        for provider, by_prompt in matrix.items()
    }
    return {
        "path": str(out.resolve()),
        "timestamp": timestamp,
        "summary": _summary_line(matrix),
        "hits": hits,
    }


@mcp.tool()
async def geo_diff(
    domain: str,
    prompts: list[str],
    baseline_path: str = ".claude/seo/geo-baseline.json",
    providers: list[str] | None = None,
) -> dict[str, Any]:
    """Compare a fresh geo_check against a saved baseline.

    Each prompt is tagged per provider as one of:
      - gained_citation: was 0 citations, now 1+
      - lost_citation:   was 1+ citations, now 0
      - unchanged:       no change in cited boolean

    Args:
        domain: Bare domain.
        prompts: Prompts to evaluate (should match the baseline's set).
        baseline_path: Path to the JSON written by geo_track.
        providers: Subset of providers; defaults to anthropic/openai/perplexity.

    Returns:
        {
          "domain": "...",
          "summary": "ChatGPT: +2, Claude: -1, Perplexity: 0",
          "gained_citation": [...],
          "lost_citation": [...],
          "unchanged": [...],
          "by_provider": {provider: {gained: [...], lost: [...], unchanged: [...]}}
        }
    """
    base_path = Path(baseline_path)
    if not base_path.exists():
        return {
            "error": f"baseline not found at {base_path.resolve()}",
            "hint": "run geo_track first to create a baseline",
        }
    baseline = json.loads(base_path.read_text(encoding="utf-8"))
    base_results = baseline.get("results", {})

    fresh = await _geo_check_impl(domain, prompts, providers)

    gained: list[str] = []
    lost: list[str] = []
    unchanged: list[str] = []
    by_provider: dict[str, dict[str, list[str]]] = {}
    deltas: dict[str, int] = {}

    for provider, prompt_map in fresh.items():
        bp_gained: list[str] = []
        bp_lost: list[str] = []
        bp_unchanged: list[str] = []
        delta = 0
        base_provider = base_results.get(provider, {})
        for prompt, result in prompt_map.items():
            now_cited = bool(result.get("cited"))
            was_cited = bool(base_provider.get(prompt, {}).get("cited"))
            if now_cited and not was_cited:
                bp_gained.append(prompt)
                gained.append(f"[{provider}] {prompt}")
                delta += 1
            elif was_cited and not now_cited:
                bp_lost.append(prompt)
                lost.append(f"[{provider}] {prompt}")
                delta -= 1
            else:
                bp_unchanged.append(prompt)
                unchanged.append(f"[{provider}] {prompt}")
        by_provider[provider] = {
            "gained": bp_gained, "lost": bp_lost, "unchanged": bp_unchanged,
        }
        deltas[provider] = delta

    label = {"anthropic": "Claude", "openai": "ChatGPT",
             "perplexity": "Perplexity", "gemini": "Gemini"}
    summary = ", ".join(
        f"{label.get(p, p)}: {'+' if d > 0 else ''}{d}"
        for p, d in deltas.items()
    )

    return {
        "domain": _normalize_domain(domain),
        "baseline_timestamp": baseline.get("timestamp"),
        "summary": summary,
        "gained_citation": gained,
        "lost_citation": lost,
        "unchanged": unchanged,
        "by_provider": by_provider,
        "fresh_results": fresh,
    }


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    """Run the MCP server over stdio (the transport Claude Code uses)."""
    mcp.run()


if __name__ == "__main__":
    main()
