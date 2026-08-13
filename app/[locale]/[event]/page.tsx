import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VenuePage } from "@/components/VenuePage";
import { getPageContent, parseLocale, SUPPORTED_LOCALES } from "@/lib/content";
import { EVENT_ROUTE_SEGMENTS, getEventKindFromSegment } from "@/lib/event-routes";
import { NON_WEDDING_EVENT_KINDS } from "@/lib/event-kinds";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getPageMetadata } from "@/lib/site-metadata";

type EventPageProps = {
  params: Promise<{
    event: string;
    locale: string;
  }>;
};

export const dynamicParams = false;

export const generateStaticParams = () =>
  SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).flatMap((locale) =>
    NON_WEDDING_EVENT_KINDS.map((eventKind) => ({
      event: EVENT_ROUTE_SEGMENTS[eventKind][locale],
      locale,
    })),
  );

const getRoute = async (props: EventPageProps) => {
  const { event, locale: requestedLocale } = await props.params;
  const locale = parseLocale(requestedLocale);

  if (!locale || locale === DEFAULT_LOCALE) notFound();

  const eventKind = getEventKindFromSegment(locale, event);

  if (!eventKind || eventKind === "weddings") notFound();

  return { eventKind, locale };
};

export const generateMetadata = async (props: EventPageProps): Promise<Metadata> => {
  const { eventKind, locale } = await getRoute(props);
  const content = await getPageContent(locale);

  return getPageMetadata({ content, eventKind, locale });
};

const EventPage = async (props: EventPageProps) => {
  const { eventKind, locale } = await getRoute(props);

  return <VenuePage content={await getPageContent(locale)} initialEventKind={eventKind} />;
};

export default EventPage;
