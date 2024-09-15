import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { appURL } from "./utils";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = appURL();
  const frameMetadata = await fetchMetadata(
    new URL("/frames", baseUrl)
  );

  const imageUrl = typeof frameMetadata["og:image"] === 'string' 
    ? frameMetadata["og:image"] 
    : `${baseUrl}/default-image.png`;

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
      "fc:frame:button:1": "Check Anniversary",
      "fc:frame:post_url": `${baseUrl}/frames`,
    },
  };
}

export default async function Home() {
  return (
    <div>
      <h1>Welcome to Farcaster Anniversary Frame!</h1>
      <p>This is a Frame to check your Farcaster join date and anniversary.</p>
    </div>
  );
}
