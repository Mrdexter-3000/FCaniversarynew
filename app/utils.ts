import { headers } from "next/headers";

export function currentURL(pathname: string): URL {
  try {
    const headersList = headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "http";

    return new URL(pathname, `${protocol}://${host}`);
  } catch (error) {
    console.error(error);
    return new URL("http://localhost:3001");
  }
}

export function appURL(): string {
  const customAppUrl = process.env.APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (customAppUrl) {
    return customAppUrl.startsWith('http') ? customAppUrl : `https://${customAppUrl}`;
  } else if (vercelUrl) {
    return `https://${vercelUrl}`;
  } else if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  } else {
    console.warn('Unable to determine app URL, using fallback');
    return 'https://fc-aniversary-v3.vercel.app';
  }
}

export async function generateOGImage(
  fid: string | null,
  joinDate: string | null,
  anniversary: string | null,
  isError: boolean = false,
  errorMessage: string = '',
  isInitial: boolean = false,
  awesomeText: string = '',
  username: string = ''
): Promise<string> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL || 'http://localhost:3001';
  const params = new URLSearchParams({
    fid: fid || '',
    joinDate: joinDate || '',
    anniversary: anniversary || '',
    isError: isError.toString(),
    errorMessage: errorMessage,
    isInitial: isInitial.toString(),
    awesomeText: awesomeText,
    username: username
  });
  return `${baseUrl}/api/og?${params.toString()}`;
}