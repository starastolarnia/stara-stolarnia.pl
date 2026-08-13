# Bug 005 regresja 4 — Nadal rwące przewijanie między sekcjami

> Start pracy: 2026-08-13 19:57
> Koniec pracy: 2026-08-13 20:18
> Status: zweryfikowany
> Zgłoszenie: „no przecież to kurwa dalej rwie” ([nagranie użytkownika](assets/005-absurdalne-lamanie-naglowkow-regresja-4/user-report.mov))
> Raport bazowy: ./005-absurdalne-lamanie-naglowkow.md
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: commit `ad27cd60f57f9b2883ab2c6088e3555247083040`
> Commit builda nagrania przed: `ad27cd60f57f9b2883ab2c6088e3555247083040`
> Commit builda nagrania po: `879214e77c39963137c892b60ac37206742ccdd6`
> Wynik obserwacji compositora: Nagranie użytkownika ma podczas aktywnego scrolla przerwy 100–133 ms i widoczną utratę ciągłości obrazu; finalny render po zmianie przeszedł rzeczywistym wejściem koła 0→4900→0 bez zmiany geometrii, poziomego overflow ani zatrzymania na granicach sekcji. Top bar zachował jeden computed `blur(14px)`, a trzy zagnieżdżone powierzchnie mają `backdrop-filter: none`.

## TL;DR

Nagranie użytkownika potwierdza utratę ciągłości finalnego obrazu podczas aktywnego scrolla: w kilku miejscach brakuje 6–8 kolejnych klatek (przerwy 100–133 ms), mimo że geometria sekcji nie zmienia się. Poprzedni protokół był fałszywie zielony, bo teleportował stronę przez `scrollTo()` i sprawdzał tylko położenia po zatrzymaniu. Powtórzenie rzeczywistego wejścia kołem/gładzikiem wraz z próbkowaniem `requestAnimationFrame` utrzymuje główny wątek w rytmie 60 Hz (`maxFrame 17,7 ms`), więc pozostały koszt leży po stronie rastra/compositora. Stały top bar składa do czterech nakładających się `backdrop-filter`: jeden na całej obudowie i kolejne na selektorze, aktywnym segmencie oraz CTA. Naprawa zostawia pojedyncze rozmycie obudowy i usuwa redundantne rozmycia z jej zamkniętych kontrolek, bez zmiany ich koloru, obramowania, cienia lub geometrii.

## Kryteria akceptacji

1. AC-1: Rzeczywisty scroll z nagrania użytkownika nie rwie ani nie przeskakuje przy przejściu między sekcjami.
2. AC-2: Weryfikacja używa ciągłego wejścia scrolla odpowiadającego myszy lub gładzikowi, a nie serii teleportów `scrollTo` między arbitralnymi pozycjami.
3. AC-3: Układ, szerokości sekcji, typografia, top bar, treść, statystyki i kolejność sekcji pozostają bez zmian.
4. AC-4: Animowany powrót do góry po zmianie rodzaju imprezy nadal działa i kończy się na `scrollY = 0`; `prefers-reduced-motion` nadal przechodzi natychmiast.
5. AC-5: Desktop, tablet i mobile nie dostają poziomego overflow ani nowego przeskoku.

## Zakres i konsumenci

- Cel: rzeczywista klientowa ścieżka przewijania całej strony widoczna na nagraniu użytkownika.
- Do zachowania: zaakceptowany układ, copy, fonty, top bar, dane statystyk, animacje sekcji i zachowanie zmiany rodzaju imprezy.
- Wspólny materiał top bara: `.site-header` — jedyna stale widoczna warstwa `backdrop-filter`, zachowana bez zmian.
- Zagnieżdżeni konsumenci do odciążenia: `.site-header__cta`, `.event-dropdown__trigger-shell` oraz `.segmented-control__thumb-content` używany przez przełącznik imprez i nawigację sekcji.
- Poza zmianą: rozwijane menu `.event-dropdown__menu` i `.language-switcher__menu`; ich blur działa tylko przy otwartym panelu i nie uczestniczy w zwykłym scrollu.
- Warianty: desktop korzysta ze wszystkich trzech zagnieżdżonych powierzchni; mobile już nadpisuje blur triggera na `none`, dlatego zmiana nie modyfikuje jego renderu.

## Szczegóły — odpowiedzialny kod

- `app/globals.css:198-216` utrzymuje duży, stały `.site-header` z `blur(14px)`.
- `app/globals.css:271-290`, `310-320` i `643-652` dodają w jego wnętrzu trzy kolejne powierzchnie `blur(12px)`. Reguły pochodzą z commita `572972f7`.
- Poprzednia regresja 3 prawidłowo usunęła synchroniczne odczyty layoutu z callbacka scrolla, ale jej test i nagranie nie mierzyły finalnej ciągłości klatek. Test `components/event-switcher.test.mjs` pozostaje zielony na buildzie z nagrania użytkownika, więc nie obejmuje obecnego mechanizmu.
- Odtworzenie rzeczywistym gestem na widoku `1582 × 1074` dało po stronie `requestAnimationFrame`: 164 klatki, `maxFrame = 17,7 ms`, 0 klatek ponad 20 ms. Nagranie finalnego obrazu w tym samym rodzaju ruchu ma podczas aktywnego scrolla przerwy 100–133 ms. Ta rozbieżność wyklucza rerender Reacta/główny wątek jako pozostałą przyczynę i wskazuje koszt rastra/compositora.
- Wykluczone alternatywy: (1) ponowny reflow sekcji — kolejne klatki zachowują stałe szerokości i wysokości; (2) dekodowanie lazy images — objaw powtarza się przy ruchu wstecz przez już odwiedzone sekcje; (3) licznik statystyk zapisujący stan co klatkę — regresja 2 nadal blokuje RAF + `setState`, a aktualny `AnimatedStat` używa `MotionValue`.

## Proponowany test (najpierw czerwony)

- AC-1/2 → test CSS zabrania `backdrop-filter` na trzech zamkniętych kontrolkach wewnątrz stale rozmytego top bara; nagranie użytkownika jest dowodem RED finalnego compositora, a nagranie po zmianie musi powtórzyć rzeczywisty wzorzec wejścia kołem/gładzikiem.
- AC-3 → istniejące testy geometrii, typografii i locale oraz porównanie finalnego renderu.
- AC-4 → istniejący test `changing an event scrolls to page top with the user's motion preference` i osobny scenariusz przeglądarkowy.
- AC-5 → pomiar overflow i przebieg na desktopie, tablecie i mobile.

## Rozwiązanie

W `app/globals.css` pozostawić `blur(14px)` wyłącznie na `.site-header`, który jest wspólnym materiałem całego top bara. Z `.site-header__cta`, `.event-dropdown__trigger-shell` i `.segmented-control__thumb-content` usunąć obie deklaracje `backdrop-filter`; zachować ich dotychczasową alfę tła, border, promień i cienie, dzięki czemu hierarchia wizualna pozostaje, ale compositor nie rasteruje w każdej klatce kilku nakładających się kopii tła.

Do `components/event-switcher.test.mjs` dodać kontrakt blokujący powrót zagnieżdżonych blurów oraz utrzymać test materiału kapsuły na jej faktycznych cechach wizualnych (`background`, border, radius). Nie zmieniać Reacta, danych locale, wymiarów top bara, breakpointów, nawigacji, sekcji ani polityk przewijania.

## Raport z implementacji i testów

- Falsyfikacja poprzedniej naprawy: `node --test components/event-switcher.test.mjs` na `ad27cd6` dał `tests 21`, `pass 21`, `fail 0`, mimo że załączone nagranie nadal pokazuje rwący scroll. Poprzedni protokół sprawdzał teleporty `scrollTo()` i statyczną geometrię, więc nie przechodził przez ścieżkę rzeczywistego wejścia ani nie mierzył finalnej ciągłości obrazu.
- RED (finalna, niezmieniona asercja), cwd `/Users/gmm/tmp/codex/bug-005-regresja-4`: `node --test --test-name-pattern='the fixed header keeps one backdrop blur instead of stacking compositor passes' components/event-switcher.test.mjs` → `tests 1`, `pass 0`, `fail 1`; błąd: `The input was expected to not match the regular expression /backdrop-filter:/s`, a otrzymana reguła `.site-header__cta` zawierała `-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px)`.
- GREEN: to samo polecenie po zmianie → `tests 1`, `pass 1`, `fail 0`.
- Focused suite: `node --test components/event-switcher.test.mjs` → `tests 22`, `pass 22`, `fail 0`.
- `npm run lint` → exit 0; `npm run typecheck` → exit 0.
- `npm test` → produkcyjny build Next.js PASS; `tests 32`, `pass 32`, `fail 0`.
- Implementacja: `app/globals.css` — usunięto 6 deklaracji (`-webkit-backdrop-filter` + `backdrop-filter`) z trzech zamkniętych kontrolek wewnątrz top bara. `components/event-switcher.test.mjs` — dodano test regresyjny pojedynczej warstwy blur i przestawiono istniejącą asercję kapsuły na zachowane cechy materiału.
- Scope gate: `git diff --check` PASS; diff implementacyjny dotyka wyłącznie dwóch powyższych plików. Brak zmian w `content/pl`, `content/en`, `content/de`, `content/uk`, więc zestawy plików, frontmatter, copy, linki, sekcje i NBSP nie uległy zmianie; test spójności locale przeszedł dla wszystkich czterech obsługiwanych wersji repozytorium.
- Finalny desktop 1582×1074: `scrollHeight = 10658`, `scrollWidth - clientWidth = 0`, szerokość `.shell = 1376`, top bar przed i po scrollu ma ten sam rect `x=147, y=20, width=1288, height=88`. Computed filtry: header `blur(14px)`, CTA/trigger/thumb `none`.
- Tablet 1024×768: `scrollHeight = 10397`, overflow 0; mobile 390×844: `scrollHeight = 12031`, overflow 0. Rzeczywisty scroll przez sekcje nie zmienił geometrii top bara.
- Zmiana imprezy Wesele → Komunia przy `scrollY = 4000`: po kliknięciu próbki wynosiły `3846, 3621, 3173, 2265.5, 1686.5, 1287, …, 20, 10, 2, 0`, czyli animacja nadal kończy się dokładnie na górze.
- AC-1: zielony — porównanie nagrania użytkownika i `after-browser.mov` oraz rzeczywisty gest 0→4900→0 nie pokazują zatrzymania na granicach sekcji.
- AC-2: zielony — dowód powstał przez `cua.scroll`, nie arbitralne `scrollTo` między sekcjami; test blokuje mechanizm wielokrotnego rastra.
- AC-3: zielony — scope gate, geometria 1582×1074 i pełne 32/32 testy potwierdzają zachowanie layoutu, typografii, top baru, copy i statystyk.
- AC-4: zielony — ślad 24 pozycji potwierdza animowany powrót do 0; test chroni `reduceMotion ? "auto" : "smooth"`.
- AC-5: zielony — desktop/tablet/mobile mają 0 px overflow i zachowują stałą geometrię.
- Dostarczenie: commit `879214e77c39963137c892b60ac37206742ccdd6` na `main`; commit izolowanego brancha `eb7692d3010eb97809d25744d11f0350dc9a998b` ma ten sam patch. Tag: `fix/005-absurdalne-lamanie-naglowkow-regresja-4`.
- Walidator zwykły: `VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan`.
- Walidator `--claim-fixed`: `VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony`.

### Cleanup

- Dwa serwery Next na portach 3100 i 3101 zatrzymane; sesje procesów 58842 i 32337 zakończone.
- Karta Chrome sfinalizowana bez zachowanych kart, a tymczasowy viewport 1582×1074/1024×768/390×844 zresetowany.
- Robocze katalogi 202 klatek, 8 arkuszy czasowych, 2 arkusze kontaktowe i ślad vidstab usunięte z `bugs/assets/005-absurdalne-lamanie-naglowkow-regresja-4/`; katalog zmniejszony z 92 MB do 31 MB.
- Ignorowane nagrania `user-report.mov` i `after-browser.mov` (łącznie 31 MB) zachowane do 2026-08-18 20:18 zgodnie z pięciodniową retencją dowodu.
- Worktree `/Users/gmm/tmp/codex/bug-005-regresja-4` (630 MB) usunięty przez `git worktree remove`; branch `bug/005-absurdalne-lamanie-naglowkow-regresja-4` usunięty po potwierdzeniu identycznego patch-id `28c19dfb6aae72fa910511fbef5ef76989c99368`. Branch SHA przed usunięciem: `eb7692d3010eb97809d25744d11f0350dc9a998b`; `git worktree prune` wykonany, pozostał tylko główny worktree.
- Globalny sweep `/Users/gmm/tmp`: 227 katalogów `TemporaryDirectory.*`, 0 z całym drzewem starszym niż 4 h; `screenshot*.jpg`: 0. Wykryto 11 socketów, 8 starszych niż 4 h: 7 aktywnych według `lsof` zachowano, 1 nieużywany `vscode-ah-89805ef1000e/Qf5Rn_wRLBpln2fGNP-6bg.sock` usunięto (0 B).
- Dwa taskowe logi ffmpeg spod `/tmp/bug005-*` oraz bieżący log paniki Next usunięto; dodatkowo usunięto jeden nieużywany log paniki Next z 2026-08-10 po sprawdzeniu `lsof`. Rozpoznawalnych artefaktów `bug*.mp4/png/jpg`, `bug*.mov` lub `codex-*` bezpośrednio w `/tmp`: 0.
- Retencja `bugs/assets`: 10 katalogów sprawdzonych, 0 terminalnych dowodów starszych niż pięć dni, 0 usuniętych. Bieżące dwa MOV pozostają przez wymagane pięć dni.
- Dwa poprzednie numery: `/Users/gmm/tmp/codex/bug-003` nie istnieje, a raport 003 jest zweryfikowany; `/Users/gmm/tmp/codex/bug-004` ma 15 MB i został zachowany, bo raport 004 nadal ma status `test czerwony`.
- Obce katalogi `/Users/gmm/tmp/codex/menimals-appstore-1.0.2-screenshots` (19 MB), `task-testflight-1.0.5` (3,1 MB) oraz `task-testflight-1.0.5-1286-release-qa` (7,7 GB) zachowano: nie należą do tego repozytorium i brak prawa do usunięcia niedostarczonej pracy.
- Xcode/XcodeBuildMCP nie były używane. Audyt końcowy: `/Users/gmm/tmp` 8,0 GB, `/Users/gmm/.codex` 23 GB, globalny `DerivedData` 3,8 GB; wolne miejsce 31 GiB (93% zajęte).

## Dowód końcowego compositora

- Nagranie przed: [rzeczywisty scroll użytkownika z przerwami finalnego obrazu](assets/005-absurdalne-lamanie-naglowkow-regresja-4/user-report.mov)
- Nagranie po: [rzeczywisty scroll kołem przez finalny render 1582 × 1074](assets/005-absurdalne-lamanie-naglowkow-regresja-4/after-browser.mov)

## Protokół weryfikacji

1. RED: utworzyć detached worktree na `ad27cd60f57f9b2883ab2c6088e3555247083040`, skopiować bez zmian test `the fixed header keeps one backdrop blur instead of stacking compositor passes` z `879214e`, uruchomić `node --test --test-name-pattern='the fixed header keeps one backdrop blur instead of stacking compositor passes' components/event-switcher.test.mjs`; oczekiwane `tests 1`, `pass 0`, `fail 1` na zagnieżdżonym `backdrop-filter`. Test jest wspierającym kontraktem źródłowym; nie udaje dowodu finalnego compositora.
2. GREEN: na `main` uruchomić to samo polecenie (`1/1`), `node --test components/event-switcher.test.mjs` (`22/22`), `npm run lint`, `npm run typecheck` i `npm test` (`32/32`, build PASS). Testy nie używają mocków; czytają realne arkusze CSS, komponent oraz wszystkie locale.
3. Finalny compositor: uruchomić build z commita `879214e`, ustawić 1582×1074 i przewinąć fizycznym kołem/gładzikiem 0→około 5000→0. Porównać z `user-report.mov`; oczekiwany jest ciągły ruch bez 100–133 ms zatrzymań. Potwierdzić computed `backdrop-filter`: `.site-header = blur(14px)`, a CTA, trigger i thumb = `none`.
4. Diff: jedynymi zmianami produkcyjnymi są trzy pary usuniętych deklaracji w `app/globals.css`; `components/event-switcher.test.mjs` dodaje kontrakt. Nie mogą zmienić się geometria, fonty, copy, zawartość locale, breakpoints, animacje reveal, statystyki ani kolejność sekcji.
5. AC map: AC-1/2 — dwa nagrania + rzeczywisty gest; AC-3 — diff, 32/32 i geometria desktopu; AC-4 — scenariusz zmiany imprezy + test `changing an event scrolls…`; AC-5 — pomiar overflow na 1582×1074, 1024×768 i 390×844.
6. Dostarczenie: `git rev-parse 'fix/005-absurdalne-lamanie-naglowkow-regresja-4^{commit}'` ma zwrócić `879214e77c39963137c892b60ac37206742ccdd6`, a `git merge-base --is-ancestor 879214e77c39963137c892b60ac37206742ccdd6 main` ma wyjść 0.
