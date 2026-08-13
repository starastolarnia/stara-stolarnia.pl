import type { Metadata } from "next";
import Link from "next/link";

import { SITE_ORIGIN } from "@/lib/site-metadata";

const POLISH_HOME_PATH = "/";

export const metadata: Metadata = {
  title: "Stara Stolarnia",
  alternates: {
    canonical: new URL(POLISH_HOME_PATH, SITE_ORIGIN).toString(),
  },
};

const LegacyPolishPage = () => (
  <main lang="pl">
    <meta httpEquiv="refresh" content={`0;url=${POLISH_HOME_PATH}`} />
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.replace(${JSON.stringify(POLISH_HOME_PATH)})`,
      }}
    />
    <p>
      <Link href={POLISH_HOME_PATH}>Przejdź na stronę główną Starej Stolarni</Link>
    </p>
  </main>
);

export default LegacyPolishPage;
