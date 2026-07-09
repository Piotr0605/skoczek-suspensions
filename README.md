# Oddaj Amora — Serwis Amortyzatorów

Aplikacja webowa dla autoryzowanego punktu serwisowego amortyzatorów i damperów rowerowych **Oddaj Amora** (Galeria Rowerowa, Białystok). Umożliwia klientom składanie zgłoszeń serwisowych online, śledzenie statusu napraw oraz zarządzanie zleceniami przez personel serwisu.

**Autor:** Piotr Sienkiewicz

---

## Spis treści

- [Funkcjonalności](#funkcjonalności)
- [Stos technologiczny](#stos-technologiczny)
- [Architektura](#architektura)
- [Struktura projektu](#struktura-projektu)
- [Wymagania](#wymagania)
- [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
- [Konfiguracja](#konfiguracja)
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
- Rejestracja i logowanie (Supabase Auth)
- **Formularz zgłoszenia serwisowego** — model amortyzatora, opis usterki, sposób dostarczenia (osobiście / wysyłka), preferowany termin
- **Panel klienta** — historia zgłoszeń z aktualnym statusem naprawy
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
| Backend / Auth | Supabase (PostgreSQL + Auth) |
| E-mail | EmailJS |
| Analityka | Vercel Analytics |

---

## Architektura

Aplikacja jest **SPA** (Single Page Application) z nawigacją opartą na stanie widoku (`HOME`, `FORM`, `DASHBOARD`, `ADMIN`, `CONTACT`, `REGULATIONS`, `PRIVACY`).

```
┌─────────────────────────────────────────────────────────┐
│                      React (Vite)                       │
│  App.tsx ──► komponenty UI + routing widoków            │
│       │                                                 │
│       ▼                                                 │
│  ApiService (api.ts) ──► Supabase Client                │
│       │                                                 │
│       ├── auth: register, login, logout, me             │
│       └── requests: create, getAll, getAllForUser,      │
│                     updateStatus                        │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   Supabase Auth              Tabela service_requests
   (user_metadata:            (PostgreSQL)
    name, phone, role)
```

Przepływ zgłoszenia serwisowego:
1. Klient loguje się lub rejestruje
2. Wypełnia formularz i akceptuje regulamin oraz politykę prywatności
3. Zgłoszenie zapisywane jest w Supabase
4. Wysyłane jest powiadomienie e-mail (EmailJS) do serwisu
5. Klient śledzi status w panelu; mechanik aktualizuje zlecenie w panelu admina

---

## Struktura projektu

```
skoczek-suspensions/
├── index.html              # Punkt wejścia HTML, konfiguracja Tailwind
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.tsx           # Montowanie aplikacji React
    ├── App.tsx             # Główny komponent, nawigacja, layout
    ├── types.ts            # Typy TypeScript (User, ServiceRequest, enums)
    ├── constants.ts        # Dane kontaktowe, cennik, regulamin, RODO
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
- Konto **Supabase** z skonfigurowaną bazą i autentykacją
- Konto **EmailJS** (opcjonalnie, do powiadomień e-mail)

---

## Instalacja i uruchomienie

```bash
# Klonowanie repozytorium
git clone <url-repozytorium>
cd skoczek-suspensions

# Instalacja zależności
npm install

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

### Supabase

W pliku `src/services/supabaseClient.ts` ustaw:

- `SUPABASE_URL` — URL projektu Supabase
- `SUPABASE_ANON_KEY` — klucz publiczny (anon)

### EmailJS

W pliku `src/components/ServiceForm.tsx` skonfiguruj:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`

Szablon e-mail powinien zawierać pola: `from_name`, `from_email`, `from_phone`, `component_model`, `problem_description`, `delivery_method`, `preferred_date`.

### Rola administratora

Nowi użytkownicy otrzymują domyślnie rolę `CLIENT`. Rolę `ADMIN` nadaje się **ręcznie** w panelu Supabase (metadane użytkownika: `role: "ADMIN"`).

---

## Baza danych (Supabase)

Wymagana tabela `service_requests`:

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

Zalecane są polityki RLS (Row Level Security) ograniczające odczyt i zapis zgłoszeń do właściciela oraz administratorów.

---

## Role użytkowników

| Rola | Uprawnienia |
|------|-------------|
| `CLIENT` | Składanie zgłoszeń, podgląd własnej historii napraw |
| `ADMIN` | Pełny dostęp do panelu mechanika, edycja statusów i wycen wszystkich zgłoszeń |

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
