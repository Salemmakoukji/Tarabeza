import { useState, useEffect } from 'react';
import { useOutletContext, useFetcher } from 'react-router';
import { createClient } from '../lib/supabase/server';
import { templates } from '../lib/templates';
import { Palette, Check, Save, Loader2, RefreshCw } from 'lucide-react';

export async function action({ request }) {
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const formData = await request.formData();
  const profileId = formData.get('profileId');
  const templateId = formData.get('templateId');
  const accentColor = formData.get('accentColor');
  const accentColor2 = formData.get('accentColor2') || '#ffffff';

  const { error } = await supabase
    .from('restaurants')
    .update({
      template_id: templateId,
      accent_color: accentColor,
      accent_color_2: accentColor2,
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

  // Local state initialized to active database profile properties
  const [templateId, setTemplateId] = useState(profile.template_id || 'classic');
  const [accentColor, setAccentColor] = useState(profile.accent_color || '#f97316');
  const [accentColor2, setAccentColor2] = useState(profile.accent_color_2 || '#ffffff');
  const [toast, setToast] = useState(null);

  // Preset accent colors
  const presetSwatches = [
    '#f97316', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#14b8a6', // Teal
  ];

  // Compare local states with original database values to verify unsaved modifications
  const isDirty = 
    templateId !== (profile.template_id || 'classic') ||
    accentColor !== (profile.accent_color || '#f97316');

  // Triggers action submission to save customization preferences
  const handleSave = () => {
    const formData = new FormData();
    formData.append('profileId', profile.id);
    formData.append('templateId', templateId);
    formData.append('accentColor', accentColor);
    formData.append('accentColor2', accentColor2);

    fetcher.submit(formData, { method: 'POST' });
    setToast({ type: 'saving', message: 'Saving your changes...' });
  };

  // Toast status hooks
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        setToast({ type: 'success', message: 'Customization saved successfully!' });
        
        // Update local context values dynamically to clear isDirty triggers
        profile.template_id = templateId;
        profile.accent_color = accentColor;
        profile.accent_color_2 = accentColor2;
      } else {
        setToast({ type: 'error', message: fetcher.data.error || 'Failed to save changes' });
      }
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.state, fetcher.data]);

  // Construct iframe preview URL
  const previewUrl = `/menu/${profile.slug}?preview=true&template=${templateId}&accent=${encodeURIComponent(accentColor)}`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] gap-6 p-1 text-slate-100">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Menu Customization</h1>
            <p className="text-slate-400 text-xs mt-0.5">Customize your interactive menu design and branding</p>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Settings Form (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Choose Your Style */}
          <div className="bg-[#111A2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Choose Your Style</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.map((tpl) => {
                const isActive = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={`flex flex-col text-start p-4 rounded-xl border transition-all relative overflow-hidden group ${
                      isActive 
                        ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <span className="text-2xl" role="img" aria-label={tpl.name}>
                        {tpl.emoji}
                      </span>
                      {isActive && (
                        <span className="bg-orange-500 text-slate-950 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                          <Check className="h-3 w-3 stroke-[3]" /> Active
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 mb-2">{tpl.name}</h3>

                    {/* Color Dots Circle Preview */}
                    <div className="flex items-center gap-1.5 mt-auto">
                      <span 
                        className="h-4.5 w-4.5 rounded-full border border-slate-800/30 shadow-inner" 
                        style={{ backgroundColor: tpl.bg }}
                        title={`Background: ${tpl.bg}`}
                      />
                      <span 
                        className="h-4.5 w-4.5 rounded-full border border-slate-800/30 shadow-inner" 
                        style={{ backgroundColor: tpl.cardBg }}
                        title={`Card BG: ${tpl.cardBg}`}
                      />
                      <span 
                        className="h-4.5 w-4.5 rounded-full border border-slate-800/30 shadow-inner" 
                        style={{ backgroundColor: tpl.text }}
                        title={`Text: ${tpl.text}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Your Brand Color */}
          <div className="bg-[#111A2E] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white">Your Brand Color</h2>
              <p className="text-xs text-slate-400 mt-1">
                This color will be used for buttons, highlights, category headings and active menu elements.
              </p>
            </div>

            <div className="space-y-6">
              {/* Preset Swatches list */}
              <div className="flex flex-wrap gap-3">
                {presetSwatches.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-9 w-9 rounded-xl border-2 transition-all relative ${
                      accentColor === color 
                        ? 'border-white scale-110 shadow-lg' 
                        : 'border-slate-800 hover:border-slate-600 hover:scale-105'
                    }`}
                  >
                    {accentColor === color && (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                        <Check className="h-4 w-4 stroke-[3.5]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Advanced Hex Input & Custom Color Picker */}
              <div className="flex items-center gap-4 max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-800">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="absolute inset-[-10px] h-20 w-20 cursor-pointer p-0 border-none"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    HEX Color Code
                  </span>
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.startsWith('#') && value.length <= 7) {
                        setAccentColor(value);
                      } else if (!value.startsWith('#') && value.length <= 6) {
                        setAccentColor('#' + value);
                      }
                    }}
                    placeholder="#f97316"
                    className="bg-transparent border-none text-white text-sm font-semibold focus:outline-none p-0 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Live Preview Iframe (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-[#111A2E] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[640px]">
            {/* Preview Panel Header */}
            <div className="bg-slate-950 border-b border-slate-800/80 py-3.5 px-4 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live Preview
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin-slow" />
                <span>Auto-refreshing</span>
              </div>
            </div>

            {/* Mobile View Frame */}
            <div className="flex-1 bg-slate-900 p-6 flex items-center justify-center relative overflow-hidden">
              <div className="relative w-full max-w-[320px] h-[520px] rounded-[36px] border-[6px] border-slate-950 bg-slate-950 shadow-2xl overflow-hidden">
                {/* Mobile Camera notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                </div>
                
                {/* Embed Menu Preview Page */}
                <iframe
                  title="Menu customization preview"
                  src={previewUrl}
                  className="w-full h-full border-none z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 p-4 rounded-xl flex items-center justify-between mt-8 shadow-2xl z-50 shrink-0">
        <div className="flex items-center gap-3">
          {isDirty ? (
            <span className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-xs text-orange-400 font-semibold tracking-wide uppercase">
                Unsaved Changes
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                All changes saved
              </span>
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!isDirty || fetcher.state === 'submitting'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
            isDirty && fetcher.state !== 'submitting'
              ? 'bg-orange-500 hover:bg-orange-600 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {fetcher.state === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
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
            {toast.type === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
