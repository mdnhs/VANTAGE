import { ImageResponse } from 'next/og';

const size = { width: 1200, height: 630 };

// The generated "Vantage" share card, used when no share image is set (GENERATED_OG in lib/seo).
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#ffffff',
        fontSize: 96,
        fontWeight: 700,
      }}
    >
      Vantage
    </div>,
    { ...size },
  );
}
