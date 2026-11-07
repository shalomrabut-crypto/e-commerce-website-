import type { Metadata, Viewport } from "next";
import { DM_Mono, Manrope, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-unbounded",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Prime Pass", template: "%s · Prime Pass" },
  description:
    "Tickets for verified events in Kenya. Student project demo, sample events, no real tickets sold.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E0B10",
  // Shrinks the page when the phone keyboard opens, so submit buttons stay reachable.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${manrope.variable} ${dmMono.variable}`}>
      <body>
        <Header />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
