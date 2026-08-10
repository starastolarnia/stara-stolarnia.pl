import type { Metadata } from "next";

import type { PageContent, SupportedLocale } from "@/lib/content";
import { LOCALES } from "@/lib/i18n";

const DEFAULT_SITE_ORIGIN = "https://stara-stolarnia.pl";
const VERCEL_PRODUCTION_HOSTNAME = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_ORIGIN = VERCEL_PRODUCTION_HOSTNAME
  ? `https://${VERCEL_PRODUCTION_HOSTNAME}`
  : DEFAULT_SITE_ORIGIN;

const LOCALE_HOME_PATHS = Object.fromEntries(
  Object.entries(LOCALES).map(([locale, config]) => [locale, config.path]),
) as Record<SupportedLocale, string>;

type PageMetadataInput = {
  canonicalPath: string;
  content: Pick<PageContent, "hero" | "site">;
  locale: SupportedLocale;
};

export const getPageMetadata = (input: PageMetadataInput): Metadata => {
  const { canonicalPath, content, locale } = input;
  const { hero, site } = content;
  const canonicalUrl = new URL(canonicalPath, SITE_ORIGIN).toString();
  const shareImageUrl = new URL(hero.desktopImage, SITE_ORIGIN).toString();
  const shareImage = {
    url: shareImageUrl,
    secureUrl: shareImageUrl,
    type: "image/webp",
    width: 2400,
    height: 1800,
    alt: hero.imageAlt,
  };

  return {
    title: site.metaTitle,
    description: site.metaDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: LOCALE_HOME_PATHS,
    },
    openGraph: {
      title: site.metaTitle,
      description: site.metaDescription,
      url: canonicalUrl,
      siteName: site.brand,
      locale: LOCALES[locale].openGraphLocale,
      type: "website",
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: site.metaTitle,
      description: site.metaDescription,
      images: [shareImage],
    },
    pinterest: {
      richPin: true,
    },
  };
};
