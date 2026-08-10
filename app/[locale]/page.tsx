import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VenuePage } from "@/components/VenuePage";
import {
  getPageContent,
  parseLocale,
  SUPPORTED_LOCALES,
} from "@/lib/content";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateStaticParams = () =>
  SUPPORTED_LOCALES.map((locale) => ({ locale }));

export const generateMetadata = async (props: LocalePageProps): Promise<Metadata> => {
  const { locale: requestedLocale } = await props.params;
  const locale = parseLocale(requestedLocale);

  if (!locale) {
    return {};
  }

  const { site } = await getPageContent(locale);

  return {
    title: site.metaTitle,
    description: site.metaDescription,
    alternates: {
      canonical: `/${locale}/`,
    },
  };
};

const LocalePage = async (props: LocalePageProps) => {
  const { locale: requestedLocale } = await props.params;
  const locale = parseLocale(requestedLocale);

  if (!locale) {
    notFound();
  }

  const content = await getPageContent(locale);

  return <VenuePage content={content} />;
};

export default LocalePage;
