---
description: Fast pre-deploy SEO and environment readiness check. Runs check.py, baseline-check.js, and seo-lint.js without requiring OAuth.
argument-hint: "[optional target: directory path or URL (default: .)]"
---

You are being invoked via the `/seo-check` slash command. Your job is to run a fast, zero-OAuth, offline-first pre-deploy validation suite to catch technical SEO defects, placeholder tokens, and configuration errors before code ships to production.

## How `/seo-check` Works

Execute the checks in 3 discrete phases, gather the outputs, and present a concise summary report.

### Phase 1: Determine Target

1. Inspect `$ARGUMENTS`:
   - If `$ARGUMENTS` is a URL (starts with `http://` or `https://`), use live URL mode for baseline auditing.
   - If `$ARGUMENTS` specifies a path (e.g., `./dist`, `./out`, `./build`, `public`), use that directory.
   - If `$ARGUMENTS` is empty or `.`:
     - Check if a static build output directory exists (`./dist`, `./out`, `./build`, or `./public`). If found, audit that build directory for the baseline check; otherwise, audit current working directory `.`.
     - Lint the project root directory `.` for placeholders and asset hygiene.

### Phase 2: Execute Diagnostics (Run in Parallel or Sequential Pipeline)

1. **Environment Readiness (`scripts/check.py`):**
   ```bash
   python scripts/check.py --no-network
   ```
   Validates required runtimes (Node.js >= 18, Python >= 3.10, git) without external network calls.

2. **SEO Asset & Placeholder Linter (`scripts/seo-lint.js`):**
   ```bash
   node scripts/seo-lint.js [target-directory]
   ```
   Scans codebase files (`.html`, `.tsx`, `.jsx`, `.astro`, `.svelte`, `.vue`, `.md`, `.mdx`, `.xml`, `.json`) for:
   - Unreplaced template tokens (e.g., `REPLACE-WITH-CANONICAL-ORIGIN`, `REPLACE-WITH-SITE-NAME`, `REPLACE-WITH-DEFAULT-DESCRIPTION`).
   - Accidental production `noindex` directives on standard pages.
   - Relative URLs in canonical link tags or sitemaps.
   - Schema.org type casing mistakes (e.g., `product` instead of `Product`).

3. **Baseline Health & AI-Bot Audit (`scripts/baseline-check.js`):**
   ```bash
   # If auditing a local directory:
   node scripts/baseline-check.js --dir <directory>

   # If auditing a live URL:
   node scripts/baseline-check.js <url>
   ```
   Evaluates the Pass A 10-point technical baseline:
   1. `robots.txt` exists, is non-empty, complies with Google's 500 KiB limit, and references a sitemap.
   2. `sitemap.xml` exists, is valid XML, has >0 URLs, and respects 50,000 URLs / 50 MB limits.
   3. `<title>` tag present (recommended 40–60 characters).
   4. `<meta name="description">` present (recommended 120–160 characters).
   5. `<link rel="canonical">` present with absolute URL.
   6. `<meta name="viewport">` present.
   7. Valid JSON-LD structured data detected.
   8. HTTPS / SSL validity (live URL) or local audit acknowledgement.
   9. Single `<h1>` tag on the page.
   10. AI retrieval bot access policy (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`).

### Phase 3: Deliver the Pre-Deploy Report

Output a structured terminal report:

```
Pre-Deploy SEO Check Report
Target: <target>

1. Environment:   [PASS / FAIL] (Node, Python, Git)
2. SEO Linter:    [PASS / FAIL] (X issues found)
3. Baseline SEO:  [PASS: X/10 / FAIL] (Pass A health score)
4. AI Retrieval:  [ALLOWED / BLOCKED] (OAI-SearchBot, Claude-SearchBot, PerplexityBot)

Verdict: [READY TO DEPLOY / ACTION REQUIRED]
```

### Remediation & Next Steps

- **If linter fails with `REPLACE-WITH-*` tokens:** Point out exact files and line numbers where placeholders remain unpopulated.
- **If `robots.txt` blocks retrieval bots:** Recommend allowing `OAI-SearchBot`, `Claude-SearchBot`, and `PerplexityBot` while keeping training bots blocked if desired (see `templates/robots-ai-bots.txt`).
- **If schema markup is missing or invalid:** Refer to `scripts/schema-quick.py` and `skills/adding-schema-markup/SKILL.md` to scaffold JSON-LD structured data.
- **If full audit with search console is desired:** Prompt user to run `/seo` or `/seo-setup`.
