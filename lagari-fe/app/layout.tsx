import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { getSiteUrl } from "@/lib/site/url";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteDescription =
  "Artisanal impressions of iconic designer fragrances. Cash on delivery across Pakistan.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Lagari — Luxury Fragrance Impressions",
    template: "%s | Lagari",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "Lagari",
    title: "Lagari — Luxury Fragrance Impressions",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Lagari — Luxury Fragrance Impressions",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col grain-overlay"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
