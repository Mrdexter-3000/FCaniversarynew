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
      profileImage
      profileImageContentValue {
        image {
          extraSmall
        }
      }
      socialCapital {
        socialCapitalScore
        socialCapitalRank
      }
    }
  }
}
`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: 'FID is required' }, { status: 400 });
  }

  try {
    const userData = await fetchQuery(userQuery, { fid });

    if (userData.error) {
      console.error("Airstack API error:", userData.error);
      return NextResponse.json({ error: userData.error.message }, { status: 500 });
    }

    const user = userData.data.Socials.Social[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = {
      fid: user.userId,
      createdAtTimestamp: new Date(user.userCreatedAtBlockTimestamp).getTime() / 1000,
      profileName: user.profileName,
      profileDisplayName: user.profileDisplayName,
      profileImage: user.profileImageContentValue?.image?.extraSmall || user.profileImage,
      socialCapitalScore: user.socialCapital?.socialCapitalScore,
      socialCapitalRank: user.socialCapital?.socialCapitalRank
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}