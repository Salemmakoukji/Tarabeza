import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/supabase/client';
import { Loader2, AlertCircle, CheckCircle, ArrowRight, ShieldAlert, Key } from 'lucide-react';
import Logo from '../components/logo';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  
  // Auth state
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Check if there is an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handler for sending reset link (Forgot Password view)
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      setSuccessMsg(
        window.navigator.language.startsWith('ar') || true // Default to Arabic as requested by user
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.'
          : 'Password reset link has been successfully sent to your email.'
      );
      setEmail('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for updating password (Reset flow view)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg(
        window.navigator.language.startsWith('ar') || true
          ? 'كلمات المرور غير متطابقة.'
          : 'Passwords do not match.'
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg(
        window.navigator.language.startsWith('ar') || true
          ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.'
          : 'Password must be at least 6 characters long.'
      );
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccessMsg(
        window.navigator.language.startsWith('ar') || true
          ? 'تم تحديث كلمة المرور الخاصة بك بنجاح! يتم الآن إعادة توجيهك...'
          : 'Your password has been updated successfully! Redirecting...'
      );

      // Write cookie session
      if (session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; SameSite=Lax; Secure`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=86400; SameSite=Lax; Secure`;
      }

      setTimeout(() => {
        const role = session?.user?.user_metadata?.role || 'merchant';
        if (role === 'customer') {
          window.location.replace('/customer/dashboard');
        } else {
          window.location.replace('/dashboard');
        }
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1524] text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  const isResetFlow = !!session; // If we have a session, we are in the password reset flow

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#0F1524] via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden text-white font-sans" dir="rtl">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F97316]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md animate-slide-up z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo variant="white" className="mb-3" />
          <p className="text-slate-400 text-sm mt-1">طربيزة - قوائم الطعام الرقمية الذكية</p>
        </div>

        <div className="bg-[#0F1524]/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-500 shrink-0" />
            <span>{isResetFlow ? 'تغيير كلمة المرور' : 'إستعادة كلمة المرور'}</span>
          </h2>
          <p className="text-slate-400 text-xs leading-normal mb-6">
            {isResetFlow 
              ? 'الرجاء إدخال كلمة المرور الجديدة وتأكيدها لحماية حسابك.' 
              : 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'}
          </p>

          {errorMsg && (
            <div className="mb-6 bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-start gap-3 text-red-200 text-xs leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-4 flex items-start gap-3 text-emerald-200 text-xs leading-relaxed">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isResetFlow ? (
            /* Reset password form */
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all text-sm text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all text-sm text-left font-mono"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#F97316] hover:to-amber-600 text-white rounded-xl py-3 px-4 text-sm font-bold shadow-lg shadow-[#F97316]/10 hover:shadow-[#F97316]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <span>تحديث كلمة المرور</span>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Request link form */
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all text-sm text-left font-sans"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#F97316] hover:to-amber-600 text-white rounded-xl py-3 px-4 text-sm font-bold shadow-lg shadow-[#F97316]/10 hover:shadow-[#F97316]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <span>إرسال رابط إعادة التعيين</span>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-500">
            {isResetFlow ? (
              <button
                onClick={() => supabase.auth.signOut().then(() => setSession(null))}
                className="text-[#F97316] hover:text-orange-400 font-semibold transition-colors bg-transparent border-0 cursor-pointer"
              >
                العودة لطلب رابط جديد
              </button>
            ) : (
              <>
                تذكرت كلمة المرور؟{' '}
                <a href="/login" className="text-[#F97316] hover:text-orange-400 font-semibold transition-colors">
                  تسجيل الدخول
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
