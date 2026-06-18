'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Palette, Building, Phone, MapPin, Image as ImageIcon, Sparkles, Link as LinkIcon, ArrowRight } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [themeColor, setThemeColor] = useState('#f97316');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    async function checkUserAndLoadRestaurant() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch the restaurant row automatically created on signup
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setRestaurant(data);
          setName(data.name || '');
          setSlug(data.slug || '');
          setThemeColor(data.theme_color || '#f97316');
          setLogoUrl(data.logo_url || '');
          setCoverUrl(data.cover_url || '');
          setDescription(data.description || '');

          // If they already completed onboarding (have phone and address set), redirect to dashboard
          if (data.phone && data.address) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error loading onboarding:', error);
        setErrorMsg('Error loading onboarding data. Please check your session.');
      } finally {
        setLoading(false);
      }
    }

    checkUserAndLoadRestaurant();
  }, [router]);

  // Auto-generate unique slug when restaurant name changes
  const handleNameChange = (val) => {
    setName(val);
    // Convert to lowercase, remove non-alphanumeric except hyphens
    const cleanSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Add unique identifier to ensure uniqueness
    const suffix = restaurant?.id ? restaurant.id.substring(0, 4) : Math.floor(Math.random() * 1000).toString();
    setSlug(`${cleanSlug}-${suffix}`);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setErrorMsg('');

    try {
      // 1. Compress Image client-side (Max size 300KB)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Supabase Storage in "logos" bucket
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
    } catch (error) {
      setErrorMsg(`Cover upload failed: ${error.message}. Please verify the 'logos' bucket exists in your Supabase storage.`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setErrorMsg('');

    try {
      // 1. Compress Image client-side before uploading (Max size 300KB)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to Supabase Storage in "logos" bucket
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `onboarding/${fileName}`;

      // Upload file directly to 'logos' bucket
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
    } catch (error) {
      setErrorMsg(`Logo upload failed: ${error.message}. Please verify the 'logos' bucket exists in your Supabase storage.`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveOnboarding = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setErrorMsg('Slug can only contain lowercase letters, numbers, and hyphens.');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updates = {
        id: restaurant.id,
        owner_id: user.id,
        name,
        slug,
        phone,
        address,
        theme_color: themeColor,
        logo_url: logoUrl,
        cover_url: coverUrl,
        description,
      };

      const { error } = await supabase.from('restaurants').upsert(updates);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMsg(`Error completing setup: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 px-4 py-12 relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-xl animate-slide-up z-10">
        <div className="text-center mb-8">
          <div className="h-12 w-12 mx-auto rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Let&apos;s Set Up Your Menu</h1>
          <p className="text-slate-400 text-sm mt-1">Provide a few key details to create your digital storefront.</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {errorMsg && (
            <div className="mb-6 bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-start space-x-3 text-red-200 text-sm">
              <Loader2 className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveOnboarding} className="space-y-6">
            
            {/* Logo & Cover Photo Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <div className="flex flex-col items-center p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl text-center">
                <div className="relative group shrink-0 mb-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="h-20 w-20 rounded-2xl object-cover border border-slate-800 shadow-md bg-white"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500">
                      <Building className="h-6 w-6 text-slate-600 mb-1" />
                      <span className="text-[8px]">Upload Logo</span>
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-slate-950/60 rounded-2xl flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5">Restaurant Logo</h3>
                <p className="text-slate-500 text-[10px] mb-2.5">Square. Max 300KB.</p>
                <label className="cursor-pointer inline-flex items-center space-x-1.5 border border-slate-800 hover:border-orange-500 hover:text-orange-500 bg-slate-950/30 text-slate-300 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm">
                  <span>Choose Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cover Photo Upload */}
              <div className="flex flex-col items-center p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl text-center">
                <div className="relative group shrink-0 mb-3 w-full">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover Preview"
                      className="h-20 w-full rounded-xl object-cover border border-slate-800 shadow-md bg-white"
                    />
                  ) : (
                    <div className="h-20 w-full rounded-xl bg-slate-950/50 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="h-6 w-6 text-slate-600 mb-1" />
                      <span className="text-[8px]">Upload Cover Banner</span>
                    </div>
                  )}
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5">Cover Photo Banner</h3>
                <p className="text-slate-500 text-[10px] mb-2.5">Landscape. Max 300KB.</p>
                <label className="cursor-pointer inline-flex items-center space-x-1.5 border border-slate-800 hover:border-orange-500 hover:text-orange-500 bg-slate-950/30 text-slate-300 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm">
                  <span>Choose Cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Restaurant Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Unique Slug
                </label>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                />
              </div>
            </div>

            {origin && slug && (
              <p className="text-[11px] text-slate-500 flex items-center space-x-1 px-1 -mt-3">
                <LinkIcon className="h-3 w-3" />
                <span>Your public menu URL:</span>
                <span className="text-orange-400 font-semibold">{origin.replace(/^https?:\/\//, '')}/menu/{slug}</span>
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="theme" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Pick Menu Accent Color
                </label>
                <div className="flex items-center space-x-3 bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-1.5 h-[46px]">
                  <input
                    id="theme"
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-7 w-12 border border-slate-800 rounded cursor-pointer bg-slate-950/50"
                  />
                  <span className="text-xs font-mono text-slate-300">
                    {themeColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Restaurant Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <textarea
                  id="address"
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Country"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm mb-4"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Restaurant Description (Optional)
              </label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description about your restaurant's story, cuisine, or vibe..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || uploadingLogo}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-3 px-4 text-sm font-bold shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Customizations...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup & Open Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
