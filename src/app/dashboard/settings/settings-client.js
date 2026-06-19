'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  X
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function SettingsClient({ initialProfile }) {
  const router = useRouter();
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
  const [templateId, setTemplateId] = useState(initialProfile?.template_id || 'classic-dark');
  const [themeId, setThemeId] = useState(initialProfile?.theme_id || 'obsidian-dark');
  const [styleId, setStyleId] = useState(initialProfile?.style_id || 'modern-minimalist');
  const [headerStyle, setHeaderStyle] = useState(initialProfile?.header_style || 'centered-overlap');
  const [colorBg, setColorBg] = useState(initialProfile?.color_bg || '#0f172a');
  const [colorText, setColorText] = useState(initialProfile?.color_text || '#f8fafc');
  const [colorCardBg, setColorCardBg] = useState(initialProfile?.color_card_bg || '#1e293b');
  const [colorCardText, setColorCardText] = useState(initialProfile?.color_card_text || '#f8fafc');
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
        template_id: templateId,
        theme_id: themeId,
        style_id: styleId,
        header_style: headerStyle,
        color_bg: colorBg,
        color_text: colorText,
        color_card_bg: colorCardBg,
        color_card_text: colorCardText,
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
      router.refresh();
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
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Restaurant Settings</h1>
        <p className="text-slate-500 text-sm">Configure your digital menu, brand look, and security details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Main settings form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Building className="h-5 w-5 text-slate-400" />
              <span>Business Information</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Menu URL Slug
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs select-none">
                    /menu/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-16 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>
                {origin && slug && (
                  <p className="mt-1.5 text-slate-400 text-[11px] flex items-center space-x-1">
                    <LinkIcon className="h-3 w-3" />
                    <span>Your menu is live at: </span>
                    <a
                      href={`${origin}/menu/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline font-semibold"
                    >
                      {origin.replace(/^https?:\/\//, '')}/menu/{slug}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Brand Accent Color
                </label>
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 h-[41px]">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-7 w-12 border border-slate-200 rounded cursor-pointer bg-slate-50"
                  />
                  <span className="text-xs font-mono text-slate-600">
                    {themeColor.toUpperCase()}
                  </span>
                  <div
                    className="h-4 w-4 rounded-full border border-slate-200 shadow-inner ml-auto"
                    style={{ backgroundColor: themeColor }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Business Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm h-[41px] appearance-none"
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Culinary Road, Food District"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm mb-4"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Restaurant Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your restaurant's story, cuisine details, or vibes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Menu Layout Templates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: 'classic-dark',
                    name: 'Classic Rows',
                    desc: 'Single-column horizontal row cards (image next to text) with modern border lines. Best for general dining spots and lounges.',
                    bg: 'bg-slate-950',
                    accent: '#f97316',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-955 p-2 flex flex-col justify-between border border-slate-800">
                        <div className="flex justify-between items-center">
                          <span className="h-1.5 w-10 bg-slate-800 rounded"></span>
                          <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-6 w-full rounded bg-slate-900/60 border border-slate-850 flex items-center justify-between p-1">
                            <div className="flex items-center space-x-1 gap-1">
                              <span className="h-4 w-4 bg-slate-800 rounded shrink-0"></span>
                              <span className="h-1 w-8 bg-slate-700 rounded"></span>
                            </div>
                            <span className="h-1 w-2 bg-orange-500 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'modern-light',
                    name: '2-Column Grid',
                    desc: 'Visual 2-column stacked card grid with prominent top images. Perfect for dessert shops and coffee spots.',
                    bg: 'bg-slate-50',
                    accent: '#10b981',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-slate-50 to-slate-100 p-2 flex flex-col justify-between border border-slate-200">
                        <div className="grid grid-cols-2 gap-1.5 pt-4">
                          <div className="h-11 rounded bg-white border border-slate-200 shadow-sm flex flex-col p-1 gap-1">
                            <span className="h-3 w-full bg-slate-200 rounded shrink-0"></span>
                            <span className="h-1 w-5 bg-slate-400 rounded"></span>
                          </div>
                          <div className="h-11 rounded bg-white border border-slate-200 shadow-sm flex flex-col p-1 gap-1">
                            <span className="h-3 w-full bg-slate-200 rounded shrink-0"></span>
                            <span className="h-1 w-5 bg-slate-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'forest-bistro',
                    name: 'Text Only List',
                    desc: 'Elegant text-only list layout (no item images shown) with dotted leaders. Excellent for fine dining and wine lists.',
                    bg: 'bg-emerald-950',
                    accent: '#fbbf24',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-emerald-950 to-slate-900 p-2 flex flex-col justify-between border border-emerald-900">
                        <div className="space-y-1 py-1 pt-4">
                          <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1">
                            <span className="h-1.5 w-12 bg-emerald-800 rounded"></span>
                            <span className="h-1.5 w-3 bg-amber-400 rounded"></span>
                          </div>
                          <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1">
                            <span className="h-1.5 w-12 bg-emerald-800 rounded"></span>
                            <span className="h-1.5 w-3 bg-amber-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'retro-sunset',
                    name: 'Spotlight Focus',
                    desc: 'The first menu item in a category is highlighted as a large banner, followed by standard list items.',
                    bg: 'bg-amber-50',
                    accent: '#dc2626',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-amber-50 to-orange-50/20 p-2 flex flex-col justify-between border border-slate-300">
                        <div className="space-y-1">
                          <div className="h-8 w-full rounded bg-white border border-slate-900 flex items-end p-0.5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-500/10" />
                            <span className="h-1.5 w-8 bg-slate-900 rounded relative z-10"></span>
                          </div>
                          <div className="h-5 w-full rounded bg-white border border-slate-900/40 flex items-center justify-between px-1">
                            <span className="h-1 w-6 bg-slate-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'minimalist-rows',
                    name: 'Minimalist Rows',
                    desc: 'Ultra-compact rows with small square thumbnails and no descriptions. Maximizes screen density.',
                    bg: 'bg-slate-950',
                    accent: '#06b6d4',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-slate-900 p-2 flex flex-col justify-center space-y-1 border border-slate-800">
                        <div className="h-4 w-full rounded bg-slate-950 flex items-center justify-between px-1">
                          <div className="flex items-center space-x-1 gap-1">
                            <span className="h-2 w-2 bg-slate-800 rounded"></span>
                            <span className="h-1 w-8 bg-slate-700 rounded"></span>
                          </div>
                          <span className="h-1 w-2 bg-cyan-500 rounded"></span>
                        </div>
                        <div className="h-4 w-full rounded bg-slate-950 flex items-center justify-between px-1">
                          <div className="flex items-center space-x-1 gap-1">
                            <span className="h-2 w-2 bg-slate-800 rounded"></span>
                            <span className="h-1 w-8 bg-slate-700 rounded"></span>
                          </div>
                          <span className="h-1 w-2 bg-cyan-500 rounded"></span>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'widescreen-cards',
                    name: 'Widescreen Cards',
                    desc: 'Cinematic widescreen landscape cards. Best for high-end signature dishes and chef creations.',
                    bg: 'bg-slate-900',
                    accent: '#eab308',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-slate-900 p-1.5 flex flex-col justify-center space-y-1 border border-slate-800">
                        <div className="h-11 w-full rounded-md bg-slate-950 overflow-hidden relative border border-slate-850">
                          <div className="h-6 w-full bg-slate-800"></div>
                          <div className="p-1 flex justify-between">
                            <span className="h-1 w-6 bg-slate-400 rounded"></span>
                            <span className="h-1 w-3 bg-amber-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'alternating-magazine',
                    name: 'Alternating Rows',
                    desc: 'Row layout that alternates photos between the left and right sides for a dynamic magazine feel.',
                    bg: 'bg-slate-50',
                    accent: '#8b5cf6',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-slate-50 p-2 flex flex-col justify-center space-y-1 border border-slate-200">
                        <div className="h-6 w-full bg-white border border-slate-150 rounded flex p-0.5 gap-1.5">
                          <span className="h-full w-4 bg-slate-200 rounded shrink-0"></span>
                          <span className="h-1 w-8 bg-slate-400 rounded mt-0.5"></span>
                        </div>
                        <div className="h-6 w-full bg-white border border-slate-150 rounded flex p-0.5 gap-1.5 justify-between">
                          <span className="h-1 w-8 bg-slate-400 rounded mt-0.5 ml-1"></span>
                          <span className="h-full w-4 bg-slate-200 rounded shrink-0"></span>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'three-column-gallery',
                    name: '3-Column Gallery',
                    desc: 'Denser 3-column photo grid layout for larger menus. Excellent for quick-service delis and bakeries.',
                    bg: 'bg-slate-50',
                    accent: '#ec4899',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-slate-50 p-1.5 flex flex-col justify-center border border-slate-200">
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="h-12 rounded bg-white border border-slate-200 flex flex-col p-0.5 gap-0.5">
                            <span className="h-5 w-full bg-slate-200 rounded shrink-0"></span>
                            <span className="h-0.5 w-4 bg-slate-400 rounded"></span>
                          </div>
                          <div className="h-12 rounded bg-white border border-slate-200 flex flex-col p-0.5 gap-0.5">
                            <span className="h-5 w-full bg-slate-200 rounded shrink-0"></span>
                            <span className="h-0.5 w-4 bg-slate-400 rounded"></span>
                          </div>
                          <div className="h-12 rounded bg-white border border-slate-200 flex flex-col p-0.5 gap-0.5">
                            <span className="h-5 w-full bg-slate-200 rounded shrink-0"></span>
                            <span className="h-0.5 w-4 bg-slate-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'dense-grid',
                    name: 'Dense Grid',
                    desc: '2-column stacked grid showing only photos, title and price (no descriptions). Clean and visual.',
                    bg: 'bg-slate-900',
                    accent: '#f43f5e',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-slate-900 p-2 flex flex-col justify-center border border-slate-800">
                        <div className="grid grid-cols-2 gap-1 pt-1">
                          <div className="h-12 rounded bg-slate-950 border border-slate-850 flex flex-col p-0.5 gap-0.5">
                            <span className="h-7 w-full bg-slate-800 rounded shrink-0"></span>
                            <span className="h-1 w-3 bg-red-400 rounded"></span>
                          </div>
                          <div className="h-12 rounded bg-slate-950 border border-slate-850 flex flex-col p-0.5 gap-0.5">
                            <span className="h-7 w-full bg-slate-800 rounded shrink-0"></span>
                            <span className="h-1 w-3 bg-red-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'horizontal-swiper',
                    name: 'Horizontal Swiper',
                    desc: 'Categories display items in horizontal sliding rows. Patrons swipe right to explore dishes.',
                    bg: 'bg-slate-950',
                    accent: '#f97316',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-slate-950 p-2 flex flex-col justify-between border border-slate-900">
                        <span className="h-1.5 w-8 bg-slate-800 rounded shrink-0"></span>
                        <div className="flex gap-1 overflow-hidden">
                          <div className="h-10 w-12 rounded bg-slate-900 border border-slate-800 shrink-0 p-0.5 flex flex-col justify-between">
                            <span className="h-3 w-full bg-slate-805 rounded"></span>
                            <span className="h-1 w-3 bg-orange-500 rounded"></span>
                          </div>
                          <div className="h-10 w-12 rounded bg-slate-900 border border-slate-800 shrink-0 p-0.5 flex flex-col justify-between">
                            <span className="h-3 w-full bg-slate-805 rounded"></span>
                            <span className="h-1 w-3 bg-orange-500 rounded"></span>
                          </div>
                          <div className="h-10 w-12 rounded bg-slate-900 border border-slate-800 shrink-0 p-0.5 flex flex-col justify-between">
                            <span className="h-3 w-full bg-slate-805 rounded"></span>
                            <span className="h-1 w-3 bg-orange-500 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                ].map((tpl) => {
                  const isSelected = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id)}
                      className={`flex flex-col text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/5'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <span className="absolute top-3 right-3 bg-orange-500 text-white rounded-full p-0.5 z-10">
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        </span>
                      )}

                      {/* Visual Preview Box */}
                      <div className="w-full mb-3 select-none">
                        {tpl.preview}
                      </div>

                      <span className="font-bold text-sm text-slate-800 mb-1">{tpl.name}</span>
                      <span className="text-slate-500 text-xs leading-normal line-clamp-3">{tpl.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Menu Color Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    id: 'obsidian-dark',
                    name: 'Obsidian Dark',
                    desc: 'Deep dark slate/indigo theme.',
                    colors: ['bg-slate-950', 'bg-slate-900', 'bg-orange-500']
                  },
                  {
                    id: 'pearl-light',
                    name: 'Pearl Light',
                    desc: 'Clean bright slate theme.',
                    colors: ['bg-slate-50', 'bg-white', 'bg-emerald-500']
                  },
                  {
                    id: 'warm-bistro',
                    name: 'Warm Bistro',
                    desc: 'Cozy beige/cream theme.',
                    colors: ['bg-[#fefaf0]', 'bg-[#fffdec]', 'bg-amber-500']
                  },
                  {
                    id: 'crimson-retro',
                    name: 'Crimson Retro',
                    desc: 'Classic off-white & red theme.',
                    colors: ['bg-[#fafaf9]', 'bg-white', 'bg-red-600']
                  },
                  {
                    id: 'emerald-palace',
                    name: 'Emerald Palace',
                    desc: 'Luxury dark green & gold theme.',
                    colors: ['bg-emerald-950', 'bg-[#064e3b]', 'bg-[#fbbf24]']
                  },
                  {
                    id: 'rose-gold',
                    name: 'Rose Gold',
                    desc: 'Soft rose & pastel pink theme.',
                    colors: ['bg-[#fff1f2]', 'bg-white', 'bg-[#f43f5e]']
                  },
                  {
                    id: 'midnight-neon',
                    name: 'Midnight Neon',
                    desc: 'Cyberpunk black & fuchsia theme.',
                    colors: ['bg-black', 'bg-slate-900', 'bg-fuchsia-500']
                  },
                  {
                    id: 'nordic-frost',
                    name: 'Nordic Frost',
                    desc: 'Cool ice blue & deep navy theme.',
                    colors: ['bg-[#f0f4f8]', 'bg-white', 'bg-[#0284c7]']
                  },
                  {
                    id: 'chocolate-truffle',
                    name: 'Chocolate Truffle',
                    desc: 'Decadent cocoa & caramel theme.',
                    colors: ['bg-[#271a15]', 'bg-[#3e2c24]', 'bg-[#d97706]']
                  },
                  {
                    id: 'sunset-glow',
                    name: 'Sunset Glow',
                    desc: 'Terracotta & warm amber theme.',
                    colors: ['bg-[#fff7ed]', 'bg-white', 'bg-[#ea580c]']
                  },
                  {
                    id: 'custom',
                    name: 'Custom Colors',
                    desc: 'Design your own custom color scheme.',
                    colors: [colorBg, colorCardBg, themeColor],
                    isCustom: true
                  }
                ].map((th) => {
                  const isSelected = themeId === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setThemeId(th.id)}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all relative overflow-hidden group ${isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/5'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-0.5 z-10">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        </span>
                      )}

                      {/* Color dots preview */}
                      <div className="flex gap-1.5 mb-2 shrink-0">
                        {th.colors.map((c, idx) => (
                          <span 
                            key={idx} 
                            className={`h-4 w-4 rounded-full border border-slate-200/50 shadow-inner ${th.isCustom ? '' : c}`}
                            style={th.isCustom ? { backgroundColor: c } : undefined}
                          />
                        ))}
                      </div>

                      <span className="font-bold text-xs text-slate-800 mb-0.5">{th.name}</span>
                      <span className="text-slate-400 text-[10px] leading-tight line-clamp-2">{th.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {themeId === 'custom' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Color Theme Settings</h4>
                  <span className="text-[10px] text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">Color by Color</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-sans">
                  {/* Page Background */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Page Background
                    </label>
                    <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 h-[38px] shadow-sm">
                      <input
                        type="color"
                        value={colorBg}
                        onChange={(e) => setColorBg(e.target.value)}
                        className="h-6 w-9 border border-slate-200 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-600">
                        {colorBg.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {/* Primary Text */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Primary Text
                    </label>
                    <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 h-[38px] shadow-sm">
                      <input
                        type="color"
                        value={colorText}
                        onChange={(e) => setColorText(e.target.value)}
                        className="h-6 w-9 border border-slate-200 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-600">
                        {colorText.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {/* Card Background */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Card Background
                    </label>
                    <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 h-[38px] shadow-sm">
                      <input
                        type="color"
                        value={colorCardBg}
                        onChange={(e) => setColorCardBg(e.target.value)}
                        className="h-6 w-9 border border-slate-200 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-600">
                        {colorCardBg.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {/* Card Text */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Card Text Color
                    </label>
                    <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 h-[38px] shadow-sm">
                      <input
                        type="color"
                        value={colorCardText}
                        onChange={(e) => setColorCardText(e.target.value)}
                        className="h-6 w-9 border border-slate-200 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-600">
                        {colorCardText.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  *Tip: The menu accent points (buttons, prices, and highlighted tabs) use your saved <strong>Brand Accent Color</strong> (customizable under Business Information above).
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Menu Typography & Style Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { id: 'modern-minimalist', name: 'Modern Minimalist', desc: 'Clean sans-serif, borderless, soft curves.' },
                  { id: 'classic-serif', name: 'Classic Serif', desc: 'Elegant serif headers and traditional lines.' },
                  { id: 'neo-brutalism', name: 'Neo-Brutalism', desc: 'Thick black strokes and high-contrast blocky shadows.' },
                  { id: 'pill-rounded', name: 'Pill Rounded', desc: 'Max curved buttons and pill-shaped elements.' },
                  { id: 'glassmorphism', name: 'Glassmorphic', desc: 'Semi-transparent frosted glass cards.' },
                  { id: 'vintage-newspaper', name: 'Vintage Newspaper', desc: 'Retro monospace type and newspaper double borders.' },
                  { id: 'clean-borderless', name: 'Clean Borderless', desc: 'Minimal flat panels, borderless, zero shadows.' },
                  { id: 'elegant-gold-rim', name: 'Royal Gold Rim', desc: 'Thin gold line framing for premium dining.' },
                  { id: 'soft-float', name: 'Soft Hover Float', desc: 'Gently elevated shadows with lift transitions.' },
                  { id: 'cyber-grid', name: 'Cyberpunk Grid', desc: 'Glowing dashed neon outlines and terminal fonts.' }
                ].map((st) => {
                  const isSelected = styleId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStyleId(st.id)}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all relative overflow-hidden group ${isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/5'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-0.5 z-10">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        </span>
                      )}

                      <span className="font-bold text-xs text-slate-800 mb-1 line-clamp-1">{st.name}</span>
                      <span className="text-slate-400 text-[10px] leading-tight line-clamp-3">{st.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Menu Header (First Section) Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { id: 'centered-overlap', name: 'Centered Overlap', desc: 'Cover image banner on top, centered profile logo overlapping, centered text.' },
                  { id: 'inline-clean', name: 'Inline Left-Aligned', desc: 'Thin banner, logo next to title on the left, left-aligned layout.' },
                  { id: 'glassy-hero', name: 'Glassy Hero Card', desc: 'Full-screen cover backdrop, logo and info centered inside floating frosted glass panel.' },
                  { id: 'minimalist-flat', name: 'Flat Minimalist', desc: 'Zero cover banner. Clean flat row with a circular logo next to title.' },
                  { id: 'split-magazine', name: 'Split Columns', desc: 'Magazine layout: cover image on the left side, brand details on the right.' },
                  { id: 'banner-neon', name: 'Neon Cyberpunk', desc: 'Futuristic terminal theme: glowing neon borders, dark backdrop, monospace font.' },
                  { id: 'newspaper-retro', name: 'Newspaper Vintage', desc: 'Retro monochrome layout: double black border outlines, grayscale styling.' },
                  { id: 'royal-gold', name: 'Royal Gold Rim', desc: 'Luxury layout: thin gold border frame, elegant gold typography accents, dark gold-etched panel.' }
                ].map((hs) => {
                  const isSelected = headerStyle === hs.id;
                  return (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => setHeaderStyle(hs.id)}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all relative overflow-hidden group ${isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/10 bg-orange-50/5'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                    >
                      {/* Check indicator */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-0.5 z-10">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        </span>
                      )}

                      <span className="font-bold text-xs text-slate-800 mb-1 line-clamp-1">{hs.name}</span>
                      <span className="text-slate-400 text-[10px] leading-tight line-clamp-3">{hs.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Promotion & Announcement Banner
              </h3>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Enable Promotion Banner</label>
                    <span className="text-[10px] text-slate-400 block">Display a promotional banner at the very top of your public menu.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={promoBannerActive}
                      onChange={(e) => setPromoBannerActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {promoBannerActive && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Promo Text (English)
                        </label>
                        <input
                          type="text"
                          value={promoBannerText}
                          onChange={(e) => setPromoBannerText(e.target.value)}
                          placeholder="e.g. 🎉 Happy Hour: Buy 1 Get 1 Free on all Mocktails from 4-6 PM!"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Promo Text (Arabic)
                        </label>
                        <input
                          type="text"
                          value={promoBannerTextAr}
                          onChange={(e) => setPromoBannerTextAr(e.target.value)}
                          placeholder="مثال: 🎉 عرض الساعة السعيدة: اشترِ واحداً واحصل على الآخر مجاناً!"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs text-right"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Banner Color Theme
                        </label>
                        <select
                          value={promoBannerColor}
                          onChange={(e) => setPromoBannerColor(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-xs appearance-none"
                        >
                          <option value="accent">Brand Accent Color (Adaptive)</option>
                          <option value="orange">Sunset Orange</option>
                          <option value="green">Emerald Green</option>
                          <option value="red">Crimson Red</option>
                          <option value="indigo">Neon Indigo</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block">Scrolling Marquee Text</label>
                          <span className="text-[10px] text-slate-400 block">Animate the promo text to scroll horizontally.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={promoBannerScroll}
                            onChange={(e) => setPromoBannerScroll(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Logo, Cover & Password Card */}
        <div className="space-y-6">
          {/* Logo Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center">
            <h2 className="text-md font-semibold text-slate-800 self-start mb-6 flex items-center space-x-2 w-full pb-3 border-b border-slate-100">
              <Building className="h-4 w-4 text-slate-400" />
              <span>Restaurant Logo</span>
            </h2>

            <div className="relative group flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Preview"
                  className="h-32 w-32 rounded-2xl object-cover border border-slate-200 shadow-md transition-opacity group-hover:opacity-75 bg-white"
                />
              ) : (
                <div className="h-32 w-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <Building className="h-10 w-10 text-slate-300 mb-1" />
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
              <label className="cursor-pointer inline-flex items-center justify-center space-x-2 w-full border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm">
                <span>Choose Logo File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-2">
                Max 300KB. Automatically compressed client-side.
              </p>
            </div>
          </div>

          {/* Cover Banner Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center">
            <h2 className="text-md font-semibold text-slate-800 self-start mb-6 flex items-center space-x-2 w-full pb-3 border-b border-slate-100">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              <span>Cover Photo Banner</span>
            </h2>

            <div className="relative group flex items-center justify-center w-full">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover Preview"
                  className="h-28 w-full rounded-2xl object-cover border border-slate-200 shadow-md transition-opacity group-hover:opacity-75 bg-white"
                />
              ) : (
                <div className="h-28 w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="h-8 w-8 text-slate-300 mb-1" />
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
              <label className="cursor-pointer inline-flex items-center justify-center space-x-2 w-full border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm">
                <span>Choose Cover File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-2">
                Landscape. Max 300KB. Compressed client-side.
              </p>
            </div>
          </div>

          {/* Wi-Fi Sharing Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-md font-semibold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100 mb-4">
              <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
              <span>Wi-Fi Sharing Settings</span>
            </h2>

            <form onSubmit={handleSaveWifi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Wi-Fi Network SSID (Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cafe_Guest_WiFi"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Wi-Fi Password
                </label>
                <input
                  type="password"
                  placeholder="Leave empty for open networks"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Security Encryption Type
                </label>
                <select
                  value={wifiEncryption}
                  onChange={(e) => setWifiEncryption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm appearance-none"
                >
                  <option value="WPA">WPA/WPA2 (Standard)</option>
                  <option value="WEP">WEP (Legacy)</option>
                  <option value="nopass">None / Open Network</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingWifi}
                className="w-full inline-flex items-center justify-center space-x-2 border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
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
            </form>
          </div>

          {/* Password Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-md font-semibold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100 mb-4">
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Change Password</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full inline-flex items-center justify-center space-x-2 border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
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
            </form>
          </div>
        </div>
      </div>

      {/* Floating Stackable Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border bg-white shadow-xl transition-all duration-300 animate-slide-up text-slate-800`}
            style={{ borderLeftWidth: '5px', borderLeftColor: toast.type === 'error' ? '#ef4444' : '#10b981' }}
          >
            <div className="flex items-start space-x-3">
              {toast.type === 'error' ? (
                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {toast.type === 'error' ? 'Error occurred' : 'Action successful'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {toast.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-4 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
