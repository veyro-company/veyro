# VEYRO online — przygotowanie do wdrożenia

**Stan: aplikacja nadal zapisuje dane lokalnie. Integracja Supabase Auth, adapter bazy i publikacja nie zostały jeszcze wykonane.** Pliki w tym dokumencie przygotowują następny etap; nie włączają współdzielenia danych.

## Docelowy układ

- Prywatne repozytorium GitHub: kod aplikacji i historia zmian. Bez kopii CRM, haseł i kluczy administracyjnych.
- Supabase: logowanie obu osób, wspólna baza, polityki dostępu i synchronizacja zmian.
- Hosting statycznego interfejsu podłączony do GitHuba. Do wersji firmowej z logowaniem proponowany jest Cloudflare Pages. GitHub Pages ma ograniczenia dla prowadzenia biznesu i wprost odradza przesyłanie haseł: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Przygotowane pliki

- `.github/workflows/check.yml`: testy i przygotowanie artefaktu przy zmianie kodu; nie publikuje strony.
- `scripts/build.mjs`: tworzy `dist/` z samym interfejsem. Pomija testy, SQL i dokumentację.
- `.gitignore`: wyklucza prywatne konfiguracje, wygenerowane pliki i kopie zapasowe o standardowej nazwie.
- `supabase/migrations/202610180001_workspace.sql`: tabele przestrzeni, członków i rekordów, RLS oraz funkcja zapisu z kontrolą wersji. Skrypt przeznaczony do nowego schematu VEYRO, bez usuwania istniejących tabel.

Schemat przeszedł **13 testów w lokalnym PostgreSQL (PGlite)** z testowym odpowiednikiem Supabase Auth. Sprawdzono dostęp obu członków, odmowę dostępu obcej osobie i anonimowemu użytkownikowi, zakaz bezpośredniego zapisu i dodawania członków, konflikt wersji, usuwanie/przywracanie oraz odebranie dostępu. To nie zastępuje testów w rzeczywistym projekcie Supabase po jego podłączeniu. Testy można powtórzyć przez `npm install` i `npm run test:db`. PGlite jest wyłącznie zależnością deweloperską i nie trafia do przeglądarki ani folderu `dist/`.

W połączonym repozytorium `veyro-company/veyro` jest już strona firmowa i konfiguracja Vercel. Dashboard należy dodać do osobnego katalogu `dashboard/` i przygotować w oddzielnej gałęzi. Obecny hosting można rozważyć przy publikacji; główna strona nie powinna zostać nadpisana. Wybór i konfiguracja właściwego projektu hostingu pozostają kolejnym etapem.

## Co jest potrzebne do dalszej pracy

1. Połączone konta GitHub i Supabase oraz wskazanie organizacji/projektu, jeśli konto zawiera kilka.
2. Dwa konta użytkowników w Supabase Auth. Hasła ustalacie samodzielnie — nie należy podawać ich w czacie ani umieszczać w repozytorium.
3. Wybrany adres strony oraz konfiguracja dozwolonych przekierowań logowania.
4. Członkostwa obu kont w tej samej przestrzeni, dodane przez administratora. Nie będzie otwartego samodzielnego dołączania do Waszego CRM.

Po połączeniu usług należy dokończyć rzeczywiste logowanie, adapter zapisu/odczytu, odbieranie zmian drugiej osoby i przeniesienie lokalnych danych za osobnym potwierdzeniem wyboru właściwej kopii. Dotychczasowe przykłady nie będą automatycznie wysyłane do wspólnej bazy.

## Założenia bazy

`veyro_members` łączy prawdziwe identyfikatory Supabase Auth z dotychczasowymi osobami `u1` i `u2`. Obie osoby mają dostęp do rekordów wspólnej przestrzeni. Pozostali użytkownicy nie mają dostępu.

Każdy rekord ma osobną wersję. Funkcja `veyro_write_entity` wymaga numeru wersji odczytanego przez klienta. Nieaktualny zapis zgłasza konflikt i nie nadpisuje nowszej zmiany. Usunięcie zapisuje znacznik `deleted_at`, który można również przekazać do innych urządzeń. Konta aplikacji nie mają bezpośrednich uprawnień INSERT/UPDATE/DELETE ani możliwości dodawania członków.

W przeglądarce może znajdować się tylko adres projektu i klucz **publishable**. Klucz **secret/service_role**, hasło bazy i token GitHuba nigdy nie trafiają do plików strony. Ochronę danych zapewniają zweryfikowana sesja i polityki RLS, a nie ukrycie publicznego klucza.

Zapis trwały w bazie nie zastępuje kopii zapasowej. Harmonogram i możliwość przywracania kopii trzeba sprawdzić dla wybranego projektu/planu Supabase przed użyciem produkcyjnym; eksport JSON pozostaje dodatkową kopią.

## Przygotowanie interfejsu

Uruchom `npm test`, a następnie `npm run build`. Folderem do publikacji jest `dist/`. Cloudflare Pages obsługuje statyczny HTML i połączenie z GitHubem: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

**Nie publikować tej wersji jako wspólnego CRM przed podłączeniem i przetestowaniem logowania oraz adaptera Supabase.** Samo umieszczenie plików w internecie nie zmieni lokalnego zapisu we wspólny.
