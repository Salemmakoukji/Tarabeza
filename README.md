# 🍽️ Tarapeza - Sleek Digital QR Menus for Restaurants

Tarapeza is a high-performance, premium Software-as-a-Service (SaaS) application designed to modernize the dining experience. It provides interactive, fast-loading, multilingual digital QR menus for restaurants and diners.

This project is built as a pure JavaScript **React Router v7 / Remix** full-stack web application designed for fast compilation, seamless deployment, and responsive interactions.

---

## 🎨 Brand Design & Aesthetic System

Tarapeza is styled around a harmonious, state-of-the-art color scheme:
*   **Brand Dark Slate (`#0F1524`):** Base background colors, panels, cards, and auth sections.
*   **Brand Orange (`#F97316`):** Primary theme color used for buttons, interactive hover items, icons, and visual highlights.
*   **Brand White (`#FEFEFE`):** Clean text styling, premium contrast headers, and subtle secondary panels.
*   **Glassmorphism Effects:** Frosted panels (`glass-panel`) with dynamic backdrop filters.

---

## 🚀 Key Features

1.  **Dynamic SEO & Sitemaps:** Full Google-friendly indexing via `/sitemap.xml` and `/robots.txt` resource endpoints.
2.  **QR Code Design Studio:** Customize dot styles, eye configurations, color highlights, and include brand logos directly. Export high-resolution printable table cards in A4 PDF formats (`jspdf` + `qrcode`).
3.  **Bilingual English & Arabic Layouts:** Comprehensive RTL (Right-to-Left) formatting utilizing the Cairo font automatically.
4.  **Diner Coffee Card Wallet:** Digital loyalty stamp tracker (coffee slots) and saved favorites bookmarks for customers.
5.  **Merchant Settings Control Center:** Configure colors, layouts (Grid, List, Compact), currency symbols, and Wi-Fi codes.
6.  **Fast Loading Media Builder:** Automatically compresses restaurant logos and cover banners in the browser before uploading to storage.

---

## 🛠️ Installation & Setup

### 1. Clone & Install Dependencies
Navigate to the project root and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Setup Database Tables
Import the database structure in your Supabase SQL Editor using the [schema.sql](./schema.sql) file. It defines:
- Profiles, Restaurants, Categories, and Menu Items
- Ratings, Favorites, Loyalty Stamps, and Scan Logs
- Support Tickets and Subscriptions
- Row-Level Security (RLS) policies and indexes for optimized performance.

---

## 💻 Development & Build Scripts

### Start Development Server
If you add or update routes and get caching glitches, run with the `--force` flag to rebuild Vite's module graph:
```bash
npm run dev -- --force
```

### Build for Production
```bash
npm run build
```

---

## 🔑 Authentication Architecture (Supabase Cookies Sync)

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

---

## 🌐 Vercel Deployment Parameters

When importing this project into Vercel, use the following parameters:
- **Framework Preset:** Select **Remix** (Vercel automatically detects React Router v7 configs since it shares the Remix Vite serverless runtime).
- **Build Command:** `npm run build`
- **Output Directory:** `build/client`
- **Environment Variables:** Provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.
