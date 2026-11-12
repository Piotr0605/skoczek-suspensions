# Oddaj Amora — Suspension Service

A web application for **Oddaj Amora** (Galeria Rowerowa, Białystok), an authorized bicycle suspension and damper service center. It allows customers to submit service requests online, track repair status, and lets service staff manage work orders.

**Author:** Piotr Sienkiewicz

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Security](#security)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation and Running](#installation-and-running)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Database (Supabase)](#database-supabase)
- [User Roles](#user-roles)
- [Request Statuses](#request-statuses)
- [npm Scripts](#npm-scripts)
- [License](#license)

---

## Features

### Public Website
- **Home page** — service presentation, brand and offer information
- **Pricing** — detailed service price list (front forks, rear shocks/dampers, additional services) grouped by manufacturer (FOX, Rock Shox, Ohlins, Marzocchi, and others); loaded from the `pricing` table, with `src/constants.ts` as a fallback
- **How it works / FAQ** — service steps and frequently asked questions
- **Contact** — address, phone, email, quick inquiry form (sent via EmailJS, with a `mailto:` fallback)
- **Terms of Service** and **Privacy Policy (GDPR)**
- **Google Maps** — service location (requires cookie consent)
- **Cookie banner** — accept all / necessary only; the choice can be changed via "Ustawienia cookies" in the footer

### Client Area
- Registration and login (Supabase Auth, minimum 8-character password)
- **Service request form** — suspension model, issue description, delivery method (in person / shipping), preferred date
- **Client dashboard** — history of own requests with current repair status
- Email notification to the service center after submitting a request (EmailJS)

### Mechanic Panel (Administrator)
- Overview of all service requests
- Filtering: active, new, in progress, ready, history
- Status and quote updates (PLN)
- Archiving completed orders
- **Price list editor** ("Cennik" tab) — edit categories, brands, models and prices; add, remove and reorder rows; restore the default list

### SEO
- Separate URLs per page (`/zglos-serwis`, `/kontakt`, `/regulamin`, `/polityka-prywatnosci`) with their own title, description and canonical link (`src/routes.ts`)
- Open Graph / Twitter tags, `LocalBusiness` (BicycleStore) JSON-LD, `robots.txt`, `sitemap.xml`, favicon and web manifest in `public/`
- `noindex` on account, admin and 404 pages

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript |
| Bundler | Vite 7 |
| Styling | Tailwind CSS 3 (built with PostCSS) |
| Icons | Lucide React |
| Backend / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Email | EmailJS |
| Analytics | Vercel Analytics |
| Hosting | Vercel |

---

## Architecture

The application is a **SPA** (Single Page Application). Each view has its own URL handled with the History API (`src/routes.ts`); `vercel.json` rewrites all paths to `index.html`.

```
┌──────────────────────────────────────────────────────────────┐
│                        React (Vite)                          │
│  App.tsx ──► UI components + view routing                  │
│       │                                                      │
│       ▼                                                      │
│  ApiService (api.ts)                                         │
│       ├── requireSession() / requireAdmin()                  │
│       ├── auth: register, login, logout, me                  │
│       └── requests: create, getAll, getAllForUser,           │
│                     updateStatus                             │
│       │                                                      │
│       ▼                                                      │
│  config.ts ──► VITE_* variables (Supabase, EmailJS)          │
│  supabaseClient.ts ──► Supabase Client                       │
└──────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
   Supabase Auth                    service_requests table
   (app_metadata: role ADMIN)       + Row Level Security (RLS)
   (user_metadata: name, phone)
```

Service request flow:
1. The client logs in or registers
2. Fills out the form (with field validation) and accepts the terms and privacy policy
3. The request is saved in Supabase with `user_id` from the active session
4. An email notification is sent to the service center (EmailJS)
5. The client tracks status in the dashboard; the mechanic updates the order in the admin panel

---

## Security

The application uses multi-layer data protection:

| Mechanism | Description |
|-----------|-------------|
| **Row Level Security (RLS)** | PostgreSQL policies in Supabase — clients see only their own requests, admins have full access |
| **Role in `app_metadata`** | The `ADMIN` role is stored only in `app_metadata` (not editable from the browser) |
| **Session verification** | Request operations use `auth.uid()` from the Supabase session, not a client-supplied parameter |
| **`requireAdmin()`** | API layer blocks admin operations before sending queries to the database |
| **Input validation** | Form field length limits, minimum password length |
| **Environment variables** | API keys in `VITE_*` env vars instead of hardcoded in components |
| **Generic error messages** | Registration does not expose server error details |
| **HTTP security headers** | `vercel.json`: Content-Security-Policy, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |
| **Insert restrictions** | Clients can only create requests with the initial status and no quote; DB-level length limits |
| **Price list** | `pricing` table readable by everyone, writable only by `is_admin()`; data is sanitized before saving |

SQL migrations: `supabase/migrations/001_security_rls.sql`, `supabase/migrations/002_pricing_and_hardening.sql`

> When adding a new external service (scripts, API, iframes), add its domain to the `Content-Security-Policy` header in `vercel.json`.

Detailed deployment guide: [`DEPLOY_SECURITY.md`](DEPLOY_SECURITY.md)

---

## Project Structure

```
skoczek-suspensions/
├── index.html                  # HTML entry point, SEO meta tags, JSON-LD
├── vercel.json                 # SPA rewrites, security headers, caching
├── tailwind.config.js / postcss.config.js
├── public/                     # favicon, og-image, robots.txt, sitemap.xml, manifest
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example                # Environment variables template
├── .gitignore
├── DEPLOY_SECURITY.md          # Security deployment guide
├── supabase/
│   └── migrations/
│       ├── 001_security_rls.sql  # RLS + ADMIN role migration
│       └── 002_pricing_and_hardening.sql  # pricing table + insert hardening
└── src/
    ├── index.tsx               # React app mount
    ├── index.css               # Tailwind entry + global styles
    ├── routes.ts               # URL ↔ view mapping, per-page SEO meta
    ├── vite-env.d.ts           # VITE_* variable types
    ├── config.ts               # Supabase and EmailJS configuration
    ├── App.tsx                 # Main component, navigation, layout
    ├── types.ts                # TypeScript types (User, ServiceRequest, enums)
    ├── constants.ts            # Contact info, pricing, terms, privacy policy
    ├── utils/
    │   ├── auth.ts             # Role lookup from app_metadata
    │   ├── pricing.ts          # Price list sanitization / formatting
    │   └── validation.ts       # Form and password validation
    ├── components/
    │   ├── ServiceForm.tsx     # Service request form
    │   ├── Dashboard.tsx       # Client dashboard
    │   ├── AdminDashboard.tsx  # Mechanic/admin dashboard
    │   ├── PricingEditor.tsx   # Admin price list editor
    │   └── CookieBanner.tsx    # Cookie consent banner
    └── services/
        ├── supabaseClient.ts   # Supabase client
        └── api.ts              # API layer (auth + requests + pricing)
```

---

## Requirements

- **Node.js** 20.19 or newer
- **npm** (or yarn / pnpm)
- **Supabase** account with configured database, authentication, and RLS migration applied
- **EmailJS** account (for email notifications about new requests)
- **Vercel** account (production hosting)

---

## Installation and Running

```bash
# Clone the repository
git clone https://github.com/Piotr0605/skoczek-suspensions.git
cd skoczek-suspensions

# Install dependencies
npm install

# Configure environment variables (optional for local dev)
cp .env.example .env.local
# Fill in values in .env.local

# Start the development server
npm run dev
```

The app is available by default at `http://localhost:5173`.

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## Configuration

Configuration is done via environment variables with the `VITE_` prefix (`.env.local` locally, **Environment Variables** on Vercel).

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public (anon) key |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | Email template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key |

Values are loaded in `src/config.ts`. If environment variables are missing, fallbacks are used — this preserves compatibility with the existing deployment, but **setting env vars on Vercel is recommended**.

The EmailJS template should include these fields: `from_name`, `from_email`, `from_phone`, `component_model`, `problem_description`, `delivery_method`, `preferred_date`.

### Administrator Role

New users receive the `CLIENT` role by default. The `ADMIN` role is assigned **only** in the Supabase dashboard, in **App Metadata**:

```json
{ "role": "ADMIN" }
```

Alternatively, via the SQL Editor:

```sql
UPDATE auth.users
SET raw_app_meta_data =
  COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'ADMIN')
WHERE email = 'admin@example.com';
```

---

## Production Deployment

The application is hosted on **Vercel** and builds automatically on `git push` to the `main` branch.

### Deployment Order (Important)

1. **Supabase** — run `supabase/migrations/001_security_rls.sql`, then `002_pricing_and_hardening.sql` in the SQL Editor
2. **Verify** — the admin account has `"role": "ADMIN"` in App Metadata
3. **Vercel** — set `VITE_*` variables (optional but recommended)
4. **Deploy** — `git push origin main`

Full step-by-step guide: [`DEPLOY_SECURITY.md`](DEPLOY_SECURITY.md)

### Post-Deployment Checklist

- [ ] Home page, pricing, and contact work correctly
- [ ] Client registration and login
- [ ] Service request submission
- [ ] Client dashboard shows only own requests
- [ ] Mechanic panel — full list and status editing
- [ ] Regular clients cannot access the mechanic panel

---

## Database (Supabase)

### `service_requests` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User ID (FK to auth.users) |
| `component_model` | text | Suspension / damper model |
| `problem_description` | text | Issue description |
| `delivery_method` | text | `Osobisty` (in person) or `Wysyłka` (shipping) |
| `preferred_date` | date | Preferred date |
| `client_name` | text | Client full name |
| `client_phone` | text | Contact phone |
| `status` | text | Request status (see below) |
| `estimated_cost` | numeric | Estimated quote (PLN) |
| `created_at` | timestamptz | Creation timestamp |

### `pricing` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Always `main` (single row) |
| `data` | jsonb | Array of price list categories (`PricingCategory[]`) |
| `updated_at` | timestamptz | Set automatically on save |
| `updated_by` | uuid | Admin who saved the price list |

Until the first save from the admin panel, the site shows the built-in price list from `src/constants.ts`.

### Row Level Security (RLS)

After running the `001_security_rls.sql` migration, these policies apply:

| Operation | Client (`CLIENT`) | Administrator (`ADMIN`) |
|-----------|-------------------|-------------------------|
| SELECT own requests | Yes | Yes |
| SELECT all requests | No | Yes |
| INSERT (own request) | Yes | Yes |
| UPDATE status / quote | No | Yes |
| DELETE | No | Yes |
| SELECT `pricing` | Yes (also anonymous) | Yes |
| INSERT / UPDATE `pricing` | No | Yes |

The `is_admin()` function checks the role exclusively in the JWT `app_metadata`.

---

## User Roles

| Role | Source | Permissions |
|------|--------|-------------|
| `CLIENT` | Default on registration | Submit requests, view own repair history |
| `ADMIN` | `app_metadata` in Supabase | Full access to the mechanic panel, edit statuses and quotes |

---

## Request Statuses

| Status (PL) | Description |
|-------------|-------------|
| Oczekuje na przyjęcie | New request |
| Przyjęty na serwis | Equipment received for service |
| W trakcie naprawy | Repair in progress |
| Oczekiwanie na części | On hold — waiting for parts |
| Gotowy do odbioru | Ready for pickup |
| Zakończony | Order archived |

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite development server |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Type check + build to `dist/` |
| `npm run preview` | Local preview of the production build |

---

## License

Private project — Galeria Rowerowa Sp. z o.o. / Oddaj Amora.
