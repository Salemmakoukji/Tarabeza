# 🍽️ Tarapeza - Sleek Digital QR Menus for Restaurants

Tarapeza is a high-performance, premium Software-as-a-Service (SaaS) application designed to modernize the dining experience. It provides interactive, fast-loading, multilingual digital QR menus for restaurants and diners.

This project is built as a pure JavaScript **React Router v7 / Remix** full-stack web application designed for fast compilation, seamless deployment, and responsive interactions.

It consists of two main applications:
1. **Tarapeza Merchant & Diner Platform** (Root directory): The core application where diners view menus, and merchants build their restaurant directory, manage categories, items, custom QR code templates, and track stamp cards.
2. **Tarapeza Admin Portal** (`/admin-portal`): A dedicated, standalone React Router single-page application (SPA) where administrators manage system users, manually grant/update subscription licenses, toggle restaurant states, and resolve customer support tickets.

---

## 🎨 Brand Design & Aesthetic System

Tarapeza is styled around a harmonious, state-of-the-art color scheme:
*   **Brand Dark Slate (`#0F1524`):** Base background colors, panels, cards, and auth sections.
*   **Brand Orange (`#F97316`):** Primary theme color used for buttons, interactive hover items, icons, and visual highlights.
*   **Brand White (`#FEFEFE`):** Clean text styling, premium contrast headers, and subtle secondary panels.
*   **Glassmorphism Effects:** Frosted panels (`glass-panel`) with dynamic backdrop filters.

---

## 🚀 Key Features

### Core Merchant & Diner Platform
1.  **Dynamic SEO & Sitemaps:** Full Google-friendly indexing via `/sitemap.xml` and `/robots.txt` resource endpoints.
2.  **QR Code Design Studio:** Customize dot styles, eye configurations, color highlights, and include brand logos directly. Export high-resolution printable table cards in A4 PDF formats (`jspdf` + `qrcode`).
3.  **Bilingual English & Arabic Layouts:** Comprehensive RTL (Right-to-Left) formatting utilizing the Cairo font automatically.
4.  **Diner Coffee Card Wallet:** Digital loyalty stamp tracker (coffee slots) and saved favorites bookmarks for customers.
5.  **Merchant Settings Control Center:** Configure colors, layouts (Grid, List, Compact), currency symbols, and Wi-Fi codes.
6.  **Fast Loading Media Builder:** Automatically compresses restaurant logos and cover banners in the browser before uploading to storage.

### Standalone Admin Portal (`admin-portal/`)
1. **Metrics KPI Dashboard:** Real-time summary of total registered users, active restaurant profiles, total licenses, and Monthly Recurring Revenue (MRR) projection based on plan tiers.
2. **Bypassing RLS Admin Operations:** Secure server-side Auth actions (create, edit, delete, list users) that bypass client-side `403 (Forbidden)` errors by running through Server Actions.
3. **Direct Licensing Control:** Ability to directly assign Basic or Pro plans to cafe/restaurant profiles, extend expiration dates with custom inputs, and use a `+30d` fast-extension shortcut.
4. **Restaurant Registry:** Check restaurant customization logs, toggle operations status (Active vs Temporarily Closed), and visit public menus instantly.
5. **Support Helpdesk:** Unified ticketing queue to track, update states (`open`, `in_progress`, `resolved`), and archive customer issues.

---

## 💳 Subscription Plan Structure

Tarapeza has transitioned to a streamlined 2-tier plan architecture with monthly and annual options (including 2 months free for annual billing):

| Plan Tier | Price (Monthly) | Price (Annual - 2 Months Free) | Limits & Constraints | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **Basic** | $10 / month | $100 / year | 1 Restaurant Profile, Up to 50 Menu Items | Standard QR Code generator, basic themes |
| **Pro** | $20 / month | $200 / year | Unlimited Restaurant Profiles, Unlimited Menu Items | Premium QR Design Studio, full analytics, custom styles, priority support |

*A 7-day Free Trial is assigned automatically to new accounts, tracking custom database expiration logs and displaying trial statuses dynamically.*

---

## 🛠️ Project Structure & Setup

### 1. Root Platform (Merchant & Diners)

#### Install Dependencies
Navigate to the root folder:
```bash
npm install
```

#### Environment Variables (`.env`)
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### 2. Standalone Admin Portal (`/admin-portal`)

#### Install Dependencies
Navigate to the `admin-portal` folder:
```bash
cd admin-portal
npm install
```

#### Environment Variables (`admin-portal/.env`)
Create a `.env` file inside the `admin-portal/` directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
> [!IMPORTANT]
> The `SUPABASE_SERVICE_ROLE_KEY` is required on the server-side to allow administrators to fetch, create, update, and delete Supabase auth users without encountering database permission blocks (`403 Forbidden`). It is strictly kept on the server environment and never exposed to client bundles.

---

### 3. Setup Database Tables
Import the database structure in your Supabase SQL Editor using the [schema.sql](./schema.sql) file. It defines:
- Profiles, Restaurants, Categories, and Menu Items
- Ratings, Favorites, Loyalty Stamps, and Scan Logs
- Support Tickets and Subscriptions
- Row-Level Security (RLS) policies and indexes for optimized performance.

---

## 💻 Development & Build Scripts

### 1. Root Platform (Merchant & Diner)

#### Start Development Server
If you add or update routes and get caching glitches, run with the `--force` flag to rebuild Vite's module graph:
```bash
npm run dev -- --force
```

#### Build for Production
```bash
npm run build
```

---

### 2. Standalone Admin Portal

#### Start Development Server
```bash
npm run dev
```

#### Build for Production
```bash
npm run build
```

---

## 🔬 Core Architectural Decisions & Bug Fixes

### 1. In-Memory Javascript Joins
Supabase Auth tables (`auth.users`) are decoupled from the public schema profiles (`public.customer_profiles`). Because tables like `restaurants` or `subscriptions` do not share direct foreign key metadata relationships with `customer_profiles` (they both reference `auth.users(id)`), executing straight PostgREST relationship queries causes schema cache `400 Bad Request` errors.
- **Solution:** We fetch flat datasets concurrently via parallel `Promise.all` calls, and resolve data joining logic **in-memory via Javascript**. This bypasses PostgREST constraints seamlessly with near-instant client-side loading times.

### 2. Trial Expiration Logic
We resolved trials date discrepancies. The merchant portal checks active subscription entries. If an expired subscription or history exists, it cleanly maps trial days remaining to `0` instead of reverting to default trial parameters.

### 3. `isBasic` Variable Reference Fix
Fixed a front-end crash on the merchant dashboard where the dashboard logic evaluated `isBasic` without declaration. The context is now properly computed from the loader's subscription response payload, ensuring full system stability.

---

## 🔑 Authentication & Server-Side Security

To ensure page loads verify authentication immediately on server-side rendering (SSR) without relying on browser `localStorage` delays, Tarapeza uses a custom hybrid auth cookie exchange:

1.  **Browser Sign In:**
    - The client-side Supabase SDK performs login credentials check.
    - Upon success, the session access and refresh tokens are manually written to request-level cookies:
    ```javascript
    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`
    ```
2.  **Server Verification:**
    - Server-side loaders and actions read these cookies from headers in `app/lib/supabase/server.js`:
    ```javascript
    const accessToken = cookies['sb-access-token'];
    const refreshToken = cookies['sb-refresh-token'];
    ```
    - The server-side Supabase client establishes the authenticated session before rendering metadata or route actions.

3. **Admin Verification & RLS Bypass:**
    - The admin portal checks that the logged-in user has `customer_profiles.role === 'admin'`.
    - Secure actions are executed via server loaders/actions powered by `SUPABASE_SERVICE_ROLE_KEY` to perform user registry cleanup or configuration modifications safely.

---

## 🌐 Vercel Deployment Parameters

When deploying this project to Vercel, you should set up two separate Vercel projects (or a monorepo setup):

### Tarapeza Root Application
- **Root Directory:** `./`
- **Framework Preset:** Select **Remix** (Vercel automatically detects React Router v7 configs since it shares the Remix Vite serverless runtime).
- **Build Command:** `npm run build`
- **Output Directory:** `build/client`
- **Environment Variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Tarapeza Admin Portal Application
- **Root Directory:** `admin-portal`
- **Framework Preset:** Select **Vite** or **Remix** (Vercel automatically detects React Router / Vite build config).
- **Build Command:** `npm run build`
- **Output Directory:** `build/client`
- **Environment Variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
