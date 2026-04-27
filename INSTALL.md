# Install — 5 minutes, no SEO knowledge needed

Two paths. Pick whichever matches you.

---

## 🟢 Easy path — for non-technical users (recommended)

You don't need to know what an OAuth client is. The wizard does the thinking.

```
/plugin marketplace add benskamps/seo-superpower
/plugin install seo-superpower
/seo-setup
```

That's it. The `/seo-setup` wizard will:

1. ✅ Check what you already have
2. 🌐 Open Google Cloud Console for you (one click — just press "Create")
3. 🌐 Open the two API enable pages (one click each)
4. 🔑 Walk you through making the OAuth client (3 clicks, downloads a JSON file)
5. 🔑 Walk you through making the API key (2 clicks)
6. 🔌 Wire everything up automatically and test it

You'll be done in ~5 minutes. The wizard never asks more than one thing at a time.

When you see ✅ Setup complete — type `/seo` in any project to use it.

---

## 🟡 DIY path — for terminal-fluent users

If you'd rather click through Google Cloud yourself, see [MCP_SETUP.md](MCP_SETUP.md). It's the same steps, just without hand-holding.

Or just install and run `/seo-setup` anyway — it skips steps you've already done.

---

## What you need before starting

- A Google account (free) — for Search Console + PageSpeed APIs
- Claude Code installed
- ~5 minutes
- Your site live somewhere (or about to be)

That's the whole list. No credit card. No SaaS subscriptions. No DataForSEO key.

---

## Stuck?

Run this in your terminal to check what's working and what isn't:

```bash
~/projects/seo-superpower/scripts/check.sh
```

It'll print a green ✅ or red ❌ for each requirement and tell you the exact fix.

Or just type `/seo-setup` again — it's idempotent. It'll skip what's already done and resume from where you stopped.
