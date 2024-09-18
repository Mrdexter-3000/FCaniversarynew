import { frames } from "./frames";
import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { getFarcasterUserData } from "../getFacasterUserData";
import { ImageResponse } from '@vercel/og';

config();

const AIRSTACK_API_KEY = process.env.AIRSTACK_API_KEY || '';
if (!AIRSTACK_API_KEY) {
  console.error("AIRSTACK_API_KEY is not set in the environment variables");
}

const userCache: { [fid: string]: { timestamp: number, lastChecked: number } } = {};

function calculateAnniversary(createdAtTimestamp: number): string {
  const createdAt = new Date(createdAtTimestamp * 1000);
  const now = new Date();
  
  if (createdAt > now) {
    return "Not joined yet";
  }
  
  let years = now.getFullYear() - createdAt.getFullYear();
  let months = now.getMonth() - createdAt.getMonth();
  let days = now.getDate() - createdAt.getDate();

  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }

  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  let result = '';
  if (years > 0) result += `${years} year${years > 1 ? 's' : ''} `;
  if (months > 0) result += `${months} month${months > 1 ? 's' : ''} `;
  if (days > 0) result += `${days} day${days > 1 ? 's' : ''}`;

  return result.trim() || 'Today';
}

async function generateOGImage(fid: string | null, joinDate: string | null, anniversary: string | null, isError: boolean = false, errorMessage: string = '', isInitial: boolean = false): Promise<string> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const params = new URLSearchParams({
    fid: fid || '',
    joinDate: joinDate || '',
    anniversary: anniversary || '',
    isError: isError.toString(),
    errorMessage: errorMessage,
    isInitial: isInitial.toString(),
  });
  const imageUrl = `${baseUrl}/api/og?${params.toString()}`;
  console.log('Requesting OG image from:', imageUrl);
  
  try {
    const response = await fetch(imageUrl);
    console.log('OG image response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error generating OG image:', error);
    // Return a fallback image or throw an error
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
  }
}


function clearCache(fid?: string) {
  if (fid) {
    delete userCache[fid];
    console.log(`Cache cleared for FID ${fid}`);
  } else {
    Object.keys(userCache).forEach(key => delete userCache[key]);
    console.log("Entire cache cleared");
  }
}

const handleRequest = frames(async (ctx) => {
  try {
    if (!ctx.request) {
      throw new Error("No request in context");
    }

    console.log("Request method:", ctx.request.method);

    if (ctx.request.method === 'POST') {
      try {
        const body = await ctx.request.json();
        console.log("Request body:", JSON.stringify(body, null, 2));

        const message = body.untrustedData;
        if (!message) {
          throw new Error("Invalid Farcaster Frame message");
        }

        const fid = message.fid;
        if (!fid) {
          throw new Error("Invalid Farcaster Frame message: Missing FID");
        }

        console.log(`Fetching data for FID: ${fid}`);
        const createdAtTimestamp = await getFarcasterUserData(fid.toString());
        if (createdAtTimestamp === null) {
          throw new Error("Unable to retrieve valid user data");
        }

        const joinDate = new Date(createdAtTimestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const anniversary = calculateAnniversary(createdAtTimestamp);

        console.log(`FID: ${fid}, Timestamp: ${createdAtTimestamp}, Join Date: ${joinDate}, Anniversary: ${anniversary}`);

        const pngBase64 = await generateOGImage(fid.toString(), joinDate, anniversary, false, '', false);

        const shareText = `I joined Farcaster on ${joinDate} and have been a member for ${anniversary}! Check your Farcaster anniversary: `;
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/frames`;

        return {
          image: `data:image/png;base64,${pngBase64}`,
          buttons: [
            { label: "Share", action: "post" },
            { label: "Check Again", action: "post" },
          ],
          ...(message.buttonIndex === 1 ? { postUrl: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}` } : {}),
          ogImage: `data:image/png;base64,${pngBase64}`,
          title: "My Farcaster Anniversary",
          description: `I joined Farcaster on ${joinDate} and have been a member for ${anniversary}!`,
        };
      } catch (error) {
        console.error("Error processing POST request:", error);
        return await handleError(error);
      }
    } else {
      // Initial frame content
      return await generateInitialFrame();
    }
  } catch (error) {
    console.error("Unhandled error in handleRequest:", error);
    return await handleError(error);
  }
});

async function handleError(error: unknown): Promise<any> {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  const errorImageBase64 = await generateOGImage(null, null, null, true, errorMessage);
  return {
    image: errorImageBase64,
    buttons: [{ label: "Retry", action: "post" }],
    ogImage: errorImageBase64,
    title: "Farcaster Anniversary Frame Error",
    description: "An error occurred while processing your Farcaster anniversary information.",
  };
}

async function generateInitialFrame(): Promise<any> {
  const initialImageBase64 = await generateOGImage(null, null, null, false, '', true);
  return {
    image: initialImageBase64,
    buttons: [
      { label: "Check Anniversary", action: "post" },
    ],
    ogImage: initialImageBase64,
    title: "Check Your Farcaster Anniversary",
    description: "Find out when you joined Farcaster and how long you've been a member!",
  };
}

export const GET = handleRequest;
export const POST = handleRequest;