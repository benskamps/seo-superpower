#!/usr/bin/env python3
"""test/test_check.py — unit tests for scripts/check.py.

Pure Python stdlib (unittest, subprocess, json, tempfile).
Discovered by: python -m unittest discover -s test
"""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "scripts" / "check.py"

spec = importlib.util.spec_from_file_location("check_mod", SCRIPT_PATH)
check_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check_mod)


class TestCheckModule(unittest.TestCase):
    def test_load_env_vars_empty(self):
        env_path, merged = check_mod.load_env_vars()
        self.assertIsInstance(merged, dict)
        # Environment variables like PATH should be present
        self.assertIn("PATH", merged)

    def test_get_command_output_valid(self):
        out = check_mod.get_command_output([sys.executable, "--version"])
        self.assertIsNotNone(out)
        self.assertIn("Python", out)

    def test_get_command_output_invalid(self):
        out = check_mod.get_command_output(["nonexistent-command-1234567890"])
        self.assertIsNone(out)

    def test_run_checks_structure(self):
        res = check_mod.run_checks(skip_network=True)
        self.assertIn("ready", res)
        self.assertIn("passCount", res)
        self.assertIn("failCount", res)
        self.assertIn("warnCount", res)
        self.assertIn("checks", res)
        self.assertIsInstance(res["checks"], list)

        check_names = {c["name"] for c in res["checks"]}
        self.assertIn("python", check_names)
        self.assertIn("node", check_names)
        self.assertIn("git", check_names)
        self.assertIn("uvx", check_names)
        self.assertIn("env_file", check_names)
        self.assertIn("gsc_secrets", check_names)
        self.assertIn("psi_key", check_names)
        # skip_network=True should not attempt psi_connectivity
        self.assertNotIn("psi_connectivity", check_names)

        # Python running this test is >= 3.10
        py_check = next(c for c in res["checks"] if c["name"] == "python")
        self.assertEqual(py_check["status"], "pass")

    def test_render_terminal_color_vs_no_color(self):
        mock_results = {
            "ready": False,
            "passCount": 1,
            "failCount": 1,
            "warnCount": 1,
            "checks": [
                {"name": "test_pass", "status": "pass", "message": "All good"},
                {"name": "test_fail", "status": "fail", "message": "Failed check"},
                {"name": "test_warn", "status": "warn", "message": "Warning check"},
            ],
        }

        # Plain text / no-color mode
        plain = check_mod.render_terminal(mock_results, use_color=False)
        self.assertIn("=== SEO Superpower Readiness Check ===", plain)
        self.assertIn("[OK] All good", plain)
        self.assertIn("[FAIL] Failed check", plain)
        self.assertIn("[WARN] Warning check", plain)
        self.assertIn("Pass: 1   Fail: 1   Warn: 1", plain)
        self.assertIn("Fix the items marked [FAIL] above", plain)
        self.assertNotIn("\033[", plain)  # No ANSI escape sequences

        # Color mode
        colored = check_mod.render_terminal(mock_results, use_color=True)
        self.assertIn("=== SEO Superpower Readiness Check ===", colored)
        self.assertIn("Failed check", colored)
        # Verify color codes are present
        self.assertIn("\033[", colored)

    def test_render_terminal_all_pass(self):
        mock_results = {
            "ready": True,
            "passCount": 3,
            "failCount": 0,
            "warnCount": 0,
            "checks": [
                {"name": "c1", "status": "pass", "message": "Check 1"},
                {"name": "c2", "status": "pass", "message": "Check 2"},
            ],
        }
        rendered = check_mod.render_terminal(mock_results, use_color=False)
        self.assertIn("Ready. Type /seo in any project to start.", rendered)

    def test_can_encode_helper(self):
        # ASCII characters should always be encodable
        self.assertTrue(check_mod._can_encode("A"))
        self.assertTrue(check_mod._can_encode("[OK]"))


class TestCheckCLI(unittest.TestCase):
    def test_cli_json_mode(self):
        proc = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--no-network", "--json"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        # Exit code should be 0 or 1 depending on whether machine has credentials configured
        self.assertIn(proc.returncode, (0, 1))
        data = json.loads(proc.stdout)
        self.assertIn("ready", data)
        self.assertIn("checks", data)
        self.assertIn("passCount", data)

    def test_cli_no_color_mode(self):
        proc = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--no-network", "--no-color"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        self.assertIn(proc.returncode, (0, 1))
        self.assertIn("=== SEO Superpower Readiness Check ===", proc.stdout)
        self.assertNotIn("\033[", proc.stdout)
        self.assertNotIn("UnicodeEncodeError", proc.stderr)
        self.assertNotIn("Traceback", proc.stderr)

    def test_cli_default_execution_does_not_crash(self):
        # This directly verifies that Windows CP1252 consoles don't crash with UnicodeEncodeError
        proc = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--no-network"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        self.assertIn(proc.returncode, (0, 1))
        self.assertIn("=== SEO Superpower Readiness Check ===", proc.stdout)
        self.assertNotIn("UnicodeEncodeError", proc.stderr)
        self.assertNotIn("Traceback", proc.stderr)

    def test_cli_help(self):
        proc = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--help"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        self.assertEqual(proc.returncode, 0)
        self.assertIn("usage:", proc.stdout.lower())
        self.assertIn("--json", proc.stdout)
        self.assertIn("--no-network", proc.stdout)


if __name__ == "__main__":
    unittest.main()
