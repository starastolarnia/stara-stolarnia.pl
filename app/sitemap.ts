import type { MetadataRoute } from "next";

import { getEventPath } from "@/lib/event-routes";
import { EVENT_KINDS } from "@/lib/event-kinds";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/site-metadata";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap =>
  SUPPORTED_LOCALES.flatMap((locale) =>
    EVENT_KINDS.map((eventKind) => ({
      url: new URL(getEventPath(locale, eventKind), SITE_ORIGIN).toString(),
      changeFrequency: "monthly" as const,
      priority: eventKind === "weddings" && locale === DEFAULT_LOCALE ? 1 : 0.8,
    })),
  );

export default sitemap;
