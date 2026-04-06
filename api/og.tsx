import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Dynamic params
    const hasWorkspace = searchParams.has('workspace');
    const workspace = hasWorkspace
      ? searchParams.get('workspace')?.slice(0, 100)
      : 'My Team';

    const pairsCount = searchParams.has('pairs')
      ? searchParams.get('pairs')
      : null;

    const isHomepage = !hasWorkspace;

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative grid dots */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #6366f1, #3b82f6, #06b6d4)',
            display: 'flex',
          }}
        />

        {/* Bottom-right decorative glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 80px',
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Logo row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 36,
            }}
          >
            <div
              style={{
                display: 'flex',
                height: 64,
                width: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                fontSize: 36,
                boxShadow: '0 0 30px rgba(99,102,241,0.5)',
              }}
            >
              🦜
            </div>
            <span
              style={{
                fontSize: 30,
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              parrit.org
            </span>
          </div>

          {/* Headline */}
          {isHomepage ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 58,
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '-0.03em',
                  display: 'flex',
                }}
              >
                Pair programming,
              </div>
              <div
                style={{
                  fontSize: 58,
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '-0.03em',
                  marginBottom: 24,
                  display: 'flex',
                }}
              >
                beautifully organized.
              </div>
              <div
                style={{
                  fontSize: 26,
                  color: '#a5b4fc',
                  display: 'flex',
                  textAlign: 'center',
                  maxWidth: 620,
                }}
              >
                Visual drag-and-drop rotation boards for engineering teams —
                open source, free forever.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  color: '#a5b4fc',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  display: 'flex',
                }}
              >
                Parrit Workspace
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '-0.03em',
                  marginBottom: 24,
                  display: 'flex',
                  textAlign: 'center',
                  maxWidth: 900,
                }}
              >
                {workspace}
              </div>
              {pairsCount ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 12,
                    padding: '10px 24px',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#34d399',
                      display: 'flex',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 26,
                      color: '#a5b4fc',
                      display: 'flex',
                    }}
                  >
                    {pairsCount} active pairs today
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 26,
                    color: '#64748b',
                    display: 'flex',
                  }}
                >
                  Visual pair rotation board
                </div>
              )}
            </div>
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`${error.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
