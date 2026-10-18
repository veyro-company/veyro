# VEYRO — małe kroki, duże możliwości

Przygotowanie do wersji z GitHubem i Supabase opisano w `ONLINE.md`. Aktualna aplikacja nadal działa lokalnie; wspólna baza i logowanie czekają na podłączenie usług.

Lokalna aplikacja do zarządzania relacjami, zadaniami, kalendarzem i rozwojem firmy. HTML, CSS i JavaScript, bez frameworków, kompilacji i instalowania pakietów.

## Uruchomienie

**Windows:** kliknij dwukrotnie `uruchom.cmd`. Zostaw okno serwera otwarte podczas pracy. Skrypt korzysta z Node.js zainstalowanego w systemie lub dostępnego w środowisku Codex.

**Każdy system z Node.js 18+:** w folderze projektu uruchom `node server.cjs` lub `npm start`, następnie otwórz **http://127.0.0.1:4173**. Zatrzymanie serwera: Ctrl+C.

Alternatywnie, z Pythonem: `python -m http.server 4173 --bind 127.0.0.1` i ten sam adres w przeglądarce.

Nie otwieraj `index.html` dwuklikiem — moduły JavaScript wymagają HTTP. Zawsze korzystaj z tego samego adresu, portu i profilu przeglądarki, ponieważ pamięć lokalna jest przypisana do adresu. Dane z `localhost` i `127.0.0.1` są osobne.

## Pierwsze kroki

1. Projekt startuje z danymi demonstracyjnymi: 19 klientów, 4 zadania, 4 wydarzenia i 3 pomysły. Daty są wyznaczane w dniu pierwszego uruchomienia. Liczniki pochodzą z tych danych.
2. Ustaw imiona obu osób, profil i cele w **Ustawieniach**.
3. Przed rozpoczęciem pracy możesz wyczyścić przykłady przez **Ustawienia → Wyczyść dane aplikacji**. Wymaga to potwierdzenia.
4. W CRM dodawaj klientów, przypisuj opiekunów i ustalaj terminy kolejnego kontaktu. Kliknięcie klienta otwiera historię i notatki.
5. W karcie klienta zapisuj wysłane wiadomości i otrzymane odpowiedzi. Aplikacja nie wysyła wiadomości na Instagram — zapisuje faktyczny kontakt wykonany poza aplikacją.
6. Przeciągaj karty w Kanbanie lub zmieniaj statusy przez formularze. Na telefonie wygodniejsza jest edycja statusu w formularzu.
7. Dodawaj checklisty do zadań; kalendarz pokazuje wydarzenia i otwarte zadania. Przypomnienia działają wewnątrz otwartej aplikacji.
8. Pomysły można edytować, usuwać i zamieniać w zadania. Po zapisaniu utworzonego zadania pomysł znika z listy pomysłów.

## Dane i kopie

- Wszystkie zmiany są zapisywane w `localStorage` tej przeglądarki pod kluczem `veyro.dashboard.v1`.
- Nie ma kont, logowania, backendu ani synchronizacji między komputerami. Przypisanie do osoby jest organizacją pracy na lokalnych danych.
- Regularnie korzystaj z **Eksportuj dane JSON**. Eksport obejmuje profil, cele, klientów, historię, zadania, wydarzenia, pomysły i bibliotekę plików.
- **Importuj kopię JSON** sprawdza strukturę oraz wersję pliku i pokazuje podsumowanie przed zastąpieniem danych.
- Wyczyszczenie pamięci przeglądarki usuwa dane. Tryb prywatny może nie zachować danych po zamknięciu. Kopia JSON umożliwia ręczne przeniesienie danych na inne urządzenie.
- Biblioteka plików obsługuje 1 MB na plik i 2 MB łącznie. Limit pamięci przeglądarki może zależeć od jej konfiguracji; aplikacja informuje o problemach z zapisem.
- Pracuj w jednej karcie. W przypadku zmiany w innej karcie aplikacja prosi o odświeżenie, aby uniknąć nadpisania danych.

## Jak obliczane są wyniki

- Potencjalni klienci: aktywne profile ze statusem **Znaleziony**. Rozmowy, oferty i pozyskani są liczeni według aktualnego statusu. Archiwum jest pomijane.
- Przychód: suma wartości współpracy klientów **Pozyskanych**. To wartość sprzedaży w CRM, a nie księgowość ani rejestr płatności.
- Cel tygodnia: zapisane wysłane wiadomości od poniedziałku. Zmiana statusu na **Kontakt wysłany** rejestruje wiadomość. Zmiana na **Rozmowa** lub **Oferta** rejestruje odpowiedź.
- Dla istniejącego kontaktu kolejną wiadomość lub odpowiedź zapisz przyciskami w karcie klienta. Nie zapisuj tego samego kontaktu dwukrotnie.
- Analityka tygodniowa i miesięczna bazuje na dzienniku kontaktów i datach pozyskania klientów. Skuteczność to odpowiedzi / wiadomości w wybranym okresie (może przekroczyć 100%, gdy odpowiedzi dotyczą wcześniejszych wiadomości).
- Cele przychodu i liczby klientów w panelu realizacji dotyczą sumy całej aktywnej bazy; cel wiadomości dotyczy bieżącego tygodnia.

## Projekt i dostępność

Układ nawiązuje do załączonego wzorca VEYRO: krem, lawenda, limonka i brzoskwinia, duże liczby, zaokrąglone kafelki. Widok dostosowuje się do komputerów, tabletów i telefonów. Ozdobna roślina jest lokalną ilustracją SVG; awatary używają inicjałów. Brak zewnętrznych zdjęć i bibliotek ikon.

Czcionki DM Sans i Manrope są dołączone lokalnie w formacie WOFF2, wraz z licencjami SIL Open Font License. Aplikacja działa bez internetu i nie wysyła danych na zewnętrzny serwer.

Obsługiwane są: klawiatura, etykiety formularzy, natywne okna dialogowe z blokadą fokusu, komunikaty odczytywane przez czytniki oraz systemowe `prefers-reduced-motion`. Dodatkowe ograniczenie animacji znajduje się w Ustawieniach. Skrót wyszukiwania: Ctrl+K / Cmd+K.

## Struktura

```text
index.html             Powłoka aplikacji
css/style.css          Układ, typografia i responsywność
css/components.css     Tabele, formularze, Kanban, wykresy, modal
css/animations.css     Animacje i ograniczenie ruchu
js/app.js              Nawigacja, formularze i obsługa interakcji
js/storage.js          Adapter danych, transakcje, import/eksport, dane startowe
js/utils.js            Wspólne formatowanie, ikony i animacja liczb
js/dashboard.js        Pulpit i podsumowania
js/clients.js          Tabela CRM, filtry i Kanban
js/tasks.js            Zadania, filtry i Kanban
js/calendar.js         Kalendarz miesiąca i tygodnia
js/analytics.js        Wykresy i wyniki według okresów
assets/images/         Lokalna ikona aplikacji
server.cjs             Lokalny serwer bez zależności
uruchom.cmd            Uruchamianie w Windows
```

## Przygotowanie do backendu

Testy warstwy danych uruchomisz poleceniem `node tests/storage.test.mjs` lub `npm test`. Nie wymagają instalowania pakietów i nie zmieniają danych przeglądarki. Wyniki oraz zakres sprawdzenia interfejsu opisano w `TESTY.md`.

`storage.js` jest granicą dostępu do danych. Encje mają stabilne identyfikatory, `ownerId`, powiązania `clientId`/`taskId`, historię i wersję schematu. Przy dodawaniu np. Supabase należy zastąpić lokalny adapter asynchronicznym repozytorium, dodać prawdziwe uwierzytelnianie, uprawnienia, rozwiązywanie konfliktów i synchronizację. Aktualna wersja nie symuluje współpracy online.
