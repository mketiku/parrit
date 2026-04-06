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

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            height: '100%',
            padding: '60px 80px',
            position: 'relative',
          }}
        >
          {/* Logo row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                height: 72,
                width: 72,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                fontSize: 40,
                boxShadow: '0 0 40px rgba(99,102,241,0.5)',
              }}
            >
              🦜
            </div>
            <span
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              parrit.org
            </span>
          </div>

          {/* Main headline */}
          {isHomepage ? (
            <>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: 24,
                  display: 'flex',
                }}
              >
                Pair programming,
                <br />
                beautifully organized.
              </div>
              <div
                style={{
                  fontSize: 30,
                  color: '#a5b4fc',
                  lineHeight: 1.5,
                  display: 'flex',
                  maxWidth: 700,
                }}
              >
                Visual drag-and-drop rotation boards for engineering teams. Open
                source. Free forever.
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 28,
                  color: '#a5b4fc',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                  display: 'flex',
                }}
              >
                Parrit Workspace
              </div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: 24,
                  display: 'flex',
                }}
              >
                {workspace}
              </div>
              {pairsCount ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 12,
                    padding: '12px 24px',
                    marginTop: 8,
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
                      fontSize: 28,
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
                    fontSize: 28,
                    color: '#64748b',
                    display: 'flex',
                  }}
                >
                  Visual pair rotation board
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom-right decorative glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
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
