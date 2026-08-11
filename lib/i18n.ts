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
  uk: {
    flag: "🇺🇦",
    name: "Українська",
    openGraphLocale: "uk_UA",
    path: "/uk/",
  },
} as const;

export type SupportedLocale = keyof typeof LOCALES;

export const SUPPORTED_LOCALES = Object.keys(LOCALES) as SupportedLocale[];
export const DEFAULT_LOCALE = "pl" satisfies SupportedLocale;

export const isSupportedLocale = (locale: string): locale is SupportedLocale =>
  Object.hasOwn(LOCALES, locale);

export const getLocalePath = (locale: SupportedLocale) => LOCALES[locale].path;

const localeRedirectConfig = {
  defaultLocale: DEFAULT_LOCALE,
  paths: Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, getLocalePath(locale)]),
  ),
};

export const LOCALE_REDIRECT_SCRIPT = `(()=>{const config=${JSON.stringify(localeRedirectConfig)};if(window.location.pathname!=="/")return;const languages=navigator.languages?.length?navigator.languages:[navigator.language];let locale=config.defaultLocale;for(const language of languages){const candidate=String(language).toLowerCase().split("-")[0];if(Object.hasOwn(config.paths,candidate)){locale=candidate;break}}window.location.replace(config.paths[locale]+window.location.search+window.location.hash)})();`;
