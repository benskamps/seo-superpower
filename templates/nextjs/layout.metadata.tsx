// templates/nextjs/layout.metadata.tsx
//   -> merge into app/layout.tsx  (App Router)
//
// `metadataBase` is the one line that decides whether every generated URL is
// absolute. Without it Next emits relative OG/canonical URLs and Google rejects
// the sitemap.

import type { Metadata } from "next";

const SITE = "https://REPLACE-WITH-CANONICAL-ORIGIN";
const SITE_NAME = "REPLACE-WITH-SITE-NAME";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "REPLACE-WITH-DEFAULT-DESCRIPTION",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_NAME,
    description: "REPLACE-WITH-DEFAULT-DESCRIPTION",
  },
  twitter: { card: "summary_large_image" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}#organization`,
      name: SITE_NAME,
      url: SITE,
      logo: `${SITE}/opengraph-image`,
    },
    {
      // "WebSite" — capital S. schema.org is case-sensitive and validators
      // silently drop "Website".
      "@type": "WebSite",
      "@id": `${SITE}#website`,
      name: SITE_NAME,
      url: SITE,
      publisher: { "@id": `${SITE}#organization` },
    },
  ],
};

// Inline JSON-LD is injected as raw HTML, so a literal `<` inside any string
// value would close the <script> early. Escaping `<` as its \u003c form keeps
// the JSON byte-identical to parsers while making that impossible — cheap
// insurance once you swap SITE_NAME/description for real, editable copy.
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Site-wide entity graph. Per-page Article/Product schema is the
            adding-schema-markup skill's job, not bootstrap's. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </body>
    </html>
  );
}
