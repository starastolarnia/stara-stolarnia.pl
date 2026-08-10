# Bug 003 — „Ostatnia aktualizacja” nie jest wyśrodkowana

> Start pracy: 2026-08-10 17:30
> Koniec pracy: 2026-08-10 17:42
> Status: zweryfikowany
> Zgłoszenie: „przy okazji popraw to ze osatnia aktualizacja nie jest idealnie na środku”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: wizualny-statyczny
> Baza analizy: af7df7ed0f00
> Commit builda nagrania przed: af7df7ed0f003bd258ba3f9dfae296f55ec05074
> Commit builda nagrania po: 0e47615d8148a5e93f48d7a22dc6ce0c7d79da16
> Wynik obserwacji compositora: środek `.footer__updated` ma deltę 0 px względem 50vw dla PL/EN/DE przy 1536 px oraz dla PL przy 390 px; brak poziomego overflow

## TL;DR

Blok `.footer__updated` jest centrowany przez `margin-inline: auto` w szerokości układu liczonej jako `100%`, czyli względem layout viewportu pomniejszonego o klasyczny pionowy scrollbar. Na zrzucie użytkownika bitmapa ma 1536 px szerokości, a widoczny obrys napisu ma środek w x=761 zamiast x=768 — dokładnie o około połowę szerokości 15-pikselowego scrollbara w lewo. Pozostała siatka stopki jest poprawna. Napis powinien dostać własną szerokość treści i kotwicę `50vw`, która wskazuje fizyczny środek viewportu również wtedy, gdy scrollbar zabiera miejsce z obszaru layoutu.

## Kryteria akceptacji

1. **AC-1:** Tekst „Ostatnia aktualizacja” jest wyśrodkowany względem całej szerokości strony, a nie względem jednej kolumny stopki.
2. **AC-2:** Pozostałe elementy stopki — logo, hasło i link do Facebooka — zachowują obecne położenie.
3. **AC-3:** Wyrównanie działa we wszystkich trzech wersjach językowych i na obsługiwanych szerokościach ekranu.
4. **Poza zakresem:** zmiana treści, wielkości liter, koloru lub daty aktualizacji oraz przebudowa pozostałych elementów stopki.

## Szczegóły — odpowiedzialny kod

Numery linii odnoszą się do bazowego commita `af7df7ed0f00`.

- `components/VenuePage.tsx:524-554`, stopka `VenuePage`: napis aktualizacji jest osobnym rodzeństwem `.footer__inner`, więc jego położenie nie wynika z trójkolumnowej siatki logo/hasło/Facebook i może zostać skorygowane niezależnie.
- `app/globals.css:912-920`, `.footer__updated`: element ma `width: var(--shell)` i `margin: 2.25rem auto 0`. `--shell` używa `100%`, dlatego auto-marginesy centrują blok w szerokości obszaru layoutu, a nie w pełnej szerokości `vw` obejmującej rezerwowany gutter scrollbara.
- Pomiar dostarczonego `before-user.png`: szerokość bitmapy 1536 px, widoczny obrys napisu x=652…870, środek x=761; środek bitmapy x=768, delta −7 px. Ten wynik odpowiada połowie typowego guttera 15 px.
- Lokalny pomiar DOM potwierdził, że sam box CSS jest wyśrodkowany w layout viewport (`elementCenter = textCenter = innerWidth / 2`). Wyklucza to błąd siatki i wskazuje różnicę layout viewport ↔ pełny viewport jako właściwą granicę.

### Wykluczone przyczyny

- **Zagnieżdżenie w środkowej kolumnie:** wykluczone przez `VenuePage.tsx:550-554`; napis jest poza `.footer__inner`.
- **Błędne `text-align`:** wykluczone przez `app/globals.css:919` i pomiar Range, który daje środek tekstu równy środkowi elementu.
- **Treść konkretnego języka:** lokalne screenshoty PL/EN/DE pokazują tę samą regułę pozycjonowania; teksty są danymi, nie źródłem przesunięcia kontenera.
- **Pozostałe kolumny stopki:** screenshot oraz DOM pokazują poprawne położenie logo, hasła i partnera; AC-2 wymaga pozostawienia ich bez zmian.

## Proponowany test (najpierw czerwony)

- **AC-1 →** `footer update is anchored to the physical viewport center` (`app/footer-updated.test.mjs`): odczytuje realną regułę `.footer__updated` i wymaga szerokości treści, kotwicy `left: 50vw` oraz kompensującego `translateX(-50%)`. Na bazie test jest czerwony, bo reguła używa szerokiego shella i auto-marginesów.
- **AC-2 →** ten sam test odrzuca modyfikacje selektorów `.footer__inner` i `.footer__links` w zakresie poprawki; dodatkowo diff musi ograniczyć zmianę produkcyjną do `.footer__updated`.
- **AC-3 →** reguła jest wspólna dla jednego `VenuePage` używanego przez PL/EN/DE; `npm test` nadal sprawdza istnienie wszystkich trzech eksportów, a weryfikacja przeglądarkowa obejmie PL/EN/DE w desktopowym viewportcie oraz mobilny viewport.

Test źródłowy jest trwałą bramką mechanizmu pozycjonowania; statyczne screenshoty finalnego renderu pozostają dowodem wizualnym, że geometria daje właściwy rezultat.

## Rozwiązanie

W `.footer__updated` zastąpić szerokość shella szerokością treści ograniczoną do viewportu, wyłączyć auto-centrowanie marginesami i zakotwiczyć środek elementu przez `position: relative; left: 50vw; transform: translateX(-50%)`. `vw` zachowuje fizyczny środek pełnego viewportu także przy klasycznym scrollbarze; `max-width` utrzyma bezpieczne zawijanie na małych ekranach.

Nie zmieniają się markup `VenuePage`, treści ani format daty, `.footer__inner`, logo, hasło, link/znak partnera i pozostałe breakpointy.

## Raport z implementacji i testów

### RED — 2026-08-10

Polecenie: `npm test`

```text
✖ footer update is anchored to the physical viewport center (0.807458ms)
✔ locale redirect does not run on localized pages (0.816375ms)
✔ all localized pages remain in the static export (0.418917ms)
✔ all rows keep one uninterrupted 100 ms lighting sequence (0.425917ms)
✔ rear-row bulbs keep a clearly visible glow close to the middle row (0.131791ms)
✔ the desktop glow mask stays in the source image coordinate system (0.355416ms)
ℹ tests 8
ℹ pass 7
ℹ fail 1

✖ footer update is anchored to the physical viewport center
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /width:\s*max-content;/. Input:

  '  width: var(--shell);\n' +
  '  margin: 2.25rem auto 0;\n' +
  '  color: rgba(255, 255, 255, 0.48);\n' +
  '  font-size: 0.58rem;\n' +
  '  letter-spacing: 0.08em;\n' +
  '  line-height: 1.4;\n' +
  '  text-align: center;\n' +
  '  text-transform: uppercase;\n'
```

Wniosek: produkcyjny build i siedem istniejących testów są zielone; nowy test pada wyłącznie na bazowym mechanizmie `width: var(--shell)` + auto-margines, który nie kotwiczy napisu w `50vw`.

### Implementacja i GREEN — 2026-08-10

- `app/globals.css`, `.footer__updated`: szerokość elementu odpowiada treści i jest ograniczona do viewportu; `left: 50vw` oraz `translateX(-50%)` kotwiczą środek napisu w fizycznym środku viewportu.
- `app/footer-updated.test.mjs`: nowy test chroni dokładny mechanizm centrowania i odrzuca powrót `width: var(--shell)` lub auto-marginesów.
- Markup stopki, treści PL/EN/DE, format daty oraz selektory pozostałych elementów stopki nie zostały zmienione.

Dostarczenie: commit `0e47615d8148a5e93f48d7a22dc6ce0c7d79da16` na `main` (commit izolowanego brancha: `05b3a23b2aa60e36707f91653a9f6aceb352ea4b`), tag `fix/003-ostatnia-aktualizacja-nie-jest-wysrodkowana`.

```text
$ npm test
✔ footer update is anchored to the physical viewport center
✔ locale redirect does not run on localized pages
✔ all localized pages remain in the static export
✔ all rows keep one uninterrupted 100 ms lighting sequence
✔ rear-row bulbs keep a clearly visible glow close to the middle row
✔ the desktop glow mask stays in the source image coordinate system
ℹ tests 8
ℹ pass 8
ℹ fail 0

$ npm run lint
> eslint .

$ npm run typecheck
> tsc --noEmit

$ git diff --check
(brak wyjścia, exit 0)
```

Checklist AC:

- **AC-1: zielony** — test blokuje powrót centrowania przez shell; pomiar finalnego renderu daje deltę 0 px do `50vw`.
- **AC-2: zielony** — diff produkcyjny obejmuje wyłącznie `.footer__updated`; screenshoty zachowują logo, hasło i partnera.
- **AC-3: zielony** — PL/EN/DE przy 1536 px: środek 768 px, delta 0, `scrollWidth = innerWidth = 1536`; PL przy 390 px: środek 195 px, delta 0, `scrollWidth = innerWidth = 390`.

Wizualna weryfikacja została wykonana na statycznym eksporcie zintegrowanego `main`. Zapisano osobne kadry PL/EN/DE oraz mobilny PL; nie stwierdzono zawijania poza viewport ani przesunięć pozostałych elementów stopki.

```text
$ python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/003-ostatnia-aktualizacja-nie-jest-wysrodkowana.md
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan

$ python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/003-ostatnia-aktualizacja-nie-jest-wysrodkowana.md --claim-fixed
VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony
```

### Cleanup

- Worktree `/Users/gmm/tmp/codex/bug-003` (536 MB wraz z `node_modules`, `.next` i `out`) usunięty; branch `bug/003-ostatnia-aktualizacja-nie-jest-wysrodkowana` usunięty po zapisaniu SHA `05b3a23b2aa60e36707f91653a9f6aceb352ea4b` i utworzeniu tagu.
- Serwery sesji `30307` i `81564` zatrzymane; port `3103` zwolniony. Współdzielony serwer Bug 002 (`70419`) również zatrzymany.
- Kontrola dwóch poprzednich numerów: worktree `bug-001` nie istniał; `bug-002` był czysty, dostarczony na `main` i został usunięty wraz z branchem.
- Sweep 4 h: 19 kandydatów; usunięto 11 nieaktywnych pozycji (4 katalogi Codex i 7 martwych socketów), łącznie 2860 KiB. Osiem socketów miało aktywne uchwyty `lsof` i pozostało. W `/private/tmp` nie pozostały stare `codex-*` z tej listy.
- Wygasłe dowody: 0 katalogów, 0 B. Dowody Bug 001 (106 MB), Bug 002 (16 MB) oraz bieżący `bugs/assets/003-ostatnia-aktualizacja-nie-jest-wysrodkowana` (904 KB) są młodsze niż pięć dni; bieżący dowód pozostaje lokalnie i jest ignorowany przez Git do 2026-08-15 17:42.
- Końcowe użycie: `/Users/gmm/tmp` 161 MB, `/Users/gmm/.codex` 22 GB, globalne Xcode DerivedData 3.8 GB (audyt, bez zmian; Xcode nie był używany), wolne miejsce woluminu 35 GiB.

## Dowód końcowego compositora

- Zgłoszony stan przed: [screenshot użytkownika](assets/003-ostatnia-aktualizacja-nie-jest-wysrodkowana/before-user.png)
- Stan po PL desktop: [after.png](assets/003-ostatnia-aktualizacja-nie-jest-wysrodkowana/after.png)
- Stan po EN desktop: [after-en.jpg](assets/003-ostatnia-aktualizacja-nie-jest-wysrodkowana/after-en.jpg)
- Stan po DE desktop: [after-de.jpg](assets/003-ostatnia-aktualizacja-nie-jest-wysrodkowana/after-de.jpg)
- Stan po PL mobile: [after-mobile-pl.jpg](assets/003-ostatnia-aktualizacja-nie-jest-wysrodkowana/after-mobile-pl.jpg)

## Protokół weryfikacji

1. **RED:** na bazie `af7df7ed0f00` uruchomić `npm test` po dodaniu niezmienionego `app/footer-updated.test.mjs`; oczekiwany fail z brakiem kotwicy `50vw`.
2. **GREEN:** na kodzie po zmianie uruchomić `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; oczekiwane: wszystkie testy zielone, eksporty PL/EN/DE obecne.
3. **Render:** w viewportcie desktopowym wejść na `/pl/`, `/en/`, `/de/`, przewinąć do końca i zapisać screenshot; środek `.footer__updated` ma odpowiadać `50vw`, a pozostałe elementy stopki mają pozostać bez zmian. Powtórzyć na mobilnym viewportcie i sprawdzić brak overflow.
4. **Diff:** zmiana produkcyjna może dotyczyć wyłącznie reguły `.footer__updated`; treści oraz markup stopki pozostają bez zmian.
5. **Dostarczenie:** `git tag -l 'fix/003-*'` oraz `git merge-base --is-ancestor $(git rev-parse 'fix/003-ostatnia-aktualizacja-nie-jest-wysrodkowana^{commit}') main` muszą zakończyć się sukcesem.
