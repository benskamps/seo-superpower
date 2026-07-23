// templates/astro/astro.config.sitemap.mjs
// Merge these two lines into the project's existing astro.config.* — do not
// overwrite the file. `site` is mandatory: without it @astrojs/sitemap emits
// relative URLs and Google rejects the sitemap.
//
// Install first:  npx astro add sitemap     (or: npm i -D @astrojs/sitemap)

import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://REPLACE-WITH-CANONICAL-ORIGIN",
  integrations: [
    sitemap({
      // Keep private and machine routes out of the index.
      filter: (page) => !/\/(admin|api|draft)\//.test(page),
    }),
  ],
});
