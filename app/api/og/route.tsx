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

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
    const backgroundImage = isInitial ? `${baseUrl}/initial-background.png` : `${baseUrl}/result-background.png`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            fontFamily: 'sans-serif',
          }}
        >
          {!isInitial && !isError && (
            <>
              <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.8)', padding: '10px' }}>Farcaster Anniversary</div>
              <div style={{ fontSize: 24, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px' }}>FID: {fid}</div>
              <div style={{ fontSize: 24, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px' }}>Joined: {joinDate}</div>
              <div style={{ fontSize: 24, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px' }}>Member for: {anniversary}</div>
            </>
          )}
          {isError && (
            <div style={{ color: 'red', fontSize: 24, backgroundColor: 'rgba(255,255,255,0.8)', padding: '10px' }}>{errorMessage}</div>
          )}
        </div>
      ),
      {
        width: 1146,
        height: 600,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image: ' + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}