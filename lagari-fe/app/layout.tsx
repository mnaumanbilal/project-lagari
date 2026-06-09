import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Lagari — Luxury Fragrance Impressions",
    template: "%s | Lagari",
  },
  description:
    "Artisanal impressions of iconic designer fragrances. Cash on delivery across Pakistan.",
  metadataBase: new URL("https://www.lagari.pk"),
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
