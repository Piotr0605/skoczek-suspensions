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
- **Pricing** — detailed service price list (front forks, rear shocks/dampers, additional services) grouped by manufacturer (FOX, Rock Shox, Ohlins, Marzocchi, and others)
- **Contact** — address, phone, email, quick inquiry form
- **Terms of Service** and **Privacy Policy (GDPR)**
- **Google Maps** — service location (requires cookie consent)
- **Cookie banner** — GDPR compliance when using maps

### Client Area
- Registration and login (Supabase Auth, minimum 8-character password)
- **Service request form** — suspension model, issue description, delivery method (in person / shipping), preferred date
- **Client dashboard** — history of own requests with current repair status
- The service center reads new requests in the mechanic panel. There is no outbound email.

### Mechanic Panel (Administrator)
- Overview of all service requests, including the client's email
- Filtering: active, new, in progress, ready, history
- Status and quote updates (PLN)
- Archiving completed orders
- Contact-form questions from the public site

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS (CDN) |
| Icons | Lucide React |
| Backend / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Analytics | Vercel Analytics |
| Hosting | Vercel |

---

## Architecture

The application is a **SPA** (Single Page Application) with view-based navigation (`HOME`, `FORM`, `DASHBOARD`, `ADMIN`, `CONTACT`, `REGULATIONS`, `PRIVACY`).

```
┌──────────────────────────────────────────────────────────────┐
│                        React (Vite)                          │
│  App.tsx ──► UI components + view routing                  │
│       │                                                      │
│       ▼                                                      │
│  ApiService (api.ts)                                         │
│       ├── requireSession() / requireAdmin()                  │
│       ├── auth: register, login, logout, me                  │
│       ├── requests: create, getAll, getAllForUser,           │
│       │            updateStatus                              │
│       └── inquiries: create, getAll                          │
│       │                                                      │
│       ▼                                                      │
│  config.ts ──► VITE_* variables (Supabase)                   │
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
3. The request is saved in Supabase with `user_id` and the session email
4. The client tracks status in the dashboard; the mechanic reads the order in the admin panel
5. A public contact question is stored in `contact_inquiries` and shown in the same panel

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

SQL migration with RLS policies: `supabase/migrations/001_security_rls.sql`

Detailed deployment guide: [`DEPLOY_SECURITY.md`](DEPLOY_SECURITY.md)

---

## Project Structure

```
skoczek-suspensions/
├── index.html                  # HTML entry point, Tailwind config
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example                # Environment variables template
├── .gitignore
├── DEPLOY_SECURITY.md          # Security deployment guide
├── supabase/
│   └── migrations/
│       └── 001_security_rls.sql  # RLS + ADMIN role migration
└── src/
    ├── index.tsx               # React app mount
    ├── vite-env.d.ts           # VITE_* variable types
    ├── config.ts               # Supabase configuration
    ├── App.tsx                 # Main component, navigation, layout
    ├── types.ts                # TypeScript types (User, ServiceRequest, enums)
    ├── constants.ts            # Contact info, pricing, terms, privacy policy
    ├── utils/
    │   ├── auth.ts             # Role lookup from app_metadata
    │   └── validation.ts       # Form and password validation
    ├── components/
    │   ├── ServiceForm.tsx     # Service request form
    │   ├── Dashboard.tsx       # Client dashboard
    │   ├── AdminDashboard.tsx  # Mechanic/admin dashboard
    │   └── CookieBanner.tsx    # Cookie consent banner
    └── services/
        ├── supabaseClient.ts   # Supabase client
        └── api.ts              # API layer (auth + requests)
```

---

## Requirements

- **Node.js** 18 or newer
- **npm** (or yarn / pnpm)
- **Supabase** account with configured database, authentication, and migrations `001` and `002` applied
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

Values are loaded in `src/config.ts`. If environment variables are missing, fallbacks are used. Outbound email is not used: new service requests and contact questions appear in the mechanic panel.

After `001_security_rls.sql`, run [`supabase/migrations/002_contact_details.sql`](supabase/migrations/002_contact_details.sql) in the Supabase SQL Editor. It adds `client_email` on `service_requests` and the `contact_inquiries` table. Without it, new contact questions cannot be saved.

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

1. **Supabase** — run `supabase/migrations/001_security_rls.sql` in the SQL Editor
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
| `client_email` | text | Email copied from the signed-in session |
| `status` | text | Request status (see below) |
| `estimated_cost` | numeric | Estimated quote (PLN) |
| `created_at` | timestamptz | Creation timestamp |

### Row Level Security (RLS)

After running the `001_security_rls.sql` migration, these policies apply:

| Operation | Client (`CLIENT`) | Administrator (`ADMIN`) |
|-----------|-------------------|-------------------------|
| SELECT own requests | Yes | Yes |
| SELECT all requests | No | Yes |
| INSERT (own request) | Yes | Yes |
| UPDATE status / quote | No | Yes |
| DELETE | No | Yes |

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
| `npm run build` | Build to `dist/` |
| `npm run preview` | Local preview of the production build |

---

## License

Private project — Galeria Rowerowa Sp. z o.o. / Oddaj Amora.
