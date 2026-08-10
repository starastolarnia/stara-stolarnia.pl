"use client";

import { useEffect } from "react";

import {
  getLocalePath,
  LOCALES,
  resolvePreferredLocale,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";

export const LocaleRedirect = () => {
  useEffect(() => {
    const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    const locale = resolvePreferredLocale(languages);
    const destination = `${getLocalePath(locale)}${window.location.search}${window.location.hash}`;

    window.location.replace(destination);
  }, []);

  return (
    <main className="locale-redirect">
      <p className="locale-redirect__brand">Stara Stolarnia</p>
      <nav className="locale-redirect__links" aria-label="Wybierz język / Choose language">
        {SUPPORTED_LOCALES.map((locale) => (
          <a href={getLocalePath(locale)} hrefLang={locale} lang={locale} key={locale}>
            <span aria-hidden="true">{LOCALES[locale].flag}</span>
            {LOCALES[locale].name}
          </a>
        ))}
      </nav>
    </main>
  );
};
