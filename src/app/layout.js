import { Cairo } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Tarapeza - Interactive Digital QR Menus for Restaurants",
  description: "Modernize your dining experience with custom color QR code menus. Fast loading, optimized images, multilingual layouts, and real-time dashboard updates.",
  metadataBase: new URL("https://tarapeza.com"),
  icons: {
    icon: "/Simple Logo - Orange.png",
    shortcut: "/Simple Logo - Orange.png",
    apple: "/Simple Logo - Orange.png",
  },
  openGraph: {
    title: "Tarapeza - Interactive Digital QR Menus for Restaurants",
    description: "Modernize your dining experience with custom color QR code menus. Fast loading, optimized images, multilingual layouts, and real-time dashboard updates.",
    url: "https://tarapeza.com",
    siteName: "Tarapeza",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tarapeza QR Menu Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarapeza - Interactive Digital QR Menus for Restaurants",
    description: "Modernize your dining experience with custom color QR code menus. Fast loading, optimized images, multilingual layouts, and real-time dashboard updates.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
