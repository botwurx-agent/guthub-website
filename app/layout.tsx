import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "GutHub — Nutrition guidance you can actually talk to",
  description: "Your personalized AI gut health assistant — ongoing support, clarity, and real-time feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
