# Bug 005 — Absurdalne łamanie nagłówków

> Start pracy: 2026-08-11 18:32
> Koniec pracy: —
> Status: test czerwony
> Zgłoszenie: „co to kurwa jest? jak to przechodzi jaką kolwiek kontrole jakości?” ([zrzut sekcji galerii](assets/005-absurdalne-lamanie-naglowkow/before-gallery.png))
> Uzupełnienie 1: „czemu tu jest taka dziura?” ([zrzut sekcji o miejscu](assets/005-absurdalne-lamanie-naglowkow/before-story.png))
> Uzupełnienie 2: „wszędzie te nagłówki maja jakies rozjebany rytm i za dużo linijek, wtf?”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: wizualny-statyczny
> Baza analizy: commit `1ff32a268a75926672cf6bb8005f6faf5476e1a7`; roboczy `app/globals.css` SHA-256 `257530ecaf7a0cba5b10b78d7bb42bf92af03118d7bb2758986b932574f76a1f`
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —

## TL;DR

Każdy typ sekcji dostał osobny, arbitralny limit szerokości nagłówka (`10ch`, `12ch` albo `16ch`), mimo że docelowe gridy już wyznaczają poprawną szerokość kolumny. Na badanym desktopie ograniczało to historię miejsca do 282 px w kolumnie 842 px, a nagłówek galerii do 235 px, przez co teksty zajmowały od pięciu do siedmiu wierszy i zostawiały dużą pustą przestrzeń. `EditorialHeading` poprawnie zachowuje pełne zdania; źródłem błędu jest dublowanie ograniczenia szerokości w CSS.

## Kryteria akceptacji

1. AC-1: Na desktopie tytuły „Od uroczystego stołu po swobodny czas w ogrodzie.” i „Miejsce zbudowane z drewna, doświadczenia i rodzinnej gościnności.” nie mogą być składane niemal słowo po słowie; każdy ma tworzyć najwyżej trzy sensowne wiersze bez pustej dziury we własnej kolumnie.
2. AC-2: Wszystkie nagłówki sekcji H2 we wszystkich profilach wydarzeń i językach PL/EN/DE/UK mają korzystać z szerokości odpowiedniej do swojej kolumny, bez samotnych krótkich słów wynikających ze sztucznego limitu `ch`.
3. AC-3: Nagłówki wielozdaniowe nadal zachowują granice zdań, w tym „Wszystko, czego potrzeba.” / „Bez niepotrzebnego komplikowania.”
4. AC-4: Na telefonie i tablecie tekst może zawijać się naturalnie do dostępnej szerokości, bez przepełnienia poziomego.
5. AC-5: Układ tekstu prowadzącego po prawej stronie galerii, obrazy, treści, tłumaczenia, topbar i menu pozostają bez zmian funkcjonalnych.

## Zakres i konsumenci

- Cel: reguły szerokości nagłówków H2 oraz komponent `EditorialHeading` w `VenuePage`.
- Wspólni konsumenci do sprawdzenia: story, trzy sekcje feature, offer, gallery i contact dla czterech profili wydarzeń oraz czterech locale.
- Poza zakresem: treść copy, obrazy, nawigacja, menu wydarzeń, selektor języka i układ hero poza samym łamaniem tytułu.

## Szczegóły — odpowiedzialny kod

- Numery linii odnoszą się do roboczego `app/globals.css` o SHA-256 zapisanym w nagłówku raportu, na bazie commita `1ff32a2`.
- `app/globals.css:824-826` ogranicza `.story__heading h2` do `12ch`, choć `app/globals.css:1189-1196` daje sekcji osobną, szeroką kolumnę `1.3fr`. Pomiar w finalnym DOM przy 1699 px: nagłówek 282 px, rodzic 842 px, 6 wierszy.
- `app/globals.css:900-902` powtarza `12ch` dla wszystkich trzech `.feature__content h2`; wariant komunijny osiągał przez to 7 wierszy w kolumnie o szerokości 501 px.
- `app/globals.css:994-996` nakłada jeszcze węższe `10ch` na `.gallery__heading h2`, niezależnie od szerokiej lewej kolumny z `app/globals.css:1255-1265`. Dla zgłoszonego tytułu komunijnego finalny DOM mierzył 235 px i 6 wierszy.
- `app/globals.css:1051-1054` nakłada `16ch` również na kontakt, mimo że jego szerokość wynika już z grida `app/globals.css:1422-1431`.
- `components/VenuePage.tsx:148-160` dzieli tekst wyłącznie na pełne zdania, a konsumenci w `components/VenuePage.tsx:1015-1119` przekazują do niego tytuły story, feature, offer, gallery i contact. Ten komponent nie narzuca szerokości i nie jest przyczyną pustej przestrzeni.

### Inwentarz konsumentów i wpływ

- Story: ma korzystać z całej własnej kolumny; usuwamy wyłącznie dodatkowy limit `12ch`.
- Trzy sekcje feature: mają korzystać z węższej kolumny grida; usuwamy dodatkowy limit `12ch`, bez zmiany proporcji obrazu i tekstu.
- Gallery: ma korzystać z lewej kolumny grida; usuwamy dodatkowy limit `10ch`, bez zmiany prawego leadu.
- Contact: ma korzystać z panelu kontaktowego; usuwamy dodatkowy limit `16ch`, bez zmiany szczegółów kontaktu.
- Offer: pozostaje przy zatwierdzonym `28ch`, ponieważ dwa osobne zdania mają pozostać dwoma blokami i obecny pomiar daje dokładnie dwa wiersze.
- Hero H1: poza zakresem; pozostaje przy osobnym limicie dopasowanym do kompozycji zdjęcia.

### Wykluczone przyczyny

- Copy i tłumaczenia: błąd występuje na różnych tekstach oraz profilach, a pomiar CSS pokazuje identyczne fizyczne limity 282/235 px niezależne od treści.
- Dzielenie zdań w `EditorialHeading`: komponent tworzy blok tylko na granicy zdania; zgłoszone nagłówki jednozdaniowe nadal były łamane na 6 wierszy przez szerokość CSS.
- Rozmiar fontu: obowiązuje zatwierdzona skala 49,28 px na desktopie; problemem jest niewykorzystanie 560–607 px dostępnego miejsca, nie sama skala.
- Grid sekcji: rodzice mają szerokości 501–842 px i nie przepełniają viewportu; wąski element jest skutkiem lokalnego `max-width`.

## Proponowany test (najpierw czerwony)

- AC-1 → pomiar finalnego DOM przy 1699 px dla story i gallery: maksymalnie 3 wiersze; zrzuty przed/po w `bugs/assets/005-absurdalne-lamanie-naglowkow/`.
- AC-2 → wspierający test `section heading measures follow their grid columns instead of arbitrary ch caps` w `components/event-switcher.test.mjs` oraz przeglądarkowy audyt wszystkich H2 w PL/EN/DE/UK i czterech profilach. Test źródłowy nie niesie samodzielnie dowodu wizualnego; dowodem rozstrzygającym są pomiary i zrzuty z finalnego DOM.
- AC-3 → istniejący test `display headings keep complete sentences together before balancing their lines` oraz pomiar oferty.
- AC-4 → wizualne/pomiarowe sprawdzenie przy 390, 768 i 1699 px; kontrola braku poziomego overflow.
- AC-5 → pełne `npm test` oraz porównanie sekcji przed/po.

RED zarejestrowany przed zmianą produkcyjną ma pokazać obecność arbitralnych limitów i brak wspólnej reguły `max-width: 100%`; ponieważ jest to wada składu wizualnego, test źródłowy jest wyłącznie trwałą bramką wspierającą.

## Rozwiązanie

Zastąpić cztery lokalne limity `10ch`/`12ch`/`16ch` jedną wspólną regułą, w której story, feature, gallery i contact używają `max-width: 100%`. Właściwy measure pozostaje wtedy pochodną istniejącej kolumny grida, czyli jedynego źródła prawdy o geometrii sekcji. Zachować osobne `28ch` w ofercie oraz limit H1 w hero, bo pełnią inne, zatwierdzone funkcje kompozycyjne. Copy, tłumaczenia, struktura DOM i komponent `EditorialHeading` nie zmieniają się.

## Raport z implementacji i testów

Implementacja produkcyjna nie rozpoczęła się; test wspierający został zapisany i potwierdzony na czerwono.

### RED

Komenda:

```sh
node --test --test-name-pattern='section heading measures follow their grid columns' components/event-switcher.test.mjs
```

Wynik (`exit=1`):

```text
✖ section heading measures follow their grid columns instead of arbitrary ch caps (1.4075ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 72.494333
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /max-width:\s*100%;/s. Input: ''
```

### Zaimplementowane zmiany

- `app/globals.css`: wspólna reguła dla story, feature, gallery i contact ustawia `max-width: 100%`; usunięto lokalne ograniczenia `10ch`, `12ch` i `16ch`.
- `components/event-switcher.test.mjs`: dodano trwałą bramkę wspierającą, która wymaga wspólnego measure i zabrania powrotu trzech arbitralnych limitów; zachowano zatwierdzone `28ch` dla oferty.
- Copy, tłumaczenia, struktura `EditorialHeading`, gridy sekcji oraz H1 nie zostały zmienione.

### GREEN i bramki zakresu

Komenda:

```sh
node --test components/event-switcher.test.mjs
```

Wynik:

```text
✔ section heading measures follow their grid columns instead of arbitrary ch caps (0.207333ms)
✔ display headings keep complete sentences together before balancing their lines (0.337709ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 109.412042
```

Pełna bramka:

```sh
npm test
```

Wynik:

```text
✓ Compiled successfully in 397ms
✓ Generating static pages using 7 workers (9/9) in 435ms
✔ section heading measures follow their grid columns instead of arbitrary ch caps (0.215666ms)
✔ display headings keep complete sentences together before balancing their lines (0.368208ms)
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 94.619041
```

Dodatkowe bramki:

```text
$ npm run lint
> eslint .
exit=0

$ npm run typecheck
> tsc --noEmit
exit=0
```

### Pomiar finalnego renderu

- 1699 px, zgłoszone story: `6 → 2` wiersze; szerokość `282 → 842` px.
- 1699 px, zgłoszona galeria komunijna: `6 → 1` wiersz; szerokość `235 → 918` px.
- 48 stanów (PL/EN/DE/UK × 4 wydarzenia × 390/768/1699 px): `0` stanów z poziomym overflow; maksymalnie 4 wiersze tylko w naturalnie węższych lub wielozdaniowych nagłówkach feature.
- Pełny wynik: [audyt geometrii 48 stanów](assets/005-absurdalne-lamanie-naglowkow/heading-audit.json).

### Wynik per AC

- AC-1: zielony — oba zgłoszone nagłówki mają odpowiednio 2 i 1 wiersz.
- AC-2: zielony — wspólny test measure oraz audyt 48 stanów.
- AC-3: zielony — istniejący test granic zdań; oferta nadal ma 2 bloki/wiersze.
- AC-4: zielony — 390, 768 i 1699 px bez overflow.
- AC-5: zielony — pełne 26/26, lint i typecheck; porównanie wizualne nie wykazało zmian poza measure nagłówków.

### Cleanup

Do uzupełnienia po zamknięciu przebiegu.

## Dowód końcowego compositora

- Widok przed — galeria: [zgłoszony absurdalny skład nagłówka](assets/005-absurdalne-lamanie-naglowkow/before-gallery.png)
- Widok przed — historia miejsca: [zgłoszona pusta przestrzeń i siedem wierszy](assets/005-absurdalne-lamanie-naglowkow/before-story.png)
- Widok po — galeria: [tytuł wykorzystuje lewą kolumnę](assets/005-absurdalne-lamanie-naglowkow/after-gallery.png)
- Widok po — historia miejsca: [dwa pełne zdania w dwóch wierszach](assets/005-absurdalne-lamanie-naglowkow/after-story.png)

## Protokół weryfikacji

1. RED: na bazowym CSS o hashu z nagłówka uruchomić test filtrowany zapisany w sekcji RED; oczekiwane `fail 1` na braku wspólnej reguły.
2. GREEN: uruchomić `node --test components/event-switcher.test.mjs` (18/18) oraz `npm test` (26/26 i build czterech locale).
3. Render: uruchomić lokalną stronę, ustawić 1699 px, wybrać „Komunia”, a następnie sprawdzić story i galerię; oczekiwane odpowiednio 2 i 1 wiersz oraz `max-width: 100%`.
4. Breakpointy: powtórzyć dla 390 i 768 px; `document.documentElement.scrollWidth` ma być równe `clientWidth`.
5. Inspekcja diffu: zmienia się tylko measure czterech klas H2 i test; `EditorialHeading`, treści, H1, `offer__intro h2`, gridy i prawy lead galerii pozostają bez zmian.
6. Dowód dostarczenia: do uzupełnienia po commicie na `main`.
