#!/usr/bin/env python3
"""scripts/check.py — cross-platform readiness checker for SEO Superpower.

Runs on Windows, macOS, and Linux without bash or external dependencies.
Verifies environment prerequisites:
  1. Configuration .env file (~/.config/seo-superpower/.env or ~/.openclaw/.env)
  2. Google Search Console client secrets file
  3. PageSpeed Insights API key (PAGESPEED_API_KEY or PSI_API_KEY)
  4. Toolchain availability: uvx, node (>= 18/20), python3 (>= 3.10), git
  5. Optional PSI API connectivity check

Usage:
    python scripts/check.py [--json] [--no-color] [--no-network] [--verbose]

Exit codes:
    0 — All required checks passed (system ready)
    1 — One or more checks failed (setup required)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
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


# Color codes
GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[1;33m"
NC = "\033[0m"


def load_env_vars() -> tuple[Path | None, dict[str, str]]:
    """Locate and parse configuration .env file."""
    env_vars: dict[str, str] = {}
    env_paths = [
        Path.home() / ".config" / "seo-superpower" / ".env",
        Path.home() / ".openclaw" / ".env",
    ]
    chosen_path: Path | None = None
    for p in env_paths:
        if p.is_file():
            chosen_path = p
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, _, v = line.partition("=")
                    env_vars[k.strip()] = v.strip().strip("'\"")
            except OSError:
                pass
            break

    # Environment variables take precedence
    merged = {**env_vars, **os.environ}
    return chosen_path, merged


def get_command_output(cmd: list[str]) -> str | None:
    """Execute command safely and return stripped stdout, or None on failure."""
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if res.returncode == 0:
            return res.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return None


def run_checks(skip_network: bool = False) -> dict[str, Any]:
    """Execute all readiness checks and return structured results."""
    env_path, env = load_env_vars()
    checks: list[dict[str, Any]] = []

    # 1. Env file
    if env_path:
        checks.append({
            "name": "env_file",
            "status": "pass",
            "message": f"Env file: {env_path}",
        })
    else:
        checks.append({
            "name": "env_file",
            "status": "fail",
            "message": "No env file found at ~/.config/seo-superpower/.env (or ~/.openclaw/.env). Run /seo-setup.",
        })

    # 2. GSC client secrets
    gsc_file = env.get("GSC_OAUTH_CLIENT_SECRETS_FILE", "")
    if gsc_file and Path(gsc_file).is_file():
        checks.append({
            "name": "gsc_secrets",
            "status": "pass",
            "message": f"GSC client secrets file: {gsc_file}",
        })
    else:
        checks.append({
            "name": "gsc_secrets",
            "status": "fail",
            "message": "GSC_OAUTH_CLIENT_SECRETS_FILE not set or file missing.",
        })

    # 3. PSI key
    psi_key = env.get("PAGESPEED_API_KEY") or env.get("PSI_API_KEY", "")
    if psi_key:
        masked = psi_key[:8] + "..." if len(psi_key) > 8 else psi_key
        checks.append({
            "name": "psi_key",
            "status": "pass",
            "message": f"PAGESPEED_API_KEY / PSI_API_KEY set ({masked})",
        })
    else:
        checks.append({
            "name": "psi_key",
            "status": "fail",
            "message": "PAGESPEED_API_KEY not set in env file or environment.",
        })

    # 4. uvx
    uvx_path = shutil.which("uvx")
    if uvx_path:
        ver = get_command_output(["uvx", "--version"]) or "available"
        checks.append({
            "name": "uvx",
            "status": "pass",
            "message": f"uvx available ({ver.splitlines()[0]})",
        })
    else:
        checks.append({
            "name": "uvx",
            "status": "fail",
            "message": "uvx not on PATH. Install: https://docs.astral.sh/uv/",
        })

    # 5. Node.js
    node_path = shutil.which("node")
    if node_path:
        ver_str = get_command_output(["node", "--version"]) or ""
        m = re.search(r"v?(\d+)", ver_str)
        major = int(m.group(1)) if m else 0
        if major >= 18:
            checks.append({
                "name": "node",
                "status": "pass",
                "message": f"node {ver_str}",
            })
        else:
            checks.append({
                "name": "node",
                "status": "fail",
                "message": f"node version {ver_str} < 18. Upgrade required.",
            })
    else:
        checks.append({
            "name": "node",
            "status": "fail",
            "message": "node not on PATH. Install Node 18+ (Node 20+ recommended).",
        })

    # 6. Python
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    if sys.version_info >= (3, 10):
        checks.append({
            "name": "python",
            "status": "pass",
            "message": f"python {py_ver}",
        })
    else:
        checks.append({
            "name": "python",
            "status": "fail",
            "message": f"python version {py_ver} < 3.10. Python 3.10+ required.",
        })

    # 7. Git
    git_path = shutil.which("git")
    if git_path:
        git_ver = get_command_output(["git", "--version"]) or "git available"
        checks.append({
            "name": "git",
            "status": "pass",
            "message": f"{git_ver}",
        })
    else:
        checks.append({
            "name": "git",
            "status": "warn",
            "message": "git not on PATH (recommended for citation commit attribution).",
        })

    # 8. PSI API connectivity test (optional)
    if psi_key and not skip_network:
        endpoint = (
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?"
            + urllib.parse.urlencode({"url": "https://example.com", "key": psi_key})
        )
        req = urllib.request.Request(endpoint, headers={"User-Agent": "seo-superpower-check/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status == 200:
                    checks.append({
                        "name": "psi_connectivity",
                        "status": "pass",
                        "message": "PSI API key verified (HTTP 200 from Google API)",
                    })
                else:
                    checks.append({
                        "name": "psi_connectivity",
                        "status": "warn",
                        "message": f"PSI API returned HTTP {resp.status}",
                    })
        except urllib.error.HTTPError as e:
            if e.code == 403:
                checks.append({
                    "name": "psi_connectivity",
                    "status": "fail",
                    "message": "PSI API returned 403 — key invalid or PageSpeed API not enabled.",
                })
            elif e.code == 429:
                checks.append({
                    "name": "psi_connectivity",
                    "status": "warn",
                    "message": "PSI API returned 429 (quota limit reached for today).",
                })
            else:
                checks.append({
                    "name": "psi_connectivity",
                    "status": "warn",
                    "message": f"PSI API returned HTTP {e.code}",
                })
        except Exception as e:
            checks.append({
                "name": "psi_connectivity",
                "status": "warn",
                "message": f"Could not reach PSI API: {e}",
            })

    pass_count = sum(1 for c in checks if c["status"] == "pass")
    fail_count = sum(1 for c in checks if c["status"] == "fail")
    warn_count = sum(1 for c in checks if c["status"] == "warn")

    return {
        "ready": fail_count == 0,
        "passCount": pass_count,
        "failCount": fail_count,
        "warnCount": warn_count,
        "checks": checks,
    }


def render_terminal(results: dict[str, Any], use_color: bool = True) -> str:
    """Render colored or plain-text report for terminal."""
    supports_unicode = _can_encode("✅") and _can_encode("❌") and _can_encode("⚠️")
    use_unicode = supports_unicode and use_color
    lines = [
        "=== SEO Superpower Readiness Check ===",
        "",
    ]
    for c in results["checks"]:
        st = c["status"]
        if st == "pass":
            if use_unicode:
                prefix = f"{GREEN}✅{NC}"
            elif use_color:
                prefix = f"{GREEN}[OK]{NC}"
            else:
                prefix = "[OK]"
        elif st == "fail":
            if use_unicode:
                prefix = f"{RED}❌{NC}"
            elif use_color:
                prefix = f"{RED}[FAIL]{NC}"
            else:
                prefix = "[FAIL]"
        else:
            if use_unicode:
                prefix = f"{YELLOW}⚠️ {NC}"
            elif use_color:
                prefix = f"{YELLOW}[WARN]{NC}"
            else:
                prefix = "[WARN]"
        lines.append(f"{prefix} {c['message']}")

    lines.append("")
    lines.append("=== Summary ===")
    if use_color:
        lines.append(f"{GREEN}Pass:{NC} {results['passCount']}   {RED}Fail:{NC} {results['failCount']}   {YELLOW}Warn:{NC} {results['warnCount']}")
    else:
        lines.append(f"Pass: {results['passCount']}   Fail: {results['failCount']}   Warn: {results['warnCount']}")
    lines.append("")

    if results["failCount"] > 0:
        marker = "❌" if use_unicode else "[FAIL]"
        lines.append(f"Fix the items marked {marker} above, then re-run this script.")
        lines.append("Or run /seo-setup in Claude Code for guided credential configuration.")
    else:
        rocket = "🚀 " if use_unicode and _can_encode("🚀") else ""
        lines.append(f"{rocket}Ready. Type /seo in any project to start.")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="check.py",
        description="Cross-platform readiness check for SEO Superpower.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output.")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI color output.")
    parser.add_argument("--no-network", "--skip-network", action="store_true", help="Skip remote API network pings.")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output.")

    args = parser.parse_args(argv)

    is_tty = hasattr(sys.stdout, "isatty") and sys.stdout.isatty()
    use_color = (
        not args.no_color
        and is_tty
        and (
            os.name != "nt"
            or "WT_SESSION" in os.environ
            or "TERM" in os.environ
            or "TERM_PROGRAM" in os.environ
            or "ANSICON" in os.environ
            or (hasattr(sys, "getwindowsversion") and sys.getwindowsversion().major >= 10)
        )
    )

    results = run_checks(skip_network=args.no_network)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(render_terminal(results, use_color=use_color))

    return 0 if results["ready"] else 1


if __name__ == "__main__":
    sys.exit(main())
