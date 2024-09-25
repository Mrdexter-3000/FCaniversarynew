import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const bungeeFont = fetch(
  new URL('../../assets/Bungee-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const tomorrowLightFont = fetch(
  new URL('../../assets/Tomorrow/Tomorrow-Light.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const tomorrowRegularFont = fetch(
  new URL('../../assets/Tomorrow/Tomorrow-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const tomorrowBoldFont = fetch(
  new URL('../../assets/Tomorrow/Tomorrow-Bold.ttf', import.meta.url)
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
    const username = searchParams.get('username');

    console.log('OG Image params:', { fid, joinDate, anniversary, isError, errorMessage, isInitial, awesomeText, username });

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3001';
    const backgroundImage = isInitial
      ? `${baseUrl}/initial-background.png`
      : `${baseUrl}/result-background.png`;

    console.log('Using background image:', backgroundImage);

    const bungeeFontData = await bungeeFont;
    const tomorrowLightFontData = await tomorrowLightFont;
    const tomorrowRegularFontData = await tomorrowRegularFont;
    const tomorrowBoldFontData = await tomorrowBoldFont;


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
            fontWeight: '400',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backgroundBlendMode: 'normal',
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
                {username && (
                  <span style={{ fontSize: 36, fontWeight: 'normal', color: '#ffffff', marginBottom: 12 }}>
                    
                  </span>
                )}
                <span style={{
                  fontFamily: 'Bungee',
                  backgroundImage: 'linear-gradient(90deg, rgb(0, 124, 240), rgb(0, 223, 216))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: 60,
                  
                  fontWeight: '400',
                  
                }}>
                  Your Farcaster Journey
                </span>    
                <span style={{fontFamily: 'Tomorrow',  
                textAlign: 'center', fontSize: 36, 
                fontWeight: '700', 
                
               
                color: 'white',
                margin: '34px 0px' 
                }}>
                  {awesomeText}
                </span>
                
                <span style={{ fontFamily: 'Tomorrow', fontSize: 27, fontWeight: '400', color: '#ffffff', marginBottom: 12 }}>Genesis Day: {joinDate}</span>
                <span style={{ fontFamily: 'Tomorrow', fontSize: 27, fontWeight: '400', color: '#ffffff' }}>My Farcaster Age: {anniversary}</span>
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
            data: bungeeFontData,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Tomorrow',
            data: tomorrowLightFontData,
            style: 'normal',
            weight: 300,
          },
          {
            name: 'Tomorrow',
            data: tomorrowRegularFontData,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Tomorrow',
            data: tomorrowBoldFontData,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}