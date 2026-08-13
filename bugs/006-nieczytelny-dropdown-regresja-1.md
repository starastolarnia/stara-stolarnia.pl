# Bug 006 regresja 1 — Niespójny dropdown języka

> Start pracy: 2026-08-13 23:25
> Koniec pracy: 2026-08-14 00:01
> Status: zweryfikowany
> Zgłoszenie: „dlaczego to zrzucane menu przy wyborze języka wygląda inaczej niż to przy wyborze imprezy? to ma być ten sam komponent, selektor ktory jest flagą jest ok, ale po zrzuceniu menu ma wyglądaćtak samo, a w tym wyboru jezyka masz niezaokrąglone boki masz jakąś czarną kropkę, ujednolić zeby jezyka wyglądało tak samo jak imprezy teraz”
> Raport bazowy: ./006-nieczytelny-dropdown.md
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: wizualny-statyczny
> Baza analizy: 5bc81a69ca919aff8682b32196950703e9995ce2
> Commit builda nagrania przed: 5bc81a69ca919aff8682b32196950703e9995ce2
> Commit builda nagrania po: c2aa1c0fb2a3bd8e7a3a09828865b94376e35977
> Wynik obserwacji compositora: Na desktopie i mobile oba rozwinięte panele mają identyczne tło, promień i odstęp 2 px; osobny znacznik języka nie występuje, a zamknięty przycisk z flagą zachował geometrię.

## TL;DR

Menu wydarzeń i języka współdzielają część stylów, ale późniejsze reguły wariantu językowego wymuszają ostre narożniki i dodają osobny okrągły znacznik aktywności. Poprzedni test regresyjny utrwalił tę rozbieżność zamiast pilnować wspólnego kontraktu wizualnego. Naprawa przeniesie oba warianty na wspólną powierzchnię oraz wspólny stan aktywnej pozycji, pozostawiając bez zmian zamknięty przycisk języka z flagą i routing locale.

## Kryteria akceptacji

1. **AC-1:** Po rozwinięciu menu języka jego panel ma wyglądać tak samo jak aktualny panel wyboru imprezy: ten sam materiał, promień narożników, cień, padding i odstęp między pozycjami.
2. **AC-2:** Aktywna pozycja języka ma używać takiego samego pełnego tła aktywnego wiersza jak pozycja wydarzenia; czarna kropka ma zniknąć.
3. **AC-3:** Zamknięty selektor języka nadal ma pozostać przyciskiem z flagą i nie może zmienić geometrii ani położenia w top barze.
4. **AC-4:** Dropdown wydarzeń, jego zatwierdzony wygląd oraz wybór imprezy pozostają bez zmian.
5. **AC-5:** Wybór języka nadal prowadzi do właściwego locale, a ujednolicony panel działa na desktopie i mobile we wszystkich obsługiwanych wersjach językowych.

Dokładny cel: rozwinięty panel języka i jego wiersze. Nietknięte rodzeństwo: przycisk z flagą, panel wydarzeń, CTA, nawigacja sekcji i geometria top baru. Poza zakresem: copy, kolejność języków, routing locale, mechanika otwierania oraz pozostałe dropdowny strony.

## Szczegóły — odpowiedzialny kod

- Wspólna reguła paneli definiuje materiał, padding, odstęp i cień, ale promień narożników jest przypisany tylko do `.event-dropdown__menu`: [`app/globals.css`](../app/globals.css) przy bazowym SHA `5bc81a69ca919aff8682b32196950703e9995ce2`.
- Niżej `.language-switcher__menu` oraz jego linki jawnie ustawiają `border-radius: 0`, przez co późniejsza reguła lokalna nadpisuje wygląd współdzielonej powierzchni.
- `LanguageSwitcher` renderuje dodatkowy pusty element `<i aria-hidden="true" />`; CSS zmienia jego kolor dla aktywnego języka, co daje zgłoszoną czarną kropkę. `EventDropdown` nie ma analogicznego elementu, tylko pełne tło aktywnego wiersza.
- Bazowy test współdzielonych materiałów dropdownów wprost oczekuje `border-radius: 0` dla języka. Testy pozostawały zielone, ponieważ chroniły błędną rozbieżność, a nie oczekiwane ujednolicenie.
- Problem jest lokalny po stronie klienta i nie zależy od danych CMS, treści locale ani serwera.

### Inwentarz konsumentów

- `LanguageSwitcher` w prawym obszarze top baru renderuje przycisk z flagą i rozwijane linki PL/EN/DE.
- `EventDropdown` jest używany w mobilnym top barze oraz w desktopowym stanie top baru po przewinięciu.
- Klasy `.language-switcher__menu` i `.event-dropdown__menu` nie mają innych konsumentów poza `VenuePage`.

### Wykluczone hipotezy

- Pozycjonowanie i geometria zamkniętego przycisku języka nie tworzą kropki ani ostrych narożników panelu.
- Dane `locales`, kolejność języków i funkcja `buildLocalePath` nie wpływają na materiał ani geometrię menu.
- Wspólne wartości koloru i cienia są prawidłowe; rozbieżność powstaje dopiero w regułach specyficznych dla wariantu językowego.

## Proponowany test (najpierw czerwony)

- AC-1–AC-2: nowy test regresyjny `language dropdown reuses the event menu surface without a separate active marker` sprawdzi wspólne klasy powierzchni i opcji oraz brak osobnego elementu znacznika. Test źródłowy jest dowodem wspierającym, a dowodem niosącym pozostaje statyczna kontrola wizualna i pomiar stylów w działającej stronie.
- AC-3: istniejący test małych ekranów plus porównanie zamkniętego przycisku języka przed i po zmianie.
- AC-4: istniejące testy kontraktu `EventDropdown` oraz kontrola otwartego menu wydarzeń po zmianie.
- AC-5: pełny zestaw testów komponentu, build i ręczne sprawdzenie linków językowych dla PL/EN/DE na desktopie i mobile.
- Pierwsze uruchomienie nowego testu musi być czerwone na bazowym SHA, ponieważ obecny kod nadal renderuje `<i>` i nie używa wspólnego kontraktu opcji.

## Rozwiązanie

- Dodać wspólne klasy powierzchni rozwijanego menu i wiersza opcji używane przez oba selektory.
- Przenieść promień narożników oraz stan hover/active do wspólnego kontraktu; zachować aktualny promień menu wydarzeń w każdym breakpointcie.
- Usunąć pusty element `<i>` z wariantu językowego i zastosować pełne tło aktywnego wiersza identyczne jak w selektorze wydarzeń.
- Zachować osobne klasy wyłącznie dla pozycjonowania, szerokości i układu treści właściwego dla flagi oraz nazwy języka.
- Nie zmieniać zamkniętego przycisku z flagą, top baru, kolejności locale ani routingu.

## Raport z implementacji i testów

- Wprowadzono jeden komponent `DropdownMenuSurface`, z którego korzystają `LanguageSwitcher` i `EventDropdown`.
- Wspólne klasy `.dropdown-menu__surface` oraz `.dropdown-menu__option` są jedynym źródłem materiału, promienia, odstępów i stanu aktywnego obu paneli.
- Usunięto pusty element `<i>` z opcji języka. Zamknięty przycisk z flagą, pozycjonowanie top baru oraz routing locale pozostały bez zmian.
- Implementację wykonano na branchu `bug/006-nieczytelny-dropdown-regresja-1` w commicie `08e5922`, a dostarczono na `main` w commicie `4c091ad`. Końcowy build `c2aa1c0` zawiera tę zmianę.
- Dostarczenie: branch `08e5922`, commit `4c091ad0f2687fff44fc4c28951639ab9f85f97d` na `main`; tag `fix/006-nieczytelny-dropdown-regresja-1` wskazuje ten commit.

### Macierz kryteriów

| Kryterium | Dowód | Wynik |
|---|---|---|
| AC-1 | Pomiar computed styles na desktopie: oba panele `rgba(255, 255, 255, 0.95)`, `14px`, `gap: 2px`; na mobile oba `25.35px` i `gap: 2px` | PASS |
| AC-2 | Brak `.language-switcher__option i`; aktywne pozycje obu menu używają `.dropdown-menu__option--active` | PASS |
| AC-3 | Zamknięty przycisk flagi: desktop `44 × 44px`, mobile `35.09375 × 35.09375px` | PASS |
| AC-4 | Panel wydarzeń zachował materiał i promień przed oraz po współdzieleniu komponentu | PASS |
| AC-5 | Widoki `/pl`, `/en`, `/de`, `/uk`, pełny build i kontrola desktop/mobile | PASS |

### Cleanup

- Usunięto worktree `/Users/gmm/tmp/codex/bug-006-regresja-1` po potwierdzeniu dostarczenia; usunięto branch `bug/006-nieczytelny-dropdown-regresja-1` przy zachowanym SHA `08e5922c4f4decec9b02c78df185a2f0a239b593`.
- Zatrzymano roboczy serwer na porcie `3002`; screenshoty dowodowe `128K` pozostają w ignorowanym `bugs/assets/006-nieczytelny-dropdown-regresja-1/` przez okres retencji.

## Dowód końcowego compositora

- Desktop: [panel języka](assets/006-nieczytelny-dropdown-regresja-1/language-desktop.png) i [panel wydarzeń](assets/006-nieczytelny-dropdown-regresja-1/event-desktop.png).
- Mobile: [panel języka](assets/006-nieczytelny-dropdown-regresja-1/language-mobile.png) i [panel wydarzeń](assets/006-nieczytelny-dropdown-regresja-1/event-mobile.png).
- Pomiar desktop: wspólne `background: rgba(255, 255, 255, 0.95)`, `border-radius: 14px`, `gap: 2px`; liczba osobnych znaczników `<i>`: `0`.
- Pomiar mobile: wspólne `background: rgba(255, 255, 255, 0.95)`, `border-radius: 25.35px`, `gap: 2px`.

## Protokół weryfikacji

1. Historyczne testy na bazowym SHA przed dodaniem poprawnego kontraktu:
   - Komenda: `node --test --test-name-pattern='both dropdowns share materials|dropdown panels prioritize legibility and two-pixel row separation|small screens use a scaled top bar with an event dropdown and a three-line menu button' components/event-switcher.test.mjs`
   - Wynik: `3 passed, 0 failed`. Test był fałszywie zielony, ponieważ jawnie akceptował ostre narożniki języka.
2. RED:
   - Komenda: `node --test --test-name-pattern='language dropdown reuses the event menu surface without a separate active marker' components/event-switcher.test.mjs`
   - Wynik: `1 failed`; kod nie zawierał wspólnego `DropdownMenuSurface` i nadal renderował osobny znacznik `<i>`.
3. GREEN po zmianie:
   - Ta sama komenda: `1 passed, 0 failed`.
   - Test kontraktu dropdownów: `4 passed, 0 failed`.
4. Pełna regresja z końcowego `main`:
   - Komenda: `npm run lint && npm test`
   - Wynik: lint PASS, build PASS, `39 passed, 0 failed`; wygenerowane locale `/pl`, `/en`, `/de`, `/uk`.
5. Kontrola działającej strony `c2aa1c0`:
   - desktop `1440 × 900`: zgodne materiały i geometria obu paneli, brak kropki, przycisk flagi `44 × 44px`;
   - mobile `390 × 844`: zgodne promienie `25.35px`, odstęp `2px`, przycisk flagi `35.09375 × 35.09375px`.
6. Kontrola dostarczenia: `git merge-base --is-ancestor $(git rev-parse 'fix/006-nieczytelny-dropdown-regresja-1^{commit}') main` ma zakończyć się kodem `0`.
