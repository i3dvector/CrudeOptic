import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CrudeOptic — Global Oil Intelligence",
  description:
    "Real-time geopolitical oil tracking dashboard. Monitor imports, exports, production, consumption, reserves, and pricing for every country.",
  keywords: [
    "oil",
    "crude",
    "petroleum",
    "geopolitics",
    "imports",
    "exports",
    "energy",
    "dashboard",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-crude-bg text-white font-body antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
