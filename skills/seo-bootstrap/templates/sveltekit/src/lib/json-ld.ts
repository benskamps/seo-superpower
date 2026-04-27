// src/lib/json-ld.ts — schema generators for SvelteKit.
// Use in src/routes/+layout.svelte:
//
//   <script lang="ts">
//     import { organizationSchema, websiteSchema } from '$lib/json-ld';
//     const orgLd = organizationSchema({ name: 'Your Site', logoUrl: '...' });
//     const siteLd = websiteSchema({ name: 'Your Site' });
//   </script>
//   <svelte:head>
//     {@html `<script type="application/ld+json">${JSON.stringify(orgLd)}</script>`}
//     {@html `<script type="application/ld+json">${JSON.stringify(siteLd)}</script>`}
//   </svelte:head>

const SITE = 'https://example.com';

export function organizationSchema(opts: {
  name: string;
  logoUrl?: string;
  sameAs?: string[];
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

// @type is "WebSite" with capital S — schema.org is case-sensitive.
export function websiteSchema(opts: {
  name: string;
  searchUrlTemplate?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: opts.name,
    url: SITE,
    ...(opts.searchUrlTemplate && {
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: opts.searchUrlTemplate },
        'query-input': 'required name=search_term_string',
      },
    }),
  };
}
