import type { MetadataRoute } from "next";

import { getLocalePath, SUPPORTED_LOCALES } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/site-metadata";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: SITE_ORIGIN,
    changeFrequency: "monthly",
    priority: 1,
  },
  ...SUPPORTED_LOCALES.map((locale) => ({
    url: new URL(getLocalePath(locale), SITE_ORIGIN).toString(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  })),
];

export default sitemap;
