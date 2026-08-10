import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const bodyFont = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stara-stolarnia.pl"),
  icons: {
    icon: "/favicon.svg",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

const RootLayout = (props: RootLayoutProps) => {
  const { children } = props;

  return (
    <html lang="pl" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
