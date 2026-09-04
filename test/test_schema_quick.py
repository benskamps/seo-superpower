#!/usr/bin/env python3
"""test/test_schema_quick.py — unit tests for scripts/schema-quick.py.

Pure Python stdlib (unittest, subprocess, json).
Discovered by: python -m unittest discover -s test
"""
from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

# Add scripts directory to sys.path for direct function testing
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import importlib.util

spec = importlib.util.spec_from_file_location("schema_quick", REPO_ROOT / "scripts" / "schema-quick.py")
sq = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sq)


class TestSchemaQuick(unittest.TestCase):
    def test_valid_article_schema(self):
        payload = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How to Build Fast Python Web Apps",
            "author": {"@type": "Person", "name": "Alice Dev"},
            "datePublished": "2026-01-01T00:00:00Z",
            "dateModified": "2026-02-01T00:00:00Z",
            "image": "https://example.com/cover.png",
            "publisher": {"@type": "Organization", "name": "Tech Corp"},
        }
        res = sq.validate_json_ld(json.dumps(payload))
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["errors"]), 0)
        self.assertEqual(len(res["warnings"]), 0)
        self.assertIn("Article", res["types"])

    def test_case_sensitivity_detection(self):
        # Website should be WebSite
        payload = {
            "@context": "https://schema.org",
            "@type": "Website",
            "name": "My Great Site",
            "url": "https://example.com",
        }
        res = sq.validate_json_ld(json.dumps(payload))
        self.assertFalse(res["valid"])
        self.assertTrue(any("WebSite" in err for err in res["errors"]))

    def test_missing_required_fields(self):
        # Article without headline
        payload_article = {
            "@context": "https://schema.org",
            "@type": "Article",
            "description": "Missing headline",
        }
        res_article = sq.validate_json_ld(json.dumps(payload_article))
        self.assertFalse(res_article["valid"])
        self.assertTrue(any("headline" in err for err in res_article["errors"]))

        # FAQPage without mainEntity
        payload_faq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
        }
        res_faq = sq.validate_json_ld(json.dumps(payload_faq))
        self.assertFalse(res_faq["valid"])
        self.assertTrue(any("mainEntity" in err for err in res_faq["errors"]))

    def test_missing_context(self):
        payload = {
            "@type": "Organization",
            "name": "Acme Inc",
        }
        res = sq.validate_json_ld(json.dumps(payload))
        self.assertFalse(res["valid"])
        self.assertTrue(any("@context" in err for err in res["errors"]))

    def test_html_extraction(self):
        html = """
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page</title>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "Extracted from HTML",
            "author": "Bob",
            "datePublished": "2026-03-01",
            "dateModified": "2026-03-02",
            "image": "https://example.com/img.png",
            "publisher": "Acme"
          }
          </script>
        </head>
        <body><h1>Hello</h1></body>
        </html>
        """
        res = sq.validate_json_ld(html)
        self.assertTrue(res["valid"])
        self.assertIn("BlogPosting", res["types"])
        self.assertEqual(len(res["errors"]), 0)

    def test_graph_traversal(self):
        payload = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebSite",
                    "name": "Example Corp",
                    "url": "https://example.com",
                },
                {
                    "@type": "Organization",
                    "name": "Example Corp",
                    "url": "https://example.com",
                    "logo": "https://example.com/logo.png",
                    "sameAs": "https://twitter.com/example",
                },
            ],
        }
        res = sq.validate_json_ld(json.dumps(payload))
        self.assertTrue(res["valid"])
        self.assertIn("WebSite", res["types"])
        self.assertIn("Organization", res["types"])

    def test_product_schema_validation(self):
        # Product missing offer/rating/review
        invalid_prod = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Widget",
        }
        res_invalid = sq.validate_json_ld(json.dumps(invalid_prod))
        self.assertFalse(res_invalid["valid"])
        self.assertTrue(any("offers" in err or "aggregateRating" in err for err in res_invalid["errors"]))

        # Product with offers
        valid_prod = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Widget Pro",
            "image": "https://example.com/widget.jpg",
            "description": "High quality widget",
            "brand": "Acme",
            "offers": {
                "@type": "Offer",
                "price": "19.99",
                "priceCurrency": "USD",
            },
        }
        res_valid = sq.validate_json_ld(json.dumps(valid_prod))
        self.assertTrue(res_valid["valid"])

    def test_breadcrumb_validation(self):
        payload = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://example.com",
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Products",
                    "item": "https://example.com/products",
                },
            ],
        }
        res = sq.validate_json_ld(json.dumps(payload))
        self.assertTrue(res["valid"])
        self.assertIn("BreadcrumbList", res["types"])

    def test_cli_exit_codes(self):
        script_path = str(REPO_ROOT / "scripts" / "schema-quick.py")

        # Clean schema -> exit 0
        clean_json = json.dumps({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "CLI Test",
            "author": "Alice",
            "datePublished": "2026-01-01",
            "dateModified": "2026-01-02",
            "image": "https://example.com/img.png",
            "publisher": "Acme",
        })
        proc0 = subprocess.run([sys.executable, script_path, "--json", clean_json], capture_output=True, text=True)
        self.assertEqual(proc0.returncode, 0)
        data0 = json.loads(proc0.stdout)
        self.assertTrue(data0["valid"])

        # Warnings only (missing recommended fields) -> exit 1
        warn_json = json.dumps({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Headline Only",
        })
        proc1 = subprocess.run([sys.executable, script_path, "--json", warn_json], capture_output=True, text=True)
        self.assertEqual(proc1.returncode, 1)
        data1 = json.loads(proc1.stdout)
        self.assertTrue(data1["valid"])
        self.assertGreater(len(data1["warnings"]), 0)

        # Errors (missing required field) -> exit 2
        err_json = json.dumps({
            "@context": "https://schema.org",
            "@type": "Article",
        })
        proc2 = subprocess.run([sys.executable, script_path, "--json", err_json], capture_output=True, text=True)
        self.assertEqual(proc2.returncode, 2)

    def test_cli_text_output_does_not_crash(self):
        script_path = str(REPO_ROOT / "scripts" / "schema-quick.py")
        test_json = json.dumps({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Test Site",
        })
        proc = subprocess.run(
            [sys.executable, script_path, "--text", "--json", test_json],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        self.assertEqual(proc.returncode, 1)  # Warnings for missing recommended fields
        self.assertIn("Schema Validation Result:", proc.stdout)
        self.assertNotIn("UnicodeEncodeError", proc.stderr)
        self.assertNotIn("Traceback", proc.stderr)

    def test_render_human_direct(self):
        payload = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Direct Render Test",
            "author": {"@type": "Person", "name": "Author"},
            "datePublished": "2026-01-01",
            "dateModified": "2026-01-02",
            "image": "https://example.com/pic.jpg",
            "publisher": {"@type": "Organization", "name": "Org"},
        }
        res = sq.validate_json_ld(json.dumps(payload))
        rendered = sq.render_human(res)
        self.assertIn("Schema Validation Result: CLEAN", rendered)
        self.assertIn("Schema Types Detected: Article", rendered)


if __name__ == "__main__":
    unittest.main()

