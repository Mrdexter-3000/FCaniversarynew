import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const joinDate = searchParams.get('joinDate');
    const anniversary = searchParams.get('anniversary');
    const isError = searchParams.get('isError') === 'true';
    const errorMessage = searchParams.get('errorMessage');
    const isInitial = searchParams.get('isInitial') === 'true';

    console.log('OG Image params:', { fid, joinDate, anniversary, isError, errorMessage, isInitial });
    console.log('Rendering text:', !isInitial && !isError);

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3001';
    const backgroundImage = isInitial
      ? `${baseUrl}/initial-background.png`
      : `${baseUrl}/result-background.png`;

    console.log('Using background image:', backgroundImage);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '20px',
              borderRadius: '10px',
            }}
          >
            {isInitial ? (
              <span style={{ fontSize: 36, fontWeight: 'bold', textAlign: 'center' }}>
                Check Your Farcaster Anniversary
              </span>
            ) : isError ? (
              <span style={{ color: 'red', fontSize: 24 }}>{errorMessage}</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 24 }}>
                  Farcaster Anniversary
                </span>
                <span style={{ fontSize: 24, marginBottom: 12 }}>FID: {fid}</span>
                <span style={{ fontSize: 24, marginBottom: 12 }}>Joined: {joinDate}</span>
                <span style={{ fontSize: 24 }}>Member for: {anniversary}</span>
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1146,
        height: 600,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}