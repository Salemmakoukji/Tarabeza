import RestaurantsDirectory from './restaurants-client';

export const metadata = {
  title: "Explore Restaurant & Cafe Menus | Tarapeza Directory",
  description: "Browse the digital menu directory of cafes and restaurants on Tarapeza. Scan QR codes, explore dining spotlights, view dishes, read ratings, and save favorites.",
  alternates: {
    canonical: "https://tarapeza.com/restaurants",
    languages: {
      'en-US': "https://tarapeza.com/restaurants?lang=en",
      'ar-SA': "https://tarapeza.com/restaurants?lang=ar",
    },
  },
  openGraph: {
    title: "Explore Restaurant & Cafe Menus | Tarapeza Directory",
    description: "Browse the digital menu directory of cafes and restaurants on Tarapeza. Scan QR codes, explore dining spotlights, view dishes, read ratings, and save favorites.",
    url: "https://tarapeza.com/restaurants",
    siteName: "Tarapeza",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tarapeza Restaurants Directory Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Restaurant & Cafe Menus | Tarapeza Directory",
    description: "Browse the digital menu directory of cafes and restaurants on Tarapeza.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <RestaurantsDirectory />;
}
