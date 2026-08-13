# Bug 005 regresja 1 — Zwężony desktop po zmianie typografii

> Start pracy: 2026-08-12 15:58
> Koniec pracy: 2026-08-12 16:17
> Status: regresja: 2
> Regresja: [Po tej zmianie strona szarpie podczas scrollowania](./005-absurdalne-lamanie-naglowkow-regresja-2.md)
> Zgłoszenie: „font na h2 nagłówków sekcji zrób na 3.1rem a linehieght na 1.21 w top barze zachowaj poprzednie fonty zarówno w menu jak i w logo, dodatkowo wszystkie <p> zrób o 2px większy miałeś podmienić fonty, a zepsułeś też układ strony kolumny, szerokość sekcji etc, troche tam jest teraz za ciasno na desktopie. - mówie o desktop reszte dostosuj Na screenshot widzisz jak to się animuje zrób to też u nas, dodaj jeszcze sekcje ze zrobili ponad: 120 wesel, 300 komunii, 60 imprez firmowych, 50 imprez rodzinnych dodaj to też jako takie animowane” ([referencja animacji i sekcji statystyk](assets/005-absurdalne-lamanie-naglowkow-regresja-1/reference-track-record.png))
> Raport bazowy: ./005-absurdalne-lamanie-naglowkow.md
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: commit `39075f0e4aeb8533b6427d009b3731c8e3807a91`
> Commit builda nagrania przed: `39075f0e4aeb8533b6427d009b3731c8e3807a91`
> Commit builda nagrania po: `d4a26b1fe9ed9daa14dc8681cacfacceea8062a8`
> Wynik obserwacji compositora: PASS — desktopowy kontener ma ponownie 1376 px przy viewportcie 1699 px, top bar 1288 px, H2 dokładnie 49,6 px / 60,016 px, akapit 18,32 px, a wejście sekcji uruchamia płynne liczenie 0→120/300/60/50; na desktopie, tablecie i mobile nie ma poziomego overflow.

## TL;DR

Commit `39075f0e4aeb8533b6427d009b3731c8e3807a91` połączył zmianę typografii z niezamierzoną przebudową geometrii: token kontenera zmalał z `86rem` do `72rem`, a desktopowy top bar, gridy i odstępy sekcji dostały mniejsze wartości. Istniejący test regresyjny został w tym samym commicie przepisany na nowe, błędne wartości, dlatego pozostał zielony mimo widocznej regresji. Naprawa odtworzy geometrię z rodzica commita bazowego, pozostawi General Sans w treści, przywróci wcześniejsze kroje w top barze i doda lokalizowaną sekcję liczników z prawdziwym wejściem w viewport.

## Kryteria akceptacji

1. AC-1: Na desktopie wszystkie nagłówki sekcji H2 mają `3.1rem` i `line-height: 1.21`.
2. AC-2: Top bar zachowuje typografię sprzed commita bazowego: menu i kontrolki używają poprzedniego kroju tekstowego, a logo poprzedniego kroju display.
3. AC-3: Widoczne akapity treści są o 2 px większe niż przed korektą, z responsywnym dostosowaniem poza desktopem.
4. AC-4: Szerokości sekcji, proporcje kolumn, odstępy między kolumnami i geometria top baru na desktopie wracają do stanu sprzed commita bazowego; sama wymiana fontów nie może ponownie zwężać layoutu.
5. AC-5: Mobile i tablet pozostają czytelne, bez poziomego overflow, obcięć oraz kolizji top baru.
6. AC-6: Powstaje sekcja doświadczenia inspirowana dostarczonym screenshotem, z animowanym wejściem i licznikami uruchamianymi po wejściu sekcji w viewport; `prefers-reduced-motion` pokazuje wartości końcowe bez animacji.
7. AC-7: Sekcja pokazuje ponad 120 wesel, 300 komunii, 60 imprez firmowych i 50 imprez rodzinnych.
8. AC-8: Nowy tytuł, etykiety i dostępne opisy sekcji istnieją i zachowują zgodną strukturę w PL/EN/DE/UK.
9. AC-9: Copy, zdjęcia, linki, identyfikatory sekcji, profile wydarzeń i zachowanie nawigacji poza dodaniem nowej sekcji pozostają bez zmian.

## Zakres i konsumenci

- Cel: typografia H2 i akapitów, przywrócenie geometrii desktopu, zachowanie dawnej typografii top baru oraz nowa globalna sekcja doświadczenia.
- Wspólni konsumenci do zinwentaryzowania: `VenuePage`, wszystkie profile wydarzeń, PL/EN/DE/UK, desktop/tablet/mobile.
- Poza zakresem: zmiana istniejących faktów, obrazów, CTA, kolejności profili wydarzeń i logiki wyboru języka.

## Szczegóły — odpowiedzialny kod

- `app/globals.css:11-20` — commit bazowy zmienił `--shell` na `72rem`, `--header-max-width` na `72rem` oraz zmniejszył tokeny wysokości i położenia top baru.
- `app/globals.css:68-79` — globalna skala H2 zatrzymała się na `2.25rem / 1.11`, zamiast żądanych `3.1rem / 1.21` na desktopie.
- `app/globals.css:178-214` — logo korzysta obecnie z nowego Fraunces, a top bar dziedziczy General Sans; kontrakt wymaga wcześniejszych Cormorant Garamond i Manrope.
- `app/globals.css:887-1069` oraz reguły desktopowe — w tym samym commicie zmniejszono odstępy, wysokości mediów, kolumny i gapy sekcji, co sumuje się w ciasny widok desktopowy.
- `app/layout.tsx:2-20` — Cormorant Garamond został zastąpiony Fraunces, a Manrope wystawiono tylko jako fallback cyrylicy; top bar utracił oba wcześniejsze przypisania.
- `components/event-switcher.test.mjs:363-483` — test geometrii i typografii został dostosowany do regresyjnych wartości (`72rem`, `4rem`, General Sans/Fraunces), więc nie wykrywa problemu.
- Klasa z rejestru: „Zielony test przepisany na wartość z regresji” — produkcja i oczekiwanie testu zmieniły się razem, mimo że zatwierdzony kontrakt layoutu nie uległ zmianie.

Protokół starego błędu uruchomiony na bazie: `node --test components/event-switcher.test.mjs` — 19/19 testów przechodzi. To fałszywie ujemny wynik: pomiar w przeglądarce przy viewportcie 1699×1000 pokazuje kontener/top bar o szerokości 1152 px (`72rem`), H2 `36px / 39.96px` i akapit `16.32px / 26.52px`.

## Proponowany test (najpierw czerwony)

1. Wzmocnić istniejący test kontraktu desktopu: `86rem` dla głównego kontenera, `80.5rem` dla top baru, przywrócone wartości desktopowego grida i paddingów, H2 `3.1rem / 1.21`, Manrope w top barze oraz Cormorant Garamond w logo.
2. Dodać test treści, który sprawdza identyczny zestaw plików i strukturę frontmatter PL/EN/DE/UK oraz dokładne cztery wartości statystyk `120/300/60/50`.
3. Dodać test kontraktu animacji: sekcja renderuje licznik uruchamiany wejściem w viewport i kończy na pełnej wartości przy `prefers-reduced-motion`.
4. Głównym dowodem defektu czasowego pozostaje porównanie nagrań compositora przed/po, wykonanych na desktopowym buildzie z tym samym przebiegiem scrolla.

## Rozwiązanie

Odtworzyć wyłącznie wartości geometrii z commita `39075f0^`, rozdzielić tokeny typograficzne na tekst treści, akcent serif i niezmienne fonty top baru, a nowe statystyki modelować w treści jako wspólną sekcję wszystkich profili. Animacja licznika ma być lokalnym zachowaniem prezentacyjnym komponentu, startować raz po wejściu w viewport i respektować ograniczenie ruchu systemu.

Zrealizowano:

- odtworzono kontener `86rem`, top bar `80.5rem`, desktopowe gridy, szerokości hero, odstępy kolumn i pionowy rytm sekcji z rodzica commita bazowego;
- rozdzielono fonty: General Sans dla treści i nagłówków, Manrope dla top baru, Cormorant Garamond dla logo oraz Fraunces dla akcentów i liczników; fonty mają `latin-ext`, a ukraiński używa cyrylicznych fallbacków;
- ustawiono H2 na `3.1rem / 1.21` od 48rem i powiększono widoczne akapity o 2 px względem stanu przed poprawką;
- dodano jeden typowany model sekcji doświadczenia, cztery równoległe pliki PL/EN/DE/UK, przesuwany ticker i liczniki uruchamiane raz po wejściu w viewport;
- dla `prefers-reduced-motion` wartości końcowe są renderowane od razu, a ticker nie porusza się.

## Rejestr zasobów tymczasowych

- Worktree: `/Users/gmm/tmp/codex/bug-005-regresja-1` — do usunięcia po dostarczeniu poprawki.
- Branch: `bug/005-absurdalne-lamanie-naglowkow-regresja-1` — do usunięcia po integracji do `main`.
- Dowody lokalne i klatki: `bugs/assets/005-absurdalne-lamanie-naglowkow-regresja-1/` — katalog ignorowany przez Git; klatki robocze do usunięcia po złożeniu MP4.
- Serwer podglądu: proces `python3 -m http.server` na porcie `3108`, sesja `22221` — do zatrzymania po QA.

## Raport z implementacji i testów

- RED — `node --test components/event-switcher.test.mjs components/track-record.test.mjs`: 21 testów, 15 zaliczonych, 6 niezaliczonych. Padają dokładnie kontrakty geometrii desktopu, skali H2, fontów top baru oraz brakujące treści i zachowanie nowej sekcji statystyk.
- GREEN — `npm run typecheck`: PASS.
- GREEN — `npm run lint`: PASS.
- GREEN — `npm test`: build produkcyjny PASS oraz 29/29 testów PASS dla wszystkich stron statycznych i czterech lokalizacji.
- Dosłowny wynik bramki standardowej: `tests 29`, `pass 29`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`.
- Dostarczenie: commit `d4a26b1fe9ed9daa14dc8681cacfacceea8062a8` na `main` (commit izolowanego brancha: `fe16669c66ae922d8bd39c721ca0d18df95a08ef`), tag `fix/005-absurdalne-lamanie-naglowkow-regresja-1`.
- Test bazowy został wzmocniony: ponownie wymaga geometrii sprzed regresji i uwzględnia szósty nagłówek H2 po dodaniu uzgodnionej sekcji; testu historycznego nie osłabiono.
- Scope Gate: PASS — diff produkcyjny obejmuje `app/globals.css`, `app/layout.tsx`, `components/VenuePage.tsx`, `lib/content.ts` i cztery równoległe pliki `075-doswiadczenie.md`; test zgodności potwierdza identyczne zestawy plików, frontmatter i strukturę Markdown PL/EN/DE/UK. Istniejące copy, zdjęcia, linki, identyfikatory i profile wydarzeń nie zostały zmienione.
- QA desktop 1699×1000: shell 1375,99 px, top bar 1288 px, H2 49,6 px / 60,016 px, akapit 18,32 px, Manrope w kontrolce menu, Cormorant Garamond w logo, overflow 0 px.
- QA tablet 1024×818 i mobile 391×847: overflow 0 px, top bar mieści się w viewportcie, sekcja przechodzi z czterech do dwóch kolumn, a wszystkie liczniki dochodzą do wartości końcowych.
- Logi runtime przeglądarki: 0 błędów.
- AC-1: zielony — computed style H2 49,6 px / 60,016 px i test `semantic heading scales use the requested desktop values`.
- AC-2: zielony — computed style Manrope w kontrolce menu, Cormorant Garamond w logo i test systemu typografii.
- AC-3: zielony — akapit historii 18,32 px wobec 16,32 px przed zmianą oraz jawne korekty wyspecjalizowanych akapitów.
- AC-4: zielony — shell 1375,99 px i top bar 1288 px wobec odpowiednio 1152 px przed zmianą; test geometrii wymaga ponownie wartości bazowych.
- AC-5: zielony — obserwacja 1024×818 i 391×847, overflow 0 px.
- AC-6/AC-7: zielony — nagranie compositora oraz test liczników; widoczny przebieg 0→120/300/60/50 i końcowe wartości z plusem.
- AC-8: zielony — test `every locale exposes the same four track-record totals` oraz test parytetu plików/frontmatter dla PL/EN/DE/UK.
- AC-9: zielony — Scope Gate i pełny build wszystkich dziewięciu tras statycznych.
- Walidator zwykły: `VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan`.
- Walidator zamknięcia: `VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony`.

### Cleanup

- Usunięto worktree `/Users/gmm/tmp/codex/bug-005-regresja-1` (543 MB), branch `bug/005-absurdalne-lamanie-naglowkow-regresja-1` i wpisy administracyjne worktree; historię izolowanego commita zachowują raport oraz tag dostarczenia. Ścieżka i branch już nie istnieją.
- Zatrzymano oba serwery podglądu na porcie 3108 (sesje 22221 i 93245); `lsof -nP -iTCP:3108 -sTCP:LISTEN` nie zwraca procesu. Przywrócono domyślny viewport i zamknięto kartę QA w przeglądarce.
- Usunięto robocze katalogi klatek `before-frames` i `after-frames`, błędnie rozszerzony duplikat `before-desktop.png` oraz log paniki Turbopack `/Users/gmm/tmp/next-panic-151bdaf4620dd9b8bb57afc77a416523.log`; odzyskano około 5,1 MB poza worktree.
- Zachowano 2,2 MB lokalnych, ignorowanych dowodów w `bugs/assets/005-absurdalne-lamanie-naglowkow-regresja-1/` na wymagane pięć dni; `git check-ignore -v` potwierdza regułę `bugs/assets/`. Wygasłe dowody: 0 katalogów, 0 B.
- Globalny sweep: rozpoznawalnych artefaktów Codex w `/tmp`: 0. Usunięto 3 puste `TemporaryDirectory.*` i 3 nieużywane, starsze niż 4 godziny sockety `ssh-askpass` (łącznie 0 B); 19 pozostałych wpisów wzorców jest aktywnych lub ma świeżą zawartość i nie zostało naruszonych. Nie było kandydatów `screenshot*.jpg`.
- Poprzednie numery: bug 003 jest zweryfikowany i nie ma worktree/brancha; bug 004 pozostaje w stanie `test czerwony`, dlatego jego 15 MB dowodów w `/Users/gmm/tmp/codex/bug-004` celowo zachowano. Nie jest to worktree i nie ma aktywnego procesu.
- XcodeBuildMCP nie był używany; nie wykonywano purge. Końcowe użycie: `/Users/gmm/tmp` 212 MB, `/Users/gmm/.codex` 23 GB, `DerivedData` 3,8 GB. Dysk: 460 GiB, 378 GiB użyte, 33 GiB wolne (93%).

## Dowód końcowego compositora

- Nagranie przed: [zwężony desktop bez sekcji liczników](assets/005-absurdalne-lamanie-naglowkow-regresja-1/before.mp4)
- Nagranie po: [wejście sekcji oraz liczenie do wartości końcowych](assets/005-absurdalne-lamanie-naglowkow-regresja-1/after.mp4)
- Widok przed: [zwężony desktop po zmianie typografii](assets/005-absurdalne-lamanie-naglowkow-regresja-1/before-desktop.jpg)
- Widok po: [przywrócona geometria i sekcja statystyk](assets/005-absurdalne-lamanie-naglowkow-regresja-1/after-desktop.jpg)
- Widok mobile: [responsywna sekcja w dwóch kolumnach podczas liczenia](assets/005-absurdalne-lamanie-naglowkow-regresja-1/after-mobile.jpg)

## Protokół weryfikacji

1. RED od zera: utworzyć tymczasowy worktree na `39075f0e4aeb8533b6427d009b3731c8e3807a91`, zastosować tylko testowy fragment `git diff d4a26b1^ d4a26b1 -- components/event-switcher.test.mjs components/track-record.test.mjs | git apply`, a następnie uruchomić `node --test components/event-switcher.test.mjs components/track-record.test.mjs`. Oczekiwane: 21 testów, 15 PASS i 6 FAIL dla geometrii, H2, fontów, brakujących danych i animacji.
2. GREEN: na `main` uruchomić `npm run typecheck`, `npm run lint` i `npm test`. Oczekiwane: build produkcyjny PASS, 29 testów, 29 PASS, 0 FAIL. Testy treści i CSS odczytują realne pliki projektu; czasowy rezultat animacji jest dowiedziony realnym nagraniem przeglądarki, nie emulacją w teście źródłowym.
3. Zbudować statyczny serwis poleceniem `npm test` i uruchomić `python3 -m http.server 3108 --directory out`.
4. Otworzyć `/pl/#miejsce` przy viewportcie 1699×1000 i sprawdzić w computed styles: shell 1376 px, H2 49,6 px / 60,016 px, tekst akapitu 18,32 px, menu Manrope, logo Cormorant Garamond. To falsyfikuje AC-1–AC-4.
5. Przejść do `/pl/#doswiadczenie` od strony galerii i obserwować jednorazowe przejście liczników z 0 do `120+`, `300+`, `60+`, `50+` oraz ruch tickera. Powtórzyć na 1024×818 i 391×847; sprawdzić overflow 0 px, dwie kolumny mobile i cztery od tabletu. To falsyfikuje AC-5–AC-7.
6. Włączyć `prefers-reduced-motion: reduce`; wartości mają pojawić się od razu, ticker pozostaje nieruchomy. Sprawdzić `/pl`, `/en`, `/de`, `/uk`: identyczna kolejność i wartości, lokalizowane nagłówki/tickery/etykiety oraz brak błędów konsoli. To falsyfikuje AC-6 i AC-8.
7. Inspekcja diffu: potwierdzić zmiany tylko w plikach wymienionych przez Scope Gate. Zweryfikować, że istniejące copy, media, CTA, linki, ID i profile w `000`–`070`, `080` i `090` nie różnią się od `39075f0`; jedynym nowym dokumentem jest `075-doswiadczenie.md` w każdym locale. To falsyfikuje AC-9.
8. Potwierdzić dostarczenie: `git merge-base --is-ancestor $(git rev-parse 'fix/005-absurdalne-lamanie-naglowkow-regresja-1^{commit}') main` ma zakończyć się kodem 0.
9. Znane ograniczenia: font General Sans jest ładowany ze wskazanego CDN tak jak przed tą regresją; przy jego czasowej niedostępności przeglądarka używa fallbacku sans-serif. Brak niewykonanych kroków wdrożenia w repozytorium.
