// lib/json-ld.ts — Organization + WebSite schema generators.
// Inject the output into the root layout via a <script type="application/ld+json"> tag.
// Reference: https://schema.org/Organization, https://schema.org/WebSite
// Note: @type is "WebSite" (capital S) — schema.org is case-sensitive.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

export function organizationSchema(opts: {
  name: string;
  logoUrl?: string;          // absolute URL, ideally 112x112+ PNG/SVG
  sameAs?: string[];         // social profile URLs (Twitter, LinkedIn, etc.)
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: opts.name,
    url: SITE,
    ...(opts.logoUrl && { logo: opts.logoUrl }),
    ...(opts.sameAs?.length && { sameAs: opts.sameAs }),
  };
}

export function websiteSchema(opts: {
  name: string;
  searchUrlTemplate?: string; // e.g. https://site.com/search?q={search_term_string}
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: opts.name,
    url: SITE,
    ...(opts.searchUrlTemplate && {
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: opts.searchUrlTemplate,
        },
        'query-input': 'required name=search_term_string',
      },
    }),
  };
}
