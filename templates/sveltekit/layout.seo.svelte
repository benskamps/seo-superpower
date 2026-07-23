<!--
  templates/sveltekit/layout.seo.svelte
    -> merge into src/routes/+layout.svelte

  Everything head-related in SvelteKit goes through <svelte:head>. Putting the
  site-wide Organization + WebSite JSON-LD in the ROOT layout (not per page)
  means it renders once on every route.
-->
<script lang="ts">
  import { page } from "$app/state";

  const SITE = "https://REPLACE-WITH-CANONICAL-ORIGIN";
  const SITE_NAME = "REPLACE-WITH-SITE-NAME";

  let { children, title = SITE_NAME, description = "REPLACE-WITH-DEFAULT-DESCRIPTION" } = $props();

  const canonical = $derived(new URL(page.url.pathname, SITE).toString());

  // Inline JSON-LD is injected with {@html}, so a literal `<` inside any string
  // value would close the <script> early. Escaping it as \u003c keeps the JSON
  // byte-identical to parsers while making that impossible.
  const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}#organization`,
        name: SITE_NAME,
        url: SITE,
        logo: `${SITE}/og.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}#website`,
        name: SITE_NAME,
        url: SITE,
        publisher: { "@id": `${SITE}#organization` },
      },
    ],
  };
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />

  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={`${SITE}/og.png`} />
  <meta property="og:site_name" content={SITE_NAME} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${SITE}/og.png`} />

  {@html `<script type="application/ld+json">${serializeJsonLd(jsonLd)}<\/script>`}
</svelte:head>

{@render children()}
