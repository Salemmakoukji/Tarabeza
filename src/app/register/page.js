'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LayoutGrid, Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/logo';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('merchant'); // 'merchant' | 'customer'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const metadata = {
        full_name: fullName,
        role: role,
      };

      if (role === 'merchant') {
        if (!restaurantName.trim()) {
          setErrorMsg('Restaurant name is required for owners.');
          setLoading(false);
          return;
        }
        metadata.restaurant_name = restaurantName;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      // If user is immediately logged in
      if (data?.session) {
        let checks = 0;
        while (!document.cookie.split(';').some(c => c.trim().startsWith('sb-') && c.includes('-auth-token')) && checks < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          checks++;
        }
        window.location.href = role === 'customer' ? '/customer/dashboard' : '/onboarding';
      } else {
        setSuccess(true);
      }
    } catch (error) {
      setErrorMsg(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isDiner = role === 'customer';
  const accentBorderClass = isDiner ? 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'focus:border-orange-500 focus:ring-1 focus:ring-orange-500';
  const accentButtonClass = isDiner 
    ? 'from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/10 hover:shadow-indigo-500/20' 
    : 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/10 hover:shadow-orange-500/20';
  const linkColorClass = isDiner ? 'text-indigo-400 hover:text-indigo-300' : 'text-orange-400 hover:text-orange-300';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animate-duration-10"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animate-duration-10" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo variant="white" className="mb-3" />
          <p className="text-slate-400 text-sm mt-1">Sleek QR Menus for Modern Dining</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {success ? (
            <div className="text-center py-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                We&apos;ve sent a verification link to <strong className="text-white">{email}</strong>. Please click the link to confirm your account and configure your menu.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors"
              >
                <span>Back to Sign In</span>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-6">Create your account</h2>

              {/* Diner vs Owner switch tabs */}
              <div className="flex bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 gap-1.5 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isDiner
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Diner (Customer)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('merchant')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isDiner
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Restaurant Owner
                </button>
              </div>

              {errorMsg && (
                <div className="mb-6 bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-start space-x-3 text-red-200 text-sm">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm ${accentBorderClass}`}
                  />
                </div>

                {!isDiner && (
                  <div>
                    <label htmlFor="restaurant" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Restaurant Name
                    </label>
                    <input
                      id="restaurant"
                      type="text"
                      required={!isDiner}
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="La Trattoria"
                      className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm ${accentBorderClass}`}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm ${accentBorderClass}`}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm ${accentBorderClass}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r ${accentButtonClass} text-white rounded-xl py-3 px-4 text-sm font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none mt-2`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Started</span>
                      <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className={`${linkColorClass} font-semibold transition-colors`}>
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
