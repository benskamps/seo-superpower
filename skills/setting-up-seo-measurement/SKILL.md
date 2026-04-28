---
name: setting-up-seo-measurement
description: Use when bootstrapping SEO measurement on a new or existing site — verifying Google Search Console, submitting a sitemap, wiring GA4 or Plausible analytics, enabling Bing Webmaster Tools, or laying groundwork for AI-citation (GEO) tracking. Triggers on "set up Google Search Console", "verify domain", "submit sitemap", "GA4 setup", "measure SEO", "track AI citations", "connect GSC". Pairs with `/seo-setup` (credentials) and runs once at site bootstrap; every other skill in this plugin assumes GSC is already streaming data.
---

# Setting Up SEO Measurement

You can't optimize what you don't measure. Before `auditing-technical-seo` can find crawl issues or `finding-underserved-keywords` can mine GSC for low-CTR opportunities, the measurement stack has to be live and accumulating data. This skill is the foundation. Run it once per site.

## The three measurement stacks

**Mandatory — Google Search Console (GSC).** The keystone. `gsc-mcp` reads from this. Without it, every other skill in this plugin is hand-waving. Free, ~10 minute setup, takes 3–7 days before the first useful data arrives.

**Strongly recommended — GA4 or Plausible.** Tells you what users do *after* they land. Not strictly required for this plugin's skills, but invaluable for context. Plausible (or Vercel Analytics, Fathom) is the privacy-friendly default for indie founders in 2026 — no cookie banner, simpler dashboard, EU-safe. Use GA4 only if you need its conversion attribution depth.

**Optional — Bing Webmaster Tools + GEO tracking.** Bing is still worth 10 minutes in 2026: it powers ChatGPT search, Copilot, and DuckDuckGo, and the GSC sitemap can be imported in one click. GEO (Generative Engine Optimization) tracking comes via the planned `geo-check` MCP — set the baseline now, the tooling lands in v2.

## Setup flow

1. **Verify the domain in GSC.** Always pick **Domain property**, never URL-prefix. Domain property covers `www`, apex, all subdomains, and both http/https in one record. It requires a DNS TXT record (no HTML-file or meta-tag fallback). Worth the 5 extra minutes — URL-property pain compounds forever.
2. **Submit `sitemap.xml`** under Indexing → Sitemaps. GSC typically picks up new sitemaps within 24–48 hours; first useful Performance data lands at 3–7 days.
3. **Wait ~7 days** before running `auditing-technical-seo`. Wait 90+ days before `finding-underserved-keywords` — that skill needs enough impression history to spot real low-CTR patterns.
4. **Connect GA4 or Plausible.** Track *both* `www` and apex on the same property/site, or one will look dead. (See common mistakes.)
5. **Optional: enable Bing Webmaster Tools.** Sign in, "Import from GSC", done. Free coverage of ChatGPT's search index.
6. **Optional: enable IndexNow.** Supported by Bing, Yandex, Seznam, Naver, and DuckDuckGo (Google still ignores it as of 2026). Push a ping on every content publish/update for near-instant re-crawl. A single `POST` per URL.

## DNS TXT record setup (the usual stumbling block)

GSC gives you a string like `google-site-verification=abc123…`. Add it as a TXT record at the apex (`@`).

- **Vercel:** Project → Settings → Domains → manage DNS → Add Record → Type `TXT`, Name `@`, Value `google-site-verification=…`. Propagation: usually <5 min.
- **Cloudflare:** DNS → Add record → Type `TXT`, Name `@`, Content `google-site-verification=…`, Proxy status: DNS only (orange cloud doesn't matter for TXT, but be explicit). Propagation: ~1 min.
- **Squarespace:** Settings → Domains → DNS → Custom Records → `@` `TXT` `google-site-verification=…`. Propagation: 5–30 min, sometimes painful.

After adding, hit **Verify** in GSC. If it fails, wait 10 minutes and retry — DNS caches lie.

## Verifying GSC is working

Once verified, run a `gsc-mcp` ping test (the plugin command stub):

```
gsc-mcp ping --site sc-domain:example.com
```

Should return property metadata + a `dataAvailable: false` until ~day 3. If it stays empty past day 7: re-check the sitemap submitted successfully, confirm pages aren't `noindex`'d, and confirm the property is `sc-domain:` (Domain) not `https://`-prefixed (URL).

## GEO measurement preview

When `geo-check` MCP ships (v2), it will run a monthly poll across ChatGPT, Claude, Perplexity, and Gemini for your top 20 commercial keywords and log which sources each engine cites. Until then: pick those 20 keywords now, save them in `seo/geo-keywords.txt`, and manually spot-check once a month so you have a baseline when the tool arrives.

## Common mistakes

- **URL-property-only verification.** Misses every subdomain. Always Domain property.
- **Sitemap submitted before pages are indexable.** 404s and `noindex` URLs in a sitemap erode crawl trust. Audit indexability first.
- **GA4 / analytics tracking only one of www or apex.** Cost roadtripper.ai a week of "why is traffic flat?" before we noticed half the visits weren't being recorded. Always cover both.
- **Forgetting to enable site verification on Vercel for prod-only.** Preview deploys can swallow the verification meta tag if you used HTML-file verification. Domain-property + DNS TXT sidesteps this entirely.
- **Confusing GSC with GA4.** GSC = how Google sees your site (impressions, queries, crawl). GA4 = how users behave after landing. You need both; they answer different questions.

## Quick reference

| Tool | Measures | Cost | Setup |
|---|---|---|---|
| Google Search Console | Impressions, queries, crawl, indexing | Free | ~10 min |
| GA4 | User behavior, conversions | Free | ~20 min |
| Plausible / Vercel Analytics | Privacy-friendly traffic | $9+/mo or included | ~5 min |
| Bing Webmaster Tools | Bing/ChatGPT visibility | Free | ~5 min (import from GSC) |
| IndexNow | Fast re-crawl ping | Free | ~10 min (one endpoint) |
| `geo-check` MCP (v2) | AI citation tracking | Free, plugin | Pending |

## Lifecycle

**Initial phase only.** Run once at site bootstrap. Re-run only on domain changes, migrations, or analytics platform swaps.

## What next

- Once GSC has 7+ days of data → `auditing-technical-seo`.
- Once GSC has 90+ days of data → `finding-underserved-keywords`.
