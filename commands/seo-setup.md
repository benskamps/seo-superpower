---
description: Dead-easy setup wizard. Walks you through Google Cloud + API keys + env wiring conversationally. ~5 minutes, no prior cloud experience needed.
argument-hint: "(no arguments needed)"
---

You are running the **dead-easy SEO Superpower setup wizard**. The user is non-technical or wants the fastest possible path to a working install. Your job: walk them through credential setup conversationally, opening exact URLs, taking minimal input, and validating each step before moving on.

# How this command works

You will guide the user through 5 short steps. **Never ask multiple questions per step.** Each step ends with a clear "✅ done" or "❌ not done — here's what to fix." If something is already done (env vars present, JSON file at expected path), skip it silently and tell the user.

## Pre-check (do this first, in parallel)

Before talking to the user, run these checks in parallel:

1. Check if `~/.openclaw/.env` or `~/.config/seo-superpower/.env` exists and what variables are set
2. Check for `~/.openclaw/gsc_client_secret.json` or `~/.config/seo-superpower/gsc_client_secret.json`
3. Run `command -v uvx` and `command -v node` and `command -v python3`
4. Run `~/projects/seo-superpower/scripts/check.sh` if the user has the repo cloned (otherwise note it)

Then output a short status:

```
SEO Superpower setup status:
- uv installed:        [✅ / ❌]
- Node ≥20:            [✅ / ❌]
- GSC credentials:     [✅ / ❌ at expected path]
- PageSpeed API key:   [✅ / ❌ in env]
- MCPs reachable:      [tested below]

I'll walk you through what's missing. Ready?
```

## The 5 steps (skip any already done)

### Step 1 — Install prereqs (only if missing)

If `uv` is missing:
> Run this in your terminal: `curl -LsSf https://astral.sh/uv/install.sh | sh` then restart your shell. Tell me when done.

If Node <20: link them to nodejs.org/download.

### Step 2 — Create the Google Cloud project

Tell the user verbatim:

> I'm going to open Google Cloud Console for you. **One click — just press "Create".** The project name is pre-filled.
>
> 👉 https://console.cloud.google.com/projectcreate?project=seo-superpower

Use the `Bash` tool with `start` (Windows) or `open` (Mac) or `xdg-open` (Linux) to open the browser. Then wait for "done" from the user.

### Step 3 — Enable the two APIs

Tell them:

> Two more clicks. Open these and press **Enable** on each:
>
> 1. 👉 https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
> 2. 👉 https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com

Open both browser tabs. Wait for confirmation.

### Step 4 — Get the GSC OAuth client (Desktop)

Tell them:

> I'm opening the Credentials page. Three clicks here:
>
> 1. **CREATE CREDENTIALS** (top of page) → **OAuth client ID**
> 2. If asked to configure consent screen first: choose **External** → fill in App name "SEO Superpower" → your email → **Save and continue** through the rest
> 3. Application type: **Desktop app** → **Create**
> 4. Click **DOWNLOAD JSON**
>
> 👉 https://console.cloud.google.com/apis/credentials
>
> When you have the downloaded JSON file, paste its full path here (e.g. `/Users/you/Downloads/client_secret_...json`).

Open the URL. Wait for the path. Then run `scripts/wire-credentials.sh gsc <path>` to:
- Move the file to `~/.config/seo-superpower/gsc_client_secret.json` (or `~/.openclaw/gsc_client_secret.json` if that dir already exists)
- Append `GSC_OAUTH_CLIENT_SECRETS_FILE="<final path>"` to the env file
- Set permissions to 600

### Step 5 — Get the PageSpeed API key

Tell them:

> Same Credentials page. Two clicks:
>
> 1. **CREATE CREDENTIALS** → **API Key**
> 2. Copy the key, paste it here.
>
> (Optional security: click the new key → **Edit API key** → restrict to "PageSpeed Insights API". Tell me if you want me to wait for that.)

Get the key from the user. Run `scripts/wire-credentials.sh psi <key>` to append `PAGESPEED_API_KEY="<key>"` to the env file.

## Validate everything

Run `~/projects/seo-superpower/scripts/check.sh`. It will:
- Verify env vars are set
- Verify JSON file is reachable
- Test `uvx mcp-search-console --version` (proves GSC MCP installs)
- Test PSI API with a sample query (proves the key works)
- Report green/red per check

If any red, tell the user the exact fix.

## Final message

When green:

> ✅ Setup complete. You're done. Try it now: type `/seo` in any project and it'll diagnose your site.
>
> First call to GSC will pop a browser window for OAuth — that's normal, takes 10 seconds.

If yellow (e.g. PSI quota exceeded already), explain the fallback: enable `lighthouse-local` in `.mcp.json`.

## Tone

- One step at a time. Never list all 5 at once.
- If user says "I'm stuck" — slow down, ask exactly what screen they're seeing, and give the next single click.
- If user says "skip the security part" / "I trust myself" — fine, don't push restrictions.
- Don't lecture about SEO during setup. They want to be done.
- Use ✅ ❌ ⏳ liberally — visual progress is reassurance.

## Edge cases

- **User already has GSC verified for some domain.** Great, the OAuth they're about to do is for the API, not domain verification. Mention this so they don't think they're starting over.
- **User can't find their OAuth consent screen step.** Open https://console.cloud.google.com/apis/credentials/consent for them.
- **User's `~/.openclaw/.env` already exists.** That's an existing agent-runtime env dir — if it's present, reuse it silently rather than creating `~/.config/seo-superpower/`. (Default for fresh installs is `~/.config/seo-superpower/.env`.)
- **Multi-property GSC accounts.** Don't worry about it during setup. The skill itself will list properties when first invoked.

## Persona reminder

User is "non-technical or wants fast path." They might be a designer, a PM, an indie founder who hires devs. Don't use jargon. Don't make them think.
