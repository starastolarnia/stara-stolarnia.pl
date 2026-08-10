import type { Metadata } from "next";

import { VenuePage } from "@/components/VenuePage";
import { getDefaultContent } from "@/lib/content";

export const generateMetadata = async (): Promise<Metadata> => {
  const { site } = await getDefaultContent();

  return {
    title: site.metaTitle,
    description: site.metaDescription,
    alternates: {
      canonical: "/",
      languages: {
        pl: "/pl/",
      },
    },
    openGraph: {
      title: site.metaTitle,
      description: site.metaDescription,
      locale: "pl_PL",
      type: "website",
      images: ["/images/hero-forest.webp"],
    },
  };
};

const HomePage = async () => {
  const content = await getDefaultContent();

  return <VenuePage content={content} />;
};

export default HomePage;
