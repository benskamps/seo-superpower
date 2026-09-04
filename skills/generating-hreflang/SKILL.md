---
name: generating-hreflang
description: Use when setting up international and multilingual SEO — configuring hreflang alternate tags, XML sitemap language alternates, x-default fallbacks, and multi-region targeting. Enforces Google's strict bidirectional reciprocity rule, ISO 639-1 language and ISO 3166-1 region validation, and generates framework-native code (Next.js, Astro, SvelteKit) or sitemap entries. Triggers on "hreflang", "multilingual SEO", "multi-language sitemap", "international SEO", "x-default", "localize site for SEO", "alternate language tags", or when expanding a site to multiple locales.
---

# Generating & Configuring Hreflang

## Overview

Hreflang tells search engines which language and regional version of a page to serve based on the searcher's locale. In multilingual setups, misconfigured hreflang tags cause duplicate content cannibalization, wrong-region SERP rankings, and lost international traffic.

Google's hreflang parser is strict and unforgiving: **if alternate links are not bidirectional (reciprocal), Google completely ignores them** [1]. Furthermore, modern AI search engines (ChatGPT, Perplexity, Claude) inspect locale-specific canonicals and alternates to attribute region-specific citations.

The job: map alternate URLs, enforce reciprocal linkage and `x-default`, validate language/region codes against ISO standards, and generate clean HTML tags, XML sitemap blocks, or framework metadata.

---

## The Four Non-Negotiable Hreflang Laws

1. **Bidirectional Reciprocity is Mandatory:**
   - If Page A (`https://example.com/en`) specifies Page B (`https://example.com/es`) as its Spanish alternate, Page B **must** specify Page A as its English alternate.
   - If reciprocity is broken anywhere in the chain, Google discards the tags for both pages [1].
2. **Self-Referential Links are Required:**
   - Every page's alternate set must include an alternate link pointing to itself with its own language tag.
3. **`x-default` Fallback Must Be Defined:**
   - Always include an `x-default` tag pointing to a generic global landing page, language selector, or default language version for users whose locale is not explicitly targeted.
4. **Absolute URLs Only:**
   - Relative URLs (`/es/about`) are invalid in hreflang and ignored by crawlers. All URLs must be fully-qualified absolute HTTPS URLs (`https://example.com/es/about`).

---

## International Architecture Decision Matrix

| Strategy | URL Structure | Best For | Trade-offs |
|---|---|---|---|
| **Subdirectories** *(Recommended)* | `example.com/es/` | SaaS, docs, startups, content sites | Consolidates all domain authority; easy to maintain; low cost. |
| **Subdomains** | `es.example.com` | Distinct multi-region server infrastructure | Splits domain authority; requires separate DNS/SSL; cookie hurdles. |
| **ccTLDs** | `example.es` | Localized e-commerce with in-country legal entities | Highest local trust signal; expensive to buy and maintain multiple domains. |

*Avoid cookie/session-based language switching or IP-auto-redirecting crawlers without offering crawlable alternate URLs.*

---

## The Flow

1. **Inventory Locales & URLs:**
   Create or inspect your locale mapping. Ensure every localized URL has an equivalent translated target.
   Example `hreflang.json`:
   ```json
   [
     {
       "group": "https://example.com/en",
       "alternates": [
         { "lang": "en", "url": "https://example.com/en" },
         { "lang": "es", "url": "https://example.com/es" },
         { "lang": "fr-CA", "url": "https://example.com/fr-ca" },
         { "lang": "x-default", "url": "https://example.com/" }
       ]
     },
     {
       "group": "https://example.com/es",
       "alternates": [
         { "lang": "en", "url": "https://example.com/en" },
         { "lang": "es", "url": "https://example.com/es" },
         { "lang": "fr-CA", "url": "https://example.com/fr-ca" },
         { "lang": "x-default", "url": "https://example.com/" }
       ]
     }
   ]
   ```

2. **Validate with Deterministic Tooling:**
   Run `scripts/hreflang-tool.js` to automatically catch syntax errors, non-reciprocal links, and invalid country codes:
   ```bash
   node scripts/hreflang-tool.js validate hreflang.json --strict
   ```

3. **Generate Tags for Your Stack:**
   - **HTML `<head>` tags:**
     ```bash
     node scripts/hreflang-tool.js generate hreflang.json --format html
     ```
   - **XML Sitemap blocks:**
     ```bash
     node scripts/hreflang-tool.js generate hreflang.json --format xml
     ```
   - **Next.js App Router metadata:**
     ```bash
     node scripts/hreflang-tool.js generate hreflang.json --format nextjs
     ```

4. **Ship via Pull Request:**
   Open a PR with the updated layout metadata, sitemap configuration, or head components. Verify the branch passes CI with `python scripts/ci-validate.py` and `node --test test/hreflang.test.js`.

---

## Code Implementations

### Next.js (App Router)
```typescript
// app/[locale]/layout.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `https://example.com/${locale}`,
      languages: {
        'en': 'https://example.com/en',
        'es': 'https://example.com/es',
        'fr-CA': 'https://example.com/fr-ca',
        'x-default': 'https://example.com/',
      },
    },
  };
}
```

### Astro
```astro
---
// src/layouts/BaseLayout.astro
const { currentLocale } = Astro;
---
<head>
  <link rel="canonical" href={Astro.url.href} />
  <link rel="alternate" hreflang="en" href="https://example.com/en" />
  <link rel="alternate" hreflang="es" href="https://example.com/es" />
  <link rel="alternate" hreflang="fr-CA" href="https://example.com/fr-ca" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/" />
</head>
```

### XML Sitemap Alternates
*(Best when pages have dozens of language variations to prevent HTML `<head>` bloat)*
```xml
<url>
  <loc>https://example.com/en</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/en" />
  <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/" />
</url>
```

---

## What `scripts/hreflang-tool.js validate` actually enforces

Every row below is a hard error (exit 1), not a warning. The point of the tool is
that a `[PASS]` means Google will honour the cluster — so anything Google would
silently ignore has to fail here.

| Check | Rejects | Suggests |
|---|---|---|
| Language subtag | Unassigned (`qq`) and deprecated (`iw`, `in`, `jw`, `mo`, `sh`) ISO 639-1 codes | `iw-IL` → `he-IL` |
| Script subtag | Non-ISO 15924 (`Qqqq`); canonicalises case | `zh-hans` → `zh-Hans` |
| Region subtag | Unassigned (`XX`), reserved (`UK`, `EU`, `UN`), withdrawn (`AN`, `YU`, `SU`) | `en-UK` → `en-GB` |
| Self-referential link | A page-keyed cluster that omits its own URL | — |
| Reciprocity | A → B where B declares a cluster and omits A | — |
| Duplicates | The same hreflang value pointing at two URLs | — |
| URL form | Relative or non-HTTP(S) alternates | — |

Accepted deliberately: UN M.49 numeric areas (`es-419`), three-letter ISO 639-2/3
codes (with a warning to prefer the two-letter form), and the user-assigned `XK`
for Kosovo (with a warning — it is not ISO-official but has no alternative).

The ISO tables in `scripts/iso-codes.js` are generated from ICU rather than typed
by hand, and `test/iso-codes.test.js` re-derives them on every run so they cannot
drift unnoticed.

---

## Common Mistakes & Anti-Patterns

- **Using underscores (`en_US`):** Invalid. Hreflang strictly mandates hyphens (`en-US`).
- **Targeting language with a country code alone (`hreflang="uk"`):** `uk` is the Ukrainian language code, NOT the United Kingdom country code. For UK English, use `en-GB`.
- **Writing `en-UK` for the United Kingdom:** The region subtag must be an *officially assigned* ISO 3166-1 alpha-2 code. `UK` is reserved, never assigned — the country is `GB`. This is the single most common hreflang error in the wild, and it fails silently: Google simply ignores the tag. Same trap for withdrawn codes (`AN`, `YU`, `SU`) and for non-countries (`EU`, `UN`).
- **Missing reciprocal links:** Forgetting to update older localized versions when launching a new language (e.g. adding French without updating English and Spanish to point to French).
- **Pointing hreflang to redirected URLs (301/302):** Alternate links must target the 200 OK canonical URL directly.
- **Translating URLs without translating content:** Creating shallow language shells that share 90% identical English copy results in soft 404 or duplicate content penalties.
