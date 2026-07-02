#!/usr/bin/env python3
"""Unit tests for scripts/psi-quick.py pure functions.

Offline + secret-free: the module is loaded via importlib spec-load (the same
pattern ci.yml uses for the MCP servers, because the filename has a hyphen) so
no network call, no real API key, and no main() invocation happen on import.
The `if __name__ == "__main__"` guard in psi-quick.py keeps main() from firing
when the module is exec'd under a non-"__main__" name.

Covered: parse_field_data, parse_lab_data, extract_metrics, render_human, and
load_api_key (env + fake-home file branches only — the real home dir is never
read, so no secret is ever touched).
"""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest import mock

# --- offline spec-load of the hyphenated script -----------------------------
_SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "psi-quick.py"
_spec = importlib.util.spec_from_file_location("psi_quick", _SCRIPT)
assert _spec is not None and _spec.loader is not None, "could not build import spec"
psi = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(psi)  # main() does NOT run: name is "psi_quick"


def _field_payload() -> dict:
    """A full CrUX loadingExperience payload."""
    return {
        "loadingExperience": {
            "overall_category": "FAST",
            "metrics": {
                "LARGEST_CONTENTFUL_PAINT_MS": {"percentile": 2500},
                "INTERACTION_TO_NEXT_PAINT": {"percentile": 200},
                "CUMULATIVE_LAYOUT_SHIFT_SCORE": {"percentile": 10},
                "EXPERIMENTAL_TIME_TO_FIRST_BYTE": {"percentile": 800},
            },
        }
    }


def _lab_payload() -> dict:
    """A lighthouseResult.audits lab payload (no field data)."""
    return {
        "lighthouseResult": {
            "audits": {
                "largest-contentful-paint": {"numericValue": 3200.5},
                "interaction-to-next-paint": {"numericValue": 250},
                "cumulative-layout-shift": {"numericValue": 0.05},
                "server-response-time": {"numericValue": 600},
            }
        }
    }


class TestParseFieldData(unittest.TestCase):
    def test_full_payload(self):
        out = psi.parse_field_data(_field_payload())
        self.assertIsNotNone(out)
        assert out is not None  # for type-checkers
        self.assertEqual(out["source"], "field")
        self.assertAlmostEqual(out["lcp_s"], 2.5)
        self.assertAlmostEqual(out["inp_ms"], 200.0)
        self.assertAlmostEqual(out["cls"], 0.1)
        self.assertAlmostEqual(out["ttfb_ms"], 800.0)
        self.assertEqual(out["overall_category"], "FAST")

    def test_returns_none_when_no_metrics(self):
        self.assertIsNone(psi.parse_field_data({}))
        self.assertIsNone(psi.parse_field_data({"loadingExperience": {}}))
        self.assertIsNone(psi.parse_field_data({"loadingExperience": {"metrics": {}}}))

    def test_inp_falls_back_to_experimental_key(self):
        payload = {
            "loadingExperience": {
                "metrics": {
                    "EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT": {"percentile": 333},
                }
            }
        }
        out = psi.parse_field_data(payload)
        assert out is not None
        self.assertEqual(out["inp_ms"], 333.0)

    def test_ttfb_falls_back_to_fcp(self):
        payload = {
            "loadingExperience": {
                "metrics": {
                    "FIRST_CONTENTFUL_PAINT_MS": {"percentile": 1200},
                }
            }
        }
        out = psi.parse_field_data(payload)
        assert out is not None
        self.assertEqual(out["ttfb_ms"], 1200.0)

    def test_metric_without_percentile_is_none(self):
        payload = {
            "loadingExperience": {
                "metrics": {
                    # present (so the dict is non-empty) but lacks "percentile"
                    "LARGEST_CONTENTFUL_PAINT_MS": {},
                    "CUMULATIVE_LAYOUT_SHIFT_SCORE": {"percentile": 5},
                }
            }
        }
        out = psi.parse_field_data(payload)
        assert out is not None
        self.assertIsNone(out["lcp_s"])
        self.assertAlmostEqual(out["cls"], 0.05)


class TestParseLabData(unittest.TestCase):
    def test_full_payload(self):
        out = psi.parse_lab_data(_lab_payload())
        self.assertEqual(out["source"], "lab")
        self.assertAlmostEqual(out["lcp_s"], 3.2005)
        self.assertEqual(out["inp_ms"], 250)
        self.assertAlmostEqual(out["cls"], 0.05)
        self.assertEqual(out["ttfb_ms"], 600)

    def test_empty_payload_all_none(self):
        out = psi.parse_lab_data({})
        self.assertEqual(out["source"], "lab")
        self.assertIsNone(out["lcp_s"])
        self.assertIsNone(out["inp_ms"])
        self.assertIsNone(out["cls"])
        self.assertIsNone(out["ttfb_ms"])

    def test_inp_falls_back_to_total_blocking_time(self):
        payload = {
            "lighthouseResult": {
                "audits": {"total-blocking-time": {"numericValue": 140}}
            }
        }
        out = psi.parse_lab_data(payload)
        self.assertEqual(out["inp_ms"], 140)

    def test_missing_lcp_audit_yields_none(self):
        payload = {
            "lighthouseResult": {
                "audits": {"server-response-time": {"numericValue": 500}}
            }
        }
        out = psi.parse_lab_data(payload)
        self.assertIsNone(out["lcp_s"])
        self.assertEqual(out["ttfb_ms"], 500)


class TestExtractMetrics(unittest.TestCase):
    def test_prefers_field_when_present(self):
        payload = {**_field_payload(), **_lab_payload()}
        out = psi.extract_metrics(payload)
        self.assertEqual(out["source"], "field")

    def test_falls_back_to_lab_without_field(self):
        out = psi.extract_metrics(_lab_payload())
        self.assertEqual(out["source"], "lab")


class TestRenderHuman(unittest.TestCase):
    def test_field_render(self):
        metrics = psi.parse_field_data(_field_payload())
        text = psi.render_human("https://example.com", "mobile", metrics)
        self.assertIn("PageSpeed Insights — https://example.com [mobile]", text)
        self.assertIn("Source: CrUX field data (p75)", text)
        self.assertIn("Overall: FAST", text)
        self.assertIn("LCP", text)
        self.assertIn("INP", text)
        self.assertIn("CLS", text)
        self.assertIn("TTFB", text)
        # lab-only note must NOT appear for field data
        self.assertNotIn("field data not available", text)

    def test_lab_render_has_fallback_note(self):
        metrics = psi.parse_lab_data(_lab_payload())
        text = psi.render_human("https://example.com", "desktop", metrics)
        self.assertIn("Source: Lighthouse lab (single sample)", text)
        self.assertIn("field data not available", text)

    def test_none_values_render_as_dash(self):
        metrics = {"source": "field"}  # all metric keys absent -> None
        text = psi.render_human("https://x.test", "mobile", metrics)
        self.assertIn("—", text)


class TestLoadApiKey(unittest.TestCase):
    def test_env_var_short_circuits(self):
        # When PSI_API_KEY is in the env, no file is read at all.
        with mock.patch.dict("os.environ", {"PSI_API_KEY": "  test-key-123  "}, clear=False):
            self.assertEqual(psi.load_api_key(), "test-key-123")

    def test_reads_from_fake_home_env_file(self):
        # Point Path.home() at a temp dir so the REAL home is never touched.
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp)
            env_dir = home / ".config" / "seo-superpower"
            env_dir.mkdir(parents=True)
            (env_dir / ".env").write_text(
                "# comment line\nPSI_API_KEY='file-key-xyz'\n", encoding="utf-8"
            )
            with mock.patch.dict("os.environ", {}, clear=True), mock.patch.object(
                psi.Path, "home", return_value=home
            ):
                self.assertEqual(psi.load_api_key(), "file-key-xyz")

    def test_returns_none_when_absent_everywhere(self):
        # Empty fake home + no env var -> None, without reading the real home.
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp)
            with mock.patch.dict("os.environ", {}, clear=True), mock.patch.object(
                psi.Path, "home", return_value=home
            ):
                self.assertIsNone(psi.load_api_key())


if __name__ == "__main__":
    unittest.main()
