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

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [themeColor, setThemeColor] = useState('#f97316');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [promoBannerActive, setPromoBannerActive] = useState(false);
  const [promoBannerText, setPromoBannerText] = useState('');
  const [promoBannerTextAr, setPromoBannerTextAr] = useState('');
  const [promoBannerColor, setPromoBannerColor] = useState('accent');
  const [promoBannerScroll, setPromoBannerScroll] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('classic-dark');
  const [themeId, setThemeId] = useState('obsidian-dark');
  const [origin, setOrigin] = useState('');

  // Wi-Fi fields
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [savingWifi, setSavingWifi] = useState(false);

  // Password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

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

    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
          setRestaurantName(data.name || '');
          setSlug(data.slug || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setThemeColor(data.theme_color || '#f97316');
          setLogoUrl(data.logo_url || '');
          setCoverUrl(data.cover_url || '');
          setDescription(data.description || '');
          setTemplateId(data.template_id || 'classic-dark');
          setThemeId(data.theme_id || 'obsidian-dark');
          setCurrency(data.currency || 'USD');
          setPromoBannerActive(data.promo_banner_active || false);
          setPromoBannerText(data.promo_banner_text || '');
          setPromoBannerTextAr(data.promo_banner_text_ar || '');
          setPromoBannerColor(data.promo_banner_color || 'accent');
          setPromoBannerScroll(data.promo_banner_scroll || false);
          setWifiSsid(data.wifi_ssid || '');
          setWifiPassword(data.wifi_password || '');
          setWifiEncryption(data.wifi_encryption || 'WPA');
        }
      } catch (error) {
        addToast('error', 'Error loading settings from Supabase.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [addToast]);

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
        currency,
        promo_banner_active: promoBannerActive,
        promo_banner_text: promoBannerText,
        promo_banner_text_ar: promoBannerTextAr,
        promo_banner_color: promoBannerColor,
        promo_banner_scroll: promoBannerScroll,
      };

      const { error } = await supabase.from('restaurants').upsert(updates);

      if (error) throw error;

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

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

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
                Menu Layout & Style Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: 'classic-dark',
                    name: 'Classic Rows (Obsidian Dark)',
                    desc: 'Single-column horizontal row cards (image next to text) with modern neon glows. Best for late-night spots, bars, and premium lounges.',
                    bg: 'bg-slate-950',
                    accent: '#f97316',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 p-2 flex flex-col justify-between border border-slate-800">
                        <div className="flex justify-between items-center">
                          <span className="h-1.5 w-10 bg-slate-800 rounded"></span>
                          <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-6 w-full rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between p-1">
                            <div className="flex items-center space-x-1 gap-1">
                              <span className="h-4 w-4 bg-slate-800 rounded shrink-0"></span>
                              <span className="h-1 w-8 bg-slate-700 rounded"></span>
                            </div>
                            <span className="h-1 w-2 bg-orange-500 rounded"></span>
                          </div>
                          <div className="h-6 w-full rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between p-1">
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
                    name: '2-Column Grid (Clean Light)',
                    desc: 'Visual 2-column stacked card grid with prominent top images. Perfect for dessert shops, coffee spots, and visually rich menus.',
                    bg: 'bg-slate-50',
                    accent: '#10b981',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-slate-50 to-slate-100 p-2 flex flex-col justify-between border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="h-1.5 w-10 bg-slate-300 rounded"></span>
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="h-11 rounded bg-white border border-slate-200 shadow-sm flex flex-col p-1 gap-1">
                            <span className="h-3 w-full bg-slate-200 rounded shrink-0"></span>
                            <div className="flex justify-between items-center">
                              <span className="h-1 w-5 bg-slate-400 rounded"></span>
                              <span className="h-1 w-2 bg-emerald-500 rounded"></span>
                            </div>
                          </div>
                          <div className="h-11 rounded bg-white border border-slate-200 shadow-sm flex flex-col p-1 gap-1">
                            <span className="h-3 w-full bg-slate-200 rounded shrink-0"></span>
                            <div className="flex justify-between items-center">
                              <span className="h-1 w-5 bg-slate-400 rounded"></span>
                              <span className="h-1 w-2 bg-emerald-500 rounded"></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'forest-bistro',
                    name: 'Text Only List (Cozy Emerald)',
                    desc: 'Elegant text-only list layout (no item images shown) with cozy warm gold serif details. Excellent for fine dining, wine collections, and bistros.',
                    bg: 'bg-emerald-950',
                    accent: '#fbbf24',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-emerald-950 to-slate-900 p-2 flex flex-col justify-between border border-emerald-900">
                        <div className="flex justify-between items-center">
                          <span className="h-1.5 w-10 bg-emerald-900 rounded"></span>
                          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        </div>
                        <div className="space-y-1 py-1">
                          <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1">
                            <span className="h-1 w-12 bg-emerald-800 rounded"></span>
                            <span className="h-1 w-3 bg-amber-400 rounded"></span>
                          </div>
                          <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1">
                            <span className="h-1 w-12 bg-emerald-800 rounded"></span>
                            <span className="h-1 w-3 bg-amber-400 rounded"></span>
                          </div>
                          <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1">
                            <span className="h-1 w-12 bg-emerald-800 rounded"></span>
                            <span className="h-1 w-3 bg-amber-400 rounded"></span>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'retro-sunset',
                    name: 'Spotlight Focus (Retro Crimson)',
                    desc: 'Structural spotlight view where the first items are featured as large cards with full background photo overlays. Fits burger bars and pizzerias.',
                    bg: 'bg-amber-50',
                    accent: '#dc2626',
                    preview: (
                      <div className="h-20 w-full rounded-lg bg-gradient-to-tr from-amber-50 to-orange-50/20 p-2 flex flex-col justify-between border border-slate-900">
                        <div className="flex justify-between items-center">
                          <span className="h-1.5 w-10 bg-slate-300 rounded"></span>
                          <span className="h-2 w-2 rounded-full bg-red-600"></span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-7 w-full rounded bg-white border border-slate-900 flex items-end p-0.5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-600/10" />
                            <span className="h-1 w-8 bg-slate-905 rounded relative z-10"></span>
                          </div>
                          <div className="h-5 w-full rounded bg-white border border-slate-900/60 flex items-center justify-between px-1">
                            <span className="h-1 w-6 bg-slate-400 rounded"></span>
                            <span className="h-1 w-2 bg-red-600 rounded"></span>
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
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-55 bg-white'
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
                          <span key={idx} className={`h-4 w-4 rounded-full border border-slate-200/50 shadow-inner ${c}`} />
                        ))}
                      </div>

                      <span className="font-bold text-xs text-slate-800 mb-0.5">{th.name}</span>
                      <span className="text-slate-450 text-[10px] leading-tight line-clamp-2">{th.desc}</span>
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
