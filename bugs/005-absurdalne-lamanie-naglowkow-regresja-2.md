# Bug 005 regresja 2 — Szarpanie strony podczas scrollowania

> Start pracy: 2026-08-13 13:54
> Koniec pracy: 2026-08-13 14:07
> Status: regresja: 3
> Regresja: [Nadal występuje przeskok między sekcjami](./005-absurdalne-lamanie-naglowkow-regresja-3.md)
> Zgłoszenie: „coś to rwie przy scrollowaniu, coś zepsułeś”
> Raport bazowy: ./005-absurdalne-lamanie-naglowkow.md
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: commit `49dcc46a6acd8d707a36cfc955cb1d31ccabe0c0`
> Commit builda nagrania przed: `49dcc46a6acd8d707a36cfc955cb1d31ccabe0c0`
> Commit builda nagrania po: `05e5ad76faef57e9a57c939756619b53ddc2e268`
> Wynik obserwacji compositora: PASS — po zmianie scroll przez wejście sekcji i animację czterech liczników pozostaje ciągły, bez widocznego rwania; wartości dochodzą do 120/300/60/50, a ticker zachowuje płynny ruch.

## TL;DR

Regresję wprowadził licznik dodany w `d4a26b1`: każdy z czterech `AnimatedStat` uruchamia własną pętlę `requestAnimationFrame` i w każdej klatce wywołuje Reactowe `setState`. Podczas wejścia sekcji w viewport scroll, cztery animacje wejścia Motion, CSS-owy ticker i do około 336 renderów Reacta konkurują o główny wątek. Poprzedni test sprawdzał jedynie obecność `useInView` i końcowe wartości, więc pozostawał zielony mimo szarpania. Liczby powinny być aktualizowane przez `MotionValue` bez renderowania drzewa Reacta w każdej klatce.

## Kryteria akceptacji

1. AC-1: Scrollowanie strony na desktopie jest płynne i nie powoduje widocznego rwania, skoków ani gubienia klatek w sekcji doświadczenia i jej sąsiedztwie.
2. AC-2: Animowane liczniki uruchamiają się raz po wejściu do viewportu i dochodzą do wartości 120/300/60/50 bez powodowania aktualizacji Reacta podczas samego scrollowania.
3. AC-3: Ticker pozostaje płynny lub zostaje uproszczony w sposób zachowujący jego czytelny, ciągły ruch bez kosztownej kompozycji całej sekcji.
4. AC-4: Układ, fonty, wartości statystyk, lokalizacje PL/EN/DE/UK oraz geometria przywrócona w regresji 1 pozostają bez zmian.
5. AC-5: `prefers-reduced-motion` nadal pokazuje wartości końcowe bez animacji, a mobile i tablet nie zyskują poziomego overflow.

## Zakres i konsumenci

- Cel: wydajność scrolla i animacji w nowej sekcji doświadczenia oraz bezpośrednio współpracujących efektach compositora.
- Konsumenci: `VenuePage`, cztery locale, desktop/tablet/mobile, zwykły i ograniczony ruch.
- Poza zakresem: zmiana copy, wartości statystyk, kolejności sekcji, top baru, szerokości layoutu, fontów i treści pozostałych sekcji.

## Szczegóły — odpowiedzialny kod

- Numery linii według bazy `49dcc46a6acd8d707a36cfc955cb1d31ccabe0c0`.
- `components/VenuePage.tsx:972-1001` — każdy z czterech liczników ma własny stan `displayValue`, własną pętlę `requestAnimationFrame` i `setDisplayValue(...)` dla każdej klatki 1,4-sekundowej animacji. Przy 60 Hz daje to około 84 aktualizacje na komponent, czyli około 336 renderów Reacta w chwili, gdy użytkownik aktywnie przewija sekcję.
- `components/VenuePage.tsx:1003-1017` — te same cztery kafle równocześnie wykonują transformację wejścia Motion. Sama transformacja jest kompozytorowa, ale konkuruje z renderami stanu liczników.
- `app/globals.css:1057-1061` — ticker jest animowany wyłącznie przez `transform` i ma własną warstwę przez `will-change`; nie wykonuje layoutu na każdej klatce. Nie był źródłem regresji i pozostaje bez zmian.
- `components/track-record.test.mjs` — poprzedni test wymagał `useInView` i końcowej wartości, lecz nie zabraniał wysokoczęstotliwościowych aktualizacji React state; obecny test przechodzi 2/2 mimo nagranego objawu.
- W rejestrze `bugs/PATTERNS.md` nie ma jeszcze klasy dla animacji licznika opartej o React state; po weryfikacji zostanie dodana reguła „animacja klatkowa poza stanem Reacta”.

Falsyfikacja poprzedniej naprawy: `node --test components/track-record.test.mjs` na bazie przechodzi 2/2. Jednocześnie nagranie `before.mp4` pokazuje scroll przez sekcję w czasie, gdy wartości 0→120/300/60/50 są przeliczane; zielony test nie pokrywa kosztu ścieżki klatkowej.

## Proponowany test (najpierw czerwony)

1. Wzmocnić standardowy test `components/track-record.test.mjs`: blok `AnimatedStat` nie może zawierać `useState`, `setDisplayValue`, ręcznej pętli `requestAnimationFrame` ani `cancelAnimationFrame`.
2. Ten sam test wymaga jednego `MotionValue`, pochodnej zaokrąglonej przez `useTransform` oraz `animate(...)`, które aktualizują tekst poza cyklem renderowania Reacta.
3. Zachować test wejścia jednokrotnego, końcowych wartości, parytetu locale i `prefers-reduced-motion`.
4. Dowodem niosącym pozostaje nagranie compositora przed/po wykonane tym samym scrollowaniem przy viewportcie 1699×1000.

## Rozwiązanie

Zastąpić cztery pary `useState` + ręczny RAF czterema `MotionValue`. `animate` ma interpolować od zera do wartości docelowej, a `useTransform` zaokrąglać wartość wyświetlaną; Motion zapisuje wynik bezpośrednio do DOM bez renderowania całego komponentu w każdej klatce. `prefers-reduced-motion` ustawia wartość końcową natychmiast. Ticker pozostaje kompozytorowym transformem bez zmian.

## Raport z implementacji i testów

- RED — `node --test components/track-record.test.mjs` w worktree: `tests 2`, `pass 1`, `fail 1`. Pada test `the track record counts once in view and resolves immediately for reduced motion` na braku `useMotionValue(reduceMotion ? props.value : 0)`; wejście pokazuje rzeczywisty blok `AnimatedStat` z `useState`, `setDisplayValue`, `requestAnimationFrame` i `cancelAnimationFrame`.
- Implementacja — `AnimatedStat` używa teraz `useMotionValue`, `useTransform` i `animate`; ręczna pętla RAF oraz `setDisplayValue` zostały usunięte. Czas animacji 1,4 s jest nazwanym kontraktem `TRACK_RECORD_COUNT_DURATION_SECONDS`.
- GREEN — `node --test components/track-record.test.mjs`: `tests 2`, `pass 2`, `fail 0`.
- GREEN — `npm run typecheck`: PASS.
- GREEN — `npm run lint`: PASS.
- GREEN — `npm test` w izolowanym worktree i ponownie na zintegrowanym `main`: build produkcyjny PASS oraz `tests 29`, `pass 29`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`.
- Dostarczenie: commit `05e5ad76faef57e9a57c939756619b53ddc2e268` na `main` (commit izolowanego brancha: `3f472fff9fd5db2f975c2811834e09eb0accfa14`; identyczny patch-id `d7ce09d5cce27571d00142ef2575f97f162c3427`), tag `fix/005-absurdalne-lamanie-naglowkow-regresja-2`.
- Scope Gate: PASS — produkcyjny diff obejmuje wyłącznie `components/VenuePage.tsx` i test kontraktu `components/track-record.test.mjs`; nie zmieniono CSS, geometrii, fontów, top baru, copy ani danych PL/EN/DE/UK.
- QA desktop 1699×1000: to samo wejście od galerii i 32-próbkowa sekwencja scrolla; H2 49,6 px / 60,016 px, shell `min(100% - 4rem, 86rem)`, końcowe wartości 120/300/60/50, overflow 0 px, 0 ostrzeżeń i 0 błędów konsoli.
- QA mobile 391 px: overflow 0 px, cztery wartości końcowe, siatka 2×2 o szerokości 167 px na kartę. QA tablet 758 px: overflow 0 px, siatka 2×2 o szerokości 351 px na kartę.
- AC-1: zielony — nagranie `after.mp4` pokazuje ciągły scroll przez wejście sekcji i jej sąsiedztwo bez widocznego rwania.
- AC-2: zielony — test zabrania `useState`, `setDisplayValue`, `requestAnimationFrame` i `cancelAnimationFrame` w `AnimatedStat`; wymaga `MotionValue`, `useTransform`, `animate` oraz jednorazowego `useInView`.
- AC-3: zielony — ticker zachował istniejącą, kompozytorową animację `transform`; nagranie po zmianie pokazuje jego nieprzerwany ruch.
- AC-4: zielony — Scope Gate oraz pomiar desktopu potwierdzają niezmienioną geometrię, typografię i wartości.
- AC-5: zielony — gałąź `prefers-reduced-motion` natychmiast ustawia wartość końcową, a pomiary mobile/tablet dają overflow 0 px.
- Walidator zwykły: `VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan`.
- Walidator zamknięcia: `VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony`.

### Cleanup

- Usunięto worktree `/Users/gmm/tmp/codex/bug-005-regresja-2` (542 MB), branch `bug/005-absurdalne-lamanie-naglowkow-regresja-2` i wpisy administracyjne worktree; po `git worktree prune` istnieje wyłącznie główny worktree. Ścieżka i branch już nie istnieją.
- Zatrzymano oba serwery statyczne na porcie 3108 (sesje 84499 i 77960); `lsof -nP -iTCP:3108 -sTCP:LISTEN` nie zwraca procesu. Przywrócono domyślny viewport i zamknięto kartę QA w Brave.
- Usunięto 64 robocze klatki oraz dwa arkusze kontaktowe (łącznie około 6,0 MB). Zachowano wyłącznie 1,8 MB ignorowanych nagrań `before.mp4` i `after.mp4` do 2026-08-18 14:07; `git check-ignore -v` potwierdza regułę `bugs/assets/`. Wygasłe dowody: 0 katalogów, 0 B.
- Globalny sweep: bezpośrednie wpisy w `/Users/gmm/tmp` i `/Users/gmm/tmp/codex` zostały wyliczone. Kandydaci `TemporaryDirectory.*`, `screenshot*.jpg` i `*.sock` ze zmianami starszymi niż 4 godziny: 0; rozpoznawalne artefakty Codex w `/tmp`: 0. Usunięto 0 elementów, 0 B.
- Poprzednie numery: bug 003 jest zweryfikowany i nie ma worktree/brancha; bug 004 pozostaje otwarty ze statusem `test czerwony`, dlatego jego 15 MB w `/Users/gmm/tmp/codex/bug-004` zachowano. Ścieżka nie jest worktree i żaden proces z niej nie korzysta.
- Zachowano niezwiązany z tym repozytorium katalog `/Users/gmm/tmp/codex/menimals-appstore-1.0.2-screenshots` (19 MB); nie spełniał warunków bezpiecznego usunięcia obcego zadania.
- XcodeBuildMCP nie był używany; purge nie dotyczy tego zadania. Końcowe użycie: `/Users/gmm/tmp` 230 MB, `/Users/gmm/.codex` 23 GB, `DerivedData` 3,8 GB. Dysk: 460 GiB, 382 GiB użyte, 32 GiB wolne (93%).

## Dowód końcowego compositora

- Nagranie przed: [scroll z czterema licznikami renderującymi Reacta w każdej klatce](assets/005-absurdalne-lamanie-naglowkow-regresja-2/before.mp4)
- Nagranie po: [ciągły scroll z licznikami aktualizowanymi przez MotionValue](assets/005-absurdalne-lamanie-naglowkow-regresja-2/after.mp4)

Oba nagrania powstały przy tym samym desktopowym viewportcie 1699×1000, z wejściem od końca galerii przez całą sekcję doświadczenia. W materiale przed ruchem scrolla towarzyszy do około 336 renderów Reacta podczas przejścia 0→wartość końcowa; w materiale po liczby przechodzą do tych samych wartości bez renderowania komponentu w każdej klatce, a ruch sekcji i tickera pozostaje wizualnie ciągły.

## Protokół weryfikacji

1. RED od zera: na commicie `49dcc46a6acd8d707a36cfc955cb1d31ccabe0c0` zastosować wyłącznie zmianę testu z commita `05e5ad76faef57e9a57c939756619b53ddc2e268`, a następnie uruchomić `node --test components/track-record.test.mjs`. Oczekiwane: 2 testy, 1 PASS i 1 FAIL na braku `useMotionValue`; output ma ujawnić `useState`, `setDisplayValue` i ręczny RAF.
2. GREEN: na `main` uruchomić `node --test components/track-record.test.mjs`, `npm run typecheck`, `npm run lint` i `npm test`. Oczekiwane: test skupiony 2/2 PASS, build produkcyjny PASS oraz pełny zestaw 29/29 PASS.
3. Zbudować statyczny serwis poleceniem `npm test`, uruchomić `python3 -m http.server 3108 --directory out`, otworzyć `/pl/#galeria` przy viewportcie 1699×1000 i przewinąć jednym ciągiem przez `#doswiadczenie`. Obserwować równoczesne wejście kafli, przebieg 0→120/300/60/50 i ticker; brak widocznego rwania falsyfikuje AC-1–AC-3.
4. W computed styles potwierdzić H2 49,6 px / 60,016 px, shell `min(100% - 4rem, 86rem)`, stare fonty top baru i overflow 0 px. Powtórzyć przy 758 px i 391 px; oczekiwane: dwie kolumny oraz overflow 0 px. To falsyfikuje AC-4 i responsywną część AC-5.
5. Włączyć `prefers-reduced-motion: reduce`; liczby muszą pojawić się od razu, a ticker pozostać nieruchomy. Sprawdzić, że `AnimatedStat` zachowuje `count.set(props.value)` i test kontraktu nadal przechodzi. To falsyfikuje pozostałą część AC-5.
6. Potwierdzić dostarczenie: `git merge-base --is-ancestor $(git rev-parse 'fix/005-absurdalne-lamanie-naglowkow-regresja-2^{commit}') main` ma zakończyć się kodem 0, a `git rev-parse 'fix/005-absurdalne-lamanie-naglowkow-regresja-2^{commit}'` ma zwrócić `05e5ad76faef57e9a57c939756619b53ddc2e268`.
7. Znane ograniczenie pomiaru: nagranie dowodzi widocznej ciągłości finalnego compositora, a test dowodzi usunięcia wysokoczęstotliwościowych renderów Reacta; nie jest to profil CPU konkretnego urządzenia użytkownika. Brak niewykonanych kroków wdrożenia w repozytorium.
