import { useState, Suspense } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { supabase } from '../lib/supabase/client';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/logo';

function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(searchParams.get('error') || '');
  const [successMsg, setSuccessMsg] = useState(searchParams.get('message') || '');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`;
      }

      const role = data?.user?.user_metadata?.role || 'merchant';
      if (role === 'customer') {
        window.location.replace('/customer/dashboard');
      } else {
        window.location.replace('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#0F1524] via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden text-white">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F97316]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo variant="white" className="mb-3" />
          <p className="text-slate-400 text-sm mt-1">Sleek QR Menus for Modern Dining</p>
        </div>

        <div className="bg-[#0F1524]/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-xl font-bold text-white mb-6">Welcome back</h2>

          {errorMsg && (
            <div className="mb-6 bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-start space-x-3 text-red-200 text-sm">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-4 flex items-start space-x-3 text-emerald-200 text-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 mt-2" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign In */}
          <a
            href="/auth/google"
            className="w-full bg-[#111A2E] hover:bg-[#162035] text-white rounded-xl py-3 px-4 text-sm font-bold border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 mb-6 shadow-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </a>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <span className="relative px-3 bg-[#0c1322] text-xs text-slate-500 uppercase tracking-widest font-semibold">
              or
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com"
                className="w-full bg-[#0f172a]/50 border border-slate-805 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <Link to="/reset-password" className="text-xs text-[#F97316] hover:text-orange-400 transition-colors font-semibold">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f172a]/50 border border-slate-805 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#F97316] hover:to-amber-600 text-white rounded-xl py-3 px-4 text-sm font-bold shadow-lg shadow-[#F97316]/10 hover:shadow-[#F97316]/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a href="/register" className="text-[#F97316] hover:text-orange-400 font-semibold transition-colors">
              Create one for free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1524] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
