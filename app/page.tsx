import type { Metadata } from "next";

import { getDefaultContent } from "@/lib/content";
import { getPageMetadata } from "@/lib/site-metadata";

export const generateMetadata = async (): Promise<Metadata> => {
  const content = await getDefaultContent();

  return getPageMetadata({ canonicalPath: "/", content, locale: "pl" });
};

const HomePage = () => null;

export default HomePage;
