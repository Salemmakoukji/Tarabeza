import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useFetcher, Link } from 'react-router';
import { createClient } from '../lib/supabase/server';
import { templates, getTemplateDefaults, googleFontsList, generateCssStyles } from '../lib/templates';
import ColorPicker from '../components/color-picker';
import { 
  Palette, Sliders, Type, Layout, Award, Settings, Check, 
  Save, RotateCcw, Smartphone, Tablet, Monitor, ExternalLink, 
  Eye, HelpCircle, Code, Plus, Trash2, ArrowRight
} from 'lucide-react';

export async function action({ request }) {
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const formData = await request.formData();
  const profileId = formData.get('profileId');
  const templateId = formData.get('templateId');
  const customization = formData.get('customization');

  const { error } = await supabase
    .from('restaurants')
    .update({
      template_id: templateId,
      customization: JSON.parse(customization),
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

  // State initialization: load from db customization JSON or merge with template defaults
  const [templateId, setTemplateId] = useState(profile.template_id || 'classic');
  
  const getInitialCustomization = () => {
    const dbValue = profile.customization || {};
    const defaultTpl = getTemplateDefaults(profile.template_id || 'classic');
    return {
      colors: { ...defaultTpl.colors, ...dbValue.colors },
      fonts: { ...defaultTpl.fonts, ...dbValue.fonts },
      layout: { ...defaultTpl.layout, ...dbValue.layout },
      badges: { ...defaultTpl.badges, ...dbValue.badges },
      customCss: dbValue.customCss || ''
    };
  };

  const [customization, setCustomization] = useState(getInitialCustomization);
  const [activeTab, setActiveTab] = useState('templates');
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile' | 'tablet' | 'desktop'
  const [toast, setToast] = useState(null);

  // Check if there are unsaved changes
  const isDirty = 
    templateId !== (profile.template_id || 'classic') ||
    JSON.stringify(customization) !== JSON.stringify(profile.customization || getTemplateDefaults(profile.template_id || 'classic'));

  // Quick preset swatches list
  const presetSwatches = ['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#22c55e', '#ec4899', '#f59e0b', '#14b8a6'];

  const updateColor = (key, val) => {
    setCustomization(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: val }
    }));
  };

  const updateFont = (key, val) => {
    setCustomization(prev => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: val }
    }));
  };

  const updateLayout = (key, val) => {
    setCustomization(prev => ({
      ...prev,
      layout: { ...prev.layout, [key]: val }
    }));
  };

  const updateBadge = (badgeKey, field, val) => {
    setCustomization(prev => ({
      ...prev,
      badges: {
        ...prev.badges,
        [`show${badgeKey}`]: field === 'show' ? val : prev.badges[`show${badgeKey}`],
        [`${badgeKey.toLowerCase()}Label`]: field === 'label' ? val : prev.badges[`${badgeKey.toLowerCase()}Label`],
        [`${badgeKey.toLowerCase()}Color`]: field === 'color' ? val : prev.badges[`${badgeKey.toLowerCase()}Color`],
      }
    }));
  };

  const handleSelectTemplate = (tplId) => {
    setTemplateId(tplId);
    const defaults = getTemplateDefaults(tplId);
    setCustomization(defaults);
  };

  const handleResetToTemplate = () => {
    const defaults = getTemplateDefaults(templateId);
    setCustomization(defaults);
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.append('profileId', profile.id);
    formData.append('templateId', templateId);
    formData.append('customization', JSON.stringify(customization));

    fetcher.submit(formData, { method: 'POST' });
    setToast({ type: 'saving', message: 'Saving customization...' });
  };

  // Toast status hooks
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.success) {
        setToast({ type: 'success', message: 'Appearance saved successfully!' });
        profile.template_id = templateId;
        profile.customization = customization;
      } else {
        setToast({ type: 'error', message: fetcher.data.error || 'Failed to save configuration' });
      }
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [fetcher.state, fetcher.data]);

  // Construct preview variable definitions
  const previewStyles = {
    '--color-bg': customization.colors.background,
    '--color-card-bg': customization.colors.cardBackground,
    '--color-text': customization.colors.primaryText,
    '--color-text-secondary': customization.colors.secondaryText,
    '--color-accent': customization.colors.accent,
    '--color-border': customization.colors.border,
    '--color-tab-active': customization.colors.tabActive,
    '--color-tab-active-text': customization.colors.tabActiveText,
    '--color-tab-inactive': customization.colors.tabInactive,
    '--color-tab-inactive-text': customization.colors.tabInactiveText,
    '--color-price': customization.colors.price,
    '--color-badge': customization.colors.badge,
    '--color-header': customization.colors.header,

    '--font-heading': `"${customization.fonts.heading}", sans-serif`,
    '--font-body': `"${customization.fonts.body}", sans-serif`,
    '--font-heading-size': `${customization.fonts.headingSize}px`,
    '--font-body-size': `${customization.fonts.bodySize}px`,
    '--font-heading-weight': customization.fonts.headingWeight,
    '--font-body-weight': customization.fonts.bodyWeight,
    '--letter-spacing': `${customization.fonts.letterSpacing}px`,
    '--line-height': customization.fonts.lineHeight,

    '--card-radius': `${customization.layout.cardRadius}px`,
    '--card-padding': `${customization.layout.cardPadding}px`,
    '--image-radius': `${customization.layout.imageRadius}px`,
    '--banner-height': `${customization.layout.bannerHeight}px`,
  };

  // Google Font URL builder
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(customization.fonts.heading)}:wght@400;650;700;800&family=${encodeURIComponent(customization.fonts.body)}:wght@300;400;600&display=swap`;

  // Resolved shadow class for mock menu
  const getShadowClass = () => {
    switch (customization.layout.cardShadow) {
      case 'sm': return 'shadow-sm';
      case 'md': return 'shadow-md';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      default: return 'shadow-none';
    }
  };

  // Custom Category Tab styling resolved class helpers
  const getCategoryTabClass = (isActive) => {
    if (customization.layout.tabStyle === 'pills') {
      return isActive 
        ? 'bg-[var(--color-tab-active)] text-[var(--color-tab-active-text)] rounded-full'
        : 'bg-[var(--color-tab-inactive)] text-[var(--color-tab-inactive-text)] rounded-full';
    } else if (customization.layout.tabStyle === 'underline') {
      return isActive
        ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)] font-bold rounded-none'
        : 'border-b-2 border-transparent text-[var(--color-text-secondary)] rounded-none';
    } else if (customization.layout.tabStyle === 'boxed') {
      return isActive
        ? 'bg-[var(--color-tab-active)] text-[var(--color-tab-active-text)] rounded-lg'
        : 'bg-[var(--color-tab-inactive)] text-[var(--color-tab-inactive-text)] border border-[var(--color-border)] rounded-lg';
    } else { // minimal
      return isActive
        ? 'text-[var(--color-accent)] font-extrabold rounded-none'
        : 'text-[var(--color-text-secondary)] rounded-none';
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] -m-6 md:-m-8 bg-[#0F1524] border border-slate-800 rounded-none overflow-hidden select-none">
      
      {/* Dynamic Font Loader Link */}
      <link rel="stylesheet" href={fontUrl} />

      {/* LEFT PANEL - Controls (40% width) */}
      <div className="w-[40%] border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden shrink-0">
        
        {/* Sticky Control Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Customize Menu</h2>
            {isDirty && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetToTemplate}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || fetcher.state === 'submitting'}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                isDirty && fetcher.state !== 'submitting'
                  ? 'bg-orange-500 hover:bg-orange-600 text-slate-950 hover:scale-[1.02] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-3.5 w-3.5" /> Save Changes
            </button>
          </div>
        </div>

        {/* Tab Controls Navigation List */}
        <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'templates', label: 'Templates', icon: Eye },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'typography', label: 'Fonts', icon: Type },
            { id: 'layout', label: 'Layout', icon: Layout },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'advanced', label: 'CSS', icon: Code }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-orange-500 text-white bg-slate-950' 
                    : 'border-transparent text-slate-450 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents Pane (Scrolling Container) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Tab 1: Templates Panel */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Select a layout preset to instantly customize colors, fonts, and styles.</p>
              <div className="grid grid-cols-2 gap-3.5">
                {templates.map((tpl) => {
                  const isActive = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`flex flex-col text-start p-3.5 rounded-xl border transition-all relative overflow-hidden group ${
                        isActive
                          ? 'border-orange-500 bg-orange-500/5'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3 w-full">
                        <span className="text-2xl">{tpl.emoji}</span>
                        {isActive && <Check className="h-4 w-4 text-orange-500 stroke-[3]" />}
                      </div>
                      
                      {/* Mini colored squares strip */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="h-3 w-3 rounded-full border border-slate-800/20" style={{ backgroundColor: tpl.colors.background }} />
                        <span className="h-3 w-3 rounded-full border border-slate-800/20" style={{ backgroundColor: tpl.colors.cardBackground }} />
                        <span className="h-3 w-3 rounded-full border border-slate-800/20" style={{ backgroundColor: tpl.colors.accent }} />
                      </div>

                      <span className="text-xs font-bold text-slate-100">{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Colors Panel */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              
              {/* Block 1: BG & Cards */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-slate-400 mb-2">Background & Cards</h3>
                <ColorPicker label="Page Background" value={customization.colors.background} onChange={(val) => updateColor('background', val)} />
                <ColorPicker label="Card Background" value={customization.colors.cardBackground} onChange={(val) => updateColor('cardBackground', val)} />
                <ColorPicker label="Header Background" value={customization.colors.header} onChange={(val) => updateColor('header', val)} />
                <ColorPicker label="Borders & Separators" value={customization.colors.border} onChange={(val) => updateColor('border', val)} />
              </div>

              {/* Block 2: Text typography */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-slate-400 mb-2">Typography & Content</h3>
                <ColorPicker label="Primary Text" value={customization.colors.primaryText} onChange={(val) => updateColor('primaryText', val)} />
                <ColorPicker label="Secondary Text" value={customization.colors.secondaryText} onChange={(val) => updateColor('secondaryText', val)} />
                <ColorPicker label="Prices Accent" value={customization.colors.price} onChange={(val) => updateColor('price', val)} />
              </div>

              {/* Block 3: Accent Highlights */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-slate-400 mb-2">Accents & Category Tabs</h3>
                <ColorPicker label="Primary Brand Accent" value={customization.colors.accent} onChange={(val) => updateColor('accent', val)} />
                <ColorPicker label="Active Tab Background" value={customization.colors.tabActive} onChange={(val) => updateColor('tabActive', val)} />
                <ColorPicker label="Active Tab Text" value={customization.colors.tabActiveText} onChange={(val) => updateColor('tabActiveText', val)} />
                <ColorPicker label="Inactive Tab Background" value={customization.colors.tabInactive} onChange={(val) => updateColor('tabInactive', val)} />
                <ColorPicker label="Inactive Tab Text" value={customization.colors.tabInactiveText} onChange={(val) => updateColor('tabInactiveText', val)} />
              </div>

            </div>
          )}

          {/* Tab 3: Typography Panel */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              
              {/* Heading Fonts block */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Heading Typography</h3>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Font Family</label>
                  <select
                    value={customization.fonts.heading}
                    onChange={(e) => updateFont('heading', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {googleFontsList.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Font Size</label>
                    <span className="text-xs font-bold text-orange-500">{customization.fonts.headingSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={customization.fonts.headingSize}
                    onChange={(e) => updateFont('headingSize', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Font Weight</label>
                  <select
                    value={customization.fonts.headingWeight}
                    onChange={(e) => updateFont('headingWeight', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {['300', '400', '500', '600', '700', '800'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {/* Body Typography block */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Body Typography</h3>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Font Family</label>
                  <select
                    value={customization.fonts.body}
                    onChange={(e) => updateFont('body', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {googleFontsList.map(font => <option key={font} value={font}>{font}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Font Size</label>
                    <span className="text-xs font-bold text-orange-500">{customization.fonts.bodySize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={customization.fonts.bodySize}
                    onChange={(e) => updateFont('bodySize', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Font Weight</label>
                  <select
                    value={customization.fonts.bodyWeight}
                    onChange={(e) => updateFont('bodyWeight', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {['300', '400', '500', '600', '700'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {/* Spacing Spreads block */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Spacing Details</h3>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Letter Spacing</label>
                    <span className="text-xs font-bold text-orange-500">{customization.fonts.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="8"
                    value={customization.fonts.letterSpacing}
                    onChange={(e) => updateFont('letterSpacing', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Line Height</label>
                    <span className="text-xs font-bold text-orange-500">{customization.fonts.lineHeight}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.1"
                    value={customization.fonts.lineHeight}
                    onChange={(e) => updateFont('lineHeight', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Tab 4: Layout Panel */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              
              {/* Card Style Selector */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">Card Style</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'grid-2', label: '2 Col Grid' },
                    { id: 'grid-3', label: '3 Col Grid' },
                    { id: 'list', label: 'Horizontal List' },
                    { id: 'compact', label: 'Compact List' },
                    { id: 'magazine', label: 'Magazine' },
                    { id: 'full', label: 'Full Width' }
                  ].map((style) => {
                    const isSelected = customization.layout.cardStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => updateLayout('cardStyle', style.id)}
                        className={`py-2.5 px-1.5 rounded-lg border text-center text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-slate-800 bg-slate-900/40 text-slate-450 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Images block */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Image Rendering</h3>
                
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-200">Show Item Images</span>
                  <input
                    type="checkbox"
                    checked={customization.layout.showImage}
                    onChange={(e) => updateLayout('showImage', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </div>

                {customization.layout.showImage && (
                  <>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Image Alignment</label>
                      <select
                        value={customization.layout.imagePosition}
                        onChange={(e) => updateLayout('imagePosition', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                      >
                        {['top', 'left', 'right', 'background'].map(pos => (
                          <option key={pos} value={pos}>{pos.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Image Corner Radius</label>
                        <span className="text-xs font-bold text-orange-500">{customization.layout.imageRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={customization.layout.imageRadius}
                        onChange={(e) => updateLayout('imageRadius', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Cards details block */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Card Properties</h3>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Card Corner Radius</label>
                    <span className="text-xs font-bold text-orange-500">{customization.layout.cardRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={customization.layout.cardRadius}
                    onChange={(e) => updateLayout('cardRadius', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Card Inner Padding</label>
                    <span className="text-xs font-bold text-orange-500">{customization.layout.cardPadding}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={customization.layout.cardPadding}
                    onChange={(e) => updateLayout('cardPadding', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Card Drop Shadow</label>
                  <select
                    value={customization.layout.cardShadow}
                    onChange={(e) => updateLayout('cardShadow', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {['none', 'sm', 'md', 'lg', 'xl'].map(sh => (
                      <option key={sh} value={sh}>{sh.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category tabs block */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Selection Tabs</h3>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Tab Styling</label>
                  <select
                    value={customization.layout.tabStyle}
                    onChange={(e) => updateLayout('tabStyle', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {['pills', 'underline', 'boxed', 'minimal'].map(style => (
                      <option key={style} value={style}>{style.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Tab Alignment Position</label>
                  <select
                    value={customization.layout.tabPosition}
                    onChange={(e) => updateLayout('tabPosition', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {['top', 'side'].map(pos => (
                      <option key={pos} value={pos}>{pos.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menu Content display toggles */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Content Toggles</h3>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-200">Show Descriptions</span>
                  <input
                    type="checkbox"
                    checked={customization.layout.showDescription}
                    onChange={(e) => updateLayout('showDescription', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-200">Show Calories Count</span>
                  <input
                    type="checkbox"
                    checked={customization.layout.showCalories}
                    onChange={(e) => updateLayout('showCalories', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-200">Show Badges</span>
                  <input
                    type="checkbox"
                    checked={customization.layout.showBadges}
                    onChange={(e) => updateLayout('showBadges', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-200">Show Currency Tag</span>
                  <input
                    type="checkbox"
                    checked={customization.layout.showCurrency}
                    onChange={(e) => updateLayout('showCurrency', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                  />
                </div>
                {customization.layout.showCurrency && (
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Currency Symbol</label>
                    <input
                      type="text"
                      value={customization.layout.currency}
                      onChange={(e) => updateLayout('currency', e.target.value)}
                      placeholder="$"
                      className="w-full bg-slate-900 border border-slate-805 border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* Header Style Config */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Banner & Header</h3>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Header Layout</label>
                  <select
                    value={customization.layout.headerStyle}
                    onChange={(e) => updateLayout('headerStyle', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                  >
                    {['logo-only', 'logo-banner', 'full-banner'].map(hdr => (
                      <option key={hdr} value={hdr}>{hdr.toUpperCase().replace('-', ' + ')}</option>
                    ))}
                  </select>
                </div>
                {customization.layout.headerStyle !== 'logo-only' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Banner Height</label>
                      <span className="text-xs font-bold text-orange-500">{customization.layout.bannerHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="300"
                      value={customization.layout.bannerHeight}
                      onChange={(e) => updateLayout('bannerHeight', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Tab 5: Badges Panel */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              {[
                { key: 'New', label: 'New Dish Tag' },
                { key: 'Popular', label: 'Best Seller Tag' },
                { key: 'Spicy', label: 'Spicy Hot Tag' },
                { key: 'Vegan', label: 'Vegan Tag' },
                { key: 'Halal', label: 'Halal Tag' }
              ].map((badge) => {
                const showVal = customization.badges[`show${badge.key}`];
                const textVal = customization.badges[`${badge.key.toLowerCase()}Label`];
                const colorVal = customization.badges[`${badge.key.toLowerCase()}Color`];
                return (
                  <div key={badge.key} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">{badge.label}</h3>
                      <input
                        type="checkbox"
                        checked={showVal}
                        onChange={(e) => updateBadge(badge.key, 'show', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                      />
                    </div>
                    
                    {showVal && (
                      <div className="space-y-3.5 pt-2.5 border-t border-slate-800/60">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">Label Text</label>
                          <input
                            type="text"
                            value={textVal}
                            onChange={(e) => updateBadge(badge.key, 'label', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <ColorPicker
                          label="Badge Base Color"
                          value={colorVal}
                          onChange={(val) => updateBadge(badge.key, 'color', val)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 6: Advanced Panel */}
          {activeTab === 'advanced' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-350 flex items-center gap-1">
                  <Code className="h-4 w-4" /> Custom CSS Editor
                </span>
                <button
                  onClick={() => setCustomization(prev => ({ ...prev, customCss: "" }))}
                  className="text-[10px] text-slate-450 hover:text-white uppercase font-bold transition-all cursor-pointer"
                >
                  Clear styles
                </button>
              </div>

              <textarea
                value={customization.customCss}
                onChange={(e) => setCustomization(prev => ({ ...prev, customCss: e.target.value }))}
                placeholder="/* Scopes with .tarapeza-public-menu */&#10;.custom-menu-card {&#10;  border-width: 2px !important;&#10;}"
                className="w-full flex-1 min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-orange-500 resize-y"
              />

              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] p-3 rounded-lg flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">⚠️</span>
                <span>
                  <strong>Warning:</strong> Custom CSS overrides template variables and layout styles. Write scoping classes safely.
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT PANEL - Mock Live Preview (60% width) */}
      <div className="w-[60%] bg-[#0A0F1D] flex flex-col overflow-hidden">
        
        {/* Preview Panel Header */}
        <div className="h-14 border-b border-slate-800 px-6 items-center justify-between bg-slate-950 shrink-0 flex">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Mock Design Canvas</span>
          </div>

          {/* Device toggle list */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-1">
            {[
              { id: 'mobile', icon: Smartphone, label: 'Mobile' },
              { id: 'tablet', icon: Tablet, label: 'Tablet' },
              { id: 'desktop', icon: Monitor, label: 'Desktop' }
            ].map((device) => {
              const Icon = device.icon;
              return (
                <button
                  key={device.id}
                  onClick={() => setPreviewDevice(device.id)}
                  title={device.label}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === device.id
                      ? 'bg-orange-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-250 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          <a
            href={`/menu/${profile.slug}?preview=true`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open real menu in new tab"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Live Mock Render Viewport */}
        <div className="flex-1 overflow-y-auto bg-[#080B14] p-8 flex items-start justify-center">
          
          <div
            style={{
              width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className={`bg-slate-900/10 ${
              previewDevice !== 'desktop' 
                ? 'rounded-[36px] border-[8px] border-slate-950 shadow-2xl relative overflow-hidden' 
                : 'w-full rounded-none border-none'
            }`}
          >
            {/* Notch if Mobile device */}
            {previewDevice === 'mobile' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-850 bg-slate-800" />
              </div>
            )}

            {/* Inner canvas container */}
            <div 
              style={previewStyles}
              className="tarapeza-public-menu w-full h-[600px] overflow-y-auto no-scrollbar pt-6 pb-20 relative select-none"
            >
              
              {/* Dynamic CSS rules injected inside mockup scope */}
              <style dangerouslySetInnerHTML={{ __html: generateCssStyles(customization) }} />

              {/* 1. Header Layout */}
              <div className="w-full shrink-0 flex flex-col items-center justify-center p-6 border-b border-[var(--color-border)] bg-[var(--color-header)] relative">
                {customization.layout.headerStyle !== 'logo-only' && (
                  <div 
                    style={{ height: `${customization.layout.bannerHeight - 60}px` }}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 z-0 bg-slate-800"
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-14 w-14 rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] shadow-md flex items-center justify-center text-lg font-black overflow-hidden mb-2">
                    {profile?.logo_url ? <img src={profile.logo_url} alt="Logo" className="h-full w-full object-cover" /> : '🍽️'}
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{profile.name}</h1>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 max-w-xs text-center">Interactive visual QR menu mockup preview</p>
                </div>
              </div>

              {/* 2. Category Tabs list */}
              <div className="sticky top-0 z-20 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'cat1', label: 'Appetizers' },
                  { id: 'cat2', label: 'Main Courses' },
                  { id: 'cat3', label: 'Desserts & Drinks' }
                ].map((cat, idx) => {
                  const active = idx === 1;
                  return (
                    <span
                      key={cat.id}
                      className={`shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-default transition-all ${getCategoryTabClass(active)}`}
                    >
                      {cat.label}
                    </span>
                  );
                })}
              </div>

              {/* 3. Cards grid view */}
              <div className="p-4 space-y-6">
                
                {/* Category Header */}
                <h3 className="text-xs font-extrabold text-[var(--color-text)] tracking-wider uppercase">Main Courses</h3>
                
                {/* Menu items layout mapper */}
                <div className={
                  customization.layout.cardStyle === 'grid-3' ? 'grid grid-cols-3 gap-2.5' :
                  customization.layout.cardStyle === 'grid-2' ? 'grid grid-cols-2 gap-3.5' :
                  'space-y-4'
                }>
                  {[
                    {
                      id: 'item1',
                      name: 'Smoked Truffle Burger',
                      desc: 'Grilled Angus beef patty, melted gruyere, black truffle aioli, brioche bun.',
                      price: '18.99',
                      cal: '750 kcal',
                      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                      isNew: true,
                      isPopular: false
                    },
                    {
                      id: 'item2',
                      name: 'Crispy Lemon Salmon',
                      desc: 'Pan-seared Atlantic salmon, wild asparagus, citrus reduction butter, dill.',
                      price: '24.50',
                      cal: '540 kcal',
                      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
                      isNew: false,
                      isPopular: true
                    }
                  ].map((item, itemIdx) => {
                    const showImage = customization.layout.showImage;
                    const imgPos = customization.layout.imagePosition;
                    const isCompact = customization.layout.cardStyle === 'compact';
                    const isMagazine = customization.layout.cardStyle === 'magazine';
                    const isImageRight = isMagazine ? (itemIdx % 2 === 1) : (imgPos === 'right');
                    
                    return (
                      <div
                        key={item.id}
                        className={`custom-menu-card overflow-hidden flex transition-all duration-300 ${getShadowClass()} ${
                          isCompact ? 'py-2 px-3 items-center justify-between' :
                          (customization.layout.cardStyle.startsWith('grid') || imgPos === 'top') ? 'flex-col p-0' :
                          isImageRight ? 'flex-row-reverse p-3 gap-3' : 'flex-row p-3 gap-3'
                        }`}
                      >
                        {/* Mock Image container */}
                        {showImage && imgPos !== 'background' && (
                          <div 
                            className="relative shrink-0 overflow-hidden bg-slate-800"
                            style={{
                              width: (customization.layout.cardStyle.startsWith('grid') || imgPos === 'top') ? '100%' : isCompact ? '32px' : '72px',
                              height: (customization.layout.cardStyle.startsWith('grid') || imgPos === 'top') ? '110px' : isCompact ? '32px' : '72px',
                              borderRadius: `${customization.layout.imageRadius}px`
                            }}
                          >
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        )}

                        {/* Card metadata fields */}
                        <div className={`flex-1 flex flex-col justify-center ${
                          (customization.layout.cardStyle.startsWith('grid') || imgPos === 'top') ? 'p-3' : ''
                        }`}>
                          
                          {/* Badges block */}
                          {customization.layout.showBadges && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {item.isNew && customization.badges.showNew && (
                                <span 
                                  style={{ backgroundColor: customization.badges.newColor }}
                                  className="text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded"
                                >
                                  {customization.badges.newLabel}
                                </span>
                              )}
                              {item.isPopular && customization.badges.showPopular && (
                                <span 
                                  style={{ backgroundColor: customization.badges.popularColor }}
                                  className="text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded"
                                >
                                  {customization.badges.popularLabel}
                                </span>
                              )}
                            </div>
                          )}

                          <h4 className="font-bold text-xs leading-snug text-[var(--color-text)]">{item.name}</h4>
                          
                          {customization.layout.showDescription && !isCompact && (
                            <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                              {item.desc}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2.5">
                            <span className="text-xs font-bold text-[var(--color-price)]">
                              {customization.layout.showCurrency && customization.layout.currency}{item.price}
                            </span>
                            {customization.layout.showCalories && (
                              <span className="text-[9px] text-[var(--color-text-secondary)]">{item.cal}</span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* 4. Footer credits */}
              <div className="absolute bottom-4 inset-x-0 text-center text-[10px] text-[var(--color-text-secondary)] opacity-60">
                Powered by Tarapeza
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Toast Alert Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
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
