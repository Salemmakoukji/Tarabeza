import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useFetcher, Link } from 'react-router';
import { createClient } from '../lib/supabase/server';
import { Check, ExternalLink, ArrowRight, Eye } from 'lucide-react';

export async function action({ request }) {
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const formData = await request.formData();
  const profileId = formData.get('profileId');
  const display_mode = formData.get('display_mode');
  const image_size = formData.get('image_size');
  const font_size = formData.get('font_size');
  const layout_style = formData.get('layout_style');
  const theme = formData.get('theme');
  const main_color = formData.get('main_color');
  const font_family = formData.get('font_family');

  const { error } = await supabase
    .from('restaurants')
    .update({
      display_mode,
      image_size,
      font_size,
      layout_style,
      theme,
      main_color,
      font_family,
      updated_at: new Date().toISOString()
    })
    .eq('id', profileId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export default function CustomizeMenu() {
  const { profile } = useOutletContext();
  const fetcher = useFetcher();

  // State initialization with fallbacks
  const [displayMode, setDisplayMode] = useState(profile.display_mode || 'image-text');
  const [imageSize, setImageSize] = useState(profile.image_size || 'M');
  const [fontSize, setFontSize] = useState(profile.font_size || 'M');
  const [layoutStyle, setLayoutStyle] = useState(profile.layout_style || 'classic');
  const [theme, setTheme] = useState(profile.theme || 'light');
  const [mainColor, setMainColor] = useState(profile.main_color || '#f97316');
  const [customHex, setCustomHex] = useState(profile.main_color || '#f97316');
  const [fontFamily, setFontFamily] = useState(profile.font_family || 'Inter');
  const [toast, setToast] = useState(null);

  // Check for unsaved changes
  const isDirty = 
    displayMode !== (profile.display_mode || 'image-text') ||
    imageSize !== (profile.image_size || 'M') ||
    fontSize !== (profile.font_size || 'M') ||
    layoutStyle !== (profile.layout_style || 'classic') ||
    theme !== (profile.theme || 'light') ||
    mainColor !== (profile.main_color || '#f97316') ||
    fontFamily !== (profile.font_family || 'Inter');

  // Sync custom hex input with mainColor state when swatch selected
  const handleSelectColor = (hex) => {
    setMainColor(hex);
    setCustomHex(hex);
  };

  const handleCustomHexChange = (e) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setMainColor(val);
    }
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append('profileId', profile.id);
    formData.append('display_mode', displayMode);
    formData.append('image_size', imageSize);
    formData.append('font_size', fontSize);
    formData.append('layout_style', layoutStyle);
    formData.append('theme', theme);
    formData.append('main_color', mainColor);
    formData.append('font_family', fontFamily);

    fetcher.submit(formData, { method: 'POST' });
    setToast({ type: 'saving', message: 'Saving changes...' });
  };

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        setToast({ type: 'success', message: 'Appearance saved successfully!' });
        profile.display_mode = displayMode;
        profile.image_size = imageSize;
        profile.font_size = fontSize;
        profile.layout_style = layoutStyle;
        profile.theme = theme;
        profile.main_color = mainColor;
        profile.font_family = fontFamily;
      } else {
        setToast({ type: 'error', message: fetcher.data.error || 'Failed to save configuration' });
      }
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.state, fetcher.data]);

  // Color Swatch Swatches array
  const swatches = [
    { name: 'Orange', hex: '#f97316' },
    { name: 'Red', hex: '#ef4444' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Lime', hex: '#84cc16' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' }
  ];

  // Google Font choices
  const fonts = [
    { name: 'Inter', arabic: false },
    { name: 'Poppins', arabic: false },
    { name: 'Montserrat', arabic: false },
    { name: 'Playfair Display', arabic: false },
    { name: 'Lora', arabic: false },
    { name: 'Cairo', arabic: true },
    { name: 'Tajawal', arabic: true },
    { name: 'Nunito', arabic: false },
    { name: 'Raleway', arabic: false },
    { name: 'DM Sans', arabic: false }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white text-slate-800 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/60 relative select-none">
      
      {/* Font preloader for card preview renders */}
      <link 
        rel="stylesheet" 
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=DM+Sans:wght@400;700&family=Inter:wght@400;700&family=Lora:wght@400;700&family=Montserrat:wght@400;700&family=Nunito:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Tajawal:wght@400;700&display=swap" 
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Design & Customization</h1>
          <p className="text-sm text-slate-500 mt-1">Configure layout, colors, typography, and display parameters for your menu.</p>
        </div>
        <Link
          to={`/menu/${profile.slug}?preview=true`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-orange-500 text-xs font-bold text-slate-600 hover:text-orange-500 bg-white hover:bg-orange-50/20 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <span>Preview Menu</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-12">
        {/* SECTION 1: DISPLAY MODE */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
            Choose Display Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'image-text', name: 'Image + Text', desc: 'Photos & text description' },
              { id: 'image', name: 'Image Only', desc: 'Visual card grids' },
              { id: 'text', name: 'Text Only', desc: 'Clean, text list' }
            ].map((opt) => {
              const selected = displayMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setDisplayMode(opt.id)}
                  className={`p-4 text-start rounded-2xl border-2 transition-all relative ${
                    selected 
                      ? 'border-orange-500 bg-orange-50/10' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{opt.name}</span>
                    {selected && <Check className="h-4 w-4 text-orange-500 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: IMAGE SIZE */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
            Image Size
          </h2>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'XS', name: 'XS', val: '90px' },
              { id: 'S', name: 'S', val: '120px' },
              { id: 'M', name: 'M', val: '160px' },
              { id: 'L', name: 'L', val: '200px' },
              { id: 'XL', name: 'XL', val: '250px' }
            ].map((opt) => {
              const selected = imageSize === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setImageSize(opt.id)}
                  className={`px-6 py-3.5 rounded-xl border-2 transition-all font-bold text-xs flex items-center gap-2 ${
                    selected 
                      ? 'border-orange-500 bg-orange-50/10 text-orange-600' 
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <span>{opt.name}</span>
                  <span className="opacity-60 text-[10px] font-normal">({opt.val})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: FONT SIZE */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
            Font Size
          </h2>
          <div className="flex gap-3">
            {[
              { id: 'S', name: 'S - Small' },
              { id: 'M', name: 'M - Medium' },
              { id: 'L', name: 'L - Large' }
            ].map((opt) => {
              const selected = fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFontSize(opt.id)}
                  className={`px-6 py-3.5 rounded-xl border-2 transition-all font-bold text-xs ${
                    selected 
                      ? 'border-orange-500 bg-orange-50/10 text-orange-600' 
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: CHOOSE LAYOUT */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
              Choose a layout for your digital menu
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select the structure of categories, tabs, and columns for your layout.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {[
              { id: 'classic', name: 'Classic', desc: 'Clean list layout', badge: 'Free' },
              { id: 'tab', name: 'Tab', desc: 'Categories as tabs', badge: 'Pro' },
              { id: 'sidebar', name: 'Sidebar', desc: 'Sidebar categories', badge: 'Pro' },
              { id: 'grid', name: 'Grid', desc: '2-column card grid', badge: 'Free' }
            ].map((opt) => {
              const selected = layoutStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setLayoutStyle(opt.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-start relative group cursor-pointer ${
                    selected 
                      ? 'border-orange-500 bg-orange-50/5' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  {/* Selected checkmark */}
                  {selected && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 z-10">
                      <Check className="h-3.5 w-3.5 stroke-[4]" />
                    </div>
                  )}

                  {/* Visual mockup representation inside a phone frame */}
                  <div className={`w-full aspect-[9/16] rounded-xl border border-slate-200 relative overflow-hidden bg-slate-50 flex flex-col p-1.5 text-[5px] leading-tight select-none shadow-sm ${
                    theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-white text-slate-800'
                  }`}>
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-900/90 rounded-b-[4px]"></div>
                    
                    {/* Simulated Header */}
                    <div className="border-b border-slate-100/50 py-1.5 px-0.5 flex flex-col items-center mt-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-200 mb-0.5" />
                      <div className="w-10 h-1 bg-slate-350 bg-slate-300 rounded" />
                    </div>

                    {/* Render phone screen layouts */}
                    {opt.id === 'classic' && (
                      <div className="flex-1 overflow-hidden py-1 space-y-1.5">
                        <div className="w-12 h-1 bg-slate-400 rounded" />
                        <div className="space-y-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-1 border border-slate-100 p-0.5 rounded">
                              <div className="w-4 h-4 bg-slate-200 rounded" />
                              <div className="flex-1 space-y-0.5">
                                <div className="w-8 h-1 bg-slate-300 rounded" />
                                <div className="w-12 h-0.5 bg-slate-200 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {opt.id === 'tab' && (
                      <div className="flex-1 overflow-hidden py-1 space-y-1.5 flex flex-col">
                        <div className="flex gap-1 overflow-x-auto pb-0.5">
                          <div className="px-1.5 py-0.5 bg-orange-500 text-white rounded-full font-bold text-[3px]">Cat 1</div>
                          <div className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[3px]">Cat 2</div>
                          <div className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[3px]">Cat 3</div>
                        </div>
                        <div className="space-y-1 flex-1">
                          {[1, 2].map(i => (
                            <div key={i} className="flex gap-1 border border-slate-100 p-0.5 rounded">
                              <div className="w-4 h-4 bg-slate-200 rounded" />
                              <div className="flex-1 space-y-0.5">
                                <div className="w-8 h-1 bg-slate-300 rounded" />
                                <div className="w-10 h-0.5 bg-slate-200 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {opt.id === 'sidebar' && (
                      <div className="flex-1 overflow-hidden py-1 flex gap-1">
                        <div className="w-7 shrink-0 border-r border-slate-100 space-y-0.5 flex flex-col pt-0.5">
                          <div className="w-full h-1 bg-orange-500 rounded-sm" />
                          <div className="w-5 h-1 bg-slate-100 rounded-sm" />
                          <div className="w-6 h-1 bg-slate-100 rounded-sm" />
                        </div>
                        <div className="flex-1 space-y-1">
                          {[1, 2].map(i => (
                            <div key={i} className="flex gap-1 border border-slate-100 p-0.5 rounded">
                              <div className="w-3 h-3 bg-slate-200 rounded" />
                              <div className="flex-1 space-y-0.5">
                                <div className="w-6 h-1 bg-slate-300 rounded" />
                                <div className="w-8 h-0.5 bg-slate-250 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {opt.id === 'grid' && (
                      <div className="flex-1 overflow-hidden py-1 space-y-1 flex flex-col">
                        <div className="w-12 h-1 bg-slate-400 rounded" />
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="border border-slate-100 p-0.5 rounded flex flex-col gap-0.5">
                              <div className="w-full h-4 bg-slate-200 rounded" />
                              <div className="w-8 h-1 bg-slate-300 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Info below mockup */}
                  <div className="mt-3 flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-800">{opt.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      opt.badge === 'Pro' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 w-full">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: THEME */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
            Light or Dark Theme
          </h2>
          <div className="grid grid-cols-2 gap-6 max-w-lg">
            {[
              { id: 'light', name: 'Light Theme', bg: 'bg-white text-slate-800' },
              { id: 'dark', name: 'Dark Theme', bg: 'bg-slate-950 text-slate-100' }
            ].map((opt) => {
              const selected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-start relative group cursor-pointer ${
                    selected 
                      ? 'border-orange-500 bg-orange-50/5' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 z-10">
                      <Check className="h-3.5 w-3.5 stroke-[4]" />
                    </div>
                  )}

                  {/* Theme Mockup Frame */}
                  <div className={`w-full aspect-[9/13] rounded-xl border border-slate-200 relative overflow-hidden flex flex-col p-2 text-[5px] shadow-sm ${opt.bg}`}>
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-900 rounded-b-[4px]"></div>

                    {/* Header */}
                    <div className="border-b border-current/10 py-1.5 px-0.5 flex flex-col items-center mt-1">
                      <div className="w-4 h-4 rounded-full bg-orange-500" />
                      <div className="w-10 h-1 bg-current/30 rounded mt-0.5" />
                    </div>

                    {/* Content list */}
                    <div className="flex-1 overflow-hidden py-2 space-y-1.5">
                      <div className="w-12 h-1 bg-current/40 rounded" />
                      {[1, 2].map(i => (
                        <div key={i} className="flex gap-1 border border-current/10 p-0.5 rounded">
                          <div className="w-4 h-4 bg-current/10 rounded" />
                          <div className="flex-1 space-y-0.5">
                            <div className="w-8 h-1 bg-current/30 rounded" />
                            <div className="w-12 h-0.5 bg-current/10 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-800 mt-2.5">{opt.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: MAIN COLOR */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
              Main Color
            </h2>
            <p className="text-xs text-slate-500 mt-1">This sets the primary brand accent color used for icons, active category highlights, prices, and CTA buttons.</p>
          </div>

          <div className="space-y-6">
            {/* Swatch Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3 max-w-2xl">
              {swatches.map((col) => {
                const selected = mainColor.toLowerCase() === col.hex;
                return (
                  <button
                    key={col.hex}
                    onClick={() => handleSelectColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className="aspect-square rounded-xl shadow-sm border border-slate-200/40 relative flex items-center justify-center cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                    title={col.name}
                  >
                    {selected && (
                      <div className="bg-white text-slate-900 rounded-full p-0.5 shadow-md border border-slate-200">
                        <Check className="h-3 w-3 stroke-[4]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom hex input */}
            <div className="max-w-xs">
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Custom HEX Color</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 shadow-inner"
                  style={{ backgroundColor: mainColor }}
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={handleCustomHexChange}
                  placeholder="#f97316"
                  maxLength={7}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all uppercase"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: CHOOSE FONT */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
              Choose Font
            </h2>
            <p className="text-xs text-slate-500 mt-1">Select the typography style for your heading and menu text.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {fonts.map((f) => {
              const selected = fontFamily === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setFontFamily(f.name)}
                  className={`p-4 rounded-xl border-2 transition-all text-start flex flex-col justify-between h-28 relative cursor-pointer ${
                    selected 
                      ? 'border-orange-500 bg-orange-50/5' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex justify-between items-start w-full gap-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{f.name}</span>
                    {f.arabic && (
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-100">
                        ARABIC
                      </span>
                    )}
                  </div>
                  
                  {/* Large visual rendering of font name in its own family */}
                  <span 
                    style={{ fontFamily: `"${f.name}", sans-serif` }}
                    className="text-lg font-bold text-slate-800 leading-tight block w-full mt-2"
                  >
                    {f.name}
                  </span>

                  {selected && (
                    <div className="absolute bottom-3 right-3 bg-emerald-500 text-white rounded-full p-0.5">
                      <Check className="h-3 w-3 stroke-[4]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* BOTTOM STICKY BAR */}
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

      {/* Toast Alert Notification */}
      {toast && (
        <div className="fixed bottom-24 right-8 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 ${
            toast.type === 'success' 
              ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
              : toast.type === 'error' 
                ? 'bg-rose-950 border-rose-800 text-rose-300' 
                : 'bg-slate-900 border-slate-800 text-orange-400'
          }`}>
            {toast.type === 'saving' && <Eye className="h-4 w-4 animate-spin" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
