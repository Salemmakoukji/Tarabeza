import { Link, useParams, useLoaderData } from 'react-router';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
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
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={i} className="text-slate-300 ml-5">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>);
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

export function meta({ data }) {
  if (!data?.post) return [{ title: 'Post Not Found' }];
  return [
    { title: `${data.post.title} — Tarabeza Blog` },
    { name: "description", content: data.post.description },
  ];
}

export default function BlogPost() {
  const { post, related } = useLoaderData();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Simple header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center active:scale-95 transition-transform">
            <Logo className="h-9" />
          </Link>
          <Link
            to="/blog"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          {/* Meta */}
          <div className="mb-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {Math.ceil(post.content.split(/\s+/).length / 200)} min read
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {post.title}
            </h1>
            <div className="flex gap-2 mt-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-300 leading-relaxed space-y-4 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-slate-300 [&_p]:leading-relaxed [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-slate-300 [&_code]:bg-slate-900 [&_code]:text-orange-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-900 [&_pre]:border [&_pre]:border-slate-800 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_hr]:border-slate-800">
            {renderContent(post.content)}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Ready to modernize your restaurant?</h3>
            <p className="text-sm text-slate-400 mb-4">Try Tarabeza free for 14 days. No credit card required.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl px-6 py-3 font-bold text-sm shadow-lg shadow-orange-500/10 transition-all"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6">Related Articles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((rp) => (
                  <Link
                    key={rp.slug}
                    to={`/blog/${rp.slug}`}
                    className="block bg-slate-900/40 border border-slate-900 rounded-xl p-4 hover:border-slate-700 transition-all"
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      {new Date(rp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h4 className="text-sm font-bold text-white hover:text-orange-400 transition-colors">{rp.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="border-t border-slate-900 py-8 px-6">
        <div className="max-w-3xl mx-auto text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Tarabeza. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
