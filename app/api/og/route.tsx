import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const bungeeFont = fetch(
  new URL('../../assets/Bungee-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const joinDate = searchParams.get('joinDate');
    const anniversary = searchParams.get('anniversary');
    const isError = searchParams.get('isError') === 'true';
    const errorMessage = searchParams.get('errorMessage');
    const isInitial = searchParams.get('isInitial') === 'true';
    const awesomeText = searchParams.get('awesomeText');

    console.log('OG Image params:', { fid, joinDate, anniversary, isError, errorMessage, isInitial, awesomeText });

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3001';
    const backgroundImage = isInitial
      ? `${baseUrl}/initial-background.png`
      : `${baseUrl}/result-background.png`;

    console.log('Using background image:', backgroundImage);

    const fontData = await bungeeFont;

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
            fontFamily: 'Bungee',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'linear-gradient(110.37deg, #6B50A4 -4.1%, rgba(0, 0, 0, 0.3) 118.81%)',
              backgroundBlendMode: 'plus-lighter',
              border: '1px solid rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              padding: '50px',
              margin: '50px',
              backgroundSize: 'cover',
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
                <span style={{
                  backgroundImage: 'linear-gradient(90deg, rgb(255, 77, 77), rgb(249, 203, 40))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: 60,
                  marginBottom: 24,
                }}>
                  Your Farcaster Journey
                </span>    
                <span style={{textIndent: '10px', textAlign: 'center', fontSize: 36, fontWeight: 'normal', color: '#ffffff', marginBottom: 24 }}>
                  {awesomeText}
                </span>
                <span style={{ fontSize: 24, fontWeight: 'normal', color: '#ffffff', marginBottom: 12 }}>FID: {fid}</span>
                <span style={{ fontSize: 24, fontWeight: 'normal', color: '#ffffff', marginBottom: 12 }}>Genesis Day: {joinDate}</span>
                <span style={{ fontSize: 24, fontWeight: 'normal', color: '#ffffff' }}>My Farcaster Age: {anniversary}</span>
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Bungee',
            data: fontData,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}