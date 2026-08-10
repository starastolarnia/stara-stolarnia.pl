export const LOCALES = {
  pl: {
    flag: "🇵🇱",
    name: "Polski",
    openGraphLocale: "pl_PL",
    path: "/pl/",
  },
  en: {
    flag: "🇬🇧",
    name: "English",
    openGraphLocale: "en_GB",
    path: "/en/",
  },
  de: {
    flag: "🇩🇪",
    name: "Deutsch",
    openGraphLocale: "de_DE",
    path: "/de/",
  },
} as const;

export type SupportedLocale = keyof typeof LOCALES;

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as SupportedLocale[];
export const DEFAULT_LOCALE = "pl" satisfies SupportedLocale;

export const isSupportedLocale = (locale: string): locale is SupportedLocale =>
  Object.hasOwn(LOCALES, locale);

export const getLocalePath = (locale: SupportedLocale) => LOCALES[locale].path;

export const resolvePreferredLocale = (languages: readonly string[]) => {
  for (const language of languages) {
    const locale = language.toLowerCase().split("-")[0];

    if (isSupportedLocale(locale)) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
};
