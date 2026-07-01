import { Link, useParams, useLoaderData, useSearchParams } from 'react-router';
import { Calendar, Clock, ArrowLeft, Globe } from 'lucide-react';
import Logo from '../components/logo';
import { posts, getPost, getRelatedPosts } from '../lib/blog-posts';

function renderContent(text) {
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '```') {
      if (inCodeBlock) {
        elements.push(<pre key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto text-sm text-slate-200">{codeLines.join('\n')}</pre>);
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.replace('## ', '')}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{line.replace('### ', '')}</h3>);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else if (/^\d+[.\u0660-\u0669]\s/.test(line) || /^\d+\.\s/.test(line)) {
      elements.push(<li key={i} className="text-slate-300 ml-5">{renderInline(line.replace(/^\d+[.\u0660-\u0669]?\s/, ''))}</li>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={i} className="text-slate-300 ml-5">{renderInline(line.replace('- ', ''))}</li>);
    } else {
      elements.push(<p key={i}>{renderInline(line)}</p>);
    }
  }
  return elements;
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export async function loader({ params }) {
  const post = getPost(params.slug);
  if (!post) {
    throw new Response(null, { status: 404, statusText: 'Not Found' });
  }
  const related = getRelatedPosts(params.slug);
  return { post, related };
}

export function meta({ data, location }) {
  if (!data?.post) return [{ title: 'Post Not Found' }];
  const lang = new URLSearchParams(location?.search).get('lang') || 'en';
  const post = data.post;
  return [
    { title: `${post.title[lang]} — Tarabeza Blog` },
    { name: "description", content: post.description[lang] },
  ];
}

export default function BlogPost() {
  const { post, related } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = searchParams.get('lang') || 'en';
  const isRtl = lang === 'ar';

  const toggleLang = () => {
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
              to={`/blog${lang === 'ar' ? '?lang=ar' : ''}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {lang === 'ar' ? 'المدونة' : 'Blog'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {Math.ceil(post.content.en.split(/\s+/).length / 200)} {lang === 'ar' ? 'دقائق قراءة' : 'min read'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {post.title[lang]}
            </h1>
            <div className="flex gap-2 mt-4 flex-wrap">
              {(post.tags[lang] || post.tags.en).map((tag) => (
                <span key={tag} className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-300 leading-relaxed space-y-4 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-slate-300 [&_code]:bg-slate-900 [&_code]:text-orange-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-900 [&_pre]:border [&_pre]:border-slate-800 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_hr]:border-slate-800">
            {renderContent(post.content[lang])}
          </div>

          <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">
              {lang === 'ar' ? 'مستعد لتحديث مطعمك؟' : 'Ready to modernize your restaurant?'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {lang === 'ar' ? 'جرّب طربيزة مجاناً لمدة ١٤ يوماً. بدون بطاقة ائتمان.' : 'Try Tarabeza free for 14 days. No credit card required.'}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl px-6 py-3 font-bold text-sm shadow-lg shadow-orange-500/10 transition-all"
            >
              {lang === 'ar' ? 'ابدأ التجربة المجانية' : 'Start Free Trial'}
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6">
                {lang === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((rp) => (
                  <Link
                    key={rp.slug}
                    to={`/blog/${rp.slug}${lang === 'ar' ? '?lang=ar' : ''}`}
                    className="block bg-slate-900/40 border border-slate-900 rounded-xl p-4 hover:border-slate-700 transition-all"
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      {new Date(rp.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h4 className="text-sm font-bold text-white hover:text-orange-400 transition-colors">{rp.title[lang]}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="border-t border-slate-900 py-8 px-6">
        <div className="max-w-3xl mx-auto text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Tarabeza. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}
