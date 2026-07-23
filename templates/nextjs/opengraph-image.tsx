// templates/nextjs/opengraph-image.tsx -> copy to app/opengraph-image.tsx
//
// next/og renders this at build time to a 1200x630 PNG, comfortably under the
// 1MB cap Google and Twitter both enforce. No design tool, no binary in the repo.

import { ImageResponse } from "next/og";

export const alt = "REPLACE-WITH-SITE-NAME";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b0b0c",
          color: "#f5f3ef",
          fontSize: 72,
          fontWeight: 600,
          letterSpacing: "-0.03em",
        }}
      >
        <div>REPLACE-WITH-SITE-NAME</div>
        <div style={{ fontSize: 32, fontWeight: 400, marginTop: 24, opacity: 0.72 }}>
          REPLACE-WITH-ONE-LINE-DESCRIPTION
        </div>
      </div>
    ),
    { ...size },
  );
}
