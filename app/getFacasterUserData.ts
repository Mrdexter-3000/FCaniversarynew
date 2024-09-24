import { NextRequest, NextResponse } from "next/server";
import { init, fetchQuery } from "@airstack/node";

const apiKey = process.env.AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("AIRSTACK_API_KEY is not defined");
}
init(apiKey);

const userQuery = `
query GetFarcasterUser($fid: String!) {
  Socials(
    input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: $fid}}, blockchain: ethereum}
  ) {
    Social {
      userId
      userCreatedAtBlockTimestamp
      profileName
      profileDisplayName
    
      
    }
  }
}
`;

export async function getFarcasterUserData(fid: string): Promise<{ timestamp: number | null; profileName: string | null; profileDisplayName: string | null }> {
  try {
    // Get username from Airstack
    const airstackData = await fetchAirstackData(fid);
    
    // Get timestamp from Farcaster fname registry
    const farcasterData = await fetchFarcasterData(fid);
    
    return {
      timestamp: farcasterData,
      profileName: airstackData?.profileName || null,
      profileDisplayName: airstackData?.profileDisplayName || null
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { timestamp: null, profileName: null, profileDisplayName: null };
  }
}

async function fetchAirstackData(fid: string): Promise<{ profileName: string, profileDisplayName: string } | null> {
  const userData = await fetchQuery(userQuery, { fid });
  if (userData.error || !userData.data.Socials.Social[0]) return null;
  return { profileName: userData.data.Socials.Social[0].profileName, profileDisplayName: userData.data.Socials.Social[0].profileDisplayName };
}

async function fetchFarcasterData(fid: string): Promise<number | null> {
  try {
    const response = await fetch(`https://fnames.farcaster.xyz/transfers?fid=${fid}`);
    const data: { transfers?: { timestamp: number; username: string }[] } = await response.json();
    if (!data.transfers || data.transfers.length === 0) return null;
    
    // Sort transfers by timestamp in ascending order and get the earliest one
    const sortedTransfers = data.transfers.sort((a, b) => a.timestamp - b.timestamp);
    const earliestTransfer = sortedTransfers[0];
    
    console.log(`Farcaster data for FID ${fid}:`, earliestTransfer);
    
    return earliestTransfer.timestamp;
  } catch (error) {
    console.error('Error fetching data from Farcaster fname registry:', error);
    return null;
  }
}