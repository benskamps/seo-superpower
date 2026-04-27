// astro.config.mjs — install the official sitemap integration.
// Run: npx astro add sitemap   (or `npm i @astrojs/sitemap` and edit manually).
// Docs: https://docs.astro.build/en/guides/integrations-guide/sitemap/
//
// IMPORTANT: `site` is required for sitemap generation. Without it,
// @astrojs/sitemap will skip generating files at build time.

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    sitemap({
      // Filter out routes you don't want indexed.
      filter: (page) =>
        !page.includes('/admin/') && !page.includes('/draft/'),
      // Optional: explicitly add routes the route scanner can't see.
      // customPages: ['https://example.com/external-landing'],
    }),
  ],
});
