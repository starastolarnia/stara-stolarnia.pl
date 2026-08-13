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
- **Raporty:** [Bug 006 — Nieczytelny dropdown](./006-nieczytelny-dropdown.md), [Bug 006 regresja 1 — Niespójny dropdown języka](./006-nieczytelny-dropdown-regresja-1.md)

## Zielony test przepisany na wartość z regresji

- **Mechanizm:** zmiana produkcyjna narusza wcześniejszy kontrakt, ale w tym samym commicie asercja regresyjna zostaje dostosowana do nowej, błędnej wartości. Test pozostaje zielony, ponieważ dokumentuje implementację zamiast chronić zatwierdzone zachowanie.
- **Sygnatura:** użytkownik widzi powrót wcześniej naprawionego objawu, podczas gdy historyczny test nadal przechodzi; diff pokazuje równoległą zmianę wartości w kodzie i w oczekiwaniu testu bez udokumentowanej zmiany kontraktu.
- **Reguła naprawy:** oczekiwania wiązać z kryterium akceptacji lub pomiarem finalnego UI, a zmianę historycznego kontraktu dopuszczać wyłącznie z jawną notą w raporcie. Przy regresji najpierw przywrócić asercję zatwierdzonego zachowania i potwierdzić uczciwe RED.
- **Raporty:** [Bug 005 regresja 1 — Zwężony desktop po zmianie typografii](./005-absurdalne-lamanie-naglowkow-regresja-1.md), [Bug 006 regresja 1 — Niespójny dropdown języka](./006-nieczytelny-dropdown-regresja-1.md)

## Wspólne przejście layoutu ponownie użyte przy zmianie zawartości

- **Mechanizm:** identyfikator przejścia między kaflem a pełnym ekranem zależy od bieżącej zawartości, więc każda nawigacja wewnątrz otwartego widoku jest błędnie traktowana jak nowe otwarcie. Sekwencyjne usuwanie starego elementu dodatkowo tworzy pustą fazę.
- **Sygnatura:** po Next lub Previous stary obraz zwija się albo znika, następny pojawia się jako mały kadr i ponownie skaluje, zamiast przesunąć się w stałej ramie.
- **Reguła naprawy:** przejście otwierające kotwiczyć do niezmiennego elementu źródłowego, a nawigację po już otwartej zawartości prowadzić osobnym stanem kierunku i równoległym wejściem/wyjściem bez `mode="wait"`; ciągłość potwierdzać nagraniem compositora.
- **Raporty:** [Bug 007 — Miganie i błędna nawigacja galerii](./007-miganie-i-bledna-nawigacja-galerii.md)

## Animacja klatkowa zapisana w stanie Reacta

- **Mechanizm:** kilka równoległych animacji uruchamia własne pętle `requestAnimationFrame` i zapisuje każdą klatkę przez `setState`, wymuszając render komponentu w chwili aktywnego scrollowania.
- **Sygnatura:** strona zaczyna szarpać dokładnie przy wejściu animowanych liczników lub podobnej sekcji w viewport, choć same transformacje CSS są kompozytorowe, a test końcowych wartości pozostaje zielony.
- **Reguła naprawy:** wartości zmieniane co klatkę prowadzić przez `MotionValue`, CSS lub bezpośrednią warstwę DOM poza cyklem renderowania Reacta; test ma zabraniać ręcznego RAF + `setState`, a efekt czasowy chronić nagraniem finalnego compositora.
- **Raporty:** [Bug 005 regresja 2 — Szarpanie strony podczas scrollowania](./005-absurdalne-lamanie-naglowkow-regresja-2.md)

## Synchroniczny odczyt layoutu w ścieżce scrolla

- **Mechanizm:** callback uruchamiany dla każdej zmiany pozycji scrolla odpytuje geometrię wielu elementów przez `getBoundingClientRect()` i bezwarunkowo kolejkuje aktualizacje stanu, dokładnie gdy przeglądarka powinna składać następną klatkę.
- **Sygnatura:** geometria sekcji i `scrollHeight` pozostają stałe, ale przewijanie szarpie w pobliżu progów aktywnej nawigacji; profil pokazuje odczyty layoutu w callbacku scrolla, mimo że faktyczna wartość stanu zmienia się tylko kilka razy podczas całej strony.
- **Reguła naprawy:** mierzyć absolutne offsety poza gorącą ścieżką (po montażu, zmianie danych, `load` i `resize`), podczas scrolla porównywać wyłącznie liczby z cache, a settery przepuszczać przez ref ostatnio zatwierdzonej wartości. Kontrakt źródłowy uzupełnić nagraniem finalnego compositora.
- **Raporty:** [Bug 005 regresja 3 — Przeskok między sekcjami podczas scrollowania](./005-absurdalne-lamanie-naglowkow-regresja-3.md)

## Zagnieżdżone rozmycia w stałej warstwie nad scrollem

- **Mechanizm:** duży element `position: fixed` rozmywa tło całego top bara, a kilka jego półprzezroczystych dzieci nakłada własne `backdrop-filter`; podczas każdej klatki scrolla compositor ponownie rasteruje ten sam zmienny obszar dla każdej warstwy.
- **Sygnatura:** główny wątek i geometria pozostają stabilne, ale nagranie finalnego obrazu gubi ciągłość podczas ruchu; koszt występuje także po ponownym przejściu przez już załadowane sekcje.
- **Reguła naprawy:** na stałej powierzchni zachować jeden wspólny blur, a zamknięte kontrolki budować kolorem, obramowaniem i cieniem bez kolejnych backdropów; chronić liczbę warstw testem CSS i weryfikować rzeczywistym gestem na finalnym compositorze.
- **Raporty:** [Bug 005 regresja 4 — Nadal rwące przewijanie między sekcjami](./005-absurdalne-lamanie-naglowkow-regresja-4.md)
