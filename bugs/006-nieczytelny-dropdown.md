# Bug 006 — Nieczytelny dropdown

> Start pracy: 2026-08-11 18:33
> Koniec pracy: —
> Status: test czerwony
> Zgłoszenie: „menu dropdown ma za duża przeźroczystość jest nieczytelen i musi być margin między elementami np na 2px”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: wizualny-statyczny
> Baza analizy: commit `1ff32a268a75926672cf6bb8005f6faf5476e1a7`; roboczy `app/globals.css` SHA-256 `257530ecaf7a0cba5b10b78d7bb42bf92af03118d7bb2758986b932574f76a1f`
> Commit builda nagrania przed: —
> Commit builda nagrania po: —
> Wynik obserwacji compositora: —

## TL;DR

Oba dropdowny korzystają ze wspólnego panelu o tle `rgba(255, 255, 255, 0.7)`, więc aż 30% zdjęcia hero prześwituje przez tekst. Ten sam grid nie definiuje `gap`, dlatego rzeczywisty odstęp między kolejnymi pozycjami wynosi 0 px. Mobilny dropdown wydarzeń dodatkowo powtarza tę samą zbyt przezroczystą wartość, zamiast dziedziczyć materiał wspólny.

## Kryteria akceptacji

1. AC-1: Panele dropdownu wydarzeń i języka mają kryjące, czytelne tło na jasnym i ciemnym obrazie hero.
2. AC-2: Między sąsiednimi pozycjami obu dropdownów jest dokładnie `2px` odstępu.
3. AC-3: Aktywna pozycja nadal ma subtelnie inne tło i pozostaje czytelna.
4. AC-4: Dropdown wydarzeń zachowuje zatwierdzone zaokrąglenie, a dropdown języka pozostaje bez zaokrągleń.
5. AC-5: Wymiary topbara, menu, obsługa kliknięć, wybór wydarzenia i zmiana języka pozostają funkcjonalnie bez zmian.

## Zakres i konsumenci

- Cel: współdzielony materiał paneli `.event-dropdown__menu` i `.language-switcher__menu` oraz rytm ich elementów.
- Konsumenci: mobilny i desktopowy dropdown wydarzeń oraz dropdown języka.
- Poza zakresem: segment wydarzeń, nawigacja sekcji, treści, hero i pozostałe powierzchnie topbara.

## Szczegóły — odpowiedzialny kod

- Numery linii odnoszą się do roboczego `app/globals.css` o SHA-256 zapisanego w nagłówku raportu, na bazie commita `1ff32a2`.
- `app/globals.css:358-369` jest wspólnym materiałem `.event-dropdown__menu` i `.language-switcher__menu`. Tło `#ffffffb3` odpowiada alfie 0,7, a grid nie ma `gap`. Pomiar finalnego DOM potwierdził `backgroundColor: rgba(255, 255, 255, 0.7)`, `rowGap: normal` oraz trzy odstępy po 0 px.
- `app/globals.css:483-486` ponownie ustawia `#ffffffb3` dla mobilnego dropdownu wydarzeń, więc późniejsza korekta reguły wspólnej zostałaby tam nadpisana.
- `app/globals.css:394-397` już definiuje subtelne tło aktywnego elementu `#33463a12`; ta reguła jest poprawna i pozostaje bez zmian.
- `app/globals.css:370-388` i `app/globals.css:421-429` rozdzielają zatwierdzone geometrie: dropdown wydarzeń jest zaokrąglony, językowy ma promień 0. Wspólna zmiana materiału nie może ich scalić.

### Inwentarz konsumentów i wpływ

- Desktopowy dropdown wydarzeń po przewinięciu: dziedziczy wspólny panel; materiał i odstęp się zmienią, zachowanie wyboru pozostaje.
- Mobilny dropdown wydarzeń: przestanie nadpisywać wspólne tło; zachowa promień zależny od wysokości topbara.
- Dropdown języka na wszystkich breakpointach: dostanie ten sam czytelny materiał i 2 px odstępu; zachowa ostre narożniki.

### Wykluczone przyczyny

- Kolor tekstu: computed style zachowuje `var(--ink)` i jest poprawny; nieczytelność pochodzi z obrazu widocznego przez panel.
- Brak zaznaczenia: aktywna pozycja ma osobną regułę i była widoczna na zrzutach.
- Padding pozycji: elementy mają własny pionowy padding; brak separacji między ich tłami wynika z `gap: normal`, nie z paddingu.
- Blur: `backdrop-filter: blur(14px)` działa, ale sam blur nie daje wystarczającej separacji luminancji na szczegółowym zdjęciu.

## Proponowany test (najpierw czerwony)

- AC-1 i AC-2 → wspierający test `dropdown panels prioritize legibility and two-pixel row separation` w `components/event-switcher.test.mjs`, plus pomiar finalnego DOM (`rgba(..., 0.95)`, `rowGap: 2px`, wszystkie geometryczne odstępy 2 px) i zrzuty na obrazie hero.
- AC-3 i AC-4 → istniejący test współdzielonego materiału rozszerzony o zachowanie `#33463a12` oraz osobnych promieni; wizualne sprawdzenie obu menu.
- AC-5 → pełne `npm test` oraz kliknięcie każdej opcji wydarzenia i języka w lokalnej stronie.

Test źródłowy jest bramką wspierającą; ponieważ właściwym objawem jest czytelność materiału na zdjęciu, dowodem rozstrzygającym pozostają pomiar computed style i zrzuty finalnego renderu.

## Rozwiązanie

W jednej wspólnej regule paneli podnieść krycie bieli z 70% do 95% (`#fffffff2`) i dodać `gap: 2px`. Usunąć mobilne nadpisanie tła, żeby każdy dropdown korzystał z tego samego materiału. Nie zmieniać bluru, cienia, paddingów, aktywnego tła ani odrębnych promieni menu wydarzeń i języka.

## Raport z implementacji i testów

Implementacja produkcyjna nie rozpoczęła się; test wspierający został zapisany i potwierdzony na czerwono.

### RED

Komenda:

```sh
node --test --test-name-pattern='dropdown panels prioritize legibility' components/event-switcher.test.mjs
```

Wynik (`exit=1`):

```text
✖ dropdown panels prioritize legibility and two-pixel row separation (1.420667ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 72.581792
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /background:\s*#fffffff2;/s.
Input: '.event-dropdown__menu,.language-switcher__menu { … background: #ffffffb3; … }'
```

### Zaimplementowane zmiany

- `app/globals.css`: wspólny panel obu dropdownów ma teraz `background: #fffffff2` (95% krycia) oraz `gap: 2px`.
- `app/globals.css`: mobilny dropdown wydarzeń nie nadpisuje już wspólnego tła `#ffffffb3`.
- `components/event-switcher.test.mjs`: dodano trwałą bramkę materiału i odstępu; zaktualizowano wcześniejsze asercje współdzielonego panelu.
- Blur 14 px, cień, paddingi, aktywne tło `#33463a12`, zaokrąglenie dropdownu wydarzeń i ostre narożniki dropdownu języka pozostały bez zmian.

### GREEN i bramki zakresu

Komenda:

```sh
node --test components/event-switcher.test.mjs
```

Wynik:

```text
✔ both dropdowns share materials and motion while keeping their approved corner treatment (0.525333ms)
✔ dropdown panels prioritize legibility and two-pixel row separation (0.201125ms)
✔ small screens use a scaled top bar with an event dropdown and a three-line menu button (0.504541ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 109.412042
```

Pełna bramka:

```sh
npm test
```

Wynik:

```text
✓ Compiled successfully in 397ms
✓ Generating static pages using 7 workers (9/9) in 435ms
✔ both dropdowns share materials and motion while keeping their approved corner treatment (0.519792ms)
✔ dropdown panels prioritize legibility and two-pixel row separation (0.210292ms)
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 94.619041
```

Dodatkowe bramki:

```text
$ npm run lint
> eslint .
exit=0

$ npm run typecheck
> tsc --noEmit
exit=0
```

### Pomiar finalnego renderu

- Desktopowy dropdown języka: `rgba(255, 255, 255, 0.95)`, `rowGap: 2px`, odstępy geometryczne `1.99/1.99/1.99` px (zaokrąglenie subpikselowe compositora).
- Mobilny dropdown wydarzeń: identyczne wartości materiału i odstępu.
- Kliknięcie języka „English” przeniosło z `/pl` do `/en/`; wszystkie 4 opcje wydarzeń zostały wybrane w audycie na 390, 768 i 1699 px.
- Konsola przeglądarki po scenariuszu: `[]` błędów.

### Wynik per AC

- AC-1: zielony — computed alpha 0,95 i zrzuty na szczegółowym zdjęciu hero.
- AC-2: zielony — computed `rowGap: 2px` i trzy odstępy po 1,99 px.
- AC-3: zielony — aktywne `#33463a12` zachowane, widoczne na mobilnym zrzucie.
- AC-4: zielony — event nadal zaokrąglony, language nadal `border-radius: 0`.
- AC-5: zielony — wybór wydarzeń i języka działa, 26/26 testów, brak błędów konsoli.

### Cleanup

Do uzupełnienia po zamknięciu przebiegu.

## Dowód końcowego compositora

- Widok przed — język, desktop: [zbyt przezroczysty panel na zdjęciu](assets/006-nieczytelny-dropdown/before-language.png)
- Widok przed — wydarzenie, telefon: [zbyt przezroczysty panel bez odstępów](assets/006-nieczytelny-dropdown/before-event-mobile.png)
- Widok po — język, desktop: [czytelny panel z ostrymi narożnikami](assets/006-nieczytelny-dropdown/after-language.png)
- Widok po — wydarzenie, telefon: [czytelny panel z odstępami i aktywnym tłem](assets/006-nieczytelny-dropdown/after-event-mobile.png)

## Protokół weryfikacji

1. RED: na bazowym CSS o hashu z nagłówka uruchomić filtrowany test z sekcji RED; oczekiwane `fail 1` na tle `#ffffffb3`.
2. GREEN: uruchomić `node --test components/event-switcher.test.mjs` (18/18), następnie `npm test` (26/26).
3. Render desktop: na `/pl` otworzyć język nad zdjęciem hero; computed tło ma wynosić `rgba(255, 255, 255, 0.95)`, `rowGap` ma wynosić `2px`, a narożniki 0.
4. Render mobile: przy 390 px otworzyć wydarzenia; oczekiwany ten sam materiał i odstęp, promień powiązany z wysokością topbara oraz subtelnie zaznaczone „Wesele”.
5. Funkcja: wybrać kolejno wydarzenia, potem „English”; treść ma się zmienić, a locale przejść do `/en/` bez błędu konsoli.
6. Inspekcja diffu: blur, cień, paddingi, aktywne tło i osobne promienie nie mogą się zmienić.
7. Dowód dostarczenia: do uzupełnienia po commicie na `main`.
