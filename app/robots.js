export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/customer/dashboard/',
        '/onboarding/',
        '/auth/',
      ],
    },
    sitemap: 'https://tarapeza.com/sitemap.xml',
  };
}
