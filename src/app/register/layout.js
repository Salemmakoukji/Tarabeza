export const metadata = {
  title: "Create Account - Merchant & Diner Registration | Tarapeza",
  description: "Register a merchant account to build interactive QR menus for your restaurant, or sign up as a customer diner to bookmark spots and collect loyalty stamps.",
  alternates: {
    canonical: "https://tarapeza.com/register",
  },
  openGraph: {
    title: "Create Your Account | Tarapeza",
    description: "Register a merchant account to build interactive QR menus for your restaurant, or sign up as a customer diner to bookmark spots and collect loyalty stamps.",
    url: "https://tarapeza.com/register",
    siteName: "Tarapeza",
    images: [
      {
        url: "/og-image.png",
        alt: "Tarapeza Registration Preview",
      },
    ],
  },
};

export default function RegisterLayout({ children }) {
  return children;
}
