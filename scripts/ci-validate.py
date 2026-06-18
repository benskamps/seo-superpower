#!/usr/bin/env python3
"""scripts/ci-validate.py — CI sanity checks for the seo-superpower plugin.

Run by .github/workflows/ci.yml (and handy locally: `python scripts/ci-validate.py`).
Stdlib only — no third-party deps, so it stays fast and dependency-free.

Checks:
  1. Skill frontmatter — every skills/<x>/SKILL.md has a YAML frontmatter block
     with both `name` and `description`.
  2. Command frontmatter — every commands/*.md has a frontmatter block with
     `description` (commands are named by filename, per the Claude Code spec).
  3. Plugin JSON — .claude-plugin/plugin.json parses and has name + version + description.
  4. Marketplace JSON — .claude-plugin/marketplace.json parses and has name + plugins[],
     each plugin entry having name + source.
  5. Reference smoke test — every path/skill referenced from a manifest or command
     actually exists on disk (no dangling references):
       - marketplace.json plugin `source` paths resolve to a real directory
         containing a plugin manifest (.claude-plugin/plugin.json), with "."
         meaning the repo root.
       - .mcp.json server entrypoints (after stripping ${CLAUDE_PLUGIN_ROOT}) exist.
       - skills/<x>/SKILL.md paths referenced from commands/*.md exist.
       - `/seo` routing targets (`→ `skill-slug``) map to a real skills/<slug>/ dir.

Exit code 0 = all green, 1 = at least one failure.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

errors: list[str] = []
checks = 0


def check(ok: bool, msg: str) -> None:
    global checks
    checks += 1
    if ok:
        print(f"  ok   {msg}")
    else:
        print(f"  FAIL {msg}")
        errors.append(msg)


def parse_frontmatter(text: str) -> dict[str, str] | None:
    """Parse a leading `---`-delimited YAML frontmatter block.

    Only the simple `key: value` shape these files use is supported (no nesting,
    no lists). Returns None if there is no frontmatter block.
    """
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    fields: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return fields
        if ":" in line and not line.startswith((" ", "\t")):
            key, _, value = line.partition(":")
            fields[key.strip()] = value.strip()
    # No closing delimiter found.
    return None


def has(fields: dict[str, str], key: str) -> bool:
    return bool(fields.get(key, "").strip())


# ---------------------------------------------------------------------------
# 1. Skill frontmatter
# ---------------------------------------------------------------------------
print("Skill frontmatter (name + description):")
skill_files = sorted((ROOT / "skills").glob("*/SKILL.md"))
check(len(skill_files) > 0, f"found {len(skill_files)} SKILL.md file(s)")
for sf in skill_files:
    rel = sf.relative_to(ROOT).as_posix()
    fm = parse_frontmatter(sf.read_text(encoding="utf-8"))
    if fm is None:
        check(False, f"{rel}: missing frontmatter block")
        continue
    check(has(fm, "name"), f"{rel}: has name")
    check(has(fm, "description"), f"{rel}: has description")

# ---------------------------------------------------------------------------
# 2. Command frontmatter
# ---------------------------------------------------------------------------
print("Command frontmatter (description):")
cmd_files = sorted((ROOT / "commands").glob("*.md"))
for cf in cmd_files:
    rel = cf.relative_to(ROOT).as_posix()
    fm = parse_frontmatter(cf.read_text(encoding="utf-8"))
    if fm is None:
        check(False, f"{rel}: missing frontmatter block")
        continue
    check(has(fm, "description"), f"{rel}: has description")

# ---------------------------------------------------------------------------
# 3. plugin.json
# ---------------------------------------------------------------------------
print("plugin.json:")
plugin_path = ROOT / ".claude-plugin" / "plugin.json"
if not plugin_path.exists():
    check(False, "plugin.json exists")
else:
    try:
        plugin = json.loads(plugin_path.read_text(encoding="utf-8"))
        check(True, "plugin.json parses as JSON")
        for key in ("name", "version", "description"):
            check(has(plugin, key) if isinstance(plugin.get(key), str) else bool(plugin.get(key)),
                  f"plugin.json has {key}")
    except json.JSONDecodeError as e:
        check(False, f"plugin.json parses as JSON ({e})")

# ---------------------------------------------------------------------------
# 4. marketplace.json
# ---------------------------------------------------------------------------
print("marketplace.json:")
market_path = ROOT / ".claude-plugin" / "marketplace.json"
if not market_path.exists():
    check(False, "marketplace.json exists")
else:
    try:
        market = json.loads(market_path.read_text(encoding="utf-8"))
        check(True, "marketplace.json parses as JSON")
        check(bool(market.get("name")), "marketplace.json has name")
        plugins = market.get("plugins")
        check(isinstance(plugins, list) and len(plugins) > 0,
              "marketplace.json has non-empty plugins[]")
        for i, entry in enumerate(plugins or []):
            check(bool(entry.get("name")), f"marketplace.json plugins[{i}] has name")
            check(bool(entry.get("source")), f"marketplace.json plugins[{i}] has source")
    except json.JSONDecodeError as e:
        check(False, f"marketplace.json parses as JSON ({e})")

# ---------------------------------------------------------------------------
# 5. Reference smoke test — nothing referenced should dangle.
# ---------------------------------------------------------------------------
print("Reference smoke test (no dangling references):")

# 5a. marketplace.json plugin `source` -> real plugin dir.
# A plugin source is a path relative to the marketplace root; "." is the repo
# root. The target must contain a plugin manifest at .claude-plugin/plugin.json.
if market_path.exists():
    try:
        market = json.loads(market_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        market = {}
    for i, entry in enumerate(market.get("plugins", []) or []):
        source = entry.get("source")
        # Only local-path sources are checkable here; skip git/url object sources.
        if isinstance(source, str):
            target = (ROOT / source).resolve()
            manifest = target / ".claude-plugin" / "plugin.json"
            check(
                target.is_dir() and manifest.exists(),
                f"marketplace.json plugins[{i}] source '{source}' "
                f"resolves to a plugin dir (has .claude-plugin/plugin.json)",
            )

# 5b. .mcp.json server entrypoints exist on disk.
# Args reference ${CLAUDE_PLUGIN_ROOT}/... for the in-repo servers; strip the
# placeholder and resolve against the repo root. Skip args that point at
# external packages (uvx/npx) — those are not files in this repo.
mcp_path = ROOT / ".mcp.json"
if mcp_path.exists():
    try:
        mcp = json.loads(mcp_path.read_text(encoding="utf-8"))
        check(True, ".mcp.json parses as JSON")
    except json.JSONDecodeError as e:
        mcp = {}
        check(False, f".mcp.json parses as JSON ({e})")
    for name, server in (mcp.get("mcpServers", {}) or {}).items():
        for arg in server.get("args", []) or []:
            if not isinstance(arg, str) or "${CLAUDE_PLUGIN_ROOT}" not in arg:
                continue
            rel = arg.replace("${CLAUDE_PLUGIN_ROOT}", "").lstrip("/\\")
            check(
                (ROOT / rel).exists(),
                f".mcp.json server '{name}' entrypoint '{rel}' exists",
            )

# 5c. skills/<x>/SKILL.md paths referenced from commands/*.md exist, and
# 5d. `/seo` routing targets (`→ `skill-slug``) map to a real skill dir.
SKILL_PATH_RE = re.compile(r"skills/[a-z0-9][a-z0-9-]*/SKILL\.md")
ROUTE_TARGET_RE = re.compile(r"→\s*`([a-z0-9][a-z0-9-]*)`")
existing_skill_dirs = {p.name for p in (ROOT / "skills").glob("*/") if p.is_dir()}
for cf in cmd_files:
    rel = cf.relative_to(ROOT).as_posix()
    text = cf.read_text(encoding="utf-8")
    for ref in sorted(set(SKILL_PATH_RE.findall(text))):
        check((ROOT / ref).exists(), f"{rel}: referenced '{ref}' exists")
    for slug in sorted(set(ROUTE_TARGET_RE.findall(text))):
        check(
            slug in existing_skill_dirs,
            f"{rel}: route target '{slug}' -> skills/{slug}/ exists",
        )

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print()
if errors:
    print(f"FAILED: {len(errors)} of {checks} checks failed.")
    sys.exit(1)
print(f"PASSED: all {checks} checks green.")
