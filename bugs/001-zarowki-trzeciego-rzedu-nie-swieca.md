# Bug 001 — Żarówki trzeciego rzędu nie świecą

> Start pracy: 2026-08-10 16:03
> Koniec pracy: —
> Status: test czerwony
> Zgłoszenie: „nie widzę żeby te żarówki z tyłu w 3cim rzędzie się zapalały coś tam jest skopane”
> Uzupełnienie 1: „ok ale to ma być tak ze każda kolejna żarówka zapala się po 100ms  i nie ma wyjątku na ostatni rząd, moze tam są źle namierzone żarówki?”
> Uzupełnienie 2: „moze poświata musi być większa, bo to jednak jest tylko kilka m raczej nie powinno być duzej różnicy”
> Uzupełnienie 3: „wydaje mi się że ty nie trafiasz w żarówki z tyłu, wiesz ten obrazek powinen mieć maskę jakąś tak zeby nie trzeba go było przeliczać ae to ma działać dla dowolnego zakresu w/h bo to zdjęcie wypełnia wiec musisz sobie to jakoś liczyć te współrzędne. wydaje mi sie ze z tylu cos sie tam pojawia na kablu a nie na zarówkach”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: a5f4320a924e
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —

## TL;DR

W kliencie problem nie leży w kolejności: `HeroLights` poprawnie wylicza jedno globalne opóźnienie `1,4 s + index × 100 ms`. Punkty trzeciego rzędu zostały jednak zapisane przy przewodzie zamiast na środkach baniek, a promienie `18–27` (wobec `36–56` w drugim rzędzie) dodatkowo obniżają docelową opacity do `0,28–0,322`. SVG już jest właściwą responsywną maską w natywnym układzie zdjęcia `2400 × 1800`; błąd stanowią źródłowe punkty i skala poświaty, nie brak przelicznika viewportu.

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

### Cleanup

- Utworzony zasób zadania: worktree `/Users/gmm/tmp/codex/bug-001`, branch `bug/001-zarowki-trzeciego-rzedu` (do usunięcia po dostarczeniu albo zablokowaniu przebiegu).
- Zależności testowe: `/Users/gmm/tmp/codex/bug-001/node_modules` (wewnątrz worktree, do usunięcia razem z nim).
- Proces testowy: serwer deweloperski `npm run dev -- --hostname 127.0.0.1 --port 3101`, sesja `77011` (do zatrzymania po nagraniach i testach UI).
- Lokalny cache dowodu: `bugs/assets/001-zarowki-trzeciego-rzedu-nie-swieca/` (ignorowany przez Git; retained przez 5 dni po zamknięciu raportu zgodnie z procedurą).

## Dowód końcowego compositora

- Nagranie przed: [render hero przed zmianą](assets/001-zarowki-trzeciego-rzedu-nie-swieca/before.mp4)
- Nagranie po: [do uzupełnienia po zmianie](assets/001-zarowki-trzeciego-rzedu-nie-swieca/after.mp4)

## Protokół weryfikacji
