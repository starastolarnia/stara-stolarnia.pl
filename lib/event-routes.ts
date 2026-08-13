import { EVENT_KINDS, type EventKind } from "@/lib/event-kinds";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/lib/i18n";

export const EVENT_ROUTE_SEGMENTS = {
  weddings: {
    pl: "",
    en: "",
    de: "",
    uk: "",
  },
  communions: {
    pl: "komunie",
    en: "first-communions",
    de: "kommunionen",
    uk: "pershe-prychastia",
  },
  corporate: {
    pl: "imprezy-firmowe",
    en: "corporate-events",
    de: "firmenfeiern",
    uk: "korporatyvni-podii",
  },
  family: {
    pl: "uroczystosci-rodzinne",
    en: "family-celebrations",
    de: "familienfeiern",
    uk: "simeini-sviata",
  },
} as const satisfies Record<EventKind, Record<SupportedLocale, string>>;

export const getEventPath = (locale: SupportedLocale, eventKind: EventKind) => {
  const localeSegment = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const eventSegment = EVENT_ROUTE_SEGMENTS[eventKind][locale];

  return eventSegment ? `${localeSegment}/${eventSegment}/` : `${localeSegment}/`;
};

export const getEventKindFromSegment = (
  locale: SupportedLocale,
  eventSegment: string,
): EventKind | null =>
  EVENT_KINDS.find((eventKind) => EVENT_ROUTE_SEGMENTS[eventKind][locale] === eventSegment) ?? null;
