import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useRouteError, Link } from "react-router";
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
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    { rel: "shortcut icon", href: "/favicon.ico" },
    { rel: "apple-touch-icon", href: "/Logo - Orange - Square.png" },
  ];
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{is404 ? 'Page Not Found — Tarabeza' : 'Something Went Wrong — Tarabeza'}</title>
        <Meta />
        <Links />
      </head>
      <body className="antialiased bg-slate-950 text-white min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">{is404 ? '404' : '!'}</div>
          <h1 className="text-2xl font-black text-white mb-3">
            {is404 ? 'Page Not Found' : 'An unexpected error occurred'}
          </h1>
          <p className="text-sm text-slate-400 mb-8">
            {is404
              ? 'The page you are looking for does not exist or has been moved.'
              : 'Something went wrong. Please try again or contact support.'}
          </p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 rounded-xl py-2.5 px-5 text-xs font-bold shadow-md hover:shadow-orange-500/10 active:scale-[0.98] transition-all"
          >
            Back to Home
          </Link>
        </div>
        <Scripts />
      </body>
    </html>
  );
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

