import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { supabase } from '../lib/supabase/client';
import { Save, Loader2, Lock, Megaphone, Settings } from 'lucide-react';
import { useToast, ToastContainer } from '../components/dashboard/toast';

export default function DashboardSettingsPage() {
  const navigate = useNavigate();
  const { profile: initialProfile } = useOutletContext();
  
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  
  // Settings States
  const [currency, setCurrency] = useState(initialProfile?.currency || 'USD');
  const [promoBannerActive, setPromoBannerActive] = useState(initialProfile?.promo_banner_active || false);
  const [promoBannerText, setPromoBannerText] = useState(initialProfile?.promo_banner_text || '');
  const [promoBannerTextAr, setPromoBannerTextAr] = useState(initialProfile?.promo_banner_text_ar || '');
  const [promoBannerColor, setPromoBannerColor] = useState(initialProfile?.promo_banner_color || 'accent');
  const [promoBannerScroll, setPromoBannerScroll] = useState(initialProfile?.promo_banner_scroll || false);

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Tab selection state
  const [activeTab, setActiveTab] = useState('general');

  const { toasts, addToast, removeToast } = useToast();

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = {
        currency,
        promo_banner_active: promoBannerActive,
        promo_banner_text: promoBannerText,
        promo_banner_text_ar: promoBannerTextAr,
        promo_banner_color: promoBannerColor,
        promo_banner_scroll: promoBannerScroll,
      };

      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => ({ ...prev, ...updates }));
      addToast('success', 'Settings saved successfully!');
      navigate(".", { replace: true });
    } catch (error) {
      addToast('error', `Error updating settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!password) {
      addToast('error', 'Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      addToast('error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      addToast('error', 'Passwords do not match.');
      return;
    }

    const confirmResult = window.confirm("Are you sure you want to change your password?");
    if (!confirmResult) return;

    setUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      addToast('success', 'Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      addToast('error', `Error updating password: ${error.message}`);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Restaurant Settings</h1>
        <p className="text-slate-400 text-sm">Configure your digital menu, brand look, and security details.</p>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800/80 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'general'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>General Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('promo')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'promo'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Promo Banner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Account Security</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <Settings className="h-5 w-5 text-orange-500" />
                <span>General Settings</span>
              </h2>

              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Business Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm h-[41px]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="SYP">SYP (SYP)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="AED">AED (AED)</option>
                  <option value="QAR">QAR (QAR)</option>
                  <option value="KWD">KWD (KWD)</option>
                  <option value="BHD">BHD (BHD)</option>
                  <option value="OMR">OMR (OMR)</option>
                  <option value="EGP">EGP (EGP)</option>
                  <option value="TRY">TRY (TRY)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
                <p className="mt-2 text-slate-400 text-xs">
                  This currency symbol will be displayed next to price items on your client-facing menu.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-slate-955 rounded-xl py-3 px-6 text-sm font-black shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving General Settings...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save General Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'promo' && (
          <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md animate-slide-up">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <Megaphone className="h-5 w-5 text-orange-500" />
                <span>Promotion & Announcement Banner</span>
              </h2>

              <div className="bg-[#0B0F19]/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                  <div>
                    <label className="text-xs font-bold text-white block">Enable Promotion Banner</label>
                    <span className="text-[10px] text-slate-400 block">Display a promotional announcement at the top of your public menu.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={promoBannerActive}
                      onChange={(e) => setPromoBannerActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 border border-slate-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {promoBannerActive ? (
                  <div className="space-y-6 animate-slide-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                          Promo Text (English)
                        </label>
                        <input
                          type="text"
                          value={promoBannerText}
                          onChange={(e) => setPromoBannerText(e.target.value)}
                          placeholder="e.g. 🎉 Happy Hour: Buy 1 Get 1 Free on all Mocktails from 4-6 PM!"
                          className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                          Promo Text (Arabic)
                        </label>
                        <input
                          type="text"
                          value={promoBannerTextAr}
                          onChange={(e) => setPromoBannerTextAr(e.target.value)}
                          placeholder="مثال: 🎉 عرض الساعة السعيدة: اشترِ واحداً واحصل على الآخر مجاناً!"
                          className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs text-right"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/40">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                          Banner Color Theme
                        </label>
                        <div className="relative">
                          <select
                            value={promoBannerColor}
                            onChange={(e) => setPromoBannerColor(e.target.value)}
                            className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs appearance-none"
                          >
                            <option value="accent" className="bg-[#111A2E]">Brand Accent Color (Adaptive)</option>
                            <option value="orange" className="bg-[#111A2E]">Sunset Orange</option>
                            <option value="green" className="bg-[#111A2E]">Emerald Green</option>
                            <option value="red" className="bg-[#111A2E]">Crimson Red</option>
                            <option value="indigo" className="bg-[#111A2E]">Neon Indigo</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-350 block">Scrolling Marquee Text</label>
                          <span className="text-[10px] text-slate-400 block">Animate the promo text to scroll horizontally.</span>
                        </div>
                        <label className="relative inline-flex inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={promoBannerScroll}
                            onChange={(e) => setPromoBannerScroll(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 border border-slate-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-650 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#0B0F19]/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs leading-relaxed">
                    Promotion banner is currently disabled. Toggle &quot;Enable Promotion Banner&quot; above to set live announcements.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl py-3 px-6 text-sm font-black shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Promo Banner...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Banner Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md max-w-xl">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800/80 mb-6">
              <Lock className="h-5 w-5 text-orange-500" />
              <span>Change Password</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl py-3 px-6 text-sm font-black shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
