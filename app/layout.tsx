import type { Metadata } from "next";
import { Cormorant_Garamond, Fraunces, Manrope } from "next/font/google";

import { LOCALE_REDIRECT_SCRIPT } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/site-metadata";

import "lenis/dist/lenis.css";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["cyrillic", "latin", "latin-ext"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const accentFont = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-accent",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bodyFont = Manrope({
  subsets: ["cyrillic", "latin", "latin-ext"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
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
    <html
      lang="pl"
      className={`${displayFont.variable} ${accentFont.variable} ${bodyFont.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{ __html: LOCALE_REDIRECT_SCRIPT }}
          id="locale-redirect"
        />
      </head>
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
