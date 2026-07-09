# Oddaj Amora — Serwis Amortyzatorów

Aplikacja webowa dla autoryzowanego punktu serwisowego amortyzatorów i damperów rowerowych **Oddaj Amora** (Galeria Rowerowa, Białystok). Umożliwia klientom składanie zgłoszeń serwisowych online, śledzenie statusu napraw oraz zarządzanie zleceniami przez personel serwisu.

**Autor:** Piotr Sienkiewicz

---

## Spis treści

- [Funkcjonalności](#funkcjonalności)
- [Stos technologiczny](#stos-technologiczny)
- [Architektura](#architektura)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Struktura projektu](#struktura-projektu)
- [Wymagania](#wymagania)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Konfiguracja](#konfiguracja)
- [Wdrożenie produkcyjne](#wdrożenie-produkcyjne)
- [Baza danych (Supabase)](#baza-danych-supabase)
- [Role użytkowników](#role-użytkowników)
- [Statusy zgłoszeń](#statusy-zgłoszeń)
- [Skrypty npm](#skrypty-npm)
- [Licencja](#licencja)

---

## Funkcjonalności

### Strona publiczna
- **Strona główna** — prezentacja serwisu, informacje o marce i ofercie
- **Cennik** — szczegółowy cennik usług (amortyzatory przednie, tylne/dampery, usługi dodatkowe) z podziałem na producentów (FOX, Rock Shox, Ohlins, Marzocchi i inne)
- **Kontakt** — dane adresowe, telefon, e-mail, formularz szybkiego zapytania
- **Regulamin** i **Polityka prywatności (RODO)**
- **Mapa Google** — lokalizacja serwisu (wymaga akceptacji cookies)
- **Baner cookies** — zgodność z RODO przy korzystaniu z map

### Strefa klienta
- Rejestracja i logowanie (Supabase Auth, hasło min. 8 znaków)
- **Formularz zgłoszenia serwisowego** — model amortyzatora, opis usterki, sposób dostarczenia (osobiście / wysyłka), preferowany termin
- **Panel klienta** — historia własnych zgłoszeń z aktualnym statusem naprawy
- Powiadomienie e-mail do serwisu po złożeniu zgłoszenia (EmailJS)

### Panel mechanika (administrator)
- Przegląd wszystkich zgłoszeń serwisowych
- Filtrowanie: bieżące, nowe, w trakcie, gotowe, historia
- Aktualizacja statusu i wyceny (PLN)
- Archiwizacja zakończonych zleceń

---

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React 18, TypeScript |
| Bundler | Vite 5 |
| Stylowanie | Tailwind CSS (CDN) |
| Ikony | Lucide React |
| Backend / Auth | Supabase (PostgreSQL + Auth + RLS) |
| E-mail | EmailJS |
| Analityka | Vercel Analytics |
| Hosting | Vercel |

---

## Architektura

Aplikacja jest **SPA** (Single Page Application) z nawigacją opartą na stanie widoku (`HOME`, `FORM`, `DASHBOARD`, `ADMIN`, `CONTACT`, `REGULATIONS`, `PRIVACY`).

```
┌──────────────────────────────────────────────────────────────┐
│                        React (Vite)                          │
│  App.tsx ──► komponenty UI + routing widoków                 │
│       │                                                      │
│       ▼                                                      │
│  ApiService (api.ts)                                         │
│       ├── requireSession() / requireAdmin()                  │
│       ├── auth: register, login, logout, me                  │
│       └── requests: create, getAll, getAllForUser,           │
│                     updateStatus                             │
│       │                                                      │
│       ▼                                                      │
│  config.ts ──► zmienne VITE_* (Supabase, EmailJS)            │
│  supabaseClient.ts ──► Supabase Client                       │
└──────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
   Supabase Auth                    Tabela service_requests
   (app_metadata: role ADMIN)       + Row Level Security (RLS)
   (user_metadata: name, phone)
```

Przepływ zgłoszenia serwisowego:
1. Klient loguje się lub rejestruje
2. Wypełnia formularz (z walidacją pól) i akceptuje regulamin oraz politykę prywatności
3. Zgłoszenie zapisywane jest w Supabase z `user_id` z aktywnej sesji
4. Wysyłane jest powiadomienie e-mail (EmailJS) do serwisu
5. Klient śledzi status w panelu; mechanik aktualizuje zlecenie w panelu admina

---

## Bezpieczeństwo

Aplikacja stosuje wielowarstwową ochronę danych:

| Mechanizm | Opis |
|-----------|------|
| **Row Level Security (RLS)** | Polityki PostgreSQL w Supabase — klient widzi tylko swoje zgłoszenia, admin ma pełny dostęp |
| **Rola w `app_metadata`** | Rola `ADMIN` przechowywana wyłącznie w `app_metadata` (niedostępna do edycji z przeglądarki) |
| **Weryfikacja sesji** | Operacje na zgłoszeniach używają `auth.uid()` z sesji Supabase, nie parametru z klienta |
| **`requireAdmin()`** | Warstwa API blokuje operacje administracyjne przed wysłaniem zapytania do bazy |
| **Walidacja wejścia** | Limity długości pól formularza, minimalna długość hasła |
| **Zmienne środowiskowe** | Klucze API w `VITE_*` env vars zamiast bezpośrednio w komponentach |
| **Ogólne komunikaty błędów** | Rejestracja nie ujawnia szczegółów błędów serwera |

Migracja SQL z politykami RLS: `supabase/migrations/001_security_rls.sql`

Szczegółowa instrukcja wdrożenia: [`DEPLOY_SECURITY.md`](DEPLOY_SECURITY.md)

---

## Struktura projektu

```
skoczek-suspensions/
├── index.html                  # Punkt wejścia HTML, konfiguracja Tailwind
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example                # Szablon zmiennych środowiskowych
├── .gitignore
├── DEPLOY_SECURITY.md          # Instrukcja wdrożenia poprawek bezpieczeństwa
├── supabase/
│   └── migrations/
│       └── 001_security_rls.sql  # RLS + migracja roli ADMIN
└── src/
    ├── index.tsx               # Montowanie aplikacji React
    ├── vite-env.d.ts           # Typy zmiennych VITE_*
    ├── config.ts               # Konfiguracja Supabase i EmailJS
    ├── App.tsx                 # Główny komponent, nawigacja, layout
    ├── types.ts                # Typy TypeScript (User, ServiceRequest, enums)
    ├── constants.ts            # Dane kontaktowe, cennik, regulamin, RODO
    ├── utils/
    │   ├── auth.ts             # Odczyt roli z app_metadata
    │   └── validation.ts       # Walidacja formularzy i haseł
    ├── components/
    │   ├── ServiceForm.tsx     # Formularz zgłoszenia serwisowego
    │   ├── Dashboard.tsx       # Panel klienta
    │   ├── AdminDashboard.tsx  # Panel mechanika
    │   └── CookieBanner.tsx    # Baner zgody na cookies
    └── services/
        ├── supabaseClient.ts   # Klient Supabase
        └── api.ts              # Warstwa API (auth + zgłoszenia)
```

---

## Wymagania

- **Node.js** 18 lub nowszy
- **npm** (lub yarn / pnpm)
- Konto **Supabase** z skonfigurowaną bazą, autentykacją i uruchomioną migracją RLS
- Konto **EmailJS** (do powiadomień e-mail o nowych zgłoszeniach)
- Konto **Vercel** (hosting produkcyjny)

---

## Instalacja i uruchomienie

```bash
# Klonowanie repozytorium
git clone https://github.com/Piotr0605/skoczek-suspensions.git
cd skoczek-suspensions

# Instalacja zależności
npm install

# Konfiguracja zmiennych środowiskowych (opcjonalnie lokalnie)
cp .env.example .env.local
# Uzupełnij wartości w .env.local

# Uruchomienie serwera deweloperskiego
npm run dev
```

Aplikacja domyślnie dostępna pod adresem `http://localhost:5173`.

```bash
# Budowanie wersji produkcyjnej
npm run build

# Podgląd buildu produkcyjnego
npm run preview
```

---

## Konfiguracja

Konfiguracja odbywa się przez zmienne środowiskowe z prefiksem `VITE_` (plik `.env.local` lokalnie, **Environment Variables** na Vercel).

| Zmienna | Opis |
|---------|------|
| `VITE_SUPABASE_URL` | URL projektu Supabase |
| `VITE_SUPABASE_ANON_KEY` | Klucz publiczny (anon) |
| `VITE_EMAILJS_SERVICE_ID` | ID serwisu EmailJS |
| `VITE_EMAILJS_TEMPLATE_ID` | ID szablonu e-mail |
| `VITE_EMAILJS_PUBLIC_KEY` | Klucz publiczny EmailJS |

Wartości ładowane są w `src/config.ts`. Przy braku zmiennych środowiskowych używane są fallbacki — zapewnia to kompatybilność z dotychczasowym deployem, ale **zalecane jest ustawienie env vars na Vercel**.

Szablon e-mail EmailJS powinien zawierać pola: `from_name`, `from_email`, `from_phone`, `component_model`, `problem_description`, `delivery_method`, `preferred_date`.

### Rola administratora

Nowi użytkownicy otrzymują domyślnie rolę `CLIENT`. Rolę `ADMIN` nadaje się **wyłącznie** w panelu Supabase, w polu **App Metadata**:

```json
{ "role": "ADMIN" }
```

Alternatywnie przez SQL Editor:

```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
WHERE email = 'admin@example.com';
```

---

## Wdrożenie produkcyjne

Aplikacja jest hostowana na **Vercel** i automatycznie buduje się po `git push` na gałąź `main`.

### Kolejność wdrożenia (ważne)

1. **Supabase** — uruchom `supabase/migrations/001_security_rls.sql` w SQL Editor
2. **Sprawdź** — konto admina ma `"role": "ADMIN"` w App Metadata
3. **Vercel** — ustaw zmienne `VITE_*` (opcjonalnie, ale zalecane)
4. **Deploy** — `git push origin main`

Pełna instrukcja krok po kroku: [`DEPLOY_SECURITY.md`](DEPLOY_SECURITY.md)

### Checklist po wdrożeniu

- [ ] Strona główna, cennik, kontakt działają poprawnie
- [ ] Rejestracja i logowanie klienta
- [ ] Złożenie zgłoszenia serwisowego
- [ ] Panel klienta pokazuje tylko własne zgłoszenia
- [ ] Panel mechanika — pełna lista i edycja statusów
- [ ] Zwykły klient nie ma dostępu do panelu mechanika

---

## Baza danych (Supabase)

### Tabela `service_requests`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | uuid | Klucz główny |
| `user_id` | uuid | ID użytkownika (FK do auth.users) |
| `component_model` | text | Model amortyzatora / dampera |
| `problem_description` | text | Opis usterki |
| `delivery_method` | text | `Osobisty` lub `Wysyłka` |
| `preferred_date` | date | Preferowany termin |
| `client_name` | text | Imię i nazwisko klienta |
| `client_phone` | text | Telefon kontaktowy |
| `status` | text | Status zgłoszenia (patrz poniżej) |
| `estimated_cost` | numeric | Szacunkowa wycena (PLN) |
| `created_at` | timestamptz | Data utworzenia |

### Row Level Security (RLS)

Po uruchomieniu migracji `001_security_rls.sql` obowiązują polityki:

| Operacja | Klient (`CLIENT`) | Administrator (`ADMIN`) |
|----------|-------------------|-------------------------|
| SELECT własnych zgłoszeń | Tak | Tak |
| SELECT wszystkich zgłoszeń | Nie | Tak |
| INSERT (własne zgłoszenie) | Tak | Tak |
| UPDATE statusu / wyceny | Nie | Tak |
| DELETE | Nie | Tak |

Funkcja `is_admin()` sprawdza rolę wyłącznie w `app_metadata` JWT.

---

## Role użytkowników

| Rola | Źródło | Uprawnienia |
|------|--------|-------------|
| `CLIENT` | Domyślna przy rejestracji | Składanie zgłoszeń, podgląd własnej historii napraw |
| `ADMIN` | `app_metadata` w Supabase | Pełny dostęp do panelu mechanika, edycja statusów i wycen |

---

## Statusy zgłoszeń

| Status | Opis |
|--------|------|
| Oczekuje na przyjęcie | Nowe zgłoszenie |
| Przyjęty na serwis | Sprzęt przyjęty do serwisu |
| W trakcie naprawy | Trwa realizacja |
| Oczekiwanie na części | Wstrzymane — brak części |
| Gotowy do odbioru | Naprawa zakończona |
| Zakończony | Zlecenie zarchiwizowane |

---

## Skrypty npm

| Polecenie | Opis |
|-----------|------|
| `npm run dev` | Serwer deweloperski Vite |
| `npm run build` | Kompilacja do katalogu `dist/` |
| `npm run preview` | Lokalny podgląd wersji produkcyjnej |

---

## Licencja

Projekt prywatny — Galeria Rowerowa Sp. z o.o. / Oddaj Amora.
