import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WardrobeAI — Your AI Stylist",
  description: "AI-powered wardrobe organizer and outfit recommender",
};

// Runs synchronously before first paint — decides whether the wardrobe-doors
// intro should be visible by marking <html> directly, so the very first
// frame is already correct. Waiting for React to hydrate and run an effect
// (the previous approach) meant the real page painted first, then got
// covered up a beat later, which read as a flash/flicker.
const WARDROBE_INTRO_SEEN_SCRIPT = `
try {
  if (sessionStorage.getItem('wardrobeai-doors-seen')) {
    document.documentElement.classList.add('wd-seen');
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${fraunces.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: WARDROBE_INTRO_SEEN_SCRIPT }} />
      </head>
      <body className="h-full antialiased">
        {children}
        <Toaster />
        <ConfirmDialog />
      </body>
    </html>
  );
}
