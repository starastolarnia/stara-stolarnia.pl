# Bug 007 — Miganie i błędna nawigacja galerii

> Start pracy: 2026-08-13 23:48
> Koniec pracy: 2026-08-14 00:01
> Status: zweryfikowany
> Zgłoszenie: „ok ale to zdjecie miga po naciśnięciu strzałki next zwija sie bierzące pojawia sie nastepne po czym znika i znowu sie pojawia do teog strzałki sa na zdjeciu mimo ze nie musza i tak samo x i nawigacja klawiaturą nie działa i index (02 / 06) to mają być kropki ktore zawsze sa na galeri a nie jakieś numerki”; „to nie jest płynne przechodzenie to jest jakaś masakra, zdjęcia powinny robić slide pomiedzy sobą jak na photos na ios”; „inicjalny zoom spoko, ale reszta to porażka”
> Klasyfikacja: klient-lokalny
> Rodzaj dowodu: compositor-czasowy
> Baza analizy: 4c091ad0f2687fff44fc4c28951639ab9f85f97d
> Commit builda nagrania przed: 4c091ad0f2687fff44fc4c28951639ab9f85f97d
> Commit builda nagrania po: c2aa1c0fb2a3bd8e7a3a09828865b94376e35977
> Wynik obserwacji compositora: Nagranie bazowe pokazuje zanik starego kadru i ponowny zoom następnego; nagranie po zmianie pokazuje jeden ciągły poziomy slide w stałej ramie, bez pustej klatki i ponownego zoomu.

## TL;DR

Lightbox ponownie przypisuje `layoutId` przy każdej zmianie zdjęcia i jednocześnie używa sekwencyjnego `AnimatePresence mode="wait"`. Powoduje to zwinięcie, ponowny montaż i miganie zamiast pojedynczego poziomego slajdu. Naprawa zachowa zoom tylko przy otwarciu, a dalszą nawigację przeniesie do stałej ramy z kierunkowym slajdem, gestem swipe, kropkami i obsługą klawiatury w aktywnym dialogu.

## Kryteria akceptacji

1. **AC-1:** Kliknięcie kafla nadal płynnie powiększa go do pełnoekranowej galerii.
2. **AC-2:** Next, previous, strzałki klawiatury i swipe zmieniają zdjęcia pojedynczym poziomym slajdem zgodnym z kierunkiem nawigacji, bez zwijania, migania, zaniku i ponownego zoomu.
3. **AC-3:** Strzałki oraz przycisk zamknięcia znajdują się poza powierzchnią zdjęcia.
4. **AC-4:** Licznik tekstowy znika; pod zdjęciem stale widoczne są kropki z oznaczeniem aktywnego zdjęcia i możliwością bezpośredniego wyboru.
5. **AC-5:** Escape zamyka galerię, ArrowLeft/ArrowRight nawigują, a blokada przewijania tła jest zdejmowana po zamknięciu.
6. **AC-6:** Zachowanie działa na desktopie i mobile oraz respektuje `prefers-reduced-motion`.

Dokładny cel: przejścia i kontrolki pełnoekranowego lightboxa. Nietknięte rodzeństwo: siatka i kolejność galerii, obrazy hero, dropdowny, treść oraz pozostałe sekcje. Poza zakresem: zmiana plików zdjęć, kadrowania kafli i struktury danych galerii.

## Szczegóły — odpowiedzialny kod

- `GalleryLightbox` renderuje obraz z `layoutId` zależnym od aktualnego `src`, więc każda nawigacja ponownie uruchamia przejście pomiędzy kaflem a pełnym ekranem.
- Wewnętrzne `AnimatePresence initial={false} mode="wait"` najpierw całkowicie usuwa poprzedni obraz, a dopiero potem montuje następny. W połączeniu z nowym `layoutId` daje wieloetapowe miganie.
- Kontrolki są absolutnie pozycjonowane nad ramą obrazu, a licznik jest osobnym tekstowym elementem.
- Obsługa klawiatury jest globalnie przepinana po każdej zmianie indeksu zamiast należeć do aktywnego dialogu.

### Inwentarz konsumentów

- `GalleryLightbox` jest jedynym pełnoekranowym konsumentem zdjęć galerii.
- Wszystkie cztery profile wydarzeń korzystają z tego samego lightboxa i sześciu zdjęć.
- Kafel galerii i pełnoekranowa rama są jedynymi uczestnikami przejścia otwierającego.

### Wykluczone hipotezy

- Pliki obrazów są już załadowane jako miniatury i nie odpowiadają za sekwencję zwinięcia oraz ponownego zoomu.
- Zmiana indeksu i źródła danych jest prawidłowa; problemem jest orkiestracja obecności i wspólnego układu.
- Blokada scrolla działa i pozostaje częścią rozwiązania.

## Proponowany test (najpierw czerwony)

- AC-1–AC-2: test `gallery keeps initial zoom separate from directional image slides` wymusi stały `originIndex`, kierunek, ramę z jednym wspólnym `layoutId`, warianty poziome oraz brak `mode="wait"`.
- AC-3–AC-4: test sprawdzi siatkowy układ kontrolek poza ramą obrazu, brak licznika i stale renderowane kropki.
- AC-5–AC-6: test sprawdzi obsługę Escape/ArrowLeft/ArrowRight na dialogu, swipe oraz wariant reduced motion; zachowanie zostanie dodatkowo sprawdzone w lokalnej stronie desktop/mobile.

## Rozwiązanie

- Przechowywać `currentIndex`, `originIndex` i `direction` jako jeden stan galerii.
- Przenieść wspólny `layoutId` z obrazu na stałą ramę powiązaną wyłącznie z kaflem otwierającym.
- Wewnątrz ramy użyć równoległego `AnimatePresence` z wariantami wejścia/wyjścia po osi X i sprężystym przejściem.
- Podpiąć przyciski, klawiaturę, kropki i swipe do jednej funkcji kierunkowej zmiany indeksu.
- Ułożyć ramę, strzałki, zamknięcie i kropki w gridzie, aby kontrolki nie zasłaniały zdjęcia.

## Raport z implementacji i testów

- Stan lightboxa został rozszerzony do jednego `GallerySelection` z `currentIndex`, `direction` i niezmiennym `originIndex`.
- Wspólne `layoutId` odpowiada teraz wyłącznie za zaakceptowany zoom otwierający i jest przypisane do stałej ramy pochodzącej z kafla startowego.
- Zmiana zdjęcia używa dwóch jednocześnie obecnych kadrów i kierunkowych wariantów osi X. Usunięto sekwencyjny `mode="wait"`, który tworzył pustą fazę i ponowny montaż.
- Dodano swipe z progiem odległości/prędkości, obsługę `Escape`, `ArrowLeft`, `ArrowRight`, sześć klikalnych kropek oraz grid odkładający strzałki i zamknięcie poza obraz.
- Implementację wykonano na branchu `bug/007-miganie-i-bledna-nawigacja-galerii` w commicie `bc8ceb8`, a dostarczono na `main` jako `c2aa1c0`.
- Dostarczenie: branch `bc8ceb8`, commit `c2aa1c0fb2a3bd8e7a3a09828865b94376e35977` na `main`; tag `fix/007-miganie-i-bledna-nawigacja-galerii` wskazuje ten commit.

### Macierz kryteriów

| Kryterium | Dowód | Wynik |
|---|---|---|
| AC-1 | Zachowany `layoutId` ramy zależny od `originIndex`; wejściowy zoom nie został zmieniony | PASS |
| AC-2 | Nagrania compositora przed/po, kierunkowe warianty X, test klawiatury i swipe | PASS |
| AC-3 | Desktop: rama `x=117.59..1322.41`, previous kończy się na `97.59`, next i close zaczynają się na `1342.41` | PASS |
| AC-4 | Mobile: `6` kropek, dokładnie `1` aktywna, licznik `.gallery-lightbox__counter`: `0` elementów | PASS |
| AC-5 | `ArrowRight` zmienia aktywny kadr, `Escape` usuwa dialog, body wraca do `overflow: visible` | PASS |
| AC-6 | Nagrania i pomiary dla `390 × 844` oraz `1440 × 900`; wariant reduced motion pozostaje w teście kontraktu | PASS |

### Cleanup

- Usunięto współdzielony worktree `/Users/gmm/tmp/codex/bug-006-regresja-1` po potwierdzeniu dostarczenia; usunięto branch `bug/007-miganie-i-bledna-nawigacja-galerii` przy zachowanym SHA `bc8ceb840e94b3d25b4affb5845168ec6c1bcc42`.
- Zatrzymano robocze serwery na portach `3002` i `3003`. Surowe katalogi klatek i robocze contact sheety przeniesiono do Kosza; można je odzyskać. Zachowano wyłącznie trzy ignorowane nagrania MP4 o łącznym rozmiarze `288K` przez okres retencji.
- Obowiązkowa kontrola poprzednich numerów: dla Bug 005 nie ma worktree ani brancha; zasoby Bug 006 usunięto w tym przebiegu. Worktree Bug 004 pozostawiono, ponieważ raport nadal ma status `test czerwony`; katalog `menimals-appstore-1.0.2-screenshots` jest poza zakresem tego zadania.
- Sweep starszych plików tymczasowych wykazał katalogi systemowe `TemporaryDirectory.*` i sockety innych procesów o nieustalonym właścicielu; nie usuwano ich. Po cleanupie wolne miejsce: `18 GiB` na woluminie danych.
- Na wyraźną prośbę użytkownika pozostawiono finalny statyczny build pod `http://127.0.0.1:3000/pl/` (proces `Python`, PID `89013`); odpowiedź HTTP `200`.

## Dowód końcowego compositora

- Nagranie przed: [nawigacja uruchamia ponowny zoom i pustą fazę](assets/007-miganie-i-bledna-nawigacja-galerii/before.mp4)
- Nagranie po: [ciągły poziomy slide na mobile](assets/007-miganie-i-bledna-nawigacja-galerii/after.mp4)
- Dodatkowe nagranie po: [ciągły poziomy slide na desktopie](assets/007-miganie-i-bledna-nawigacja-galerii/after-desktop.mp4)
- Obserwacja klatek przed: po kliknięciu Next stary kadr zanika do niemal pustej ramy, nowy pojawia się jako osobny mały kadr i ponownie skaluje do rozmiaru docelowego.
- Obserwacja klatek po: stary i nowy kadr współistnieją podczas przejścia, jadą w przeciwnych kierunkach osi X i ani jedna z zarejestrowanych klatek nie pokazuje pustej ramy.
- Validator: `VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony`.

## Protokół weryfikacji

1. RED na bazie `4c091ad0f2687fff44fc4c28951639ab9f85f97d`:
   - Komenda: `node --test --test-name-pattern='gallery keeps initial zoom separate from directional image slides' components/event-switcher.test.mjs`
   - Wynik: `1 failed`; brak typu `GallerySelection`, stałego `originIndex` i kierunkowych wariantów slajdu.
2. GREEN po zmianie:
   - Ta sama komenda: `1 passed, 0 failed`.
   - Pełna regresja: `npm run lint && npm test` → lint PASS, build PASS, `39 passed, 0 failed`.
3. Compositor mobile `390 × 844`:
   - na bazowym commicie zapisano 48 kolejnych klatek po Next; widoczna jest pusta faza i osobny ponowny zoom;
   - na końcowym commicie zapisano 48 kolejnych klatek; widoczny jest ciągły poziomy slide, `6` kropek, `1` aktywna i brak licznika;
   - gest przeciągnięcia w lewo zmienił aktywny kadr na następny.
4. Compositor desktop `1440 × 900`:
   - zapisano 42 kolejne klatki po Next; przejście jest poziome i rama pozostaje stale wypełniona;
   - previous, next oraz close zostały zmierzone poza granicami ramy obrazu;
   - `ArrowRight` zmienił aktywny kadr, `Escape` zamknął dialog, a blokada przewijania została zdjęta.
5. Kontrola dostarczenia: `git merge-base --is-ancestor $(git rev-parse 'fix/007-miganie-i-bledna-nawigacja-galerii^{commit}') main` ma zakończyć się kodem `0`.
