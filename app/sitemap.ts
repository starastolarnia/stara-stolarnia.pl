import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "@/lib/site-metadata";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: SITE_ORIGIN,
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    url: `${SITE_ORIGIN}/pl/`,
    changeFrequency: "monthly",
    priority: 0.9,
  },
];

export default sitemap;
