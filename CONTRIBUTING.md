# Contributing

seo-superpower is a [Claude Code](https://claude.com/claude-code) plugin built
from **skills** (markdown reference docs), **MCP servers** (the tools Claude
calls), **commands** (the `/seo` entry points), and **scripts** (one-time setup).
Most contributions are a single new skill. This guide covers the layout, how to
author a skill, the bundled MCP servers, what CI checks, and PR conventions.

If you're a user installing the plugin, you want [INSTALL.md](INSTALL.md), not
this file. Maintainer-only dogfood + release notes live in
[DEVELOPING.md](DEVELOPING.md).

## The bar

A new skill must:

1. **Auto-trigger on a real builder scenario** the existing skills don't already
   cover. The 14-skill registry (see [README.md](README.md#skills-included-14-total--full-registry-shipped))
   is fairly complete — so a new skill should fill a genuine gap, not overlap an
   existing one.
2. **Run on free-tier APIs only.** No DataForSEO, no Ahrefs/Surfer/Semrush, no
   paid SaaS dependency. Free-tier Google Search Console + PageSpeed Insights is
   the whole budget. `$0` marginal cost is the wedge — don't break it.
3. **Ship its findings as a PR**, not a report the user will ignore. Skills tell
   Claude *what* to do; the work lands as reviewable code.

## Repo layout

| Path | What lives here |
|---|---|
| `.claude-plugin/plugin.json` | Plugin manifest — `name`, `version`, `description`. Canonical version. |
| `.claude-plugin/marketplace.json` | Marketplace entry — `name` + `plugins[]` (each with `name` + `source`). |
| `skills/<slug>/SKILL.md` | One skill per directory. Frontmatter + the reference doc. |
| `skills/<slug>/SOURCES.md` | Per-skill citation list (every claim should be cited). |
| `commands/seo.md`, `commands/seo-setup.md` | Slash-command entry points. Named by filename. |
| `mcp-servers/<name>/` | The MCP servers we own (`geo-check`, `schema-validate`). |
| `scripts/` | Setup + helper scripts (`check.sh`, `ci-validate.py`, `psi-quick.py`, …). |
| `hooks/seo-decay-check.json` | The weekly content-decay detection hook spec. |
| `templates/` | Paste-ready snippets (e.g. `robots-ai-bots.txt`). |
| `.github/workflows/ci.yml` | CI — runs the validator + MCP smoke tests on every PR. |

## Authoring a skill

A skill is a directory under `skills/` containing a `SKILL.md`. Most also ship a
`SOURCES.md`.

### 1. Create the directory and frontmatter

```
skills/<your-skill-slug>/SKILL.md
```

`SKILL.md` **must** open with a `---`-delimited YAML frontmatter block containing
both `name` and `description` (the validator enforces this — see below):

```markdown
---
name: your-skill-slug
description: Use when <a real scenario>. Triggers on "<phrase>", "<phrase>", … . Do NOT trigger when <the boundary> — let <other-skill> win.
---

# Your Skill Title

## Overview
...
```

Conventions, mirrored from the existing skills:

- **`name` matches the directory slug** exactly (kebab-case).
- The **`description` is the trigger surface.** Lead with "Use when…", then list
  the literal phrases that should fire it. State what it does *not* cover so it
  loses ties cleanly to a more specific skill (the meta-router relies on this —
  see `skills/seo-superpower/SKILL.md`). Keep it specific; a vague description
  fires on the wrong prompts.
- The body is a **playbook**, not prose: a decision tree or numbered flow Claude
  can execute, ending in a PR.
- **Cite your claims** in a sibling `SOURCES.md`. Every threshold or stat (title
  pixel widths, decay percentages, citation multipliers) should trace to a
  source.

### 2. Wire it into routing

Two touch points keep a skill reachable:

- **Meta-router** (`skills/seo-superpower/SKILL.md`) — add an intent → skill
  mapping so vague requests route to it.
- **`/seo` command** (`commands/seo.md`) — if the skill deserves an explicit
  intent (e.g. `/seo refresh`), add the argument pattern.

The validator checks that `/seo` routing targets and command-referenced skill
paths resolve to a real `skills/<slug>/` directory — so a typo in a route is a
CI failure, not a silent dead end.

## The bundled MCP servers

Skills are reference docs; MCP servers are the hands that pull data, run scans,
and validate. Two servers are owned in this repo (full notes in
[`mcp-servers/README.md`](mcp-servers/README.md)):

- **`geo-check`** — polls ChatGPT / Claude / Perplexity / Gemini for citations of
  a domain. Tools: `geo_check`, `geo_track`, `geo_diff`.
- **`schema-validate`** — offline JSON-LD validation against schema.org via
  `pyld` + `extruct`, with Google rich-result checks for 9 types. Tools:
  `validate_jsonld`, `extract_schema_from_html`, `validate_url_schema`,
  `check_required_fields`.

Two more are external: `gsc` (pulled at install via `uvx`) and `pagespeed`
(vendored). All are declared in `.mcp.json`.

Touching a server? Each is a FastMCP Python module. Keep `mcp.run()` behind
`if __name__ == "__main__":` so CI can import-smoke-test it without starting the
stdio loop. If you add or rename a server, update `.mcp.json` and
`mcp-servers/README.md`, and add an import smoke step in `ci.yml`.

## Validation & testing expectations

### Run the validator locally

```bash
python scripts/ci-validate.py
```

Stdlib-only, fast. It checks (exit `0` = green, `1` = any failure):

1. Every `skills/<x>/SKILL.md` has frontmatter with `name` + `description`.
2. Every `commands/*.md` has frontmatter with `description`.
3. `plugin.json` parses and has `name` + `version` + `description`.
4. `marketplace.json` parses and has `name` + `plugins[]` (each with `name` +
   `source`).
5. **No dangling references** — marketplace `source` paths, `.mcp.json`
   entrypoints, command-referenced `SKILL.md` paths, `/seo` routing targets, and
   hook command scripts all resolve on disk.

### CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every PR:

- **`validate`** — `scripts/ci-validate.py`.
- **`mcp-smoke`** — `py_compile` each server, then install its `requirements.txt`
  and import it to confirm the FastMCP app and tool registrations build.

Green CI is the merge gate. Run the validator before you push.

### Functional testing

There's no formal test suite for skills — they're markdown, not code. The
maintainer convention is to **dogfood against a real site** (vibecrafting.ai is
the canonical target; its tech-SEO is exemplary, so any false positive is a
plugin bug) and write the run up in `DOGFOOD-YYYY-MM-DD.md`. See
[DEVELOPING.md](DEVELOPING.md) for `--plugin-dir` and the other dogfood paths.

The one script with real logic, `scripts/psi-quick.py`, is testable directly:

```bash
python scripts/psi-quick.py https://vibecrafting.ai          # human output
python scripts/psi-quick.py https://vibecrafting.ai --json   # machine output
```

Exit codes: `0` success, `1` missing `PSI_API_KEY`, `2` HTTP/network, `3` bad args.

## PR conventions

- **One change per PR.** A skill + its routing wiring is one PR; an MCP change is
  another.
- **Branch, don't push to `main`.** Open a PR; CI must be green before merge.
- **Commit titles** follow the repo style: `<type>: <summary>` for changes
  (`docs:`, `ci:`, `fix:`, `feat:`) and `vX.Y.Z: <summary>` for releases. Versioning:
  patch (`0.3.x`) for bugfixes and small additions, minor (`0.x.0`) for new
  skills (see [DEVELOPING.md](DEVELOPING.md#releasing)).
- **Update the docs you touched** — README skill table, `VISION.md` status line,
  and [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]`.
- **No secrets in the tree.** Credentials come from env / the user's
  `~/.config/seo-superpower/.env`, never a committed file.

## License

By contributing you agree your work ships under the project's
[MIT license](LICENSE).
