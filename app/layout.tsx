import type { Metadata } from "next";
import { Inter, Bungee } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Farcaster Anniversary Frame",
  description: "Check your Farcaster join date and anniversary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} ${bungee.className} h-full`}>
        {children}
      </body>
    </html>
  );
}
