import type { Metadata } from "next";

import type { PageContent, SupportedLocale } from "@/lib/content";
import { getEventPath } from "@/lib/event-routes";
import type { EventKind } from "@/lib/event-kinds";
import { LOCALES, SUPPORTED_LOCALES } from "@/lib/i18n";

const DEFAULT_SITE_ORIGIN = "https://stara-stolarnia.pl";
const VERCEL_PRODUCTION_HOSTNAME = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_ORIGIN = VERCEL_PRODUCTION_HOSTNAME
  ? `https://${VERCEL_PRODUCTION_HOSTNAME}`
  : DEFAULT_SITE_ORIGIN;

type PageMetadataInput = {
  content: Pick<PageContent, "hero" | "site">;
  eventKind: EventKind;
  locale: SupportedLocale;
};

export const getPageMetadata = (input: PageMetadataInput): Metadata => {
  const { content, eventKind, locale } = input;
  const { hero, site } = content;
  const shareEvent = hero.events[eventKind];
  const canonicalPath = getEventPath(locale, eventKind);
  const canonicalUrl = new URL(canonicalPath, SITE_ORIGIN).toString();
  const shareImageUrl = new URL(shareEvent.desktopImage, SITE_ORIGIN).toString();
  const languageAlternates = Object.fromEntries(
    SUPPORTED_LOCALES.map((alternateLocale) => [
      alternateLocale,
      getEventPath(alternateLocale, eventKind),
    ]),
  );
  const shareImage = {
    url: shareImageUrl,
    secureUrl: shareImageUrl,
    type: "image/webp",
    width: 2400,
    height: 1800,
    alt: shareEvent.imageAlt,
  };

  return {
    title: shareEvent.metaTitle,
    description: shareEvent.metaDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ...languageAlternates,
        "x-default": getEventPath("pl", eventKind),
      },
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
    openGraph: {
      title: shareEvent.metaTitle,
      description: shareEvent.metaDescription,
      url: canonicalUrl,
      siteName: site.brand,
      locale: LOCALES[locale].openGraphLocale,
      type: "website",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareEvent.metaTitle,
      description: shareEvent.metaDescription,
      images: [shareImage],
    },
    pinterest: {
      richPin: true,
    },
  };
};
