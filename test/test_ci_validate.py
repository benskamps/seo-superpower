#!/usr/bin/env python3
"""test/test_ci_validate.py — unit tests for scripts/ci-validate.py.

Tests YAML frontmatter parsing, reference expansion, hook command extraction,
and end-to-end repository validation.

Pure Python stdlib (unittest, ast, subprocess).
Discovered by: python -m unittest discover -s test
"""
from __future__ import annotations

import ast
import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CI_VALIDATE_PATH = REPO_ROOT / "scripts" / "ci-validate.py"

# Safely extract pure functions and constants from ci-validate.py without triggering top-level checks
tree = ast.parse(CI_VALIDATE_PATH.read_text(encoding="utf-8"))
needed_nodes = [
    n
    for n in tree.body
    if isinstance(n, (ast.Import, ast.ImportFrom))
    or (
        isinstance(n, ast.Assign)
        and any(
            getattr(t, "id", "")
            in ("IN_REPO_ROOTS", "BRACE_REF_RE", "PLAIN_REF_RE", "PLACEHOLDER_RE", "LOCAL_SCRIPT_RE")
            for t in n.targets
        )
    )
    or isinstance(n, ast.FunctionDef)
]
module_ast = ast.Module(body=needed_nodes, type_ignores=[])
ci_ns: dict = {}
exec(compile(module_ast, filename=str(CI_VALIDATE_PATH), mode="exec"), ci_ns)

parse_frontmatter = ci_ns["parse_frontmatter"]
has = ci_ns["has"]
expand_refs = ci_ns["expand_refs"]
hook_script_target = ci_ns["hook_script_target"]
collect_hook_commands = ci_ns["collect_hook_commands"]


class TestCiValidate(unittest.TestCase):
    def test_parse_frontmatter_valid(self):
        text = """---
name: my-skill
description: A helpful description for SEO.
other_key: some value
---

# Skill Body
Content goes here.
"""
        fm = parse_frontmatter(text)
        self.assertIsNotNone(fm)
        self.assertEqual(fm["name"], "my-skill")
        self.assertEqual(fm["description"], "A helpful description for SEO.")
        self.assertEqual(fm["other_key"], "some value")

    def test_parse_frontmatter_missing_delimiter(self):
        # Missing closing delimiter
        text_no_closing = """---
name: incomplete
description: No ending dashes
"""
        self.assertIsNone(parse_frontmatter(text_no_closing))

        # Missing opening delimiter
        text_no_opening = """name: no-start
description: Missing leading delimiter
---
"""
        self.assertIsNone(parse_frontmatter(text_no_opening))

    def test_parse_frontmatter_colons_in_values(self):
        text = """---
name: test-skill
description: Use when doing x: y, or url: https://example.com/test
timestamp: 2026-09-04T00:00:00Z
---
"""
        fm = parse_frontmatter(text)
        self.assertIsNotNone(fm)
        self.assertEqual(fm["name"], "test-skill")
        self.assertEqual(fm["description"], "Use when doing x: y, or url: https://example.com/test")
        self.assertEqual(fm["timestamp"], "2026-09-04T00:00:00Z")

    def test_has_utility(self):
        fields = {
            "name": "seo-superpower",
            "empty": "",
            "whitespace": "   ",
        }
        self.assertTrue(has(fields, "name"))
        self.assertFalse(has(fields, "empty"))
        self.assertFalse(has(fields, "whitespace"))
        self.assertFalse(has(fields, "nonexistent"))

    def test_hook_script_target(self):
        # Shell command with placeholder
        cmd1 = "node ${CLAUDE_PLUGIN_ROOT}/scripts/decay-check-nudge.js"
        target1 = hook_script_target(cmd1)
        self.assertEqual(target1, "scripts/decay-check-nudge.js")

        # Command with no local script (external tool only)
        cmd2 = "git status"
        target2 = hook_script_target(cmd2)
        self.assertIsNone(target2)

        # Python command
        cmd3 = "python3 ${CLAUDE_PROJECT_DIR}/scripts/ci-validate.py"
        target3 = hook_script_target(cmd3)
        self.assertEqual(target3, "scripts/ci-validate.py")

    def test_collect_hook_commands(self):
        hook_cfg = {
            "hooks": {
                "SessionStart": [
                    {
                        "type": "command",
                        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/decay-check-nudge.js",
                    }
                ],
                "UserPrompt": [
                    {
                        "type": "command",
                        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/decay-check-run.js",
                    }
                ],
            }
        }
        commands = collect_hook_commands(hook_cfg)
        self.assertEqual(len(commands), 2)
        self.assertIn("node ${CLAUDE_PLUGIN_ROOT}/scripts/decay-check-nudge.js", commands)

    def test_expand_refs_plain_and_brace(self):
        markdown = """
        Use the script `scripts/baseline-check.js` to inspect baseline health.
        Check templates in `templates/{nextjs,astro,sveltekit}/robots.txt`.
        Ignore user paths like `app/robots.ts` or `public/sitemap.xml`.
        """
        refs = expand_refs(markdown)
        self.assertIn("scripts/baseline-check.js", refs)
        self.assertIn("templates/nextjs/robots.txt", refs)
        self.assertIn("templates/astro/robots.txt", refs)
        self.assertIn("templates/sveltekit/robots.txt", refs)
        self.assertNotIn("app/robots.ts", refs)

    def test_live_repo_ci_validation(self):
        res = subprocess.run(
            [sys.executable, str(CI_VALIDATE_PATH)],
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        self.assertEqual(res.returncode, 0, f"ci-validate.py failed:\n{res.stdout}\n{res.stderr}")
        self.assertIn("PASSED: all", res.stdout)


if __name__ == "__main__":
    unittest.main()
