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
  const isDevelopment = process.env.NODE_ENV === 'development';
  const vercelUrl = process.env.VERCEL_URL;

  if (isDevelopment) {
    return 'http://localhost:3001';
  } else if (vercelUrl) {
    return `https://${vercelUrl}`;
  } else {
    throw new Error('Unable to determine app URL');
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toFixed(2);
  }
}