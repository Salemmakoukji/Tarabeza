import { Link } from 'react-router';
import Logo from '../components/logo';

export function meta() {
  return [
    { title: 'Page Not Found — Tarabeza' },
    { name: "description", content: "The page you're looking for doesn't exist." },
  ];
}

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 text-center">
      <Logo className="h-12 mb-8 opacity-50" />
      <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">404</h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 rounded-xl py-2.5 px-5 text-xs font-bold shadow-md hover:shadow-orange-500/10 active:scale-[0.98] transition-all"
        >
          Back to Home
        </Link>
        <Link
          to="/blog"
          className="border border-slate-800 hover:border-slate-700 rounded-xl py-2.5 px-5 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          Visit Blog
        </Link>
      </div>
    </div>
  );
}
