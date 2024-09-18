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
  
      console.log('OG Image params:', { fid, joinDate, anniversary, isError, errorMessage });
  
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
              backgroundColor: '#f0f0f0',
              fontFamily: 'sans-serif',
            }}
          >
            {isError ? (
              <div style={{ color: 'red', fontSize: 24 }}>{errorMessage}</div>
            ) : fid ? (
              <>
                <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 24 }}>Farcaster Anniversary</div>
                <div style={{ fontSize: 24, marginBottom: 12 }}>FID: {fid}</div>
                <div style={{ fontSize: 24, marginBottom: 12 }}>Joined: {joinDate}</div>
                <div style={{ fontSize: 24 }}>Member for: {anniversary}</div>
              </>
            ) : (
              <div style={{ fontSize: 48, fontWeight: 'bold' }}>Check Your Farcaster Anniversary</div>
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