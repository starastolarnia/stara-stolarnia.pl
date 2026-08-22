import type { PageContent, SupportedLocale } from "@/lib/content";
import { getEventPath } from "@/lib/event-routes";
import type { EventKind } from "@/lib/event-kinds";
import { SITE_ORIGIN } from "@/lib/site-metadata";

const BUSINESS_ID = `${SITE_ORIGIN}/#venue`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const INTERNATIONAL_PHONE = "+48 506 979 921";
const BUSINESS_IMAGE_PATHS = [
  "/images/stara-stolarnia-venue-1x1.webp",
  "/images/hero-forest.webp",
  "/images/stara-stolarnia-venue-16x9.webp",
] as const;
const BUSINESS_IMAGE_URLS = BUSINESS_IMAGE_PATHS.map((path) =>
  new URL(path, SITE_ORIGIN).toString(),
);

type StructuredDataInput = {
  content: PageContent;
  eventKind: EventKind;
  locale: SupportedLocale;
};

export const getStructuredData = (input: StructuredDataInput) => {
  const { content, eventKind, locale } = input;
  const { hero, serviceOverview, site } = content;
  const event = hero.events[eventKind];
  const pageUrl = new URL(getEventPath(locale, eventKind), SITE_ORIGIN).toString();
  const imageUrl = new URL(event.desktopImage, SITE_ORIGIN).toString();
  const primaryImageId = `${pageUrl}#primaryimage`;
  const serviceId = `${pageUrl}#service`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "EventVenue"],
        "@id": BUSINESS_ID,
        name: site.brand,
        description: serviceOverview.lead,
        url: SITE_ORIGIN,
        image: BUSINESS_IMAGE_URLS,
        telephone: INTERNATIONAL_PHONE,
        email: content.eventProfiles[eventKind].contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "ul. Wrocławska 7d",
          postalCode: "55-095",
          addressLocality: "Byków",
          addressRegion: "dolnośląskie",
          addressCountry: "PL",
        },
        sameAs: [site.facebookHref, site.partnerHref],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_ORIGIN,
        name: site.brand,
        inLanguage: locale,
        publisher: { "@id": BUSINESS_ID },
      },
      {
        "@type": "ImageObject",
        "@id": primaryImageId,
        url: imageUrl,
        contentUrl: imageUrl,
        caption: event.imageAlt,
      },
      {
        "@type": "Service",
        "@id": serviceId,
        name: event.tabLabel,
        serviceType: event.eyebrow,
        description: event.lead,
        url: pageUrl,
        image: { "@id": primaryImageId },
        areaServed: {
          "@type": "AdministrativeArea",
          name: "Wrocław i okolice",
        },
        provider: { "@id": BUSINESS_ID },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: event.metaTitle,
        description: event.metaDescription,
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": BUSINESS_ID },
        mainEntity: { "@id": serviceId },
        primaryImageOfPage: { "@id": primaryImageId },
      },
    ],
  };
};
