import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "@/lib/site-metadata";

export const dynamic = "force-static";

const robots = (): MetadataRoute.Robots => ({
  rules: [
    {
      userAgent: ["Googlebot", "Bingbot", "OAI-SearchBot"],
      allow: "/",
    },
    {
      userAgent: "*",
      allow: "/",
    },
  ],
  sitemap: `${SITE_ORIGIN}/sitemap.xml`,
});

export default robots;
