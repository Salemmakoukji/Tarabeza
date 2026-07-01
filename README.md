# Tarapeza — Cloud Restaurant Management System & POS

Tarapeza is a full-stack SaaS platform that digitizes restaurants and cafes with interactive QR menus, table management, dine-in ordering, call waiter, and a real-time dashboard. Built with React Router v8 (Remix) and Supabase.

## Brand Design

- **Dark Slate `#0F1524`** — Backgrounds, panels, cards
- **Orange `#F97316`** — Primary accent, buttons, highlights
- **White `#FEFEFE`** — Text, contrast headers
- **Glassmorphism** — Frosted panels with backdrop blur

## Key Features

### Merchant Platform
1. **Digital Menu Builder** — Add/edit categories and items with images, pricing, tags. Instant sync.
2. **Table Management** — Create table groups, assign numbers/names, toggle availability, generate per-table QR codes.
3. **QR Code Studio** — Customize dot styles, eye colors, include logos. Export print-ready A4 PDFs.
4. **Dine-in Ordering** — Customers scan QR, build orders from their phone (cart, quantities, notes), submit to kitchen.
5. **Call Waiter** — Service / Bill / Help requests sent directly to staff in real time.
6. **Requests Dashboard** — Merged tabbed view of incoming orders + waiter calls with real-time subscriptions, toast notifications, and audio alerts.
7. **Real-time Dashboard** — Track orders and service calls live with status workflows (pending → confirmed → preparing → ready → delivered).
8. **Bilingual EN/AR** — Full RTL support with Cairo font, language toggle throughout.
9. **Customizable Styling** — Colors, layouts (Grid/List/Compact), currency symbol, Wi-Fi code display.
10. **Loyalty Stamps** — Digital coffee card wallet for returning diners.
11. **Favorites** — Diners can bookmark favorite items.
12. **Image Compression** — Auto-compresses logos and banners before upload.

### Marketing Site
13. **Bilingual Blog** — Static blog with 4+ EN/AR posts, markdown renderer, related articles, SEO metadata.
14. **Dynamic Sitemap** — Auto-generated `/sitemap.xml` with all pages including blog posts and `?lang=ar` variants.

## Subscription Plans

| Plan | Monthly | Annual (2 mo free) | Limits |
| :--- | :--- | :--- | :--- |
| Basic | $10/mo | $100/yr | 1 restaurant, 50 menu items, 10 tables |
| Pro | $20/mo | $200/yr | Unlimited restaurants, items, tables, full analytics, premium styles, priority support |

7-day free trial assigned on registration.

## Tech Stack

- **Framework:** React Router v8 (Remix), React 19
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (Postgres) with Row-Level Security
- **Auth:** Supabase Auth with custom cookie-based SSR session
- **Realtime:** Supabase Realtime subscriptions
- **QR:** `qrcode` + `jspdf` for generation and PDF export
- **Deployment:** Vercel (serverless)

## Project Structure

```
app/
  routes/           — Route modules (home, dashboard, menu, blog, etc.)
  components/       — Shared UI components (logo, user-avatar, dashboard sidebar)
  lib/              — Utilities (supabase clients, notification-sound, blog-posts)
  root.jsx          — App root with fonts, meta, layout
  routes.js         — Route config
schema.sql          — Full database schema (migration)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database

Run `schema.sql` in your Supabase SQL Editor. It creates all tables, RLS policies, indexes, and Realtime publications for:
- `restaurants`, `categories`, `menu_items`
- `restaurant_tables`, `waiter_calls`
- `orders`, `order_items`
- `ratings`, `favorites`, `stamp_cards`, `scan_logs`
- `support_tickets`, `subscriptions`

### 4. Development

```bash
npm run dev
```

### 5. Production build

```bash
npm run build
```

## Core Architecture

### Auth (SSR-first)
Auth session is written to cookies on the client after login, then read by server loaders for instant SSR auth. No `localStorage` delay on page load.

### Real-time Dashboard
Orders and Waiter Calls use Supabase Realtime subscriptions. The dashboard layout subscribes to both tables and computes a combined badge count. Each tab on `/dashboard/requests` has its own subscription for instant updates.

### Dine-in Ordering
The `?table=` query parameter activates ordering and call-waiter on the menu page. Cart state is client-side only; submission is a batch insert into `orders` + `order_items`.

### Blog
Static data file (`app/lib/blog-posts.js`). Each post has `en` and `ar` content keys. Routes toggle language via `?lang=ar`. Sitemap auto-picks up new posts via dynamic import.

### QR Codes
Per-table QR codes encode the menu URL with `?table=<id>`. The `?qr=true` param unlocks review-writing mode. Bulk PDF export generates all table QR codes on a single A4 sheet.

## Deployment (Vercel)

- **Root Directory:** `./`
- **Framework Preset:** Remix (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `build/client`
- **Env Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
