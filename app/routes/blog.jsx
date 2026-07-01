import { Link, useLoaderData } from 'react-router';
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import Logo from '../components/logo';
import { posts } from '../lib/blog-posts';
import { useState } from 'react';

export async function loader() {
  return { posts };
}

export function meta() {
  return [
    { title: "Tarabeza Blog — Restaurant Technology Guides & Tips" },
    { name: "description", content: "Learn about QR code menus, digital restaurant management, dine-in ordering, table management, and more. Expert guides for modern restaurant owners." },
  ];
}

export default function BlogIndex() {
  const { posts } = useLoaderData();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Simple header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center active:scale-95 transition-transform">
            <Logo className="h-9" />
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Tarabeza Blog
            </h1>
            <p className="text-slate-400 mt-3 text-sm sm:text-base">
              Guides, tips, and insights for modern restaurant owners. Learn how digital tools can transform your dining experience.
            </p>
          </div>

          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block bg-slate-900/40 border border-slate-900 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.ceil(post.content.split(/\s+/).length / 200)} min read
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-orange-400 transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Read More <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t border-slate-900 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Tarabeza. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
