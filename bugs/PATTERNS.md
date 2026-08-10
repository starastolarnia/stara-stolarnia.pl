# Rejestr klas błędów

## Nakładka obrazu zakotwiczona poza obiektem źródłowym

- **Mechanizm:** punkty efektu są zapisane w poprawnym układzie współrzędnych obrazu, ale celują w sąsiedni detal; zbyt mała skala efektu może dodatkowo ukryć przesunięcie.
- **Sygnatura:** poświata, hotspot lub inna nakładka pojawia się przy obiekcie (np. na przewodzie), a nie na nim; błąd pozostaje widoczny mimo poprawnego responsywnego skalowania.
- **Reguła naprawy:** przechowywać punkty raz w natywnym układzie źródła, mapować obraz i nakładkę tym samym `cover/slice`, kalibrować współrzędne na finalnym compositorze w kilku proporcjach i chronić skalę oraz kolejność testem danych.
- **Raporty:** [Bug 001 — Żarówki trzeciego rzędu nie świecą](./001-zarowki-trzeciego-rzedu-nie-swieca.md)
