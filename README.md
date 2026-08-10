# Stara Stolarnia

Statyczna strona sali weselnej zbudowana w Next.js i TypeScript.

## Zmiana tekstów

Cała polska treść znajduje się bezpośrednio w katalogu [`content/pl`](./content/pl). Pliki są ponumerowane zgodnie z kolejnością sekcji na stronie, a odstępy co 10 pozwalają później łatwo wstawić nową sekcję. Teksty można edytować bez dotykania HTML-a ani komponentów.

- `000-ustawienia-strony.md`: menu, metadane, stopka i wspólne etykiety; nie jest osobną sekcją
- `010-poczatek.md`: pierwsza sekcja strony
- `020-o-miejscu.md`: historia miejsca i najważniejsze liczby
- `030-sala.md`: wnętrze sali
- `040-ceremonia.md`: ceremonia w lesie
- `050-goscinnosc.md`: obsługa i noclegi
- `060-oferta.md`: zakres oferty bez cen
- `070-galeria.md`: zdjęcia i ich opisy
- `080-kontakt.md`: dane kontaktowe

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
