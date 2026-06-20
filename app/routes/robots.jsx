export function loader() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /customer/dashboard/
Disallow: /onboarding/
Disallow: /auth/

Sitemap: https://tarapeza.com/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
