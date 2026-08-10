# Bug 001 — Żarówki trzeciego rzędu nie świecą

> Start pracy: 2026-08-10 16:03
> Koniec pracy: 2026-08-10 16:43
> Status: zweryfikowany
> Zgłoszenie: „nie widzę żeby te żarówki z tyłu w 3cim rzędzie się zapalały coś tam jest skopane”
> Uzupełnienie 1: „ok ale to ma być tak ze każda kolejna żarówka zapala się po 100ms  i nie ma wyjątku na ostatni rząd, moze tam są źle namierzone żarówki?”
> Uzupełnienie 2: „moze poświata musi być większa, bo to jednak jest tylko kilka m raczej nie powinno być duzej różnicy”
> Uzupełnienie 3: „wydaje mi się że ty nie trafiasz w żarówki z tyłu, wiesz ten obrazek powinen mieć maskę jakąś tak zeby nie trzeba go było przeliczać ae to ma działać dla dowolnego zakresu w/h bo to zdjęcie wypełnia wiec musisz sobie to jakoś liczyć te współrzędne. wydaje mi sie ze z tylu cos sie tam pojawia na kablu a nie na zarówkach”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: a5f4320a924e
> Commit builda nagrania przed: a5f4320a924e
> Commit builda nagrania po: d1b4ac5b234ab6f4d978cfde0fd9f8e7ed649f04
> Wynik obserwacji compositora: PASS — na końcowym renderze poświaty tylnego rzędu są wycentrowane na bańkach i pozostają wyrównane przy szerokim oraz wąskim desktopie; nagranie pokazuje ciągłą iluminację bez wyjątku dla ostatniego rzędu.

## TL;DR

W kliencie problem nie leżał w kolejności: `HeroLights` poprawnie wyliczał jedno globalne opóźnienie `1,4 s + index × 100 ms`. Punkty trzeciego rzędu były jednak zapisane przy przewodzie zamiast na środkach baniek, a promienie `18–27` (wobec `36–56` w drugim rzędzie) dodatkowo obniżały docelową opacity do `0,28–0,322`. Punkty zostały przesunięte na bańki, a promienie zwiększone do `40–49`. SVG pozostaje responsywną maską w natywnym układzie zdjęcia `2400 × 1800`, skalowaną dokładnie jak obraz przez równoważne `cover/slice`, więc nie wymaga współrzędnych zależnych od viewportu.

## Kryteria akceptacji

1. **AC-1:** Poświata każdej z 18 żarówek w tylnym, trzecim rzędzie jest wycentrowana na odpowiadającej jej żarówce obrazu i staje się wyraźnie widoczna podczas iluminacji.
2. **AC-2:** Wszystkie 30 żarówek zapala się w jednej globalnej kolejności; każda kolejna żarówka startuje dokładnie `100 ms` po poprzedniej, bez wyjątku i bez resetowania sekwencji dla trzeciego rzędu.
3. **AC-3:** Poświata trzeciego rzędu nie jest nieproporcjonalnie mniejsza i ciemniejsza od drugiego rzędu; zachowawcza granica dla promienia i jasności zostanie dobrana na podstawie renderu na obrazie źródłowym.
4. **AC-4:** Współrzędne, jasność i wygląd żarówek w pierwszym i drugim rzędzie oraz układ całej dekoracji pozostają bez zmian.
5. **AC-5:** Zdjęcie desktopowe i wektorowa maska poświaty używają jednego układu źródłowego `2400 × 1800` oraz identycznego odwzorowania `cover/slice`, więc punkty pozostają na bańkach przy dowolnych obsługiwanych proporcjach desktopowego kontenera bez ręcznego przeliczania współrzędnych dla viewportu.
6. **AC-6:** Mobilny hero pozostaje bez nakładki, ponieważ używa osobnego zdjęcia `1600 × 1200`, na którym nie ma trzech rzędów żarówek.
7. **Poza zakresem:** treści i tłumaczenia PL/EN/DE, nawigacja, pozostałe sekcje strony oraz zmiana bazowego opóźnienia startu całej iluminacji.

Dokładny komponent docelowy to lokalny `HeroLights` używany wyłącznie przez hero w `VenuePage`. `HERO_LIGHTS` nie ma innych konsumentów produkcyjnych. Zmiana może objąć wyłącznie dane trzeciego rzędu i testowalną funkcję wyprowadzającą harmonogram; dwa wcześniejsze rzędy są nietkniętymi rodzeństwami.

## Szczegóły — odpowiedzialny kod

Numery linii poniżej odnoszą się do bazowego commita `a5f4320a924e`.

- `components/VenuePage.tsx:60-91`, `HERO_LIGHTS`: dane tworzą kolejno trzy rzędy `4 + 8 + 18`. Promienie trzeciego rzędu (`18–27`) są o `25–50%` mniejsze od najmniejszego promienia drugiego rzędu (`36`).
- `components/VenuePage.tsx:165-168`, `HeroLights`: zmierzony fakt — `delay = 1.4 + index * 0.1` zachowuje jedną sekwencję co `100 ms`; pierwszy element trzeciego rzędu startuje po `2,6 s`, ostatni po `4,3 s`. To realizuje Uzupełnienie 1 i nie jest przyczyną błędu.
- `components/VenuePage.tsx:167-168`, `HeroLights`: `restingOpacity` zależy od tego samego małego promienia. Dla trzeciego rzędu wynosi `0,28–0,322`, dla drugiego `0,364–0,458`; po uwzględnieniu centralnego `stopOpacity="0.34"` daje to wyraźnie słabszą poświatę.
- `components/VenuePage.tsx:147-190` oraz `components/VenuePage.tsx:409`, `HeroLights`: to jedyny konsument danych świateł w kodzie produkcyjnym; zmiana nie rozlewa się na inne sekcje.
- `app/globals.css:463-478`: SVG jest warstwą nad zdjęciem, a `mix-blend-mode: screen` nie wzmacnia małego okręgu, jeżeli jego środek wypada nad bańką. Zrzut diagnostyczny [`diagnostic-light-targets.png`](assets/001-zarowki-trzeciego-rzedu-nie-swieca/diagnostic-light-targets.png) pokazuje skalę i położenie wszystkich trzech grup; nagranie bazowe jest w [`before.mp4`](assets/001-zarowki-trzeciego-rzedu-nie-swieca/before.mp4).
- `components/VenuePage.tsx:151-155` i `app/globals.css:458-470`: SVG (`viewBox="0 0 2400 1800"`, `preserveAspectRatio="xMidYMid slice"`) oraz desktopowe zdjęcie (`object-fit: cover`, wyśrodkowanie) mają równoważne mapowanie źródła na kontener. Fakt zmierzony: obraz desktopowy ma dokładnie `2400 × 1800`; obraz mobilny ma `1600 × 1200`, przedstawia inny kadr bez rzędów żarówek i dlatego nakładka pozostaje tam ukryta.
- Rejestr `bugs/PATTERNS.md` nie istniał w chwili analizy, więc nie było wcześniejszej klasy do zastosowania.

### Wykluczone przyczyny

- **Wyjątek/reset opóźnienia dla trzeciego rzędu:** wykluczony przez bezpośredni odczyt `index * 0.1` i zielony test `all rows keep one uninterrupted 100 ms lighting sequence`.
- **Brak elementów SVG:** wykluczony pomiarem w przeglądarce — w desktopowym renderze istnieje dokładnie `30` elementów `.hero-lights__glow`.
- **Ukrycie całej warstwy na desktopie:** wykluczone przez `app/globals.css:985-987` (`display: block` od `48rem`) oraz nagranie przy desktopowym viewportcie.
- **Treść lub lokalizacja:** komponent i jego dane nie zależą od zawartości PL/EN/DE; żadna kopia nie jest zmieniana.
- **Brak responsywnego przeliczenia desktopowego zdjęcia:** wykluczony przez równoważne natywne mechanizmy `object-fit: cover` i SVG `xMidYMid slice` na tym samym układzie `2400 × 1800`. Problem jest widoczny już w surowych współrzędnych źródłowych na nakładce diagnostycznej.

## Proponowany test (najpierw czerwony)

- **AC-1 →** nagranie compositora `before.mp4` / `after.mp4` na produkcyjnym komponencie hero; automatyczny test nie potrafi dowieść widoczności po zmieszaniu SVG ze zdjęciem.
- **AC-2 →** `all rows keep one uninterrupted 100 ms lighting sequence` (`components/hero-lights.test.mjs`). Test jest już zielony na kodzie bazowym, co wyklucza podejrzewany wyjątek w harmonogramie.
- **AC-3 →** `rear-row bulbs keep a clearly visible glow close to the middle row` (`components/hero-lights.test.mjs`). Test używa dokładnie funkcji opacity i danych promieni konsumowanych przez widok; na błędnych danych jest czerwony.
- **AC-4 →** porównanie pierwszego i drugiego rzędu na nagraniach compositora oraz inspekcja diffu; te dane są poza zmianą produkcyjną.
- **AC-5 →** nagrania/zrzuty compositora w kilku proporcjach desktopowego viewportu; środek każdej poprawionej poświaty musi pozostać na tej samej bańce po `cover/slice`.
- **AC-6 →** zrzut mobilnego hero i inspekcja media query; osobny kadr nie dostaje maski desktopowej.

Test nie używa atrap. Prawdziwe są dane `HERO_LIGHT_ROWS`, globalna funkcja opóźnienia i funkcja docelowej opacity. Warstwa obrazu/SVG pozostaje dowodem końcowego compositora, ponieważ jest to defekt czasowy i wizualny.

## Rozwiązanie

Zachować wszystkie `30` świateł w jednej spłaszczonej kolejności i wyprowadzać odstęp z jednej stałej `HERO_LIGHT_DELAY_STEP_SECONDS = 0.1`. Dane podzielić na trzy rzędy wyłącznie po to, aby test i zmiana geometrii nie opierały się na magicznych zakresach indeksów.

Zmienić tylko trzeci rząd: zapisać środki baniek raz w natywnych współrzędnych zdjęcia `2400 × 1800` i zwiększyć promienie do zakresu zbliżonego do drugiego rzędu. SVG pozostaje wektorową maską skalowaną i kadrowaną przez `xMidYMid slice` dokładnie tak jak zdjęcie przez `object-fit: cover`; nie powstają żadne współrzędne zależne od viewportu. Pierwszy i drugi rząd, bazowe opóźnienie `1,4 s`, gradient, czas przejścia, kolejność elementów i osobny kadr mobilny pozostają bez zmian. Brak migracji danych i brak zmian kopii.

## Raport z implementacji i testów

Przed testem dane i czyste funkcje zostały wydzielone bez zmiany wartości z `components/VenuePage.tsx` do `components/hero-lights.ts`, a standardowa komenda `npm test` została dodana do `package.json`.

### RED

Komenda (cwd: `/Users/gmm/tmp/codex/bug-001`):

```text
npm test
```

Wynik:

```text
✔ all rows keep one uninterrupted 100 ms lighting sequence
✖ rear-row bulbs keep a clearly visible glow close to the middle row
✔ the desktop glow mask stays in the source image coordinate system
ℹ tests 3
ℹ suites 0
ℹ pass 2
ℹ fail 1
AssertionError [ERR_ASSERTION]: rear light at (78, 758) has radius 18; expected at least 30.599999999999998
```

- AC-2: bazowo zielony — brak wyjątku dla ostatniego rzędu.
- AC-3: czerwony z właściwego powodu — produkcyjny promień tylnej żarówki jest za mały.
- AC-5: bazowo zielony — maska i punkty są zapisane w natywnym układzie zdjęcia desktopowego `2400 × 1800`.

### Zaimplementowane zmiany

- `components/hero-lights.ts`: jedno źródło prawdy dla trzech rzędów, maski `2400 × 1800`, odstępu `0,1 s`, opóźnienia startu i funkcji opacity. Tylko 18 punktów trzeciego rzędu przesunięto o `30 px` w dół w układzie źródłowym na środki baniek; ich promienie zmieniono z `18–27` na `40–49` po kontroli końcowego renderu.
- `components/VenuePage.tsx`: `HeroLights` konsumuje wspólne dane i funkcje bez zmiany gradientu, czasu przejścia, kolejności ani dwóch pierwszych rzędów.
- `components/hero-lights.test.mjs` i `package.json`: trwały test regresji w standardowej komendzie `npm test`; sprawdza jedną sekwencję co `100 ms`, liczebność rzędów, minimalną widoczność tylnego rzędu oraz wspólny układ maski.
- Nie zmieniono zdjęć, CSS, breakpointu mobilnego ani treści. Diff nie dotyka `content/pl`, `content/en`, `content/de` ani etykiet interfejsu, więc zestawy plików i frontmatter tłumaczeń pozostają takie jak w bazie.

Dostarczenie: commit `058f4f212b55be9e032d93bb442d5f1c601a0bef` na `main` (commit fixu i testów `d1b4ac5b234ab6f4d978cfde0fd9f8e7ed649f04` jest jego przodkiem).

### GREEN

Komenda (cwd: `/Users/gmm/tmp/codex/bug-001`, przed usunięciem worktree):

```text
npm test
```

Wynik:

```text
✔ all rows keep one uninterrupted 100 ms lighting sequence (0.621458ms)
✔ rear-row bulbs keep a clearly visible glow close to the middle row (0.153459ms)
✔ the desktop glow mask stays in the source image coordinate system (0.353625ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 103.256791
```

Szersza bramka dotkniętego zakresu:

```text
npm run lint
> eslint .
exit 0

npm run typecheck
> tsc --noEmit
exit 0

npm run build
✓ Compiled successfully in 2.4s
✓ Finished TypeScript in 1317ms
✓ Generating static pages using 7 workers (8/8) in 420ms
/pl, /en i /de wygenerowane jako SSG
exit 0
```

Po scaleniu powtórzono pełną bramkę na zintegrowanym `main` (`058f4f212b55be9e032d93bb442d5f1c601a0bef`):

```text
npm test
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ duration_ms 140.44825

npm run lint
> eslint .
exit 0

npm run typecheck
> tsc --noEmit
exit 0

npm run build
✓ Compiled successfully in 897ms
✓ Finished TypeScript in 1303ms
✓ Generating static pages using 7 workers (8/8) in 411ms
/pl, /en i /de wygenerowane jako SSG
exit 0
```

Mapa kryteriów:

- **AC-1:** zielony — `after.mp4` i `after-final.jpg` pokazują 18 poświat wycentrowanych na odpowiadających im tylnych bańkach; nie ma już plam prowadzonych po przewodzie.
- **AC-2:** zielony — test `all rows keep one uninterrupted 100 ms lighting sequence` sprawdza każdy z 29 odstępów w spłaszczonej kolejności `4 + 8 + 18`; wszystkie wynoszą `100 ms`. `after.mp4` potwierdza wizualnie nieprzerwaną sekwencję.
- **AC-3:** zielony — test widoczności wymaga co najmniej `85%` najmniejszego promienia drugiego rzędu i `90%` jego najmniejszej opacity; końcowe promienie `40–49` spełniają granicę, a render potwierdza porównywalną poświatę.
- **AC-4:** zielony — diff danych pokazuje brak zmian w pierwszym i drugim rzędzie; porównanie `before.mp4`/`after.mp4` nie wykazało zmiany ich położenia ani wyglądu.
- **AC-5:** zielony — test maski sprawdza `2400 × 1800`, `xMidYMid slice` i zakres punktów; `after-wide.jpg` (`1440 × 900`) oraz `after-narrow.jpg` (`900 × 1200`) pokazują zachowane trafienie po kadrowaniu `cover`.
- **AC-6:** zielony — przy `390 × 844` zmierzono `display: none` dla `.hero-lights`, załadowano `hero-forest-mobile.webp`, a `after-mobile.jpg` potwierdza brak desktopowej nakładki na osobnym kadrze.

### Cleanup

- Zatrzymano serwer `npm run dev -- --hostname 127.0.0.1 --port 3101` (sesja `77011`); końcowa kontrola procesów nie znalazła procesu na porcie ani procesu wskazującego `bug-001`.
- Usunięto worktree `/Users/gmm/tmp/codex/bug-001` wraz z `node_modules`, `.next` i surowymi klatkami; rozmiar przed usunięciem: `728M`. Usunięto scalony branch `bug/001-zarowki-trzeciego-rzedu` i wykonano `git worktree prune`.
- `git worktree list --porcelain` pokazuje wyłącznie główny checkout, a `git branch --list 'bug/*'` nie pokazuje gałęzi tego zadania.
- Obowiązkowa kontrola dwóch poprzednich numerów: raporty/ścieżki `bug-000` i `bug--001` nie istnieją; brak pozostałości do usunięcia.
- Sweep `~/tmp` starszy niż 4 h znalazł 12 pasujących kandydatów: usunięto 6 pustych `TemporaryDirectory.*` (`0B`), zachowano 6 aktywnie otwartych socketów VS Code/SSH (`0B`). Nie znaleziono `screenshot*.jpg`; w Codex-owned `/tmp` nie znaleziono `bug*.mp4/png/jpg` ani `codex-*` należących do tego zadania.
- Katalog `/Users/gmm/tmp/codex/menimals-appstore-1.0.2-screenshots` zachowano jako zasób innego, niepotwierdzonego zadania; nie jest worktree ani pozostałością tego raportu.
- Expired-evidence sweep: `0` kandydatów, `0B` usunięte. Bieżący cache `bugs/assets/001-zarowki-trzeciego-rzedu-nie-swieca/` ma `106M`, jest ignorowany przez Git i pozostaje przez 5 dni od `Koniec pracy`, aby zachować nagrania compositora.
- XcodeBuildMCP nie był używany, więc nie było natywnego cache ani symulatora do purge.
- Końcowe użycie: `/Users/gmm/tmp` `127M`, `/Users/gmm/.codex` `22G`, `~/Library/Developer/Xcode/DerivedData` `3.8G`; wolne miejsce na wolumenie danych: `34Gi`.

## Dowód końcowego compositora

- Nagranie przed: [render hero przed zmianą](assets/001-zarowki-trzeciego-rzedu-nie-swieca/before.mp4)
- Nagranie po: [render hero po zmianie](assets/001-zarowki-trzeciego-rzedu-nie-swieca/after.mp4)
- Końcowa klatka przed: [pełny desktop przed zmianą](assets/001-zarowki-trzeciego-rzedu-nie-swieca/before-final.jpg)
- Końcowa klatka po: [pełny desktop po zmianie](assets/001-zarowki-trzeciego-rzedu-nie-swieca/after-final.jpg)
- Szeroki desktop: [1440 × 900](assets/001-zarowki-trzeciego-rzedu-nie-swieca/after-wide.jpg)
- Wąski desktop: [900 × 1200](assets/001-zarowki-trzeciego-rzedu-nie-swieca/after-narrow.jpg)
- Mobile: [390 × 844, osobny obraz bez maski](assets/001-zarowki-trzeciego-rzedu-nie-swieca/after-mobile.jpg)

Obserwacja: na `before.mp4` małe, słabe plamy trzeciego rzędu biegną po przewodzie nad bańkami. Na `after.mp4` kolejne poświaty pojawiają się na bańkach i pozostają tam po zakończeniu animacji. Zrzuty szeroki/wąski potwierdzają, że wspólne kadrowanie `cover/slice` zachowuje zgodność maski przy różnych proporcjach; mobile ładuje osobny obraz i ukrywa maskę.

Walidator uruchomiony w tym samym przebiegu po ustawieniu statusu terminalnego:

```text
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan
VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony
```

## Protokół weryfikacji

1. **RED od zera:** utworzyć worktree na `a5f4320a924e`, przenieść bez zmiany wartości bazowe dane `HERO_LIGHTS` do `components/hero-lights.ts`, dodać test z commita `d1b4ac5` bez produkcyjnej korekty tylnego rzędu i uruchomić `npm test`. Oczekiwane: `3` testy, `2` pass, `1` fail z `rear light at (78, 758) has radius 18; expected at least 30.599999999999998`.
2. **GREEN:** na `main` uruchomić `npm ci`, następnie `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Oczekiwane: `3/3` testy zielone, lint/typecheck `exit 0`, produkcyjny build generuje `/pl`, `/en`, `/de`. Testy używają realnych danych i funkcji importowanych przez `VenuePage`; niczego nie mockują. Widoczność na obrazie niesie prawdziwy render przeglądarki w nagraniach, nie test źródłowej geometrii.
3. **Weryfikacja środowiska:** uruchomić `npm run dev -- --hostname 127.0.0.1 --port 3101`, otworzyć `/pl/`, odświeżyć i obserwować hero od pierwszej klatki przez co najmniej `6 s`. W tym przebiegu wykonano to na produkcyjnym komponencie przy desktopie domyślnym, `1440 × 900`, `900 × 1200` i mobile `390 × 844`; wynik zapisano w linkach powyżej. Nie wykonywano deployu, ponieważ zgłoszenie dotyczyło lokalnego klienta, a repo nie zawierało zlecenia publikacji.
4. **Inspekcja diffu:** w `components/hero-lights.ts` potwierdzić, że tylko trzeci rząd ma nowe `y` i `radius`, zaś dwa pierwsze są identyczne z bazą. W `VenuePage.tsx` potwierdzić brak zmiany gradientu i właściwości `motion.circle`; w `app/globals.css`, zdjęciach oraz `content/{pl,en,de}` nie powinno być zmian tego fixu.
5. **Spot-check twierdzeń i AC:** `getHeroLightDelay` + test sekwencji falsyfikują AC-2; `HERO_LIGHT_ROWS[2]` + nagranie `after.mp4` falsyfikują AC-1/AC-3; `HERO_LIGHT_MASK`, `object-fit: cover` oraz szeroki/wąski zrzut falsyfikują AC-5; media query i zrzut mobile falsyfikują AC-6; `git diff a5f4320a924e..d1b4ac5 -- components/hero-lights.ts components/VenuePage.tsx` falsyfikuje AC-4.
6. **Znane ograniczenia:** test jednostkowy nie rozpoznaje pikseli bańki; dlatego nie jest dowodem trafienia. Dowodem zamykającym jest końcowy compositor `after.mp4` oraz zrzuty z produkcyjnego rodzica. Dokładne `100 ms` jest chronione testem harmonogramu, bo próbkowanie nagrania ekranu nie ma rozdzielczości gwarantującej pomiar każdego odstępu.
