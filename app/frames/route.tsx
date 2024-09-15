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
  let svg: string;
  if (isError) {
    svg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" fill="#f0f0f0"/>
        <text x="300" y="180" font-family="Arial" font-size="24" fill="red" text-anchor="middle">An error occurred</text>
        <text x="300" y="220" font-family="Arial" font-size="20" fill="black" text-anchor="middle">${errorMessage}</text>
        <text x="300" y="260" font-family="Arial" font-size="20" fill="black" text-anchor="middle">Please try again</text>
      </svg>
    `;
  } else if (!fid || !joinDate || !anniversary) {
    svg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" fill="#f0f0f0"/>
        <text x="300" y="180" font-family="Arial" font-size="24" fill="black" text-anchor="middle">Welcome to Farcaster Anniversary Frame!</text>
        <text x="300" y="220" font-family="Arial" font-size="20" fill="black" text-anchor="middle">Click the button to check your join date and anniversary.</text>
      </svg>
    `;
  } else {
    const isOG = parseInt(fid) < 20000;
    svg = `
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="400" fill="#f0f0f0"/>
        <text x="300" y="140" font-family="Arial" font-size="24" fill="black" text-anchor="middle">Your FID is ${fid}</text>
        <text x="300" y="180" font-family="Arial" font-size="20" fill="black" text-anchor="middle">You joined Farcaster on ${joinDate}</text>
        <text x="300" y="220" font-family="Arial" font-size="20" fill="black" text-anchor="middle">You've been on Farcaster for ${anniversary}</text>
        ${isOG ? '<text x="300" y="260" font-family="Arial" font-size="24" font-weight="bold" fill="black" text-anchor="middle">You\'re OG!</text>' : ''}
      </svg>
    `;
  }

  return await sharp(Buffer.from(svg)).png().toBuffer();
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
          ...(message.buttonIndex === 1 ? { postUrl: `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${shareUrl}` } : {}),
          ogImage: `data:image/png;base64,${pngBase64}`,
          title: "My Farcaster Anniversary",
          description: `I joined Farcaster on ${joinDate} and have been a member for ${anniversary}!`,
        };
      } catch (error) {
        console.error("Error processing POST request:", error);
        const errorPngBuffer = await generatePNG(null, null, null, true, (error as Error).message);
        const errorPngBase64 = errorPngBuffer.toString('base64');
        return {
          image: `data:image/png;base64,${errorPngBase64}`,
          buttons: [{ label: "Retry", action: "post" }],
          ogImage: `data:image/png;base64,${errorPngBase64}`,
          title: "Farcaster Anniversary Frame Error",
          description: "An error occurred while processing your Farcaster anniversary information.",
        };
      }
    } else {
      // Initial frame content
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
  } catch (error) {
    console.error("Unhandled error in handleRequest:", error);
    const errorPngBuffer = await generatePNG(null, null, null, true, 'An unexpected error occurred');
    const errorPngBase64 = errorPngBuffer.toString('base64');
    return {
      image: `data:image/png;base64,${errorPngBase64}`,
      buttons: [{ label: "Retry", action: "post" }],
      ogImage: `data:image/png;base64,${errorPngBase64}`,
      title: "Farcaster Anniversary Frame Error",
      description: "An unexpected error occurred while processing your Farcaster anniversary information.",
    };
  }
});

export const GET = handleRequest;
export const POST = handleRequest;