import { frames } from "./frames";
import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { getFarcasterUserData } from "../getFacasterUserData";

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

async function generatePNG(fid: string | null, joinDate: string | null, anniversary: string | null, isError: boolean = false, errorMessage: string = ''): Promise<Buffer> {
  const width = 1146;
  const height = 600;
  const fontBase64 = '...';

  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <style type="text/css">
        @font-face {
          font-family: 'Inter';
          src: url(data:application/font-woff2;charset=utf-8;base64,${fontBase64}) format('woff2');
          font-weight: normal;
          font-style: normal;
        }
      </style>
      ${isError 
        ? `<text x="50%" y="50%" class="text error" text-anchor="middle">${errorMessage}</text>`
        : fid
          ? `
            <text x="50%" y="150" class="text title" text-anchor="middle">Farcaster Anniversary</text>
            <text x="50%" y="250" class="text info" text-anchor="middle">FID: ${fid}</text>
            <text x="50%" y="350" class="text info" text-anchor="middle">Joined: ${joinDate}</text>
            <text x="50%" y="450" class="text info" text-anchor="middle">Member for: ${anniversary}</text>
          `
          : `<text x="50%" y="300" class="text title" text-anchor="middle">Check Your Farcaster Anniversary</text>`
      }
    </svg>
  `;

  const svgBuffer = Buffer.from(svgContent);
  return sharp(svgBuffer).png().toBuffer();
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

        const pngBuffer = await generatePNG(fid.toString(), joinDate, anniversary);
        const pngBase64 = pngBuffer.toString('base64');

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
  const errorPngBuffer = await generatePNG(null, null, null, true, errorMessage);
  const errorPngBase64 = errorPngBuffer.toString('base64');
  return {
    image: `data:image/png;base64,${errorPngBase64}`,
    buttons: [{ label: "Retry", action: "post" }],
    ogImage: `data:image/png;base64,${errorPngBase64}`,
    title: "Farcaster Anniversary Frame Error",
    description: "An error occurred while processing your Farcaster anniversary information.",
  };
}

async function generateInitialFrame(): Promise<any> {
  const initialPngBuffer = await generatePNG(null, null, null);
  const initialPngBase64 = initialPngBuffer.toString('base64');
  return {
    image: `data:image/png;base64,${initialPngBase64}`,
    buttons: [
      { label: "Check Anniversary", action: "post" },
    ],
    ogImage: `data:image/png;base64,${initialPngBase64}`,
    title: "Check Your Farcaster Anniversary",
    description: "Find out when you joined Farcaster and how long you've been a member!",
  };
}

export const GET = handleRequest;
export const POST = handleRequest;