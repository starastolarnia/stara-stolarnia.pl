# Stara Stolarnia

Statyczna strona sali weselnej zbudowana w Next.js i TypeScript.

## Zmiana tekstów

Treść znajduje się w katalogach [`content/pl`](./content/pl), [`content/en`](./content/en) i [`content/de`](./content/de). Pliki są ponumerowane zgodnie z kolejnością sekcji na stronie, a odstępy co 10 pozwalają później łatwo wstawić nową sekcję. Teksty można edytować bez dotykania HTML-a ani komponentów.

Każdą zmianę tekstu należy sprawdzić we wszystkich trzech językach zgodnie z zasadami zapisanymi w [`AGENTS.md`](./AGENTS.md). Struktura frontmatteru, identyfikatory sekcji, linki i fakty powinny pozostać spójne między wersjami.

- `000-ustawienia-strony.md`: menu, metadane, stopka i wspólne etykiety; nie jest osobną sekcją
- `010-poczatek.md`: pierwsza sekcja strony
- `020-o-miejscu.md`: historia miejsca i najważniejsze liczby
- `030-sala.md`: wnętrze sali
- `040-ceremonia.md`: ceremonia w lesie
- `050-goscinnosc.md`: obsługa i noclegi
- `060-oferta.md`: zakres oferty bez cen
- `070-galeria.md`: zdjęcia i ich opisy
- `080-kontakt.md`: dane kontaktowe

## Wersje językowe

Strony są dostępne pod adresami `/pl/`, `/en/` i `/de/`. Wejście na adres główny automatycznie wybiera wersję na podstawie preferowanych języków przeglądarki lub telefonu, a w razie braku dopasowania otwiera wersję polską. Język można też zmienić ręcznie z listy z flagą w prawym górnym rogu.

Data i godzina ostatniej aktualizacji w stopce są ustalane podczas produkcyjnego builda i formatowane dla wybranego języka w strefie `Europe/Warsaw`.

## Uruchomienie

```bash
npm install
npm run dev
```

## Wersja produkcyjna

```bash
npm run build
```

Gotowa statyczna strona zostanie wygenerowana w katalogu `out`.
