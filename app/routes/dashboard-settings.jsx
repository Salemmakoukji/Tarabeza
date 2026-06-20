import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { supabase } from '../lib/supabase/client';
import {
  Save,
  Loader2,
  Link as LinkIcon,
  Palette,
  Building,
  Phone,
  MapPin,
  Image as ImageIcon,
  Lock,
  CheckCircle2,
  XCircle,
  X,
  Megaphone,
  Wifi
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function DashboardSettingsPage() {
  const navigate = useNavigate();
  const { profile: initialProfile } = useOutletContext();
  
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [restaurantName, setRestaurantName] = useState(initialProfile?.name || '');
  const [slug, setSlug] = useState(initialProfile?.slug || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [address, setAddress] = useState(initialProfile?.address || '');
  const [themeColor, setThemeColor] = useState(initialProfile?.theme_color || '#f97316');
  const [logoUrl, setLogoUrl] = useState(initialProfile?.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(initialProfile?.cover_url || '');
  const [description, setDescription] = useState(initialProfile?.description || '');
  const [currency, setCurrency] = useState(initialProfile?.currency || 'USD');
  const [promoBannerActive, setPromoBannerActive] = useState(initialProfile?.promo_banner_active || false);
  const [promoBannerText, setPromoBannerText] = useState(initialProfile?.promo_banner_text || '');
  const [promoBannerTextAr, setPromoBannerTextAr] = useState(initialProfile?.promo_banner_text_ar || '');
  const [promoBannerColor, setPromoBannerColor] = useState(initialProfile?.promo_banner_color || 'accent');
  const [promoBannerScroll, setPromoBannerScroll] = useState(initialProfile?.promo_banner_scroll || false);
  
  // Wi-Fi fields
  const [wifiSsid, setWifiSsid] = useState(initialProfile?.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(initialProfile?.wifi_password || '');
  const [wifiEncryption, setWifiEncryption] = useState(initialProfile?.wifi_encryption || 'WPA');
  const [savingWifi, setSavingWifi] = useState(false);

  // Upload fields
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Origin state for live preview links
  const [origin, setOrigin] = useState('');

  // Tab selection state
  const [activeTab, setActiveTab] = useState('general');

  // Stackable toasts
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, text) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);

    try {
      // 1. Compress Image client-side before uploading (max size 300KB, max dim 500px)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Supabase Storage - 'logos' bucket
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      addToast('success', 'Logo uploaded and compressed successfully!');
    } catch (error) {
      addToast('error', `Logo upload failed: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    try {
      // 1. Compress Image client-side before uploading (max size 300KB, max dim 800px)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Supabase Storage - 'logos' bucket under 'covers/' path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setCoverUrl(publicUrl);
      addToast('success', 'Cover photo uploaded and compressed successfully!');
    } catch (error) {
      addToast('error', `Cover photo upload failed: ${error.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Slug validation: letters, numbers, hyphens only
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      addToast('error', 'Slug can only contain lowercase letters, numbers, and hyphens.');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = {
        id: profile.id,
        owner_id: user.id,
        name: restaurantName,
        slug: slug.toLowerCase(),
        phone: phone,
        address,
        theme_color: themeColor,
        logo_url: logoUrl,
        cover_url: coverUrl,
        description,
        currency,

        promo_banner_active: promoBannerActive,
        promo_banner_text: promoBannerText,
        promo_banner_text_ar: promoBannerTextAr,
        promo_banner_color: promoBannerColor,
        promo_banner_scroll: promoBannerScroll,
      };

      const { error } = await supabase.from('restaurants').upsert(updates);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => ({ ...prev, ...updates }));
      addToast('success', 'Restaurant settings saved successfully!');
      navigate(".", { replace: true });
    } catch (error) {
      addToast('error', `Error updating settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWifi = async (e) => {
    e.preventDefault();
    setSavingWifi(true);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          wifi_ssid: wifiSsid,
          wifi_password: wifiPassword,
          wifi_encryption: wifiEncryption,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => ({
        ...prev,
        wifi_ssid: wifiSsid,
        wifi_password: wifiPassword,
        wifi_encryption: wifiEncryption,
      }));
      addToast('success', 'Wi-Fi settings saved successfully!');
    } catch (error) {
      addToast('error', `Error saving Wi-Fi settings: ${error.message}`);
    } finally {
      setSavingWifi(false);
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
          <Building className="h-4 w-4" />
          <span>General Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'border-orange-500 text-orange-400 bg-orange-500/5'
              : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Branding & Media</span>
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
          <Wifi className="h-4 w-4" />
          <span>Wi-Fi & Security</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <Building className="h-5 w-5 text-orange-500" />
                <span>Business Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Menu URL Slug
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-500 text-xs select-none">
                      /menu/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl pl-16 pr-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>
                  {origin && slug && (
                    <p className="mt-1.5 text-slate-400 text-[11px] flex items-center space-x-1">
                      <LinkIcon className="h-3 w-3 text-orange-500" />
                      <span>Your menu is live at: </span>
                      <a
                        href={`${origin}/menu/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:underline font-semibold hover:text-orange-300"
                      >
                        {origin.replace(/^https?:\/\//, '')}/menu/{slug}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center space-x-3 bg-[#0B0F19] border border-slate-800/80 rounded-xl px-3 py-1.5 h-[41px]">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-7 w-12 border border-slate-800/80 rounded cursor-pointer bg-[#0F1524]"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {themeColor.toUpperCase()}
                    </span>
                    <div
                      className="h-4 w-4 rounded-full border border-slate-700 shadow-inner ml-auto"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Business Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm h-[41px] appearance-none"
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
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Culinary Road, Food District"
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm mb-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Restaurant Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your restaurant's story, cuisine details, or vibes..."
                  className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm resize-none"
                />
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
                      <span>Saving General Info...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save General Info</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md animate-slide-up">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800/80">
                <ImageIcon className="h-5 w-5 text-orange-500" />
                <span>Branding Assets</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Card */}
                <div className="bg-[#0B0F19]/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-slate-350 self-start mb-6 pb-2 border-b border-slate-800/40 w-full flex items-center space-x-2">
                    <Building className="h-4 w-4 text-orange-500" />
                    <span>Restaurant Logo</span>
                  </h3>

                  <div className="relative group flex items-center justify-center">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="h-32 w-32 rounded-2xl object-cover border border-slate-800/80 shadow-md transition-opacity group-hover:opacity-75 bg-[#0B0F19]"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-2xl bg-[#0B0F19] border-2 border-dashed border-slate-800/80 flex flex-col items-center justify-center text-slate-500">
                        <Building className="h-10 w-10 text-slate-600 mb-1" />
                        <span className="text-[10px]">No Logo Set</span>
                      </div>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 w-full text-center">
                    <label className="cursor-pointer inline-flex items-center justify-center space-x-2 w-full border border-slate-800/80 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm">
                      <span>Choose Logo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Max 300KB. Automatically compressed client-side.
                    </p>
                  </div>
                </div>

                {/* Cover Banner Card */}
                <div className="bg-[#0B0F19]/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-slate-350 self-start mb-6 pb-2 border-b border-slate-800/40 w-full flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4 text-orange-500" />
                    <span>Cover Photo Banner</span>
                  </h3>

                  <div className="relative group flex items-center justify-center w-full">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt="Cover Preview"
                        className="h-32 w-full rounded-2xl object-cover border border-slate-800/80 shadow-md transition-opacity group-hover:opacity-75 bg-[#0B0F19]"
                      />
                    ) : (
                      <div className="h-32 w-full rounded-2xl bg-[#0B0F19] border-2 border-dashed border-slate-800/80 flex flex-col items-center justify-center text-slate-500">
                        <ImageIcon className="h-8 w-8 text-slate-600 mb-1" />
                        <span className="text-[10px]">No Cover Banner Set</span>
                      </div>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 w-full text-center">
                    <label className="cursor-pointer inline-flex items-center justify-center space-x-2 w-full border border-slate-800/80 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm">
                      <span>Choose Cover File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploadingCover}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Landscape. Max 300KB. Compressed client-side.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-slate-500">Note: Upload files will be staged until you save branding settings.</span>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-slate-955 rounded-xl py-3 px-6 text-sm font-black shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Media...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Branding Assets</span>
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
                        <label className="relative inline-flex items-center cursor-pointer select-none">
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
                      <span>Saving Promo...</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            {/* Wi-Fi Sharing Card */}
            <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800/80 mb-6">
                <Wifi className="h-5 w-5 text-orange-500" />
                <span>Wi-Fi Sharing Settings</span>
              </h2>

              <form onSubmit={handleSaveWifi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Wi-Fi Network SSID (Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cafe_Guest_WiFi"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Wi-Fi Password
                  </label>
                  <input
                    type="password"
                    placeholder="Leave empty for open networks"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Security Encryption Type
                  </label>
                  <select
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                  >
                    <option value="WPA" className="bg-[#111A2E]">WPA/WPA2 (Standard)</option>
                    <option value="WEP" className="bg-[#111A2E]">WEP (Legacy)</option>
                    <option value="nopass" className="bg-[#111A2E]">None / Open Network</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingWifi}
                    className="w-full inline-flex items-center justify-center space-x-2 border border-slate-800 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-305 rounded-xl py-3 px-4 text-sm font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {savingWifi ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Saving Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Wi-Fi Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Card */}
            <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-xl p-6 backdrop-blur-md">
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

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full inline-flex items-center justify-center space-x-2 border border-slate-800 hover:border-orange-500 hover:text-orange-400 bg-[#0B0F19]/40 hover:bg-[#0B0F19] text-slate-305 rounded-xl py-3 px-4 text-sm font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Floating Stackable Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border border-slate-800 bg-[#111A2E] shadow-2xl transition-all duration-300 animate-slide-up text-slate-200`}
            style={{ borderLeftWidth: '5px', borderLeftColor: toast.type === 'error' ? '#f97316' : '#10b981' }}
          >
            <div className="flex items-start space-x-3">
              {toast.type === 'error' ? (
                <XCircle className="h-5 w-5 text-orange-555 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs text-white">
                  {toast.type === 'error' ? 'Error occurred' : 'Action successful'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {toast.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors ml-4 shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
