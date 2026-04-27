// app/opengraph-image.tsx — default OG image for the whole site.
// Next renders this with the Edge runtime via @vercel/og's ImageResponse.
// Output is 1200x630, well under 1MB. Per-route OG images can override.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Site preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// TODO: replace with the real site name + tagline.
const SITE_NAME = 'Your Site';
const TAGLINE = 'A short description that shows up in social cards.';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 36, marginTop: 24, opacity: 0.8, maxWidth: 900 }}>
          {TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
