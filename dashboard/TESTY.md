# Sprawdzenie wersji 1.0

Data: 18 października 2026.

## Sprawdzone w przeglądarce

- Dodawanie klienta, wyszukiwanie, zmiana statusu i wartości współpracy.
- Zapis wiadomości, historia kontaktów, automatyczny status i przychód w analityce.
- Archiwizacja klienta i otwieranie archiwum.
- Tworzenie zadania z checklistą, edycja statusu i odczyt po odświeżeniu.
- Rzeczywiste przeciągnięcie zadania z kolumny „Do zrobienia” do „W trakcie”.
- Usunięcie utworzonego zadania przez okno potwierdzenia i zniknięcie karty.
- Tworzenie wydarzenia powiązanego z klientem; odrzucenie końca wcześniejszego niż początek.
- Przełączanie miesiąca i tygodnia, zmiana okresu oraz powrót do bieżącej daty.
- Tworzenie pomysłu i zamiana w zadanie.
- Zmiana celu tygodniowego oraz ograniczenia animacji i zapis ustawień.
- Pobranie kopii JSON i przywrócenie tej kopii przez import.
- Dodanie pliku do biblioteki, zachowanie po odświeżeniu i pobranie pliku.
- Wyszukiwanie globalne zwracające klienta, zadanie i wydarzenie dla hasła „bloom”.
- Otwieranie i zamykanie mobilnego menu oraz przejście do CRM.
- Kontrola wyglądu pulpitu przy szerokościach 1536, 390 i 768 px. Mniejsze widoki sprawdzono w ramkach przeglądarki o określonej szerokości, bez fizycznych urządzeń.
- Usunięto nakładanie awatarów na licznik w telefonie i poziome przepełnienie pulpitu w tablecie.
- Konsola przeglądarki nie wykazała błędów ani ostrzeżeń aplikacji podczas sprawdzonych scenariuszy.

Końcowy podgląd przywrócono do danych demonstracyjnych. Testowe rekordy nie są częścią danych startowych projektu.

## Automatyczne testy danych

Uruchom: `node tests/storage.test.mjs` albo `npm test`.

**Wynik: 14/14 testów zakończonych powodzeniem.**

Testy obejmują dane startowe, datę pozyskania nowego klienta, przychód, wiadomości i odpowiedzi, zapobieganie ponownemu naliczaniu kontaktu przy zwykłej edycji, pomijanie archiwum, porządkowanie relacji po usunięciu, eksport/import, odrzucanie wadliwych kopii, checklist i plików, brak zmiany stanu po błędzie pamięci, bezpieczne wyświetlanie tekstu, początek tygodnia, wyczyszczenie przestrzeni i zachowanie groszy w kwotach.

Testy używają pamięci testowej w Node.js. Nie modyfikują danych zapisanych w przeglądarce. Sprawdzono również składnię modułów JavaScript.

## Zakres wersji

To lokalna wersja aplikacji. Nie zawiera backendu, logowania, synchronizacji urządzeń ani współpracy online. Przypomnienia wymagają otwartej aplikacji. Nie przeprowadzono oddzielnych testów w Safari ani Firefox ani audytu zgodności WCAG. Wygląd odtwarza układ i kolorystykę wzorca; zamiast zdjęć osób i roślin zastosowano inicjały i lokalną ilustrację SVG.
