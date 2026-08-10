# Bug 002 — Beżowy ekran wyboru języka przed stroną

> Start pracy: 2026-08-10 17:16
> Koniec pracy: 2026-08-10 17:42
> Status: zweryfikowany
> Zgłoszenie: „tam sie pojawia na starcie jakiś beżowy ekran z wyborem języka, nie chicałem czegoś takiego,”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-granica-klatek
> Baza analizy: 902b4cafc28f
> Commit builda nagrania przed: 902b4cafc28faf06f3be4e4bd57bd923bd06989f
> Commit builda nagrania po: af7df7ed0f003bd258ba3f9dfae296f55ec05074
> Wynik obserwacji compositora: przed zmianą 15 pierwszych klatek pokazywało beżowy picker; po zmianie żadna z 24 klatek nie zawiera pickera, a handoff prowadzi bezpośrednio do strony językowej

## TL;DR

Root `/` renderuje klientowy `LocaleRedirect` jako pełnoekranową, beżową stronę wyboru języka już w statycznym HTML. Właściwe przekierowanie uruchamia się dopiero w `useEffect`, więc z definicji następuje po pierwszym renderze i może pokazać użytkownikowi powierzchnię pośrednią. Dobór locale i docelowe strony językowe są poprawne; błędna jest faza prezentacji handoffu. Skrypt musi znaleźć się w `<head>` i wykonać synchroniczne `location.replace` przed parsowaniem widocznego body, a root nie może renderować żadnego fallbacku wizualnego.

## Kryteria akceptacji

1. **AC-1:** Wejście na `/` nie pokazuje beżowego ekranu ani ręcznego wyboru języka w żadnej widocznej klatce.
2. **AC-2:** Automatyczny wybór `/pl/`, `/en/` albo `/de/` nadal wynika z preferencji językowych przeglądarki, z polskim jako fallbackiem.
3. **AC-3:** Bezpośrednie wejścia na `/pl/`, `/en/` i `/de/` oraz ręczny dropdown z flagą pozostają bez zmian.
4. **AC-4:** Treści i tłumaczenia PL/EN/DE, układ strony docelowej oraz metadane stron językowych pozostają bez zmian.
5. **Poza zakresem:** zmiana reguł doboru języka, zapamiętywanie preferencji, zmiany treści i przebudowa nagłówka stron językowych.

## Szczegóły — odpowiedzialny kod

Numery linii odnoszą się do bazowego commita `902b4cafc28f`.

- `app/page.tsx:3,13`, `HomePage`: root importuje i zwraca wyłącznie `LocaleRedirect`; jest to jedyny produkcyjny konsument komponentu.
- `components/LocaleRedirect.tsx:12-19`, `LocaleRedirect`: `window.location.replace` jest wywoływane wewnątrz `useEffect`. Zmierzony fakt z modelu React: efekt nie jest częścią statycznego HTML i uruchamia się dopiero po renderze klientowym.
- `components/LocaleRedirect.tsx:21-32`: przed efektem komponent zwraca widoczne `<main>`, nazwę marki oraz trzy linki językowe. Ta powierzchnia trafia do `out/index.html`, więc występuje niezależnie od szybkości pobrania JavaScriptu; przy wyłączonym JS zostaje na stałe.
- `app/globals.css:923-958`: `.locale-redirect` ma `min-height: 100svh` i `background: var(--sand)`, co bezpośrednio tworzy zgłoszony beżowy ekran.
- `lib/i18n.ts:1-42`: `LOCALES`, `DEFAULT_LOCALE` i `resolvePreferredLocale` poprawnie wybierają `pl/en/de`; problem nie leży w danych locale, tylko w momencie wykonania przekierowania.
- `app/[locale]/page.tsx`, `components/VenuePage.tsx`: bezpośrednie strony językowe i dropdown nie używają `LocaleRedirect`; pozostają poza zmianą.
- Rejestr `bugs/PATTERNS.md` nie zawierał klasy dotyczącej widocznego fallbacku przed klientowym przekierowaniem.

### Wykluczone przyczyny

- **Błędne locale przeglądarki:** wykluczone, ponieważ zgłoszony ekran pojawia się przed wyborem dowolnej strony docelowej, a konfiguracja zawiera komplet `pl/en/de` i polski fallback.
- **Wolne obrazy lub fonty strony docelowej:** wykluczone przez obecność całej powierzchni `.locale-redirect` bezpośrednio w statycznym `out/index.html`.
- **Dropdown z flagą na stronach językowych:** ma innych konsumentów i inną klasę CSS; nie bierze udziału w rootowym handoffie.
- **Treści PL/EN/DE:** nie sterują komponentem `LocaleRedirect` i nie są przyczyną ekranu.

## Proponowany test (najpierw czerwony)

- **AC-1 →** `root locale handoff has no visible intermediate surface` (`app/locale-redirect.test.mjs`): po produkcyjnym buildzie odczytuje realne `out/index.html`, wymaga skryptu `locale-redirect` w `<head>` i odrzuca widoczny markup `.locale-redirect`. Na bazie test jest czerwony, ponieważ root zawiera pełnoekranowy picker i nie ma skryptu w `<head>`.
- **AC-2 →** ten sam test wykonuje produkcyjny skrypt w izolowanym kontekście `node:vm` dla preferencji `de-DE`, query i hash oraz dla nieobsługiwanego locale; oczekuje odpowiednio `/de/…` i polskiego fallbacku `/pl/`. Obecny wybór locale jest zachowaniem zachowanym; jego część bazowa może być zielona przed fixem, podczas gdy AC-1 pozostaje czerwone.
- **AC-3 →** `all localized pages remain in the static export` (`app/locale-redirect.test.mjs`): sprawdza istnienie `out/pl/index.html`, `out/en/index.html`, `out/de/index.html`; preservation test jest bazowo zielony.
- **AC-4 →** produkcyjny build i inspekcja diffu; brak zmian w `content/{pl,en,de}`, metadanych stron językowych i `VenuePage`.

Test wykonuje prawdziwy produkcyjny build i czyta jego rootowy HTML; nie mockuje ścieżki generowania strony. `node:vm` zastępuje wyłącznie przeglądarkowe `navigator` i `location`, czyli granicę poza logiką redirectu. Ponieważ defekt dotyczy pierwszej widocznej klatki, test HTML jest bramką wspierającą; dowodem zamykającym pozostają nagrania finalnego compositora przed i po zmianie wraz z czterema klatkami granicy handoffu.

## Rozwiązanie

Wyprowadzić z `LOCALES` jeden synchroniczny skrypt redirectu i osadzić go w `<head>` root layoutu. Skrypt działa wyłącznie dla pathname `/`, zachowuje kolejność `navigator.languages`, query i hash, używa polskiego fallbacku oraz wywołuje `location.replace` podczas parsowania dokumentu. `app/page.tsx` nie renderuje widocznej treści, a klientowy `LocaleRedirect` i jego nieużywane style zostają usunięte.

Nie zmieniają się: konfiguracja `LOCALES`, strony `/pl/`, `/en/`, `/de/`, dropdown z flagą, treści, metadane językowe, sitemap ani pozostały layout strony. Wspólny root layout otrzyma skrypt, ale warunek pathname powoduje brak działania na wszystkich stronach językowych.

## Raport z implementacji i testów

### RED — 2026-08-10

Polecenie: `npm test`

```text
> stara-stolarnia@0.1.0 test
> npm run build && node --test app/*.test.mjs components/*.test.mjs

> stara-stolarnia@0.1.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
✓ Compiled successfully in 2.3s
✓ Generating static pages using 7 workers (8/8) in 406ms

Route (app)
┌ ○ /
├ ○ /_not-found
├   /[locale]
│ ├ ● /pl
│ ├ ● /en
│ └ ● /de
├ ○ /robots.txt
└ ○ /sitemap.xml

✖ root locale handoff has no visible intermediate surface (1.487958ms)
✖ root locale handoff follows browser preferences and preserves the URL suffix (0.461ms)
✖ locale redirect does not run on localized pages (0.5505ms)
✔ all localized pages remain in the static export (0.29475ms)
✔ all rows keep one uninterrupted 100 ms lighting sequence (0.432041ms)
✔ rear-row bulbs keep a clearly visible glow close to the middle row (0.141791ms)
✔ the desktop glow mask stays in the source image coordinate system (0.366667ms)
ℹ tests 7
ℹ pass 4
ℹ fail 3

✖ failing tests:

✖ root locale handoff has no visible intermediate surface
  AssertionError [ERR_ASSERTION]: root export should contain the locale redirect script inside <head>

✖ root locale handoff follows browser preferences and preserves the URL suffix
  AssertionError [ERR_ASSERTION]: root export should contain the locale redirect script inside <head>

✖ locale redirect does not run on localized pages
  AssertionError [ERR_ASSERTION]: root export should contain the locale redirect script inside <head>
```

Wniosek: czerwony test reprodukuje brak parser-blocking redirectu w realnym eksporcie produkcyjnym. Preservation test stron językowych oraz istniejące testy oświetlenia pozostają zielone.

### Implementacja i GREEN — 2026-08-10

- `lib/i18n.ts`: konfiguracja ścieżek pozostaje wyprowadzona z `LOCALES`; na jej podstawie generowany jest jeden synchroniczny skrypt wyboru locale.
- `app/layout.tsx`: skrypt `locale-redirect` jest osadzony bezpośrednio w `<head>` i działa wyłącznie dla pathname `/`.
- `app/page.tsx`: root nie renderuje widocznej powierzchni pośredniej.
- `components/LocaleRedirect.tsx` oraz `.locale-redirect*` w `app/globals.css`: usunięte jako nieużywany klientowy fallback.
- `app/locale-redirect.test.mjs`, `package.json`: test produkcyjnego eksportu obejmuje brak pickera, locale przeglądarki, fallback PL, zachowanie query/hash, brak redirectu na stronach językowych oraz istnienie wszystkich trzech eksportów.

Dostarczenie: commit `af7df7ed0f003bd258ba3f9dfae296f55ec05074` na `main` (commit izolowanego brancha: `2389217aef8e185503fff196e6d4a5f937a541db`), tag `fix/002-bezowy-ekran-wyboru-jezyka`.

```text
$ npm test
✔ root locale handoff has no visible intermediate surface
✔ root locale handoff follows browser preferences and preserves the URL suffix
✔ locale redirect does not run on localized pages
✔ all localized pages remain in the static export
✔ all rows keep one uninterrupted 100 ms lighting sequence
✔ rear-row bulbs keep a clearly visible glow close to the middle row
✔ the desktop glow mask stays in the source image coordinate system
ℹ tests 7
ℹ pass 7
ℹ fail 0

$ npm run lint
> eslint .

$ npm run typecheck
> tsc --noEmit

$ git diff --check
(brak wyjścia, exit 0)
```

Checklist AC:

- **AC-1: zielony** — test HTML oraz nagranie po zmianie nie zawierają widocznej powierzchni `.locale-redirect`.
- **AC-2: zielony** — `node:vm` potwierdza kolejność preferencji, wybór DE, fallback PL oraz zachowanie query/hash.
- **AC-3: zielony** — eksporty PL/EN/DE istnieją; w przeglądarce na stronie EN widoczny był jeden przycisk języka i zero pickerów.
- **AC-4: zielony** — diff nie obejmuje `content/{pl,en,de}`, `VenuePage` ani metadanych stron językowych.

Test compositora: viewport 1280×800, 10 kl./s, ten sam Chrome i serwer produkcyjnego eksportu. Serwer opóźniał wyłącznie chunki JavaScript o 2 s, aby ujawnić granicę statyczny HTML → hydracja. Na bazie klatki `000–014` pokazywały pełny beżowy picker; klatka `015` rozpoczynała docelową stronę. Na buildzie po zmianie wszystkie 24 klatki przedstawiają wyłącznie stronę językową podczas jej naturalnego ładowania/animacji — brak pickera również przy opóźnionych chunkach. Końcowy DOM: URL `/en/?proof=after-main`, `.locale-redirect` = 0, kontrola języka = 1.

```text
$ python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/002-bezowy-ekran-wyboru-jezyka.md
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan

$ python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/002-bezowy-ekran-wyboru-jezyka.md --claim-fixed
VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony
```

### Cleanup

- Worktree `/Users/gmm/tmp/codex/bug-002` (536 MB wraz z `node_modules`, `.next` i `out`) usunięty; branch `bug/002-bezowy-ekran-wyboru-jezyka` usunięty po zapisaniu SHA `2389217aef8e185503fff196e6d4a5f937a541db` i utworzeniu tagu.
- Tymczasowy symlink `node_modules` został wcześniej usunięty po odrzuceniu go przez Turbopack; lokalna instalacja zniknęła razem z worktree.
- Log `/Users/gmm/tmp/next-panic-489b79ab1260f363fbad5a273e861bc4.log` usunięty.
- Serwery sesji `87213`, `20864` i `70419` zatrzymane; port `3102` zwolniony.
- Poprzednie numery: `/Users/gmm/tmp/codex/bug-000` i `bug-001` nie istniały; po dostarczeniu nie istnieje również `bug-002`.
- Dowód `bugs/assets/002-bezowy-ekran-wyboru-jezyka` (16 MB) pozostaje lokalnie i jest ignorowany przez Git; retencja do 2026-08-15 17:42.
- Wspólny sweep 4 h wykonany przy zamknięciu Bug 003: 19 kandydatów, 11 nieaktywnych pozycji usuniętych (2860 KiB), osiem aktywnych socketów zachowanych; wygasłe dowody: 0 katalogów, 0 B.

## Dowód końcowego compositora

- Nagranie przed: [before.mp4](assets/002-bezowy-ekran-wyboru-jezyka/before.mp4)
- Nagranie po: [after.mp4](assets/002-bezowy-ekran-wyboru-jezyka/after.mp4)
- Ostatnia klatka przed handoffem: [before-last-static.png](assets/002-bezowy-ekran-wyboru-jezyka/before-last-static.png)
- Pierwsza klatka po handoffie: [before-first-live.png](assets/002-bezowy-ekran-wyboru-jezyka/before-first-live.png)
- Ostatnia klatka przed handoffem po zmianie: [after-last-static.png](assets/002-bezowy-ekran-wyboru-jezyka/after-last-static.png)
- Pierwsza klatka po handoffie po zmianie: [after-first-live.png](assets/002-bezowy-ekran-wyboru-jezyka/after-first-live.png)

## Protokół weryfikacji

1. **RED:** na bazie `902b4cafc28f` uruchomić `npm test` po dodaniu niezmienionego testu `app/locale-redirect.test.mjs`; oczekiwane: test AC-1 fail z informacją o braku parser-blocking script lub obecności `.locale-redirect`, pozostałe dotychczasowe testy zielone.
2. **GREEN:** na kodzie po zmianie uruchomić `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; oczekiwane: wszystkie testy zielone, a build generuje `/`, `/pl`, `/en`, `/de`.
3. **Compositor:** nagrać odświeżenie `/` przed i po zmianie w tym samym viewportcie i locale. Przed: widoczna beżowa klatka pickera. Po: bezpośredni handoff do strony językowej bez widocznej powierzchni pośredniej. Wyeksportować ostatnią i pierwszą klatkę obu handoffów do ścieżek z sekcji dowodowej.
4. **Diff:** potwierdzić usunięcie `components/LocaleRedirect.tsx` i `.locale-redirect*`, pusty wizualnie root page oraz skrypt w `<head>` wyprowadzony z `LOCALES`; brak zmian `content/{pl,en,de}` i `VenuePage`.
5. **Dostarczenie:** `git tag -l 'fix/002-*'` oraz `git merge-base --is-ancestor $(git rev-parse 'fix/002-bezowy-ekran-wyboru-jezyka^{commit}') main` muszą zakończyć się sukcesem.
