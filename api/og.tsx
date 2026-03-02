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

    return new ImageResponse(
      <div
        style={{
          backgroundColor: '#000000',
          backgroundSize: '150px 150px',
          height: '100%',
          width: '100%',
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          flexWrap: 'nowrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            justifyItems: 'center',
          }}
        >
          {/* Minimalist bird logo block */}
          <div
            style={{
              display: 'flex',
              height: 80,
              width: 80,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: 48,
              marginBottom: 20,
            }}
          >
            🦜
          </div>
        </div>

        <div
          style={{
            fontSize: 60,
            fontStyle: 'normal',
            fontWeight: 'bold',
            letterSpacing: '-0.025em',
            color: 'white',
            marginTop: 30,
            padding: '0 120px',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
          }}
        >
          {hasWorkspace
            ? `Parrit Workspace: ${workspace}`
            : 'Parrit: Modern Pairing'}
        </div>

        {pairsCount && (
          <div
            style={{
              fontSize: 32,
              fontStyle: 'normal',
              color: '#93c5fd' /* Brand 300 */,
              marginTop: 20,
            }}
          >
            {pairsCount} active pairs today
          </div>
        )}
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
