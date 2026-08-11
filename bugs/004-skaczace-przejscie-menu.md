# Bug 004 — Skaczące przejście menu

> Start pracy: 2026-08-11 16:00
> Koniec pracy: —
> Status: test czerwony
> Zgłoszenie: „to nie jest takie samomasz teraz zarówno obramowanie segmentu jak i obramowanie całej belki, segment nie ma niec obramowania i jest za duzy padding od góry i to collapsowanie nie jest przez transition”
> Uzupełnienie 1: „i to skacze”
> Uzupełnienie 2: „nie ma być żadnej zmiany rozmiaru on hover i żadnego extra tła/cienia/obramowania na segmencie, tylko tło belki”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: 1ff32a268a75926672cf6bb8005f6faf5476e1a7; stan roboczy przed fixem `VenuePage.tsx` sha256 `ee4e57684a51f4b416ec69bcc629eadc85b13ca2a28d68386a1bb54c973f03c6`, `globals.css` sha256 `24b9a45d0137d5a3382a86bed035a7662b6ae218d91373b6ca8e758239b18942`
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —

## TL;DR

To błąd klientowy w komponencie nagłówka. `Header` podmienia dwa osobne drzewa po przekroczeniu 48 px scrolla, a każde z nich ma własne, przeciwne przesunięcie `y`; Motion wykonuje więc dwa wejścia/wyjścia zamiast jednego przejścia geometrii aktywnej opcji. CSS dodatkowo nakłada półprzezroczystą kapsułę na cały selektor i drugą na aktywną opcję, co wizualnie tworzy niepotrzebne podwójne obramowanie. Serwer i dane wydarzeń nie uczestniczą w błędzie.

## Kryteria akceptacji

1. AC-1: W stanie początkowym cztery rodzaje uroczystości nie mają własnej kapsuły, tła, cienia ani obramowania; jedyną powierzchnią jest tło całej belki.
2. AC-2: Na desktopie pływająca belka znajduje się bliżej górnej krawędzi niż obecne 48 px, bez zmiany jej wysokości i szerokości.
3. AC-3: Po rozpoczęciu scrollowania aktywny segment płynnie zmienia geometrię w dropdown; przejście nie wykonuje skoku pionowego ani podmiany z przeciwnymi przesunięciami `y`.
4. AC-4: Po przejściu nadal widać dropdown, nawigację sekcji, CTA i język, a wybór rodzaju uroczystości nadal zmienia zawartość strony.
5. AC-5: Poza zakresem pozostają hero, treści i tłumaczenia oraz układ sekcji poniżej nagłówka.
6. AC-6: Hover nad opcją wydarzenia nie zmienia rozmiaru ani skali opcji lub belki.

## Szczegóły — odpowiedzialny kod

- `components/VenuePage.tsx:456-458`, `Header`: próg `scrollY > 48` przełącza `isScrolled`.
- `components/VenuePage.tsx:511-545`, `Header`: warunek renderuje naprzemiennie `EventSwitcher` i `site-header__scrolled-controls`; brak współdzielonej tożsamości layoutu dla aktywnej powierzchni.
- `components/VenuePage.tsx:214-220`, `EventSwitcher`: stan początkowy wchodzi z `y: -12` i wychodzi do `y: -16`.
- `components/VenuePage.tsx:514-520`, `Header`: stan menu wchodzi z `y: 14` i wychodzi do `y: -10`. Przy jednym progu scrolla obie transformacje dają obserwowany skok.
- `app/globals.css:672-684` oraz `727-737`: półprzezroczyste tło jest jednocześnie na całym `.event-switcher` i na `.event-switcher__thumb`.
- `app/globals.css:1463-1467`: desktopowy `--header-top: 3rem` daje 48 px odstępu od góry.
- Wspólni konsumenci: `EventSwitcher` i `EventDropdown` są używane wyłącznie przez `Header` w `VenuePage`; zmiana nie wpływa na inne produkcyjne komponenty.

### Wykluczone przyczyny

- Dane i tłumaczenia wydarzeń: wybór oraz treść zmieniają się poprawnie, a objaw występuje wyłącznie podczas handoffu nagłówka.
- Zmiana geometrii samej zewnętrznej belki: jej szerokość i wysokość są stałe w obu stanach; skok pochodzi z transformacji dzieci.
- Przewijanie hero: osobny parallax obrazu nie zmienia pozycji fixed headera.

## Proponowany test (najpierw czerwony)

- AC-1 → test `the desktop header morphs the active event into a borderless dropdown before the menu` w `components/event-switcher.test.mjs`: brak tła na całym `.event-switcher`, tło pozostaje na aktywnym `.event-switcher__thumb`.
- AC-2 → ten sam test: desktopowy `--header-top` wynosi `1.5rem`.
- AC-3 → ten sam test jako wspierający kontrakt źródłowy: dwa końce przejścia używają jednego `layoutId` wewnątrz `LayoutGroup`, a kontenery nie mają przeciwnych transformacji `y`. Test źródłowy nie jest dowodem końcowym; dowodem niosącym jest nagranie compositora przed i po.
- AC-4 → istniejące asercje semantyki dropdownu i pełny test pliku; ręcznie wybór innego wydarzenia po scrollu.
- AC-5 → pełny zestaw testów aplikacji, typecheck i lint; brak zmian w treściach i sekcjach strony.

RED:

```text
node --test components/event-switcher.test.mjs
tests 10, pass 9, fail 1
AssertionError: The input did not match the regular expression /LayoutGroup/.
```

## Rozwiązanie

- Usunąć dodatkową powierzchnię całego `.event-switcher` oraz aktywnego segmentu; stan aktywny sygnalizować wyłącznie typografią na tle głównej belki.
- Zmniejszyć desktopowy odstęp belki od góry z 48 px do 24 px bez zmiany jej rozmiaru.
- Nadać aktywnej etykiecie tekstowej selektora i etykiecie dropdownu ten sam `layoutId` w jednym `LayoutGroup`, aby Motion interpolował pozycję tekstu bez tworzenia dodatkowej powierzchni.
- Usunąć przesunięcia `y` z wejścia/wyjścia obu stanów; pozostałe etykiety oraz nawigacja mogą łagodnie zmieniać opacity.
- Nie stosować transformacji `scale` ani zmiany wymiarów na hover.
- Nie zmieniać API wyboru wydarzenia, danych, tekstów ani struktury strony poniżej nagłówka.

## Raport z implementacji i testów

RED zapisany powyżej. Implementacja jeszcze nie została wykonana.

## Dowód końcowego compositora

- Nagranie przed: [skacząca podmiana selektora na menu](assets/004-skaczace-przejscie-menu/before.mp4)
- Nagranie po: —

## Protokół weryfikacji
