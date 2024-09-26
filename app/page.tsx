import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { appURL } from "./utils";
import { generateOGImage } from './utils';

export async function generateMetadata(): Promise<Metadata> {
  let baseUrl = process.env.APP_URL || process.env.VERCEL_URL || 'http://localhost:3001';
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  const frameMetadata = await fetchMetadata(new URL("/frames", baseUrl));

  // Generate the initial frame image URL
  const initialImageUrl = `${baseUrl}/initial-animation-optimized.gif`;

  return {
    title: "Farcaster Anniversary Frame",
    description: "Check your Farcaster join date and anniversary",
    openGraph: {
      title: "Farcaster Anniversary Frame",
      description: "Check your Farcaster join date and anniversary",
      images: [{ url: initialImageUrl }],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": initialImageUrl,
      "fc:frame:button:1": "Check Anniversary",
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
