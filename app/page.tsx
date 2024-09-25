import { fetchMetadata } from "frames.js/next";
import type { Metadata } from "next";
import { appURL } from "./utils";
import { generateOGImage } from './utils';

export async function generateMetadata(): Promise<Metadata> {
  let baseUrl = process.env.APP_URL || process.env.VERCEL_URL || 'http://localhost:3001';
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  const frameMetadata = await fetchMetadata(new URL("/frames", baseUrl));
  const searchParams = new URLSearchParams(frameMetadata.requestUrl?.toString() || '');
  const isResult = searchParams.get('isResult') === 'true';
  const isShare = searchParams.get('isShare') === 'true';
  const fid = searchParams.get('fid');

  let imageUrl: string;
  if (isResult || isShare) {
    if (!fid) {
      throw new Error("Missing FID in result or share frame");
    }
    const response = await fetch(`${baseUrl}/frames?isResult=true&isShare=true&fid=${fid}`);
    const data = await response.json();
    imageUrl = data.image;
  } else {
    imageUrl = `${baseUrl}/initial-animation.gif`;
  }

  return {
    title: "Farcaster Anniversary Frame",
    description: "Check your Farcaster join date and anniversary",
    openGraph: {
      title: "Farcaster Anniversary Frame",
      description: "Check your Farcaster join date and anniversary",
      images: [{ url: imageUrl }],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:button:1": isResult || isShare ? "Check Again" : "Check Anniversary",
      "fc:frame:post_url": `${baseUrl}/frames`,
    },
  };
}

export default async function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to Farcaster Anniversary Frame!</h1>
      <p className="text-xl text-gray-700">This is a Frame to check your Farcaster join date and anniversary.</p>
    </div>
  );
}