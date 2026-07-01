import { createClient } from "../lib/supabase/server";

export async function loader({ request }) {
  const supabase = await createClient(request);
  const baseUrl = "https://tarapeza.com";

  // Fetch all restaurants to generate dynamic menu paths
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("slug, updated_at");

  const restaurantEntries = (restaurants || []).map((r) => `
  <url>
    <loc>${baseUrl}/menu/${r.slug}</loc>
    <lastmod>${r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("");

  const staticUrls = [
    { loc: "", changefreq: "daily", priority: "1.0" },
    { loc: "/restaurants", changefreq: "daily", priority: "0.9" },
    { loc: "/about", changefreq: "monthly", priority: "0.7" },
    { loc: "/careers", changefreq: "monthly", priority: "0.7" },
    { loc: "/contact", changefreq: "monthly", priority: "0.7" },
    { loc: "/terms", changefreq: "monthly", priority: "0.5" },
    { loc: "/privacy", changefreq: "monthly", priority: "0.5" },
    { loc: "/login", changefreq: "monthly", priority: "0.5" },
    { loc: "/register", changefreq: "monthly", priority: "0.5" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
  ];

  const staticEntries = staticUrls.map((entry) => `
  <url>
    <loc>${baseUrl}${entry.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("");

  // Blog post entries (dynamic from blog-posts data)
  const { posts } = await import("../lib/blog-posts");
  const blogEntries = posts.map((post) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
