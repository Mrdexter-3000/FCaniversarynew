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
    }
  }
}
`;

export async function getFarcasterUserData(fid: string): Promise<number | null> {
  try {
    const userData = await fetchQuery(userQuery, { fid });

    if (userData.error) {
      console.error("Airstack API error:", userData.error);
      return null;
    }

    const user = userData.data.Socials.Social[0];

    if (!user) {
      console.error('User not found');
      return null;
    }

    return new Date(user.userCreatedAtBlockTimestamp).getTime() / 1000;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}