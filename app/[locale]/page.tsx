import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VenuePage } from "@/components/VenuePage";
import {
  getPageContent,
  parseLocale,
  SUPPORTED_LOCALES,
} from "@/lib/content";
import { EVENT_KINDS } from "@/lib/event-kinds";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getPageMetadata } from "@/lib/site-metadata";

const EVENT_KIND = EVENT_KINDS[0];

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateStaticParams = () =>
  SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ locale }));

export const generateMetadata = async (props: LocalePageProps): Promise<Metadata> => {
  const { locale: requestedLocale } = await props.params;
  const locale = parseLocale(requestedLocale);

  if (!locale) {
    return {};
  }

  const content = await getPageContent(locale);

  return getPageMetadata({
    content,
    eventKind: EVENT_KIND,
    locale,
  });
};

const LocalePage = async (props: LocalePageProps) => {
  const { locale: requestedLocale } = await props.params;
  const locale = parseLocale(requestedLocale);

  if (!locale) {
    notFound();
  }

  const content = await getPageContent(locale);

  return <VenuePage content={content} initialEventKind={EVENT_KIND} />;
};

export default LocalePage;
