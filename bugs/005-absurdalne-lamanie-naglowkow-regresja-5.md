# Bug 005 regresja 5 — scroll nadal rwie

> Start pracy: 2026-08-13 20:30
> Koniec pracy: 2026-08-13 20:55
> Status: zablokowany: brak dowodu końcowego compositora
> Zgłoszenie: „nie poprawiłeś tego”
> Raport bazowy: ./005-absurdalne-lamanie-naglowkow.md
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: 1ca728ed52d9f48a32b35989c4853ba4b531f5ab
> Commit builda nagrania przed: 879214e77c39963137c892b60ac37206742ccdd6
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —

## TL;DR

Poprzednia naprawa celowała w koszt compositora, ale nie zmieniła toru wejścia scrolla, który nadal jest w pełni natywny i skokowo odwzorowuje paczki delty z koła/gładzika. W buildzie bazowym jeden rzeczywisty gest `960 px` dał tylko sześć pozycji (`0, 256, 395, 743, 874, 960`) i cały ruch zakończył się w 176 ms; po zakończeniu wejścia nie było żadnej interpolacji. `scroll-behavior: smooth` dotyczy istniejących przejść programatycznych/anchorów, a `motion/useScroll` tylko obserwuje pozycję — żaden z nich nie wygładza wejścia `wheel`. Poprzedni test nadal przechodzi, mimo potwierdzonego objawu, a „nagranie po” z regresji 4 było pętlą screenshotów, nie nagraniem czasu rzeczywistego; była to fałszywie zielona weryfikacja złego mechanizmu.

## Kryteria akceptacji

1. **AC-1:** Na desktopie fizyczny scroll kółkiem lub gładzikiem przesuwa stronę w sposób ciągły, bez widocznych skoków między sekcjami.
2. **AC-2:** Dowodem końcowym jest nagranie rzeczywistego compositora przy normalnym scrollowaniu, a nie wniosek z VFR, pętla screenshotów ani programatyczny teleport `scrollTo`.
3. **AC-3:** Zmiana rodzaju imprezy nadal animuje przewinięcie strony do góry; przy `prefers-reduced-motion` przejście pozostaje natychmiastowe.
4. **AC-4:** Nie zmieniają się: układ i szerokości sekcji, typografia, top bar, treść, liczniki oraz istniejące animacje wejścia.
5. **AC-5:** Desktop jest powierzchnią główną; tablet i mobile zachowują brak poziomego overflow oraz działające sterowanie.

Zakres: tor scrollowania dokumentu oraz wywołania przewijania po zmianie imprezy. Poza zakresem: redesign, zmiany copy, treści lokalizacyjne, geometria sekcji i stylistyka top baru.

## Szczegóły — odpowiedzialny kod

- Numery linii poniżej są przypięte do bazy `1ca728ed52d9f48a32b35989c4853ba4b531f5ab`.
- `app/globals.css:24-26` ustawia tylko natywne `scroll-behavior: smooth` i `scroll-padding-top`. Nie istnieje warstwa, która przechwytuje `wheel`, utrzymuje cel przewinięcia i interpoluje pozycję na kolejnych klatkach.
- `components/VenuePage.tsx:663-714` (`Header`) pobiera `scrollY` z Motion i reaguje na jego zmianę. Ten kod jest obserwatorem już wykonanej pozycji, nie generatorem toru ruchu. Regresja 3 prawidłowo usunęła z callbacka odczyty layoutu, ale nie mogła zmienić charakterystyki natywnego scrolla.
- `components/VenuePage.tsx:831` i `components/VenuePage.tsx:1114-1118` wygładzają wyłącznie programatyczne przejścia do sekcji i do góry. Zwykły gest użytkownika omija oba wywołania.
- `package.json:13-21` nie zawiera żadnego silnika wygładzającego `wheel`.
- Pomiar finalnej strony w Chrome, viewport `1582 × 1074`, realne `cua.scroll` o `960 px`: sześć różnych pozycji `0 → 256 → 395 → 743 → 874 → 960`; zmiany trwały od 71 do 176 ms, wejście zakończyło się po 217 ms, a przez pozostałe ~2 s pozycja była stała. To odtwarza zgłoszoną charakterystykę ruchu bez programatycznego `scrollTo`.
- Oryginalny protokół regresji 4 został odtworzony na aktualnym kodzie: `node --test --test-name-pattern='the fixed header keeps one backdrop blur instead of stacking compositor passes' components/event-switcher.test.mjs` daje `tests 1`, `pass 1`, `fail 0`. Zielony wynik obok powracającego symptomu dowodzi, że test pilnuje wyłącznie kształtu CSS i nie pokrywa awarii.
- Dostarczenie poprzedniej zmiany do Git jest potwierdzone: lokalny `main`, `origin/main` i `git ls-remote origin refs/heads/main` wskazują `1ca728e`, który zawiera commit produkcyjny `879214e`. Repo nie ma workflow wdrożeniowego ani konfiguracji hostingu, a domena nie rozwiązuje się z tego środowiska; wdrożenie publiczne pozostaje niepotwierdzone i nie jest używane jako dowód przyczyny.
- Konsumenci: `VenuePage` jest renderowany przez jedyną trasę treści `app/[locale]/page.tsx:48`, więc naprawa celowo obejmie wszystkie profile wydarzeń i wszystkie locale. Wewnątrz tej strony musi zachować cztery istniejące ścieżki programatyczne: menu sekcji, zmianę imprezy, hero/skip-link oraz linki „do góry”.

### Wykluczone przyczyny

- **Rerender Reacta na każdej klatce:** callback `Header` zapisuje stan tylko przy zmianie progu lub aktywnej sekcji (`components/VenuePage.tsx:683-713`), a poprzedni test nadal chroni brak odczytu layoutu w gorącej ścieżce.
- **Zmiana geometrii sekcji:** pomiar przed zmianą kończy się dokładnie na docelowym `scrollY = 960`; nie występuje korekta wysokości dokumentu ani cofnięcie pozycji, tylko sześć dużych kroków wejścia.
- **Zagnieżdżone blury top baru jako przyczyna obecnego charakteru ruchu:** ich usunięcie jest obecne na aktualnym buildzie, poprzedni kontrakt CSS przechodzi, a ślad pozycji pozostaje skokowy.
- **Niezaładowana poprzednia zmiana w lokalnym buildzie:** uruchomiony worktree bazuje na `1ca728e` i zawiera commit `879214e`; osobno nie udało się zweryfikować publicznego deployu.

## Proponowany test (najpierw czerwony)

- **AC-1 / AC-2 →** nowy, trwały test wspierający `wheel scrolling is driven by one reduced-motion-aware smooth-scroll engine` w `components/event-switcher.test.mjs`; ma wymagać jednego silnika Lenis z `autoRaf`, `smoothWheel`, anchorami i obsługą reduced motion oraz wspólnego `scrollTo` dla przejść programatycznych. Ponieważ płynność jest efektem czasowym finalnego compositora, test źródłowy nie jest dowodem niosącym; RED/AFTER stanowią pomiar rzeczywistego gestu i nagrania finalnej strony.
- **AC-3 →** istniejący test `changing an event scrolls to page top with the user's motion preference`, rozszerzony tak, by wymagał tego samego kontrolera przewijania; scenariusz przeglądarkowy z pozycji około `4000` do `0`, osobno normal motion i reduced motion.
- **AC-4 →** istniejące testy typografii, layoutu, contentu i animacji oraz porównanie geometrii/renderu przed-po. Ten AC już jest zielony na bazie; zmiana nie może go naruszyć.
- **AC-5 →** pomiar `scrollWidth - clientWidth` i obsługa na `1582×1074`, `1024×768`, `390×844`. Ten AC już jest zielony na bazie; zmiana nie może go naruszyć.
- Brak mocków w teście wspierającym: czyta on realny komponent, layout, CSS i `package.json`. Finalny test compositora uruchamia realny build i realne wejście koła.

## Rozwiązanie

- Dodać pojedynczą instancję aktualnego Lenis `1.3.26` na poziomie `VenuePage`, z `autoRaf: true`, `smoothWheel: true`, anchorami oraz domyślnym `respectReducedMotion: true`; dotyk pozostawić natywny (`syncTouch: false`). Silnik pracuje na natywnym scrollu dokumentu, więc istniejące sticky/fixed, Motion `useScroll` i dostępność pozostają na tym samym źródle pozycji.
- Skierować menu sekcji i zmianę imprezy przez `Lenis.scrollTo`, z bezpiecznym fallbackiem natywnym do czasu montażu instancji. Przy reduced motion Lenis wyłącza interpolację i wykonuje przejścia programatyczne natychmiast.
- Włączyć obsługę anchorów i rekomendowany arkusz `lenis/dist/lenis.css`, tak aby hero, skip-link, logo i linki „do góry” nie straciły działania.
- Nie zmieniać wartości typograficznych, wymiarów/gridów, treści, lokalizacji, animacji reveal/statystyk ani stylistyki top baru.

## Raport z implementacji i testów

- RED, cwd `/Users/gmm/tmp/codex/bug-005-regresja-5`:

  ```text
  $ node --test --test-name-pattern='wheel and programmatic scrolling share one reduced-motion-aware smooth-scroll model' components/event-switcher.test.mjs
  ✖ wheel and programmatic scrolling share one reduced-motion-aware smooth-scroll model (2.462458ms)
  ℹ tests 1
  ℹ pass 0
  ℹ fail 1
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + undefined
  - '^1.3.26'
  at components/event-switcher.test.mjs:406:10
  exit 1
  ```

- Test jest wspierającym kontraktem źródłowym, nie dowodem płynności. Jego asercja została zamrożona po tym RED; dowodem niosącym pozostają nagrania finalnego compositora przed i po oraz ślad realnego wejścia.
- Implementacja na branchu `bug/005-absurdalne-lamanie-naglowkow-regresja-5`, commit `f483fd94d37e94447f72c3e0bc6781e56bcc4b5a`:
  - `components/venue-scroll.model.ts` tworzy jedną instancję Lenis z `autoRaf`, `smoothWheel`, anchorami, natywnym dotykiem i respektowaniem reduced motion; udostępnia jeden `scrollTo` z fallbackiem przed montażem.
  - `components/VenuePage.tsx` kieruje zmianę imprezy i menu sekcji przez wspólny model. Ręczny offset został odrzucony po pomiarze, ponieważ Lenis już uwzględnia `scroll-padding-top`; podwójny offset ustawiał sekcję na 176 px zamiast 88 px. Finalna wersja kończy na `87,64 px` przy computed `88 px`.
  - `app/layout.tsx`, `package.json`, `package-lock.json` dodają oficjalny arkusz i zależność Lenis `1.3.26`.
  - `components/event-switcher.test.mjs` dodaje zamrożony kontrakt i aktualizuje zachowany test powrotu do góry.
- GREEN, ten sam test i cwd:

  ```text
  $ node --test --test-name-pattern='wheel and programmatic scrolling share one reduced-motion-aware smooth-scroll model' components/event-switcher.test.mjs
  ✔ wheel and programmatic scrolling share one reduced-motion-aware smooth-scroll model (0.981542ms)
  ℹ tests 1
  ℹ pass 1
  ℹ fail 0
  ```

- Focused suite: `node --test components/event-switcher.test.mjs` → `tests 23`, `pass 23`, `fail 0`.
- Pełna bramka: `npm test` → produkcyjny build Next.js ukończony, 9/9 stron statycznych; `tests 33`, `pass 33`, `fail 0`.
- `npm run lint` → exit 0; `npm run typecheck` → exit 0; `git diff --check` → exit 0.
- Produkcyjny `out`, desktop `1582×1074`: `scrollHeight = 10658`, overflow `0`, `.shell = 1376`, top bar `x=147, y=20, width=1288, height=88` — wartości zgodne z buildem sprzed zmiany.
- Ten sam realny gest na bazie: 6 pozycji i koniec ruchu po 176 ms. Po zmianie w dev: 39 pozycji, ruch kontynuowany po zakończeniu wejścia aż do celu; w produkcyjnym `out`: 38 pozycji oraz ruch po zakończeniu wejścia. To wspiera diagnozę, ale nie zastępuje nagrania compositora.
- Zmiana imprezy z `scrollY = 4000`: 39 odczytanych pozycji i finalne `scrollY = 0`; anchor hero kończy na `targetViewportTop = 88` przy `scroll-padding-top = 88px`; menu sekcji kończy na `87,64 px`.
- Tablet `1024×768`: `scrollHeight = 10397`, overflow `0`, właściwy mobilny wariant przełącznika. Mobile `390×844`: `scrollHeight = 12031`, overflow `0`, właściwy mobilny wariant przełącznika. Klasa `html.lenis` obecna w obu wariantach.
- Nie zmieniono user-facing copy ani plików `content/pl`, `content/en`, `content/de`, `content/uk`. Pełna bramka potwierdziła identyczne zestawy plików, frontmatter i strukturę wszystkich czterech locale; interfejsowe etykiety i reguły NBSP pozostają bez zmian.
- AC-1: automatycznie wspierany — finalny kontrakt 1/1 i rzeczywisty ślad 6→39 pozycji; oczekuje na niosące nagranie finalnego compositora.
- AC-2: automatycznie wspierany — pomiar użył `cua.scroll`, nie `scrollTo`; oczekuje na rzeczywiste nagranie wideo.
- AC-3: zielony — test zmiany imprezy, 39-pozycyjny przebieg 4000→0 i konfiguracja `respectReducedMotion`.
- AC-4: zielony — 33/33, geometria desktopu i brak zmian copy/CSS layoutu.
- AC-5: zielony — pomiary desktop/tablet/mobile i overflow 0.
- Dostarczenie: commit `2061bafd5928707d1768fc0658046ee7d708d550` na `main`. Commit roboczy `f483fd94d37e94447f72c3e0bc6781e56bcc4b5a` ma identyczny patch-id `b49d2b6483f102adafd3b20fcbd6083748066705`; tag kandydata: `fix/005-absurdalne-lamanie-naglowkow-regresja-5`.
- Otwarte: automatyczne `AVFoundation` i `screencapture` nie mają dostępu do nagrywania ekranu; próba natywnego UI QuickTime nie uruchomiła zapisu. Bez prawdziwego `after` raport nie może przejść do `zweryfikowany`.

### Cleanup

- Worktree `/Users/gmm/tmp/codex/bug-005-regresja-5` usunięto po przeniesieniu identycznego patcha na `main`; branch `bug/005-absurdalne-lamanie-naglowkow-regresja-5` usunięto. Jedynym worktree pozostaje główny katalog repozytorium.
- Zatrzymano serwer Next na porcie `3205`, serwer produkcyjnego `out` na porcie `3206`, QuickTime oraz próbę ffmpeg. Końcowy audyt nie znalazł listenerów na tych portach ani procesów nagrywania; pliki `capture-probe.mp4` i `capture-probe.mov` nie istnieją. Sesję przeglądarkową zamknięto po przywróceniu viewportu.
- Sweep `/Users/gmm/tmp`: 228 katalogów `TemporaryDirectory.*`, wszystkie modyfikowane w ciągu ostatnich 4 godzin, więc 0 kwalifikowało się do usunięcia; `screenshot*.jpg` bezpośrednio w tym katalogu: 0. Rozpoznawalnych artefaktów zadania w `/tmp` nie znaleziono.
- Sockety: znaleziono 10; 3 mają mniej niż 4 godziny, a wszystkie 7 starszych należy do aktywnych procesów (`67510`, `67512`, `67515`). Usunięto 0, aby nie naruszyć cudzych aktywnych sesji.
- Wygasłe dowody starsze niż 5 dni: 0 kandydatów, 0 usuniętych. `before.mov` bieżącej, zablokowanej regresji pozostaje wymaganym dowodem. Katalog poprzedniego `bug-003` nie istnieje, raport jest zamknięty; `bug-004` zajmuje 15 MiB i pozostaje, ponieważ raport ma status `test czerwony`.
- XcodeBuildMCP nie był używany. Audyt końcowy: `/Users/gmm/tmp` 343 MiB, `/Users/gmm/.codex` 23 GiB, globalny DerivedData 3,8 GiB; 35 GiB wolnego miejsca. Globalne katalogi tylko odnotowano i nie były modyfikowane.

## Dowód końcowego compositora

- Nagranie przed: [nagranie użytkownika](assets/005-absurdalne-lamanie-naglowkow-regresja-5/before.mov)
- Nagranie po: —

## Protokół weryfikacji

1. RED: w detached worktree na `1ca728ed52d9f48a32b35989c4853ba4b531f5ab` skopiować bez zmian zamrożony test z commita `2061bafd5928707d1768fc0658046ee7d708d550` i uruchomić `node --test --test-name-pattern='wheel and programmatic scrolling share one reduced-motion-aware smooth-scroll model' components/event-switcher.test.mjs`; oczekiwane `tests 1`, `pass 0`, `fail 1` na braku zależności `^1.3.26`. Wynik odtworzony i zapisany w sekcji implementacji.
2. GREEN: na `main` uruchomić to samo polecenie (`1/1`), `node --test components/event-switcher.test.mjs` (`23/23`), `npm test` (`33/33`, build 9/9), `npm run lint`, `npm run typecheck` i `git diff --check`; wszystkie zakończyły się powodzeniem. Testy czytają realny komponent, model, layout, manifest zależności, CSS i zawartość locale.
3. Finalny compositor: uruchomić build dokładnie z `2061bafd5928707d1768fc0658046ee7d708d550` w rzeczywistej przeglądarce przy viewport `1582×1074`, wykonać fizycznym kołem/gładzikiem trasę 0→około 5000→0 i zmianę imprezy z pozycji około 4000. Zapisać nieprzetworzone `after.mov`; dopiero bez widocznych skoków można uzupełnić hash builda, wynik obserwacji i zmienić status na `zweryfikowany`.
4. Diff: produkcyjnie dodano `components/venue-scroll.model.ts`, zależność i CSS Lenis w `package.json`, `package-lock.json`, `app/layout.tsx` oraz podłączenie modelu w `components/VenuePage.tsx`; `components/event-switcher.test.mjs` dodaje kontrakt. Nie zmieniono copy, fontów, gridów, szerokości, breakpointów, top baru, animacji reveal ani statystyk.
5. AC map: AC-1/2 — prawdziwe nagrania przed i po oraz ślad fizycznego wejścia; obecnie brakuje `after`. AC-3 — test zmiany imprezy, przebieg 4000→0 i reduced motion. AC-4 — 33/33, diff i zgodna geometria desktopu. AC-5 — pomiar desktop/tablet/mobile z overflow 0.
6. Środowisko docelowe: repo nie zawiera workflow wdrożeniowego ani konfiguracji hostingu, a domena nie rozwiązuje się z tego środowiska. Publiczny deploy jest niezweryfikowany i nie może być użyty jako dowód końcowy.
7. Dostarczenie: `git rev-parse 'fix/005-absurdalne-lamanie-naglowkow-regresja-5^{commit}'` ma zwrócić `2061bafd5928707d1768fc0658046ee7d708d550`, a `git merge-base --is-ancestor 2061bafd5928707d1768fc0658046ee7d708d550 main` ma wyjść 0. Po pushu `git ls-remote origin refs/heads/main refs/tags/fix/005-absurdalne-lamanie-naglowkow-regresja-5` musi wskazać ten commit.
8. Ograniczenie: automatyczne `AVFoundation` i `screencapture` nie miały dostępu do nagrywania ekranu, a próba przez QuickTime nie uruchomiła zapisu. Ślad 6→38/39 pozycji potwierdza działanie interpolacji technicznie, ale nie zastępuje obserwacji finalnego compositora.
