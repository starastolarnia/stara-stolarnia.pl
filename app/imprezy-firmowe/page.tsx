import type { Metadata } from "next";

import { VenuePage } from "@/components/VenuePage";
import { getDefaultContent } from "@/lib/content";
import { getPageMetadata } from "@/lib/site-metadata";

const EVENT_KIND = "corporate" as const;

export const generateMetadata = async (): Promise<Metadata> => {
  const content = await getDefaultContent();

  return getPageMetadata({ content, eventKind: EVENT_KIND, locale: "pl" });
};

const CorporateEventsPage = async () => (
  <VenuePage content={await getDefaultContent()} initialEventKind={EVENT_KIND} />
);

export default CorporateEventsPage;
