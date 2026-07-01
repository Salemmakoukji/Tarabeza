import { createClient } from "../lib/supabase/server";

export async function loader({ request }) {
  const supabase = await createClient(request);
  const baseUrl = "https://tarapeza.com";

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("slug, updated_at");

  const today = new Date().toISOString();

  const restaurantEntries = (restaurants || []).map((r) => {
    const lastmod = r.updated_at ? new Date(r.updated_at).toISOString() : today;
    return `
  <url>
    <loc>${baseUrl}/menu/${r.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join("");

  // Pages with bilingual (EN/AR) support
  const bilingualPages = [
    { loc: "", changefreq: "daily", priority: "1.0" },
    { loc: "/restaurants", changefreq: "daily", priority: "0.9" },
    { loc: "/about", changefreq: "monthly", priority: "0.7" },
    { loc: "/careers", changefreq: "monthly", priority: "0.7" },
    { loc: "/contact", changefreq: "monthly", priority: "0.7" },
    { loc: "/terms", changefreq: "monthly", priority: "0.5" },
    { loc: "/privacy", changefreq: "monthly", priority: "0.5" },
    { loc: "/login", changefreq: "monthly", priority: "0.5" },
    { loc: "/register", changefreq: "monthly", priority: "0.5" },
    { loc: "/reset-password", changefreq: "monthly", priority: "0.3" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  ];

  const staticEntries = bilingualPages.map((page) => {
    const enUrl = `${baseUrl}${page.loc}`;
    const arUrl = `${baseUrl}${page.loc}?lang=ar`;
    return `
  <url>
    <loc>${enUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}" />
  </url>`;
  }).join("");

  // Blog post entries with hreflang
  const { posts } = await import("../lib/blog-posts");
  const blogEntries = posts.map((post) => {
    const lastmod = new Date(post.date).toISOString();
    const enUrl = `${baseUrl}/blog/${post.slug}`;
    const arUrl = `${baseUrl}/blog/${post.slug}?lang=ar`;
    return `
  <url>
    <loc>${enUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}" />
  </url>`;
  }).join("");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticEntries}
${restaurantEntries}
${blogEntries}
</urlset>`;

  return new Response(xmlContent, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=18000",
    },
  });
}
