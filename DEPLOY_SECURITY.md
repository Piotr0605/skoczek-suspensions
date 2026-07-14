# Security Fixes Deployment (Zero Downtime)

## Order — Very Important

To keep the site running and the mechanic panel accessible:

### 1. Supabase SQL (First!)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **SQL Editor** → **New query**
3. Copy the entire contents of `supabase/migrations/001_security_rls.sql`
4. Click **Run**

This will:
- move the `ADMIN` role to `app_metadata` (secure, not editable by the client),
- enable RLS on the `service_requests` table,
- set access policies (client → own data, admin → everything).

### 2. Verify the Administrator

In Supabase → **Authentication** → **Users** → select the admin account.

**App Metadata** should contain:
```json
{ "role": "ADMIN" }
```

If missing — run in the SQL Editor:
```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
WHERE email = 'YOUR-ADMIN-EMAIL@example.com';
```

### 3. Deploy Frontend (Vercel)

```bash
git add .
git commit -m "Security fixes: RLS, app_metadata, validation"
git push origin main
```

Vercel will build and deploy automatically. The public site (landing, pricing, contact) works unchanged.

### 4. Optional — Environment Variables on Vercel

**Settings → Environment Variables** (for Production):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key |
| `VITE_EMAILJS_SERVICE_ID` | service_... |
| `VITE_EMAILJS_TEMPLATE_ID` | template_... |
| `VITE_EMAILJS_PUBLIC_KEY` | public key |

Without these variables the app uses fallbacks — it works as before.

### 5. Post-Deployment Test

- [ ] Home page, pricing, contact — unchanged
- [ ] Client registration and login
- [ ] Service request submission
- [ ] Client dashboard — only own requests visible
- [ ] Mechanic panel — full list and status editing
- [ ] Regular client **cannot** see the mechanic panel

## What Was Fixed

| Issue | Solution |
|-------|----------|
| Missing RLS | SQL policies in Supabase |
| ADMIN role in user_metadata | Moved to app_metadata |
| Authorization only in UI | `requireAdmin()` in API + RLS |
| userId from parameter | User session from Supabase Auth |
| Keys in source code | `config.ts` + env vars (fallback) |
| Missing validation | Field length limits, min. 8 character password |
| Registration error leakage | Generic error messages |

## Note on EmailJS

EmailJS keys still work from the browser (SPA architecture limitation).
Consider moving email sending to a Supabase Edge Function in the future.
