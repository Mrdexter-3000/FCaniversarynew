import { frames } from "./frames";
import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { getFarcasterUserData } from "../getFacasterUserData";
import { createCanvas, loadImage } from 'canvas';

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

async function generatePNG(
  screenType: 'splash' | 'score' | 'anniversary' | 'error',
  data: { fid?: string; joinDate?: string; anniversary?: string; errorMessage?: string }
): Promise<Buffer> {
  const width = 1146;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Set text styles
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  switch (screenType) {
    case 'splash':
      ctx.fillStyle = '#333';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('Welcome to Farcaster Anniversary', width / 2, height / 2);
      ctx.font = '36px Arial';
      ctx.fillText('Click to check your anniversary!', width / 2, height / 2 + 50);
      break;
    case 'score':
      ctx.fillStyle = '#333';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('Your Farcaster Score', width / 2, height / 3);
      ctx.font = '36px Arial';
      ctx.fillText(`FID: ${data.fid}`, width / 2, height / 2);
      ctx.fillText(`Member for: ${data.anniversary}`, width / 2, height / 2 + 50);
      break;
    case 'anniversary':
      ctx.fillStyle = '#333';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('Farcaster Anniversary', width / 2, height / 5);
      ctx.font = '36px Arial';
      ctx.fillText(`FID: ${data.fid}`, width / 2, height / 3);
      ctx.fillText(`Joined: ${data.joinDate}`, width / 2, height / 2);
      ctx.fillText(`Member for: ${data.anniversary}`, width / 2, height / 1.5);
      break;
    case 'error':
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px Arial';
      ctx.fillText(data.errorMessage || 'An unexpected error occurred', width / 2, height / 2);
      break;
  }

  return canvas.toBuffer('image/png');
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

        const anniversaryPngBuffer = await generatePNG('anniversary', { fid: fid.toString(), joinDate, anniversary });
        const anniversaryPngBase64 = anniversaryPngBuffer.toString('base64');

        const scorePngBuffer = await generatePNG('score', { fid: fid.toString(), anniversary });
        const scorePngBase64 = scorePngBuffer.toString('base64');

        const shareText = `I joined Farcaster on ${joinDate} and have been a member for ${anniversary}! Check your Farcaster anniversary: `;
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/frames`;

        return {
          image: `data:image/png;base64,${anniversaryPngBase64}`,
          buttons: [
            { label: "View Score", action: "post" },
            { label: "Share", action: "post" },
            { label: "Check Again", action: "post" },
          ],
          ...(message.buttonIndex === 1 ? { image: `data:image/png;base64,${scorePngBase64}` } : {}),
          ...(message.buttonIndex === 2 ? { postUrl: `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}` } : {}),
          ogImage: `data:image/png;base64,${anniversaryPngBase64}`,
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
  const errorPngBuffer = await generatePNG('error', { errorMessage });
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
  const splashPngBuffer = await generatePNG('splash', {});
  const splashPngBase64 = splashPngBuffer.toString('base64');
  return {
    image: `data:image/png;base64,${splashPngBase64}`,
    buttons: [
      { label: "Check Anniversary", action: "post" },
    ],
    ogImage: `data:image/png;base64,${splashPngBase64}`,
    title: "Check Your Farcaster Anniversary",
    description: "Find out when you joined Farcaster and how long you've been a member!",
  };
}

export const GET = handleRequest;
export const POST = handleRequest;