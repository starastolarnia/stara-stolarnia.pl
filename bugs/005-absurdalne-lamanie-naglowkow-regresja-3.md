# Bug 005 regresja 3 — Przeskok między sekcjami podczas scrollowania

> Start pracy: 2026-08-13 19:21
> Koniec pracy: 2026-08-13 19:49
> Status: zweryfikowany
> Zgłoszenie: „i tak przy scrollu między sekcjami jest przeskok coś masz zwalone jest jakiś rerender i to nie jest super smooth scroll”
> Uzupełnienie 1: „dodatkowo jak zmienie impreze to powinno mnie animacją przescrollować do góry”
> Raport bazowy: ./005-absurdalne-lamanie-naglowkow.md
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: commit `147b9ffb4bcd392f0fc28b662d43ff927312b342`
> Commit builda nagrania przed: `147b9ffb4bcd392f0fc28b662d43ff927312b342`
> Commit builda nagrania po: `e32dbb871d97ec971e7516ce62663ec0b55afa75`
> Wynik obserwacji compositora: nagranie po zmianie pokazuje jednostajny przebieg 108 klatek przez wszystkie sekcje bez widocznego przeskoku; absolutne pozycje i wysokości sekcji oraz `scrollHeight` mają deltę 0 px. Osobne nagranie zmiany Wesele → Komunia pokazuje 11 kolejnych pozycji `scrollY` od 9588 px do 0 px i kończy się na górze strony.

## TL;DR

Poprzednia naprawa była niepełna: usunęła około 336 renderów liczników, ale pozostawiła drugą kosztowną ścieżkę w `Header`. Callback `useMotionValueEvent(scrollY, "change")` nadal przy każdej zmianie scrolla wykonuje do pięciu synchronicznych `getBoundingClientRect()` i wywołuje oba settery stanu nagłówka, choć ich wartości zwykle się nie zmieniają. Pomiar 170 kroków potwierdza, że geometria sekcji pozostaje stała (delta 0 px i stałe `scrollHeight` 10688 px), więc objaw nie jest layout shiftem całej strony; to praca na głównym wątku dokładana do każdej klatki scrolla oraz rzeczywiste rerendery nagłówka na granicach nawigacji. Osobno `selectEvent` zmienia profil bez żadnej polityki scrolla: nagranie zmiany na dole strony pokazuje `scrollY` 9588,5→9585,5 zamiast przejścia do 0.

## Kryteria akceptacji

1. AC-1: Ciągły scroll na desktopie nie wykonuje widocznego przeskoku na żadnej granicy między sekcjami.
2. AC-2: Scrollowanie nie uruchamia rerenderu ani zmiany geometrii, która przesuwa już widoczną zawartość.
3. AC-3: Istniejące animacje wejścia i liczniki nie odbierają scrollowi płynności i nie resetują się przy przekraczaniu granic sekcji.
4. AC-4: Układ, szerokości sekcji, typografia, top bar, treść i kolejność sekcji pozostają bez zmian.
5. AC-5: Mobile, tablet i `prefers-reduced-motion` pozostają bez poziomego overflow i bez nowego przeskoku.
6. AC-6: Po zmianie rodzaju imprezy strona wykonuje widoczny, płynny animowany scroll do samej góry; przy `prefers-reduced-motion` przechodzi na natychmiastowe ustawienie góry.

## Zakres i konsumenci

- Cel: klientowa ścieżka scrolla całej strony i zmiany stanu/layoutu wyzwalane podczas przechodzenia między sekcjami.
- Konsumenci: `Header` ma jednego konsumenta produkcyjnego (`VenuePage`); jego śledzenie sekcji obsługuje pięć przycisków nawigacji. `selectEvent` jest wspólną polityką dla desktopowego przełącznika, mobilnego dropdownu i desktopowego dropdownu po przewinięciu — wszystkie trzy powierzchnie mają przewijać stronę na górę tylko przy rzeczywistej zmianie imprezy.
- Poza zakresem: copy i tłumaczenia PL/EN/DE/UK, wartości statystyk, media, CTA, linki, identyfikatory sekcji i zmiana zaakceptowanej geometrii.

## Szczegóły — odpowiedzialny kod

- Numery linii według bazy `147b9ffb4bcd392f0fc28b662d43ff927312b342`.
- `components/VenuePage.tsx:677-701`, `Header` — każde zdarzenie Motion `scrollY` bezwarunkowo wywołuje `setIsScrolled`, następnie `setActiveNavigationIndex`, a po minięciu hero przechodzi po całej nawigacji i odczytuje `getBoundingClientRect()` dla do pięciu sekcji. Odczyty geometrii są wykonywane w ścieżce scrolla, więc przeglądarka musi zsynchronizować layout z JavaScriptem w czasie, gdy ma składać kolejną klatkę.
- `components/VenuePage.tsx:667-672` — brak refów ostatnio zatwierdzonego stanu i brak cache absolutnych offsetów oznacza, że callback nie odróżnia zwykłej klatki scrolla od faktycznego przekroczenia progu/nawigacyjnej granicy.
- `components/VenuePage.tsx:1062-1075`, `VenuePage.selectEvent` — wspólny handler wszystkich selektorów tylko aktualizuje `selection`; nie wywołuje `window.scrollTo`, dlatego wybór „Komunia” na dole pozostawia użytkownika przy końcu nowego profilu.
- Pomiar finalnej strony: 170 próbek scrolla 0→9588,5 px dało jeden próg top baru i pięć zmian aktywnej nawigacji, ale callback wykonał się dla każdej próbki. Absolutny `top` i wysokość każdej z dziewięciu sekcji miały deltę 0 px, a `scrollHeight` przez cały przebieg wynosił 10688 px. To wyklucza doładowanie obrazu lub zmianę wysokości sekcji jako źródło przeskoku.
- Falsyfikacja regresji 2: `node --test components/track-record.test.mjs` na bieżącym `main` nadal przechodzi `tests 2`, `pass 2`, `fail 0`, mimo ponownego zgłoszenia. Ten test chroni licznik, ale nie ścieżkę scrolla nagłówka ani zachowanie selektora imprezy.
- Nagranie zmiany imprezy przy dolnej krawędzi: po kliknięciu „Komunia” `scrollY` zmienia się wyłącznie 9588,5→9585,5 wraz z różnicą `scrollHeight` 10688→10685; nie następuje przejście do góry.

### Wykluczone przyczyny

- Layout shift sekcji — wykluczony przez stałe absolutne pozycje, wysokości i `scrollHeight` w 170 próbkach.
- Liczniki oparte o React state — wykluczone przez kod z `MotionValue` i zielony test regresji 2 (2/2).
- CSS-owy ticker jako źródło zmiany geometrii — jego transform nie zmienia rozmiaru sekcji; wysokość `#doswiadczenie` pozostawała 744,258 px przez cały pomiar.
- `prefers-reduced-motion` wymuszone w środowisku QA — `matchMedia("(prefers-reduced-motion: reduce)").matches` zwróciło `false`, a computed `scroll-behavior` wynosiło `smooth`.

## Proponowany test (najpierw czerwony)

- AC-1 → `before.mp4`/`after.mp4`: identyczny jednostajny scroll 0→dół przez wszystkie granice sekcji; dowód niosący finalnego compositora.
- AC-2 → `the header keeps layout reads and redundant state updates out of the scroll callback` (`components/event-switcher.test.mjs`): callback scrolla ma używać cache absolutnych offsetów i refów ostatniego stanu; nie może zawierać `getBoundingClientRect()` ani bezwarunkowego settera. Jest to wspierający test kontraktu źródłowego, ponieważ płynności klatki nie da się uczciwie potwierdzić w procesowym teście Node; dowodem niosącym pozostaje nagranie compositora.
- AC-3 → powyższy test kontraktu, istniejący `the track record counts once in view...` oraz nagranie scrolla przed/po.
- AC-4 → istniejące `the desktop header follows the reference geometry...`, `semantic heading scales...`, `the typography system...` oraz computed styles po buildzie.
- AC-5 → pomiar `scrollWidth - innerWidth` i siatki na desktopie, tablecie oraz mobile; scenariusz `prefers-reduced-motion` jest chroniony kodem i CSS, a zachowanie do potwierdzenia w QA.
- AC-6 → `changing an event scrolls to page top with the user's motion preference` (`components/event-switcher.test.mjs`) oraz osobne nagranie kliknięcia „Komunia” wykonanego przy dole strony. Test jest wspierającym kontraktem klientowym; nagranie finalnego compositora dowodzi faktycznej animacji.

## Rozwiązanie

W `Header` obliczyć absolutne offsety pięciu sekcji poza ścieżką scrolla: po zmianie profilu, na `load` i na `resize`. Callback Motion ma porównywać `scrollY + HEADER_SECTION_OFFSET_PX` z tablicą liczb, a refy `isScrolled` i aktywnego indeksu mają przepuszczać setter Reacta wyłącznie przy rzeczywistej zmianie progu lub sekcji. Dzięki temu scroll nie wykonuje odczytów layoutu i nie kolejkuje redundantnych aktualizacji stanu.

W `VenuePage.selectEvent` odrzucić wybór aktywnej pozycji, a przy rzeczywistej zmianie wywołać `window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" })` równolegle z aktualizacją profilu. Nie zmieniać `selectNavigationSection`, geometrii, animacji treści, top baru, copy ani danych locale.

## Raport z implementacji i testów

- RED: `node --test components/event-switcher.test.mjs` na bazie `147b9ffb4bcd392f0fc28b662d43ff927312b342` po zamrożeniu dwóch nowych regresji: `tests 21`, `pass 19`, `fail 2`. Czerwone dokładnie: `the header keeps layout reads and redundant state updates out of the scroll callback` (callback nadal zawiera `getBoundingClientRect`) oraz `changing an event scrolls to page top with the user's motion preference` (handler nie ma polityki `scrollTo`).
- GREEN: `node --test components/event-switcher.test.mjs` po implementacji: `tests 21`, `pass 21`, `fail 0`.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: produkcyjny build Next.js PASS, pełny zestaw `tests 31`, `pass 31`, `fail 0`.
- Implementacja: `components/VenuePage.tsx`, `Header` — dodano cache absolutnych offsetów odświeżany poza callbackiem scrolla po zmianie profilu, `load`, `resize` i zakończeniu przejścia; callback porównuje wyłącznie liczby i przez refy wywołuje settery tylko po zmianie progu lub aktywnej sekcji. `VenuePage.selectEvent` odrzuca wybór aktywnej imprezy, a rzeczywistą zmianę łączy z `window.scrollTo` respektującym `useReducedMotion`.
- Testy: `components/event-switcher.test.mjs` — dwa testy regresyjne są częścią domyślnego `npm test`; sprawdzają brak odczytu layoutu w gorącej ścieżce, cache/guardy stanu oraz wspólną politykę animowanego powrotu do góry.
- Scope gate: PASS — diff implementacyjny `147b9ff..e32dbb8` obejmuje wyłącznie `components/VenuePage.tsx` i `components/event-switcher.test.mjs`; brak zmian w CSS, treści locale, geometrii sekcji, top barze i danych statystyk. Pomiar finalnego builda: desktop 1869×1100, tablet 768×1024 i mobile 390×844 mają `scrollWidth - innerWidth = 0`; desktopowe `h2` nadal ma 49,6/60,016 px (3,1 rem i line-height 1,21), top bar nadal używa Manrope, logo Cormorant Garamond, `.story` nadal ma 1376 px szerokości.
- QA finalnego compositora na buildzie `e32dbb8`: 108 klatek, `scrollY` 0→9588 px, stałe `scrollHeight = 10688 px`; dla wszystkich dziewięciu sekcji delta absolutnego `top` i wysokości wynosi 0 px. Na nagraniu po zmianie nie występuje widoczny przeskok na granicach sekcji.
- QA zmiany imprezy na buildzie `e32dbb8`: kliknięcie „Komunia” przy `scrollY = 9588` daje 11 różnych kolejnych pozycji (`9588`, `9006`, `3331`, `1699`, `1034`, `643,5`, `371`, `188,5`, …, `0`) i kończy się na hero nowego profilu. Nagranie przed pozostawało przy dole (`9588,5→9585,5`).
- AC-1: zielony — finalne nagranie 108 klatek przez wszystkie granice i delta geometrii 0 px.
- AC-2: zielony — nowy test zabrania `getBoundingClientRect` w callbacku scrolla i wymaga guardów obu stanów; callback finalnego kodu aktualizuje React tylko na rzeczywistej zmianie.
- AC-3: zielony — `npm test` zawiera wcześniejszą regresję licznika; finalne nagranie przechodzi przez `#doswiadczenie` bez resetu układu i przeskoku.
- AC-4: zielony — scope gate i computed styles potwierdzają brak zmian CSS/copy/layoutu oraz zachowanie fontów top baru i logo.
- AC-5: zielony — trzy viewporty mają 0 px overflow; `reduceMotion ? "auto" : "smooth"` pozostaje bezpośrednio w obu politykach przewijania, a test obejmuje ten kontrakt.
- AC-6: zielony — finalne nagranie i ślad pozycji dowodzą animowanego powrotu z dołu do `scrollY = 0` po rzeczywistej zmianie imprezy.
- Dostarczenie: commit `e32dbb871d97ec971e7516ce62663ec0b55afa75` na `main`; commit izolowanego brancha `042896c46acbb1e00f600c5b8c866346aea92352` ma ten sam patch-id `b9e4cde316ec84af9322ca00cea8ba79a4a9062e`. Tag: `fix/005-absurdalne-lamanie-naglowkow-regresja-3`.
- Walidator zwykły: `VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan`.
- Walidator `--claim-fixed`: `VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony`.

### Cleanup

- Worktree `/Users/gmm/tmp/codex/bug-005-regresja-3` (533 MB) usunięty przez `git worktree remove`; branch `bug/005-absurdalne-lamanie-naglowkow-regresja-3` usunięty przy zachowanym SHA `042896c`; `git worktree prune` wykonany. Pozostał tylko główny worktree, a tag wskazuje dostarczony commit na `main`.
- Serwery statyczne sesji 65574 i 35435 zatrzymane; `lsof -nP -iTCP:3109 -sTCP:LISTEN` nie zwrócił procesu.
- Karta Chrome `921888609` zamknięta, tymczasowy viewport zresetowany, sesja kart sfinalizowana.
- Cztery katalogi klatek, cztery ślady JSON i dwa arkusze kontaktowe usunięte po złożeniu dowodów: katalog assets zmniejszony z 77 MB do 21 MB. Zachowano wyłącznie cztery ignorowane nagrania MP4 (przed/po scrollu i przed/po zmianie imprezy) do 2026-08-18 19:49; `git check-ignore` potwierdza `bugs/assets/`.
- Cztery taskowe logi ffmpeg spod `/tmp/bug005-reg3-*` usunięte; rozpoznawalnych artefaktów `bug*.mp4/png/jpg` lub `codex-*` bezpośrednio w `/tmp`: 0.
- Globalny sweep `~/tmp`: 190 katalogów `TemporaryDirectory.*`, 0 starszych w całym drzewie niż 4 h; `screenshot*.jpg`: 0; sockety: 18, z czego 16 starszych niż 4 h — 12 nieużywanych usunięto (0 B), 4 aktywne według `lsof` zachowano.
- Retencja `bugs/assets`: 9 katalogów sprawdzonych, 0 dowodów starszych niż pięć dni, 0 usuniętych (0 B). Bieżące cztery MP4 pozostają przez wymagane pięć dni.
- Poprzednie numery: `/Users/gmm/tmp/codex/bug-003` nie istnieje, raport 003 jest zweryfikowany; `/Users/gmm/tmp/codex/bug-004` ma 15 MB, nie jest worktree i został zachowany, bo raport 004 nadal ma status `test czerwony` (brak prawa do usunięcia stanu niedostarczonej pracy).
- Obce pozostałości `/Users/gmm/tmp/codex/menimals-appstore-1.0.2-screenshots` (19 MB) i `/Users/gmm/tmp/codex/task-testflight-1.0.5` (17 GB) zachowano: nie należą do tego repozytorium, a bieżący raport nie daje dowodu zakończenia ani prawa do ich usunięcia.
- Xcode/XcodeBuildMCP nie były używane, więc natywny purge nie miał zastosowania. Audyt końcowy: `~/tmp` 17 GB, `~/.codex` 23 GB, globalny `DerivedData` 3,8 GB; wolne miejsce 25 GiB (94% zajęte).

## Dowód końcowego compositora

- Nagranie przed: [scroll przez wszystkie sekcje na bazie](assets/005-absurdalne-lamanie-naglowkow-regresja-3/before.mp4)
- Nagranie po: [scroll przez wszystkie sekcje po zmianie](assets/005-absurdalne-lamanie-naglowkow-regresja-3/after.mp4)
- Zmiana imprezy przed: [brak powrotu do góry po wyborze Komunii](assets/005-absurdalne-lamanie-naglowkow-regresja-3/before-event-change.mp4)
- Zmiana imprezy po: [animowany powrót do góry po wyborze Komunii](assets/005-absurdalne-lamanie-naglowkow-regresja-3/after-event-change.mp4)

## Protokół weryfikacji

1. RED odtworzyć w odłączonym worktree na `147b9ffb4bcd392f0fc28b662d43ff927312b342`, kopiując bez zmian testy z `e32dbb8`, i uruchomić `node --test components/event-switcher.test.mjs`. Oczekiwane: `tests 21`, `pass 19`, `fail 2`; dokładnie dwa testy nazwane w sekcji implementacyjnej. Testy są kontraktami źródłowymi i nie udają finalnego compositora.
2. GREEN: na `main` uruchomić `node --test components/event-switcher.test.mjs` (`21/21`), `npm run lint`, `npm run typecheck` i `npm test` (build PASS, `31/31`). Finalną powierzchnię sprawdzić na produkcyjnym statycznym buildzie: scroll 0→dół przez wszystkie sekcje, potem przy dole otworzyć selektor wydarzenia i wybrać inny typ; oczekiwane są brak przeskoku sekcji i animowany powrót do `scrollY = 0`.
3. Diff: w `components/VenuePage.tsx` sprawdzić `Header` i `VenuePage.selectEvent`, w `components/event-switcher.test.mjs` dwa nowe testy. Nie mogą być zmienione `app/globals.css`, pliki `content/*`, fonty, statystyki, identyfikatory ani kolejność sekcji.
4. Spot-check przyczyny: callback `useMotionValueEvent` nie może zawierać `getBoundingClientRect`; pomiary muszą istnieć wyłącznie w `refreshNavigationOffsets`, a settery w callbacku muszą być osłonięte refami. AC-1/2/3 potwierdza nagranie scrolla + dwa testy; AC-4/5 scope gate i trzy viewporty; AC-6 nagranie zmiany imprezy + kontrakt `scrollTo`.
5. Dostarczenie: `git rev-parse 'fix/005-absurdalne-lamanie-naglowkow-regresja-3^{commit}'` ma zwrócić `e32dbb871d97ec971e7516ce62663ec0b55afa75`; `git merge-base --is-ancestor e32dbb871d97ec971e7516ce62663ec0b55afa75 main` ma wyjść 0.
6. Znane ograniczenie: `prefers-reduced-motion` jest chronione wspólnym kodem i testem kontraktu, lecz nagrania powstały przy `matchMedia(...).matches = false`; dlatego dowodzą ścieżki animowanej, której oczekiwał użytkownik, a nie osobnego nagrania wariantu bez animacji.
