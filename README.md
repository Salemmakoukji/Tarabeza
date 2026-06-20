# 🍽️ LesMenu — Sleek QR Menus for Modern Dining

LesMenu is a modern, bilingual (English & Arabic), full-stack QR Menu SaaS platform designed for restaurants to create interactive digital storefronts, manage categories and items in real time, customize print-ready QR code flyers, and process premium subscriptions.

Built with **Next.js 16 (Turbopack)**, **React 19**, and powered by **Supabase (Auth, Database, Storage)** & **Paddle Billing**.

---

## ✨ Key Features

*   **🌐 Bilingual Landing Page**: Fully responsive landing page supporting instant English (LTR) and Arabic (RTL) localization switches with premium CSS-based device mockups.
*   **📊 Dynamic Business Dashboard**: Tracks business analytics (total categories, total menu items) and provides instant QR code generation and quick-sharing links.
*   **🖐️ Real-time Drag & Drop Menu Builder**: Easily create, edit, or delete categories and menu items. Reorder your menu items and categories instantly with native HTML5 drag-and-drop actions that sync with the database in real time.
*   **⚡ Client-Side Image Compression**: Automatically resizes and compresses uploaded logos (max 500px) and item photos (max 800px) client-side using `browser-image-compression` to under `300KB` before uploading to Supabase Storage, maximizing menu load speeds for restaurant guests.
*   **🖨️ Custom PDF & PNG QR Code Flyers**: Generate and customize your menu's QR code (foreground/background color picker). Download a high-res PNG or print a beautiful, centered A4 table flyer PDF containing custom table number instructions.
*   **📱 Premium Customer Menu View**: Mobile-first public menu rendering matching the restaurant's accent theme color. Includes live text searching, category scrolling tabs, item availability indicators, and interactive dietary filters (Gluten, Nuts, Dairy, Vegan, etc.).
*   **💳 Subscription Blockers & Paddle Billing**: Enforces subscription-based access:
    *   **14-Day Free Trial** automatically granted upon restaurant creation.
    *   **Dashboard Blocking Screen** blocks access (excluding Settings/Billing) once a trial or paid plan expires.
    *   **Paddle Checkout integration** utilizing dynamic Paddle v2 SDK overlays, with an elegant Mock checkout fallback for sandbox validation.
*   **🔔 Floating Stackable Toasts**: Stackable and animated success/error notification banners for all database, auth, and image uploading actions.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 16.2.9 (App Router / Turbopack), React 19, Tailwind CSS, Lucide Icons.
*   **Backend**: Supabase SSR (Authentication, PostgREST Database, Storage Buckets).
*   **Payment**: Paddle Billing SDK (Paddle.js v2).
*   **Core Libraries**: `qrcode` (QR Generation), `jspdf` (A4 PDF compilation), `browser-image-compression` (client-side image resizing).

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/lesmenu.git
cd lesmenu
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and populate it with your Supabase and Paddle credentials:
```env
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key

# Paddle configuration (Sandbox or Production)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=sb_publishable_e_...
NEXT_PUBLIC_PADDLE_BASIC_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_PREMIUM_PRICE_ID=pri_...
```

### 4. Database Schema Setup
Log in to your **Supabase Dashboard**, open the **SQL Editor**, and execute the commands inside [schema.sql](file:///c:/Users/ASUS/Desktop/LesMenu/schema.sql) to set up the tables, triggers, and RLS (Row Level Security) policies.

*Make sure to configure the public storage buckets inside Supabase:*
1.  **`logos`**: Set to public read access. Used for logo and cover photo uploads.
2.  **`menu-images`**: Set to public read access. Used for menu item photos.

### 5. Running Locally
Run the Turbopack development server:
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) (or the custom port shown in your terminal) to view the application.

### 6. Production Build
Verify compilation and run the production server:
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
/src
  /app
    /login/page.js              # Auth Login form
    /register/page.js           # Restaurant Owner SignUp
    /onboarding/page.js         # Initial brand setup wizard
    /auth/callback/route.js     # Auth exchange route
    /dashboard
      /layout.js                # Server layout & Subscription gating guard
      /layout-client.js         # Main UI sidebar/navbar shell
      /page.js                  # Analytics overview & quick links
      /menu/page.js             # Drag & Drop Menu builder
      /qr/page.js               # QR flyer PDF & PNG generator
      /settings/page.js         # Settings & Cover/Logo uploads
    /menu
      /[slug]/page.js           # Server dynamic route loader
      /[slug]/menu-client.js    # Bilingual customer menu layout (LTR/RTL)
    /page.js                    # SaaS landing page (English/Arabic copy)
  /components
    /dashboard                  # Dashboard sub-panels (Billing Blocker, etc.)
  /lib
    /supabase.js                # Supabase browser client
    /supabase-server.js         # Supabase Server-Side cookies client
    /supabase-middleware.js     # Auth session gatekeeper
```

---

## 🔒 Security & Row Level Security (RLS)

All database tables (`restaurants`, `categories`, `menu_items`, `subscriptions`) have **Row Level Security (RLS)** enabled:
*   **Anonymous Access**: Customers have read-only access (`SELECT`) to restaurants, categories, and menu items to view the public menu `/menu/[slug]`.
*   **Owner-Only Modification**: All writes (`INSERT`, `UPDATE`, `DELETE`) are strictly gated and verified to ensure users can only modify details for restaurants they own (`auth.uid() = owner_id`).

---

## 📄 License
This project is licensed under the MIT License.
