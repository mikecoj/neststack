import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'NestStack — Enterprise-Grade NestJS Packages';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '80px',
          fontWeight: 800,
          color: '#f1f5f9',
          letterSpacing: '-3px',
          marginBottom: '32px',
        }}
      >
        NestStack
      </div>
      <div
        style={{
          fontSize: '30px',
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: '880px',
          lineHeight: '1.5',
          marginBottom: '56px',
        }}
      >
        Enterprise-grade NestJS packages for type-safe configuration, secret management, and more.
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        {['Type-Safe', 'Zod Validated', 'Immutable', '100% Tested'].map((tag) => (
          <div
            key={tag}
            style={{
              background: '#1e3a5f',
              color: '#60a5fa',
              padding: '10px 24px',
              borderRadius: '50px',
              fontSize: '22px',
              fontWeight: 600,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
