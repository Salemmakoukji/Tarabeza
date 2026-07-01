import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("login", "routes/login.jsx"),
  route("register", "routes/register.jsx"),
  route("reset-password", "routes/reset-password.jsx"),
  route("onboarding", "routes/onboarding.jsx"),
  
  // Public directory and menus
  route("restaurants", "routes/restaurants.jsx"),
  route("menu/:slug", "routes/menu-$slug.jsx"),
  
  // Customer portal
  route("customer/dashboard", "routes/customer-dashboard.jsx"),
  
  // Nested Dashboard Layout with its sub-routes
  route("dashboard", "routes/dashboard-layout.jsx", [
    index("routes/dashboard.jsx"),
    route("menu", "routes/dashboard-menu.jsx"),
    route("customize", "routes/dashboard-customize.jsx"),
    route("information", "routes/dashboard-information.jsx"),
    route("qr", "routes/dashboard-qr.jsx"),
    route("tables", "routes/dashboard-tables.jsx"),
    route("calls", "routes/dashboard-calls.jsx"),
    route("billing", "routes/dashboard-billing.jsx"),
    route("settings", "routes/dashboard-settings.jsx"),
  ]),
  
  route("auth/logout", "routes/logout.jsx"),
  route("auth/google", "routes/auth-google.jsx"),
  route("auth/callback", "routes/auth-callback.jsx"),
  route("api/auth/set-session", "routes/api-auth-set-session.jsx"),

  // Static marketing / legal pages
  route("about", "routes/about.jsx"),
  route("careers", "routes/careers.jsx"),
  route("contact", "routes/contact.jsx"),
  route("privacy", "routes/privacy.jsx"),
  route("terms", "routes/terms.jsx"),

  // SEO dynamic resource routes
  route("sitemap.xml", "routes/sitemap.jsx"),
  route("robots.txt", "routes/robots.jsx"),
];
