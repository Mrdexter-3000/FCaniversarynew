import { frames } from "./frames";
import { NextRequest, NextResponse } from "next/server";
import { config } from "dotenv";
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { getFarcasterUserData } from "../getFacasterUserData";
import { generateOGImage } from "../utils";

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

function clearCache(fid?: string) {
  if (fid) {
    delete userCache[fid];
    console.log(`Cache cleared for FID ${fid}`);
  } else {
    Object.keys(userCache).forEach(key => delete userCache[key]);
    console.log("Entire cache cleared");
  }
}

function getAwesomeText(fid: number, username: string | null): string {
  const replaceUsername = (text: string) => text.replace('{username}', username ? `${username}! ` : '');

  if (fid <= 1000) return replaceUsername("wow! {username}You're a Farcaster OG! 🏆");
  if (fid <= 5000) return replaceUsername("amazing! {username}You're a Farcaster pioneer! 🌟");
  if (fid <= 10000) return replaceUsername("fantastic! {username}You're an early Farcaster adopter! 🎉");
  if (fid <= 50000) return replaceUsername("Awesome! {username}You're a Farcaster enthusiast! 🚀");
  if (fid <= 100000) return replaceUsername("great! {username}You're really getting into Farcaster! 💪");
  if (fid <= 500000) return replaceUsername("welcome aboard! {username}You're part of the Farcaster community! 🌱");
  return replaceUsername("welcome to farcaster {username} Your journey begins now! 🎊");
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

        if (message.buttonIndex === 3) {
          clearCache();
          return await generateInitialFrame();
        }

        const fid = message.fid;
        if (!fid) {
          throw new Error("Invalid Farcaster Frame message: Missing FID");
        }

        console.log(`Fetching data for FID: ${fid}`);
        const userData = await getFarcasterUserData(fid.toString());
        console.log(`User data:`, userData);
        if (userData.timestamp === null) {
          throw new Error("Unable to retrieve valid user data");
        }

        const joinDate = new Date(userData.timestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const anniversary = calculateAnniversary(userData.timestamp);
        const awesomeText = getAwesomeText(parseInt(fid), userData.profileName);

        console.log(`FID: ${fid}, Timestamp: ${userData.timestamp}, Join Date: ${joinDate}, Anniversary: ${anniversary}, Username: ${userData.profileName}`);

        // Add a note about the data source
        const dataSource = "Airstack & Farcaster Registry";
        console.log(`Data source: ${dataSource}`);

          const greeting = userData.profileName ? `Hello, ${userData.profileName}! ` : '';

        const pngBase64 = await generateOGImage(
          fid.toString(),
          joinDate,
          anniversary,
          false,
          '',
          false,
          awesomeText,
          
        );

        const shareText = `I joined Farcaster on ${joinDate} and have been a member since ${anniversary}! Check your Farcaster stats: Frame by @0xdexter `;
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(`${process.env.APP_URL}/frames?userfid=${fid}`)}`;

        return {
          image: pngBase64,
          buttons: [
            { label: "Share", action: "link", target: shareUrl },
            { label: "Check Again", action: "post" },
            { label: "Home", action: "post" },
          ],
          ogImage: pngBase64,
          title: "My Farcaster Journey",
          description: `${awesomeText} I joined Farcaster on ${joinDate} and have been a member for ${anniversary}!`,
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
  const errorImageBase64 = await generateOGImage(null, null, null, true, errorMessage, false, '', '');
  return {
    image: errorImageBase64,
    buttons: [{ label: "Retry", action: "post" }],
    ogImage: errorImageBase64,
    title: "Farcaster Anniversary Frame Error",
    description: "An error occurred while processing your Farcaster anniversary information.",
  };
}

async function generateInitialFrame(): Promise<any> {
  const initialImageUrl = `${process.env.APP_URL}/initial-animation.webp`;
  return {
    image: initialImageUrl,
    buttons: [
      { label: "Check My Stats", action: "post" },
    ],
    ogImage: initialImageUrl,
    title: "Farcaster Stats",
    description: "Discover your Farcaster journey! Find out when you joined and your Farcaster rank.",
  };
}

export const GET = handleRequest;
export const POST = handleRequest;