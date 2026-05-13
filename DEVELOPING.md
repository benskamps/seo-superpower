# DEVELOPING

Maintainer-facing notes. If you're a user installing the plugin, see [INSTALL.md](INSTALL.md).

## Dogfood mode

You're the plugin author. You want to run these skills against a real target site **without** going through the marketplace install / OAuth wizard. Three options, in order of preference.

### Option 1 — `--plugin-dir` (recommended)

Claude Code supports loading a plugin from a local directory for one session:

```bash
cd ~/path/to/target-site
claude --plugin-dir ~/projects/seo-superpower
```

The flag is repeatable (`--plugin-dir A --plugin-dir B.zip`). Inside that session, `/seo`, `/seo-setup`, and the skills auto-trigger as if installed from the marketplace. No marketplace round-trip, no global `~/.claude/plugins/` symlinks. Verified working on this machine 2026-05-12 (`claude --help` lists `--plugin-dir <path>`).

This is the right answer for the "test changes against vibecrafting.ai before pushing" loop.

### Option 2 — symlink into `~/.claude/plugins/`

If you want the plugin "always on" across sessions while you iterate:

```bash
ln -s ~/projects/seo-superpower ~/.claude/plugins/seo-superpower
```

**Windows caveat:** symlinks require either Developer Mode on (`Settings → System → For Developers → Developer Mode`) or an elevated shell with `mklink /D`. Git Bash's `ln -s` falls back to copying without Developer Mode, which defeats the purpose. If you hit this, use Option 1.

Edit files in `~/projects/seo-superpower/`, restart the Claude session, changes are picked up.

### Option 3 — manual `Read` (last resort)

When the above don't work (e.g., debugging in a session that's already running, no shell access to restart), `Read` each `SKILL.md` directly and execute the steps manually:

```
Read ~/projects/seo-superpower/skills/seo-superpower/SKILL.md
Read ~/projects/seo-superpower/skills/auditing-technical-seo/SKILL.md
```

Then walk the diagnostic flow by hand against the target URL. This is what `DOGFOOD-2026-05-12.md` documents — slower, but works from anywhere.

## Where to put audit output when dogfooding

Default is `./SEO_AUDIT.md` in the cwd. When testing against a third party's repo (or your own production site that you don't want to commit a report to), set `SEO_AUDIT_OUTPUT`:

```bash
SEO_AUDIT_OUTPUT=~/audits/vibecrafting-2026-05-12.md \
  claude --plugin-dir ~/projects/seo-superpower
```

See `skills/auditing-technical-seo/SKILL.md` for the full env var contract.

## Testing changes before shipping

For now: dogfood against a real site (vibecrafting.ai is the canonical target — its tech-SEO is exemplary, so any false-positive findings are bugs in the plugin, not the site). Write up the run in `DOGFOOD-YYYY-MM-DD.md` per the precedent set on 2026-05-12. No formal test suite yet — skills are markdown, not code.

The one script with code (`scripts/psi-quick.py`) is small enough to test by:

```bash
python scripts/psi-quick.py https://vibecrafting.ai          # human output
python scripts/psi-quick.py https://vibecrafting.ai --json   # machine output
python scripts/psi-quick.py https://vibecrafting.ai --strategy desktop
```

Exit codes: `0` success, `1` missing `PSI_API_KEY`, `2` HTTP/network error, `3` bad CLI args.

## Releasing

1. Bump `.claude-plugin/plugin.json` `version`.
2. Update `VISION.md` status line if the release closes a roadmap item.
3. One commit on `main`: `vX.Y.Z: <one-line summary>` with the deliverables enumerated in the body.
4. `git push origin main`. Tagging is optional — GitHub auto-derives `vX.Y.Z` from commit titles for the marketplace.

No semver thrash: bugfixes and small additions go in patch releases (`0.3.x`), new skills go in minor releases (`0.x.0`).
