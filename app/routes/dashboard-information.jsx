import { useState, useEffect } from 'react';
import { useOutletContext, useFetcher, Link, useNavigate } from 'react-router';
import { createClient } from '../lib/supabase/server';
import { supabase as browserSupabase } from '../lib/supabase/client';
import imageCompression from 'browser-image-compression';
import { 
  Building, Phone, Globe, Wifi, Clock, Image as ImageIcon, 
  Save, Check, X, Edit, Eye, EyeOff, Plus, Trash2, ExternalLink
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/dashboard/toast';

export async function action({ request }) {
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const formData = await request.formData();
  const profileId = formData.get('profileId');
  const name = formData.get('name');
  const phone = formData.get('phone');
  const slug = formData.get('slug');
  const address = formData.get('address');
  const map_link = formData.get('map_link');
  const website = formData.get('website');
  
  const logo_url = formData.get('logo_url') || null;
  const cover_url = formData.get('cover_url') || null;
  const custom_text = formData.get('custom_text');
  
  const instagram = formData.get('instagram');
  const facebook = formData.get('facebook');
  const whatsapp = formData.get('whatsapp');
  const twitter = formData.get('twitter');
  const tiktok = formData.get('tiktok');
  const youtube = formData.get('youtube');
  const tripadvisor = formData.get('tripadvisor');
  
  const wifi_ssid = formData.get('wifi_ssid');
  const wifi_password = formData.get('wifi_password');
  const business_hours = formData.get('business_hours');
  const temporarily_closed = formData.get('temporarily_closed') === 'true';

  const { error } = await supabase
    .from('restaurants')
    .update({
      name,
      phone,
      slug,
      address,
      map_link,
      website,
      logo_url,
      cover_url,
      custom_text,
      instagram,
      facebook,
      whatsapp,
      twitter,
      tiktok,
      youtube,
      tripadvisor,
      wifi_ssid,
      wifi_password,
      business_hours: JSON.parse(business_hours),
      temporarily_closed,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export default function RestaurantInformationPage() {
  const { profile } = useOutletContext();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  // Basic Details States
  const [restaurantName, setRestaurantName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [slug, setSlug] = useState(profile.slug || '');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [address, setAddress] = useState(profile.address || '');
  const [mapLink, setMapLink] = useState(profile.map_link || '');
  const [website, setWebsite] = useState(profile.website || '');
  
  // Media States
  const [logoUrl, setLogoUrl] = useState(profile.logo_url || '');
  const [coverUrl, setCoverUrl] = useState(profile.cover_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Custom Text State
  const [customText, setCustomText] = useState(profile.custom_text || '');

  // Social Media States
  const [instagram, setInstagram] = useState(profile.instagram || '');
  const [facebook, setFacebook] = useState(profile.facebook || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');
  const [twitter, setTwitter] = useState(profile.twitter || '');
  const [tiktok, setTiktok] = useState(profile.tiktok || '');
  const [youtube, setYoutube] = useState(profile.youtube || '');
  const [tripadvisor, setTripadvisor] = useState(profile.tripadvisor || '');

  // WiFi States
  const [wifiSsid, setWifiSsid] = useState(profile.wifi_ssid || '');
  const [wifiPassword, setWifiPassword] = useState(profile.wifi_password || '');
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  // Business Hours and Temporarily Closed States
  const [temporarilyClosed, setTemporarilyClosed] = useState(profile.temporarily_closed || false);

  const getInitialBusinessHours = () => {
    const defaultHours = {
      timezone: 'Asia/Damascus',
      days: {
        Monday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] },
        Tuesday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] },
        Wednesday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] },
        Thursday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] },
        Friday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] },
        Saturday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] },
        Sunday: { isOpen: true, periods: [{ from: '12:00', to: '23:59' }] }
      }
    };
    return { ...defaultHours, ...profile.business_hours };
  };

  const [businessHours, setBusinessHours] = useState(getInitialBusinessHours);
  const [initialBusinessHoursSnapshot] = useState(getInitialBusinessHours);
  const { toasts, addToast, removeToast } = useToast();

  // Unsaved Changes Dirty Verification
  const isDirty = 
    restaurantName !== (profile.name || '') ||
    phone !== (profile.phone || '') ||
    slug !== (profile.slug || '') ||
    address !== (profile.address || '') ||
    mapLink !== (profile.map_link || '') ||
    website !== (profile.website || '') ||
    logoUrl !== (profile.logo_url || '') ||
    coverUrl !== (profile.cover_url || '') ||
    customText !== (profile.custom_text || '') ||
    instagram !== (profile.instagram || '') ||
    facebook !== (profile.facebook || '') ||
    whatsapp !== (profile.whatsapp || '') ||
    twitter !== (profile.twitter || '') ||
    tiktok !== (profile.tiktok || '') ||
    youtube !== (profile.youtube || '') ||
    tripadvisor !== (profile.tripadvisor || '') ||
    wifiSsid !== (profile.wifi_ssid || '') ||
    wifiPassword !== (profile.wifi_password || '') ||
    temporarilyClosed !== (profile.temporarily_closed || false) ||
    JSON.stringify(businessHours) !== JSON.stringify(initialBusinessHoursSnapshot);

  // Image Upload Handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await browserSupabase.storage
        .from('logos')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = browserSupabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      addToast('success', 'Logo uploaded and compressed!');
    } catch (err) {
      addToast('error', `Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      // Resilient bucket check upload
      let finalPublicUrl = '';
      const { error: uploadError } = await browserSupabase.storage
        .from('covers')
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        // Fallback to logos bucket under covers/ prefix
        const { error: fallbackError } = await browserSupabase.storage
          .from('logos')
          .upload(`covers/${fileName}`, compressedFile, { cacheControl: '3600', upsert: true });
        
        if (fallbackError) throw fallbackError;

        const { data: { publicUrl } } = browserSupabase.storage
          .from('logos')
          .getPublicUrl(`covers/${fileName}`);
        finalPublicUrl = publicUrl;
      } else {
        const { data: { publicUrl } } = browserSupabase.storage
          .from('covers')
          .getPublicUrl(fileName);
        finalPublicUrl = publicUrl;
      }

      setCoverUrl(finalPublicUrl);
      addToast('success', 'Cover banner uploaded and compressed!');
    } catch (err) {
      addToast('error', `Cover upload failed: ${err.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  // Schedule Toggling
  const toggleDayOpen = (day) => {
    setBusinessHours(prev => {
      const updatedDays = { ...prev.days };
      const dayData = updatedDays[day] || { isOpen: false, periods: [] };
      const nextOpen = !dayData.isOpen;
      updatedDays[day] = {
        ...dayData,
        isOpen: nextOpen,
        periods: nextOpen && (!dayData.periods || dayData.periods.length === 0) 
          ? [{ from: '12:00', to: '23:59' }] 
          : dayData.periods
      };
      return { ...prev, days: updatedDays };
    });
  };

  const updatePeriodTime = (day, idx, field, val) => {
    setBusinessHours(prev => {
      const updatedDays = { ...prev.days };
      const dayData = { ...updatedDays[day] };
      const updatedPeriods = [...dayData.periods];
      updatedPeriods[idx] = { ...updatedPeriods[idx], [field]: val };
      dayData.periods = updatedPeriods;
      updatedDays[day] = dayData;
      return { ...prev, days: updatedDays };
    });
  };

  const addPeriod = (day) => {
    setBusinessHours(prev => {
      const updatedDays = { ...prev.days };
      const dayData = { ...updatedDays[day] };
      dayData.periods = [...(dayData.periods || []), { from: '12:00', to: '23:59' }];
      updatedDays[day] = dayData;
      return { ...prev, days: updatedDays };
    });
  };

  const removePeriod = (day, idx) => {
    setBusinessHours(prev => {
      const updatedDays = { ...prev.days };
      const dayData = { ...updatedDays[day] };
      dayData.periods = dayData.periods.filter((_, i) => i !== idx);
      updatedDays[day] = dayData;
      return { ...prev, days: updatedDays };
    });
  };

  const handleTimezoneChange = (e) => {
    setBusinessHours(prev => ({
      ...prev,
      timezone: e.target.value
    }));
  };

  // Save Settings Submit Action
  const handleSave = () => {
    // Slug validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      addToast('error', 'Slug can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    const formData = new FormData();
    formData.append('profileId', profile.id);
    formData.append('name', restaurantName);
    formData.append('phone', phone);
    formData.append('slug', slug.toLowerCase());
    formData.append('address', address);
    formData.append('map_link', mapLink);
    formData.append('website', website);
    formData.append('logo_url', logoUrl);
    formData.append('cover_url', coverUrl);
    formData.append('custom_text', customText);
    formData.append('instagram', instagram);
    formData.append('facebook', facebook);
    formData.append('whatsapp', whatsapp);
    formData.append('twitter', twitter);
    formData.append('tiktok', tiktok);
    formData.append('youtube', youtube);
    formData.append('tripadvisor', tripadvisor);
    formData.append('wifi_ssid', wifiSsid);
    formData.append('wifi_password', wifiPassword);
    formData.append('business_hours', JSON.stringify(businessHours));
    formData.append('temporarily_closed', temporarilyClosed ? 'true' : 'false');

    fetcher.submit(formData, { method: 'POST' });
    addToast('saving', 'Saving changes...');
  };

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        addToast('success', 'Restaurant details saved successfully!');
        
        // Inline layout context sync
        profile.name = restaurantName;
        profile.phone = phone;
        profile.slug = slug.toLowerCase();
        profile.address = address;
        profile.map_link = mapLink;
        profile.website = website;
        profile.logo_url = logoUrl;
        profile.cover_url = coverUrl;
        profile.custom_text = customText;
        profile.instagram = instagram;
        profile.facebook = facebook;
        profile.whatsapp = whatsapp;
        profile.twitter = twitter;
        profile.tiktok = tiktok;
        profile.youtube = youtube;
        profile.tripadvisor = tripadvisor;
        profile.wifi_ssid = wifiSsid;
        profile.wifi_password = wifiPassword;
        profile.business_hours = businessHours;
        profile.temporarily_closed = temporarilyClosed;

        setIsEditingSlug(false);
      } else {
        addToast('error', fetcher.data.error || 'Failed to save configuration');
      }
    }
  }, [fetcher.state, fetcher.data]);

  const timezones = [
    { value: 'Asia/Damascus', label: 'GMT+3 · Damascus' },
    { value: 'Asia/Beirut', label: 'GMT+3 · Beirut' },
    { value: 'Asia/Riyadh', label: 'GMT+3 · Riyadh' },
    { value: 'Asia/Dubai', label: 'GMT+4 · Dubai' },
    { value: 'Asia/Amman', label: 'GMT+3 · Amman' },
    { value: 'Europe/London', label: 'GMT+1 · London' },
    { value: 'Europe/Paris', label: 'GMT+2 · Paris' },
    { value: 'America/New_York', label: 'GMT-4 · New York' },
    { value: 'America/Los_Angeles', label: 'GMT-7 · Los Angeles' },
    { value: 'UTC', label: 'GMT+0 · UTC' }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white text-slate-800 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/60 relative select-none font-sans">
      
      {/* SECTION 1: RESTAURANT NAME */}
      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 flex items-center justify-between mb-8 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">Active Business</span>
          <h2 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{profile.name}</h2>
        </div>
        <Link 
          to="/dashboard/settings" 
          className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200/80 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
        >
          Edit in Settings
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 gap-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Restaurant Profile Info</h1>
          <p className="text-xs text-slate-500 mt-1">Update media assets, location maps, Wi-Fi keys, timezone settings, and business timetables.</p>
        </div>
        <Link
          to={`/menu/${profile.slug}?preview=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-emerald-500 text-xs font-bold text-slate-600 hover:text-emerald-500 bg-white hover:bg-emerald-50/20 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <span>Preview Menu</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-12">
        {/* SECTION 2: COVER IMAGE */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <ImageIcon className="h-4 w-4 text-emerald-500" />
            Cover Image
          </h2>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row items-center gap-4">
            {coverUrl ? (
              <div className="relative w-full md:w-56 h-32 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-900 group">
                <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverUrl('')}
                  className="absolute top-2 right-2 bg-slate-950/70 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-all active:scale-90"
                  title="Remove Image"
                  aria-label="Remove cover image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-full md:w-56 h-32 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="h-8 w-8 text-slate-300" />
                <span className="text-[10px] mt-1">No Cover Image</span>
              </div>
            )}
            <div className="flex-1 w-full flex flex-col justify-center">
              <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 w-full md:w-auto px-6 py-3 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 bg-white hover:bg-emerald-50/10 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 text-center">
                <span>{uploadingCover ? 'Compressing & Uploading...' : 'Upload Cover Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-2">Landscape banner. Max file size: 500KB. Image is automatically compressed client-side before uploading.</p>
            </div>
          </div>
        </section>

        {/* SECTION 3: GENERAL CUSTOM TEXT */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              General Custom Text
            </h2>
            <p className="text-xs text-emerald-600 font-bold mt-1">This text is displayed on all menus. It will be shown above menu categories.</p>
          </div>
          <div className="space-y-2">
            <textarea
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Welcome to Tarapeza! We use 100% fresh and local ingredients. Please inform our staff about any allergies."
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none"
            />
            <p className="text-[10px] text-slate-400">This text will be shown on your public menu, above the menu categories.</p>
          </div>
        </section>

        {/* SECTION 4: LOGO */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            Logo
          </h2>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-6">
            <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Preview" className="h-full w-full object-cover" />
              ) : (
                <Building className="h-8 w-8 text-slate-350" />
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-5 py-2.5 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 bg-white hover:bg-emerald-50/10 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 text-center">
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1.5">Max file size: 200KB. Automatically compressed before uploading.</p>
            </div>
          </div>
        </section>

        {/* SECTION 5: GENERAL INFORMATION */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            General Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Van Gogh Cafe"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Menu URL</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs select-none">tarapeza.com/menu/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={!isEditingSlug}
                    className={`w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-36 pr-4 py-2.5 text-sm focus:outline-none transition-all ${
                      isEditingSlug ? 'text-slate-800' : 'text-slate-500 cursor-not-allowed'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingSlug(!isEditingSlug)}
                  className={`p-2.5 border rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer ${
                    isEditingSlug 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                      : 'border-slate-200 hover:border-slate-350 text-slate-550'
                  }`}
                  aria-label="Edit menu URL slug"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Art Avenue, Damascus, Syria"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Map Link</label>
              <input
                type="text"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Customers can tap to open in Google Maps, Yandex Maps, etc.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.restaurant.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: SOCIAL MEDIA */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <Globe className="h-4 w-4 text-emerald-500" />
            Social Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@restaurant"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Facebook</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">X / Twitter</label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@restaurant"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">TikTok</label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="@restaurant"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">YouTube</label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="@restaurant"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">TripAdvisor</label>
              <input
                type="text"
                value={tripadvisor}
                onChange={(e) => setTripadvisor(e.target.value)}
                placeholder="https://tripadvisor.com/..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* SECTION 7: WIFI DETAILS */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <Wifi className="h-4 w-4 text-emerald-500" />
            WiFi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">WiFi Name (SSID)</label>
              <input
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="WiFi Network SSID"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">WiFi Password</label>
              <div className="relative flex items-center">
                <input
                  type={showWifiPassword ? 'text' : 'password'}
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWifiPassword(!showWifiPassword)}
                  className="absolute right-3 text-slate-450 hover:text-slate-650 cursor-pointer"
                  aria-label="Toggle WiFi password visibility"
                >
                  {showWifiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: BUSINESS HOURS */}
        <section className="space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <Clock className="h-4 w-4 text-emerald-500" />
            Business Hours
          </h2>

          {/* Temporarily Closed Toggle */}
          <div className="border border-rose-200 bg-rose-50/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">Temporarily Close</h4>
              <p className="text-[10px] text-rose-600/75 mt-0.5">Toggle this if your store is closed for holidays, maintenance, etc. A closed banner will show on public menus.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={temporarilyClosed}
                onChange={(e) => setTemporarilyClosed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-250 border border-slate-200/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div className="max-w-xs">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Store Timezone</label>
              <select
                value={businessHours.timezone}
                onChange={handleTimezoneChange}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Day list schedule */}
            <div className="space-y-3.5 border-t border-slate-100 pt-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const dayData = businessHours.days[day] || { isOpen: false, periods: [] };
                return (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-start justify-between py-2 border-b border-slate-50 gap-3">
                    <div className="flex items-center gap-4 w-36 shrink-0">
                      <span className="text-xs font-bold text-slate-800">{day}</span>
                      <button
                        type="button"
                        onClick={() => toggleDayOpen(day)}
                        className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all active:scale-95 cursor-pointer ${
                          dayData.isOpen 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                            : 'bg-slate-100 text-slate-450 border border-slate-200'
                        }`}
                      >
                        {dayData.isOpen ? 'Open' : 'Closed'}
                      </button>
                    </div>

                    {dayData.isOpen ? (
                      <div className="flex-1 space-y-2">
                        {dayData.periods?.map((period, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={period.from}
                              onChange={(e) => updatePeriodTime(day, idx, 'from', e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <input
                              type="time"
                              value={period.to}
                              onChange={(e) => updatePeriodTime(day, idx, 'to', e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                            />
                            {dayData.periods.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePeriod(day, idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg active:scale-90 transition-all cursor-pointer"
                                aria-label="Remove time period"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addPeriod(day)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-600 transition-all cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add Period
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center h-[30px]">
                        <span className="text-[10px] font-bold text-slate-400 italic">No business hours active</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* STICKY BOTTOM ACTIONS BAR */}
      <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 py-4 px-6 -mx-6 -mb-6 md:-mx-8 md:-mb-8 mt-12 flex items-center justify-between rounded-b-3xl shadow-lg shadow-slate-100/50">
        <Link
          to={`/menu/${profile.slug}?preview=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <span>See Example Menu</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={handleSave}
          disabled={!isDirty || fetcher.state === 'submitting'}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
            isDirty && fetcher.state !== 'submitting'
              ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-[1.02] cursor-pointer'
              : 'bg-slate-150 text-slate-400 bg-slate-100 cursor-not-allowed'
          }`}
        >
          {isDirty && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          )}
          <span>Save Changes</span>
        </button>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

    </div>
  );
}
