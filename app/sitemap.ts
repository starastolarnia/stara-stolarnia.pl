import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: "https://stara-stolarnia.pl",
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    url: "https://stara-stolarnia.pl/pl/",
    changeFrequency: "monthly",
    priority: 0.9,
  },
];

export default sitemap;
