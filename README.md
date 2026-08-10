# Stara Stolarnia

Statyczna strona sali weselnej zbudowana w Next.js i TypeScript.

## Zmiana tekstów

Cała polska treść znajduje się w katalogu [`content/pl`](./content/pl). Każdy plik `.md` odpowiada jednej sekcji strony. Teksty można edytować bez dotykania HTML-a ani komponentów.

- `site.md`: menu, metadane, stopka i wspólne etykiety
- `hero.md`: pierwsza sekcja strony
- `story.md`: historia miejsca i najważniejsze liczby
- `sections/*.md`: sala, ceremonia oraz gościnność
- `offer.md`: zakres oferty bez cen
- `gallery.md`: zdjęcia i ich opisy
- `contact.md`: dane kontaktowe

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
