# Wdrożenie poprawek bezpieczeństwa (bez przestoju)

## Kolejność — bardzo ważna

Aby strona nie przestała działać i panel mechanika nie zniknął:

### 1. Supabase SQL (najpierw!)

1. Wejdź w [Supabase Dashboard](https://supabase.com/dashboard) → swój projekt
2. **SQL Editor** → **New query**
3. Skopiuj całą zawartość pliku `supabase/migrations/001_security_rls.sql`
4. Kliknij **Run**

To:
- przeniesie rolę `ADMIN` do `app_metadata` (bezpieczne, nieedytowalne przez klienta),
- włączy RLS na tabeli `service_requests`,
- ustawi polityki dostępu (klient → swoje dane, admin → wszystko).

### 2. Sprawdź administratora

W Supabase → **Authentication** → **Users** → wybierz konto admina.

W **App Metadata** powinno być:
```json
{ "role": "ADMIN" }
```

Jeśli nie ma — uruchom w SQL Editor:
```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
WHERE email = 'TWOJ-EMAIL-ADMINA@example.com';
```

### 3. Deploy frontendu (Vercel)

```bash
git add .
git commit -m "Poprawki bezpieczeństwa: RLS, app_metadata, walidacja"
git push origin main
```

Vercel zbuduje i wdroży automatycznie. Strona publiczna (landing, cennik, kontakt) działa bez zmian.

### 4. Opcjonalnie — zmienne środowiskowe na Vercel

**Settings → Environment Variables** (dla Production):

| Zmienna | Wartość |
|---------|---------|
| `VITE_SUPABASE_URL` | URL projektu Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key |
| `VITE_EMAILJS_SERVICE_ID` | service_... |
| `VITE_EMAILJS_TEMPLATE_ID` | template_... |
| `VITE_EMAILJS_PUBLIC_KEY` | klucz publiczny |

Bez tych zmiennych aplikacja używa fallbacków — działa jak dotychczas.

### 5. Test po wdrożeniu

- [ ] Strona główna, cennik, kontakt — bez zmian
- [ ] Rejestracja i logowanie klienta
- [ ] Złożenie zgłoszenia serwisowego
- [ ] Panel klienta — widać tylko własne zgłoszenia
- [ ] Panel mechanika — pełna lista i edycja statusów
- [ ] Zwykły klient **nie** widzi panelu mechanika

## Co zostało naprawione

| Problem | Rozwiązanie |
|---------|-------------|
| Brak RLS | Polityki SQL w Supabase |
| Rola ADMIN w user_metadata | Przeniesiona do app_metadata |
| Autoryzacja tylko w UI | `requireAdmin()` w API + RLS |
| userId z parametru | Sesja użytkownika z Supabase Auth |
| Klucze w kodzie | `config.ts` + env vars (fallback) |
| Brak walidacji | Limity długości pól, min. 8 znaków hasła |
| Wyciek błędów rejestracji | Ogólne komunikaty |

## Uwaga o EmailJS

Klucze EmailJS nadal działają z przeglądarki (ograniczenie architektury SPA).
Docelowo warto przenieść wysyłkę maili na Supabase Edge Function.
