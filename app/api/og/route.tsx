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

    const backgroundImage = isInitial ? '/initial-background.png' : '/result-background.png';

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
          {isError ? (
            <div style={{ color: 'red', fontSize: 24, backgroundColor: 'rgba(255,255,255,0.8)', padding: '10px' }}>{errorMessage}</div>
          ) : isInitial ? (
            <div style={{ fontSize: 48, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.8)', padding: '20px' }}>Check Your Farcaster Anniversary</div>
          ) : (
            <>
              <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.8)', padding: '10px' }}>Farcaster Anniversary</div>
              <div style={{ fontSize: 24, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px' }}>FID: {fid}</div>
              <div style={{ fontSize: 24, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px' }}>Joined: {joinDate}</div>
              <div style={{ fontSize: 24, backgroundColor: 'rgba(255,255,255,0.8)', padding: '5px' }}>Member for: {anniversary}</div>
            </>
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