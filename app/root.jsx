import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

export function meta() {
  return [
    { title: "Tarapeza - Interactive Digital QR Menus for Restaurants" },
    { name: "description", content: "Modernize your dining experience with custom color QR code menus. Fast loading, optimized images, multilingual layouts, and real-time dashboard updates." },
    { property: "og:title", content: "Tarapeza - Interactive Digital QR Menus for Restaurants" },
    { property: "og:description", content: "Modernize your dining experience with custom color QR code menus. Fast loading, optimized images, multilingual layouts, and real-time dashboard updates." },
    { property: "og:url", content: "https://tarapeza.com" },
    { property: "og:site_name", content: "Tarapeza" },
    { property: "og:image", content: "/og-image.png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Tarapeza QR Menu Preview" },
    { property: "og:locale", content: "en_US" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Tarapeza - Interactive Digital QR Menus for Restaurants" },
    { name: "twitter:description", content: "Modernize your dining experience with custom color QR code menus. Fast loading, optimized images, multilingual layouts, and real-time dashboard updates." },
    { name: "twitter:image", content: "/og-image.png" },
  ];
}

export function links() {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&family=Inter:wght@100..900&family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
    },
    { rel: "icon", type: "image/png", href: "/Simple Logo - Orange.png" },
    { rel: "shortcut icon", type: "image/png", href: "/Simple Logo - Orange.png" },
    { rel: "apple-touch-icon", type: "image/png", href: "/Simple Logo - Orange.png" },
  ];
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

