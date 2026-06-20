export const metadata = {
  title: "Merchant & Diner Sign In | Tarapeza",
  description: "Sign in to your Tarapeza merchant dashboard to manage categories and item details, or sign in as a diner to check favorites and loyalty stamp rewards.",
  alternates: {
    canonical: "https://tarapeza.com/login",
  },
  openGraph: {
    title: "Sign In to Your Account | Tarapeza",
    description: "Sign in to your Tarapeza merchant dashboard to manage categories and item details, or sign in as a diner to check favorites and loyalty stamp rewards.",
    url: "https://tarapeza.com/login",
    siteName: "Tarapeza",
    images: [
      {
        url: "/og-image.png",
        alt: "Tarapeza Login Preview",
      },
    ],
  },
};

export default function LoginLayout({ children }) {
  return children;
}
