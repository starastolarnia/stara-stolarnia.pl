# Rejestr klas błędów

## Nakładka obrazu zakotwiczona poza obiektem źródłowym

- **Mechanizm:** punkty efektu są zapisane w poprawnym układzie współrzędnych obrazu, ale celują w sąsiedni detal; zbyt mała skala efektu może dodatkowo ukryć przesunięcie.
- **Sygnatura:** poświata, hotspot lub inna nakładka pojawia się przy obiekcie (np. na przewodzie), a nie na nim; błąd pozostaje widoczny mimo poprawnego responsywnego skalowania.
- **Reguła naprawy:** przechowywać punkty raz w natywnym układzie źródła, mapować obraz i nakładkę tym samym `cover/slice`, kalibrować współrzędne na finalnym compositorze w kilku proporcjach i chronić skalę oraz kolejność testem danych.
- **Raporty:** [Bug 001 — Żarówki trzeciego rzędu nie świecą](./001-zarowki-trzeciego-rzedu-nie-swieca.md)

## Widoczny fallback przed klientowym przekierowaniem

- **Mechanizm:** statyczny HTML renderuje pełną powierzchnię pośrednią, a właściwe przekierowanie uruchamia się dopiero w efekcie klientowym po pierwszym renderze.
- **Sygnatura:** podczas wejścia na trasę przekierowującą miga ekran wyboru, loader lub inny fallback; przy wolnych chunkach JavaScript pozostaje widoczny dłużej.
- **Reguła naprawy:** przekierowanie zależne od API przeglądarki wykonywać synchronicznie w `<head>` przed widocznym body, root pozostawić bez wizualnego fallbacku, a finalny handoff chronić testem eksportowanego HTML i nagraniem granicy klatek.
- **Raporty:** [Bug 002 — Beżowy ekran wyboru języka przed stroną](./002-bezowy-ekran-wyboru-jezyka.md)

## Centrowanie względem layout viewportu zamiast pełnego viewportu

- **Mechanizm:** `width: 100%` i auto-marginesy centrują element w layout viewport pomniejszonym o klasyczny gutter scrollbara, więc na pełnym zrzucie środek może przesunąć się o połowę szerokości scrollbara.
- **Sygnatura:** element jest matematycznie wyśrodkowany według `innerWidth`, lecz na bitmapie całego okna wypada kilka pikseli w lewo; delta zwykle wynosi około 7–8 px.
- **Reguła naprawy:** dla elementu wymagającego fizycznego środka okna użyć szerokości treści i kotwicy `50vw` z translacją `-50%`, ograniczyć `max-width` i zweryfikować brak overflow na desktopie oraz mobile.
- **Raporty:** [Bug 003 — „Ostatnia aktualizacja” nie jest wyśrodkowana](./003-ostatnia-aktualizacja-nie-jest-wysrodkowana.md)

## Arbitralny measure tekstu dubluje ograniczenie grida

- **Mechanizm:** komponent ma poprawnie ograniczoną kolumnę layoutu, ale jego nagłówek dostaje drugi, znacznie węższy `max-width` w jednostkach `ch`; treść składa się niemal słowo po słowie i zostawia pozornie niewykorzystaną kolumnę.
- **Sygnatura:** nagłówki mają nadmierną liczbę wierszy mimo dużej pustej przestrzeni obok, a computed width elementu jest wielokrotnie mniejsze od szerokości rodzica.
- **Reguła naprawy:** traktować kolumnę grida jako źródło prawdy o measure, lokalny limit dodawać tylko dla jawnie zatwierdzonej kompozycji i chronić finalny skład pomiarem na wszystkich locale/breakpointach.
- **Raporty:** [Bug 005 — Absurdalne łamanie nagłówków](./005-absurdalne-lamanie-naglowkow.md)

## Półprzezroczysty panel bez budżetu kontrastu i rytmu wierszy

- **Mechanizm:** wspólny panel nad szczegółowym zdjęciem ma zbyt niską alfę, a grid pozycji nie definiuje odstępu; blur nie kompensuje zmiennej luminancji tła, a powierzchnie opcji zlewają się.
- **Sygnatura:** tekst menu jest czytelny tylko nad wybranymi fragmentami zdjęcia, a computed `rowGap` wynosi `normal`/0 px.
- **Reguła naprawy:** ustalać materiał w jednej wspólnej regule, weryfikować computed alpha na zróżnicowanym tle i deklarować jawny odstęp między pozycjami, zachowując lokalne geometrie wariantów.
- **Raporty:** [Bug 006 — Nieczytelny dropdown](./006-nieczytelny-dropdown.md)
