import { Link, useLoaderData, useSearchParams } from 'react-router';
import { Calendar, Clock, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import Logo from '../components/logo';
import { posts } from '../lib/blog-posts';
import { getStoredLang, setStoredLang } from '../lib/language';

export async function loader() {
  return { posts };
}

export function meta({ data, params, location }) {
  const lang = new URLSearchParams(location?.search).get('lang') || 'en';
  const baseUrl = "https://tarapeza.com";
  if (lang === 'ar') {
    return [
      { title: "مدونة طربيزة — أدلة ونصائح تكنولوجيا المطاعم" },
      { name: "description", content: "تعرف على قوائم QR وإدارة المطاعم الرقمية والطلب من الطاولة وإدارة الطاولات. أدلة ونصائح خبراء لأصحاب المطاعم العصرية." },
      { name: "keywords", content: "مدونة مطاعم, قوائم QR, إدارة مطاعم رقمية, تكنولوجيا المطاعم, نصائح مطاعم, طلب من الطاولة, إدارة الطاولات" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${baseUrl}/blog?lang=ar` },
      { property: "og:title", content: "مدونة طربيزة — أدلة ونصائح تكنولوجيا المطاعم" },
      { property: "og:description", content: "تعرف على قوائم QR وإدارة المطاعم الرقمية والطلب من الطاولة وإدارة الطاولات. أدلة ونصائح خبراء لأصحاب المطاعم العصرية." },
      { property: "og:image", content: `${baseUrl}/og-image.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: `${baseUrl}/blog?lang=ar` },
      { name: "twitter:title", content: "مدونة طربيزة — أدلة ونصائح تكنولوجيا المطاعم" },
      { name: "twitter:description", content: "تعرف على قوائم QR وإدارة المطاعم الرقمية والطلب من الطاولة وإدارة الطاولات. أدلة ونصائح خبراء لأصحاب المطاعم العصرية." },
      { name: "twitter:image", content: `${baseUrl}/og-image.png` },
    ];
  }
  return [
    { title: "Tarabeza Blog — Restaurant Technology Guides & Tips" },
    { name: "description", content: "Learn about QR code menus, digital restaurant management, dine-in ordering, table management, and more. Expert guides for modern restaurant owners." },
    { name: "keywords", content: "restaurant blog, QR code menus, digital restaurant management, restaurant technology, hospitality guides, dine-in ordering, table management" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${baseUrl}/blog` },
    { property: "og:title", content: "Tarabeza Blog — Restaurant Technology Guides & Tips" },
    { property: "og:description", content: "Learn about QR code menus, digital restaurant management, dine-in ordering, table management, and more. Expert guides for modern restaurant owners." },
    { property: "og:image", content: `${baseUrl}/og-image.png` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: `${baseUrl}/blog` },
    { name: "twitter:title", content: "Tarabeza Blog — Restaurant Technology Guides & Tips" },
    { name: "twitter:description", content: "Learn about QR code menus, digital restaurant management, dine-in ordering, table management, and more. Expert guides for modern restaurant owners." },
    { name: "twitter:image", content: `${baseUrl}/og-image.png` },
  ];
}

export default function BlogIndex() {
  const { posts } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = searchParams.get('lang') || getStoredLang('en');
  const isRtl = lang === 'ar';

  const toggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    setStoredLang(next);
    if (lang === 'ar') {
      setSearchParams({});
    } else {
      setSearchParams({ lang: 'ar' });
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (lang === 'ar') {
      return d.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center active:scale-95 transition-transform">
            <Logo className="h-9" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-orange-500 bg-slate-900 text-xs font-semibold text-slate-300 transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>
            <Link
              to="/"
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-12" style={{ textAlign: isRtl ? 'right' : 'left' }}>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              {lang === 'ar' ? 'مدونة طربيزة' : 'Tarabeza Blog'}
            </h1>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              {lang === 'ar'
                ? 'أدلة ونصائح وإرشادات لأصحاب المطاعم العصريين. تعرف على كيفية تحويل مطعمك رقمياً.'
                : 'Guides, tips, and insights for modern restaurant owners. Learn how digital tools can transform your dining experience.'}
            </p>
          </div>

          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}${lang === 'ar' ? '?lang=ar' : ''}`}
                className="block bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.ceil(post.content.en.split(/\s+/).length / 200)} {lang === 'ar' ? 'دقائق قراءة' : 'min read'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-orange-400 transition-colors mb-2">
                  {post.title[lang]}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {post.description[lang]}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(post.tags[lang] || post.tags.en).map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    {lang === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                    {isRtl ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Tarabeza. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}
