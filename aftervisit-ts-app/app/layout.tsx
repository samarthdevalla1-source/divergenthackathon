import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono"
});

export const metadata: Metadata = {
  title: "AfterVisit AI",
  description: "AI-powered healthcare communication that turns doctor notes into patient-friendly guidance."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable} font-[family-name:var(--font-manrope)]`}>
        {children}
      </body>
    </html>
  );
}
