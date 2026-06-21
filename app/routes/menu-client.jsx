'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Phone, Sparkles, Globe, Star, X, Loader2, Share2, Check, Heart, Clock, Wifi, Eye, EyeOff } from 'lucide-react';
import { getTemplateDefaults, generateCssStyles } from '../lib/templates';
const Image = ({ src, alt, fill, className, width, height, ...props }) => {
  const styles = fill ? { position: 'absolute', height: '100%', width: '100%', left: 0, top: 0, right: 0, bottom: 0, objectFit: 'cover' } : {};
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={{ ...styles, ...props.style }}
      {...props}
    />
  );
};
import { supabase } from '../lib/supabase/client';

const translateDay = (day) => {
  const mapping = {
    Monday: 'الإثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    Friday: 'الجمعة',
    Saturday: 'السبت',
    Sunday: 'الأحد'
  };
  return mapping[day] || day;
};

export default function MenuViewClient({ profile, categories = [], menuItems = [], initialRatings = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'chef' | 'bestseller' | 'new' | 'popular' | 'spicy'
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [lang, setLang] = useState('en'); // 'en' | 'ar'
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const getBusinessHours = () => {
    const defaults = {
      timezone: 'Asia/Damascus',
      days: {}
    };
    try {
      return profile.business_hours && typeof profile.business_hours === 'object'
        ? { ...defaults, ...profile.business_hours }
        : defaults;
    } catch (e) {
      return defaults;
    }
  };
  const businessHours = getBusinessHours();

  const checkIfOpen = () => {
    if (profile.temporarily_closed) return false;
    if (!businessHours || !businessHours.days) return false;
    try {
      const tz = businessHours.timezone || 'Asia/Damascus';
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const formattedParts = formatter.formatToParts(now);
      const parts = {};
      formattedParts.forEach(p => { parts[p.type] = p.value; });
      const currentDay = parts.weekday;
      const currentHour = parseInt(parts.hour, 10);
      const currentMinute = parseInt(parts.minute, 10);
      const currentTimeNum = currentHour * 60 + currentMinute;
      const dayData = businessHours.days[currentDay];
      if (!dayData || !dayData.isOpen) return false;
      if (!dayData.periods || dayData.periods.length === 0) return false;
      return dayData.periods.some(p => {
        if (!p.from || !p.to) return false;
        const [fromHour, fromMin] = p.from.split(':').map(Number);
        const [toHour, toMin] = p.to.split(':').map(Number);
        const fromTimeNum = fromHour * 60 + fromMin;
        const toTimeNum = toHour * 60 + toMin;
        return currentTimeNum >= fromTimeNum && currentTimeNum <= toTimeNum;
      });
    } catch (e) {
      console.error('Error checking open status:', e);
      return false;
    }
  };

  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false);

  useEffect(() => {
    setIsCurrentlyOpen(checkIfOpen());
    const interval = setInterval(() => {
      setIsCurrentlyOpen(checkIfOpen());
    }, 60000);
    return () => clearInterval(interval);
  }, [profile.business_hours, profile.temporarily_closed]);

  const hasSocialLinks = !!(
    profile.instagram ||
    profile.facebook ||
    profile.whatsapp ||
    profile.twitter ||
    profile.tiktok ||
    profile.youtube ||
    profile.tripadvisor
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Diner client auth state
  const [customerUser, setCustomerUser] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Ratings state
  const [ratings, setRatings] = useState(initialRatings);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Custom styling states
  const getInitialTheme = () => {
    const activeTemplateId = profile.template_id || 'classic';
    const defaults = getTemplateDefaults(activeTemplateId);
    const dbValue = profile.customization || {};
    
    const mergedColors = { 
      ...defaults.colors, 
      ...dbValue.colors 
    };
    
    // Inject the custom brand accent color from profile
    const accentColorVal = profile.main_color || profile.accent_color;
    if (accentColorVal) {
      mergedColors.accent = accentColorVal;
      mergedColors.tabActive = accentColorVal;
      mergedColors.price = accentColorVal;
      mergedColors.badge = accentColorVal;
    }

    const layoutStyle = profile.layout_style || 'classic';
    const showImageVal = profile.display_mode !== 'text';
    const activeCardStyle = layoutStyle === 'grid' ? 'grid-2' : 'list';

    const mergedLayout = {
      ...defaults.layout,
      ...dbValue.layout,
      showImage: showImageVal,
      cardStyle: activeCardStyle
    };

    return {
      templateId: activeTemplateId,
      colors: mergedColors,
      fonts: { ...defaults.fonts, ...dbValue.fonts },
      layout: mergedLayout,
      badges: { ...defaults.badges, ...dbValue.badges },
      customCss: dbValue.customCss || '',
      icons: { ...defaults.icons, ...dbValue.icons },
      advanced: defaults.advanced
    };
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [themeId, setThemeId] = useState('tarapeza-custom');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }

    const handleMessage = (e) => {
      if (e.data && e.data.type === 'UPDATE_THEME') {
        const received = e.data.data;
        
        if (received.customization) {
          setTheme({
            templateId: received.templateId || 'classic',
            colors: received.customization.colors || {},
            fonts: received.customization.fonts || {},
            layout: received.customization.layout || {},
            badges: received.customization.badges || {},
            customCss: received.customization.customCss || '',
            icons: received.customization.icons || {},
            advanced: received.customization.advanced || {}
          });
        } else {
          const defaults = getTemplateDefaults(received.templateId || 'classic');
          const customAccent = received.accentColor || '#f97316';
          defaults.colors.accent = customAccent;
          defaults.colors.tabActive = customAccent;
          defaults.colors.button = customAccent;

          setTheme({
            templateId: received.templateId || 'classic',
            colors: defaults.colors,
            fonts: defaults.fonts,
            layout: defaults.layout,
            badges: defaults.badges || {},
            customCss: '',
            icons: defaults.icons,
            advanced: defaults.advanced
          });
        }
        setThemeId('tarapeza-custom');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / totalReviews).toFixed(1)
    : null;

  // Dynamic Theme Highlight Color
  const primaryColor = themeId === 'tarapeza-custom' ? theme.colors.accent : (profile.theme_color || '#f97316');
  
  const hexToRgb = (hex) => {
    if (!hex) return '249, 115, 22';
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? '249, 115, 22' : `${r}, ${g}, ${b}`;
  };
  const primaryColorRgb = hexToRgb(primaryColor);
  
  const fontUrl = themeId === 'tarapeza-custom' 
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fonts.heading)}:wght@300;400;500;600;700;800;900&family=${encodeURIComponent(theme.fonts.body)}:wght@300;400;500;600;700;800;900&display=swap` 
    : '';
  const cssOverrides = themeId === 'tarapeza-custom' ? generateCssStyles(theme) : '';

  // Translations
  const t = {
    en: {
      searchPlaceholder: 'Search dishes, drinks...',
      all: 'All',
      soldOut: 'Sold Out',
      poweredBy: 'Powered by Tarapeza',
      scanText: 'Scan QR for menu',
      noItems: 'No matching dishes',
      refiningText: 'Try refining your keyword search.',
      rateUs: 'Rate Us',
      reviews: 'reviews',
      beFirstToRate: 'Be the first to rate!',
      rateThisCafe: 'Rate this Café / Restaurant',
      selectStars: 'Select your rating',
      writeComment: 'Optional comment...',
      submitRating: 'Submit Rating',
      ratingSuccessMsg: 'Thank you for your rating!',
      ratingErrorMsg: 'Failed to submit rating. Please try again.',
      close: 'Close',
      chef: 'Chef Special',
      bestseller: 'Best Seller',
      new: 'New',
      popular: 'Popular',
      spicy: 'Spicy',
    },
    ar: {
      searchPlaceholder: 'البحث عن الأطباق والمشروبات...',
      all: 'الكل',
      soldOut: 'نفذت الكمية',
      poweredBy: 'مشغل بواسطة طربيزة',
      scanText: 'امسح رمز الاستجابة السريعة للمنيو',
      noItems: 'لا توجد أطباق مطابقة',
      refiningText: 'حاول تغيير كلمة البحث الخاصة بك.',
      rateUs: 'قيمنا',
      reviews: 'تقييمات',
      beFirstToRate: 'كن أول من يقيم!',
      rateThisCafe: 'تقييم هذا المقهى / المطعم',
      selectStars: 'اختر تقييمك',
      writeComment: 'تعليق اختياري...',
      submitRating: 'إرسال التقييم',
      ratingSuccessMsg: 'شكراً لتقييمك!',
      ratingErrorMsg: 'فشل إرسال التقييم. يرجى المحاولة مرة أخرى.',
      close: 'إغلاق',
      chef: 'مميز الشيف',
      bestseller: 'الأكثر مبيعاً',
      new: 'جديد',
      popular: 'محبوب',
      spicy: 'حار 🌶️',
    }
  };

  const currentT = t[lang];
  const isRtl = lang === 'ar';

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    setRatingError('');
    setRatingSuccess(false);

    try {
      const ratingPayload = {
        restaurant_id: profile.id,
        stars: selectedStars,
        comment: reviewComment.trim() || null
      };

      if (customerUser) {
        ratingPayload.customer_id = customerUser.id;
      }

      const { data, error } = await supabase
        .from('ratings')
        .insert(ratingPayload)
        .select('*, customer_profiles(full_name)')
        .single();

      if (error) throw error;

      // Add diner name fallback
      const ratingsData = {
        ...data,
        customer_profiles: customerUser ? { full_name: customerUser.user_metadata?.full_name || 'Diner' } : null
      };

      setRatings([...ratings, ratingsData]);

      // Handle loyalty stamp update for registered diners
      if (customerUser) {
        const { data: existingLoyalty } = await supabase
          .from('customer_loyalty')
          .select('*')
          .eq('customer_id', customerUser.id)
          .eq('restaurant_id', profile.id)
          .maybeSingle();

        if (existingLoyalty) {
          const newStamps = Math.min(6, existingLoyalty.stamps_count + 1);
          await supabase
            .from('customer_loyalty')
            .update({ stamps_count: newStamps, updated_at: new Date() })
            .eq('id', existingLoyalty.id);
        } else {
          await supabase
            .from('customer_loyalty')
            .insert({
              customer_id: customerUser.id,
              restaurant_id: profile.id,
              stamps_count: 1
            });
        }
      }

      setRatingSuccess(true);
      setReviewComment('');
      setSelectedStars(5);
      setTimeout(() => {
        setShowRateModal(false);
        setRatingSuccess(false);
      }, 2000);
    } catch (error) {
      setRatingError(currentT.ratingErrorMsg);
    } finally {
      setSubmittingRating(false);
    }
  };

  // diner user status effect & toggle favorite
  useEffect(() => {
    async function checkCustomerAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && authUser.user_metadata?.role === 'customer') {
        setCustomerUser(authUser);
        // Check if favorited
        const { data } = await supabase
          .from('customer_favorites')
          .select('id')
          .eq('customer_id', authUser.id)
          .eq('restaurant_id', profile.id)
          .maybeSingle();
        if (data) {
          setIsFavorited(true);
        }
      }
    }
    checkCustomerAuth();
  }, [profile.id]);

  // Log the scan/menu view count
  useEffect(() => {
    async function logMenuScan() {
      try {
        await supabase
          .from('scans_log')
          .insert({
            restaurant_id: profile.id
          });
      } catch (err) {
        console.warn('Failed to log scan:', err);
      }
    }
    logMenuScan();
  }, [profile.id]);

  const handleToggleFavorite = async () => {
    if (!customerUser) {
      alert(isRtl ? 'يرجى تسجيل الدخول كزبون لحفظ هذا المطعم في المفضلة.' : 'Please log in as a Diner to bookmark this restaurant.');
      return;
    }
    
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('customer_favorites')
          .delete()
          .eq('customer_id', customerUser.id)
          .eq('restaurant_id', profile.id);
        if (error) throw error;
        setIsFavorited(false);
      } else {
        const { error } = await supabase
          .from('customer_favorites')
          .insert({
            customer_id: customerUser.id,
            restaurant_id: profile.id
          });
        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Scroll to category section
  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      const offset = 120; // sticky header offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const displayMode = profile.display_mode || 'image-text';
  const layoutStyle = profile.layout_style || 'classic';

  const processedItems = menuItems.map(item => {
    let newItem = { ...item };
    if (displayMode === 'text') {
      newItem.image_url = null;
    } else if (displayMode === 'image') {
      newItem.description = null;
      newItem.description_ar = null;
    }
    return newItem;
  });

  const specialsItems = processedItems.filter(item => 
    item.available && 
    (item.badge?.toLowerCase() === 'chef' || item.badge?.toLowerCase() === 'bestseller' || item.badge?.toLowerCase() === 'popular')
  );

  // Filter items
  const filteredItems = processedItems.filter((item) => {
    const matchesSearch = (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name_ar && item.name_ar.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description_ar && item.description_ar.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const matchesFilter = activeFilter === 'all' || item.badge?.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const itemsByCategory = categories.reduce((acc, cat) => {
    const catItems = filteredItems.filter((item) => item.category_id === cat.id);
    if (catItems.length > 0 || searchQuery) {
      acc.push({
        ...cat,
        items: catItems,
      });
    }
    return acc;
  }, []);

  const templateId = themeId === 'tarapeza-custom' ? theme.templateId : (profile.template_id || 'classic-dark');
  const styleId = profile.style_id || 'modern-minimalist';
  const headerStyle = themeId === 'tarapeza-custom' 
    ? (theme.layout.headerStyle || theme.icons?.headerStyle || 'centered-overlap') 
    : (profile.header_style || 'centered-overlap');

  const getStyleClasses = () => {
    switch (styleId) {
      case 'classic-serif':
        return {
          fontFamily: 'font-serif',
          card: 'rounded-md shadow-sm border border-current/10',
          button: 'rounded-md',
          input: 'rounded-md border-slate-300',
          badge: 'rounded-none border border-current/25'
        };
      case 'neo-brutalism':
        return {
          fontFamily: 'font-sans font-black',
          card: 'rounded-none border-2 border-current shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all',
          button: 'rounded-none border-2 border-current shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold',
          input: 'rounded-none border-2 border-current shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          badge: 'rounded-none border-2 border-current'
        };
      case 'pill-rounded':
        return {
          fontFamily: 'font-sans',
          card: 'rounded-[2rem] shadow-sm border border-current/10',
          button: 'rounded-full',
          input: 'rounded-full',
          badge: 'rounded-full'
        };
      case 'glassmorphism':
        return {
          fontFamily: 'font-sans',
          card: 'rounded-3xl bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg',
          button: 'rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/20',
          input: 'rounded-xl bg-white/5 border border-white/20',
          badge: 'rounded-lg bg-white/20'
        };
      case 'vintage-newspaper':
        return {
          fontFamily: 'font-mono',
          card: 'rounded-none border-4 border-double border-current bg-transparent p-4',
          button: 'rounded-none border-2 border-current font-bold uppercase tracking-wider',
          input: 'rounded-none border-2 border-current bg-transparent',
          badge: 'rounded-none border border-current uppercase'
        };
      case 'clean-borderless':
        return {
          fontFamily: 'font-sans',
          card: 'rounded-none border-0 shadow-none bg-black/[0.02] dark:bg-white/[0.02]',
          button: 'rounded-none border-0 shadow-none font-semibold',
          input: 'rounded-none border-b-2 border-current/20 bg-transparent',
          badge: 'rounded-none border-0 bg-current/10'
        };
      case 'elegant-gold-rim':
        return {
          fontFamily: 'font-serif',
          card: 'rounded-xl border border-[#c29864]/50 shadow-md',
          button: 'rounded-xl border border-[#c29864]/60',
          input: 'rounded-lg border border-[#c29864]/40',
          badge: 'rounded-md border border-[#c29864] text-[#c29864]'
        };
      case 'soft-float':
        return {
          fontFamily: 'font-sans',
          card: 'rounded-2xl border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
          button: 'rounded-2xl shadow-md hover:shadow-lg transition-all',
          input: 'rounded-xl border border-current/10',
          badge: 'rounded-xl'
        };
      case 'cyber-grid':
        return {
          fontFamily: 'font-mono',
          card: 'rounded-none border border-dashed border-[var(--primary-theme)]/80 bg-black/40 shadow-[0_0_8px_rgba(var(--primary-theme),0.1)]',
          button: 'rounded-none border border-[var(--primary-theme)] bg-transparent hover:bg-[var(--primary-theme)]/20 shadow-[0_0_5px_rgba(var(--primary-theme),0.5)]',
          input: 'rounded-none border border-[var(--primary-theme)] bg-black/80',
          badge: 'rounded-none border border-[var(--primary-theme)]'
        };
      case 'modern-minimalist':
      default:
        return {
          fontFamily: 'font-sans',
          card: 'rounded-2xl border border-current/5 shadow-sm',
          button: 'rounded-2xl',
          input: 'rounded-2xl',
          badge: 'rounded-xl'
        };
    }
  };

  const styleClasses = getStyleClasses();

  const mergeStyle = (themeClass = '', type = 'card') => {
    let result = themeClass;
    
    if (styleId !== 'modern-minimalist') {
      if (type === 'card') {
        result = result
          .replace(/\brounded-[a-z0-9]+/g, '')
          .replace(/\brounded\b/g, '')
          .replace(/\bshadow-[a-z0-9/\[\]_]+/g, '')
          .replace(/\bshadow\b/g, '')
          .replace(/\bhover:shadow-[a-z0-9/\[\]_]+/g, '')
          .replace(/\bhover:translate-[x-y]-[a-z0-9/\[\]_]+/g, '')
          .replace(/\bhover:scale-[a-z0-9/\[\]_.]+/g, '');
        
        result += ` ${styleClasses.card}`;
      } else if (type === 'button') {
        result = result
          .replace(/\brounded-[a-z0-9]+/g, '')
          .replace(/\brounded\b/g, '')
          .replace(/\bshadow-[a-z0-9/\[\]_]+/g, '')
          .replace(/\bshadow\b/g, '');
        result += ` ${styleClasses.button}`;
      } else if (type === 'input') {
        result = result
          .replace(/\brounded-[a-z0-9]+/g, '')
          .replace(/\brounded\b/g, '')
          .replace(/\bshadow-[a-z0-9/\[\]_]+/g, '')
          .replace(/\bshadow\b/g, '');
        result += ` ${styleClasses.input}`;
      } else if (type === 'badge') {
        result = result
          .replace(/\brounded-[a-z0-9]+/g, '')
          .replace(/\brounded\b/g, '');
        result += ` ${styleClasses.badge}`;
      }
    }
    
    if (!isRtl) {
      result += ` ${styleClasses.fontFamily}`;
    }
    
    return result;
  };

  const colorThemes = {
    'tarapeza-custom': {
      wrapper: "tarapeza-public-menu min-h-screen pb-24 relative overflow-hidden",
      bgDecorations: null,
      header: "relative w-full overflow-hidden shrink-0 flex flex-col items-center justify-center py-8 border-b border-[var(--menu-border)] bg-[var(--menu-sec-bg)]",
      logoBorder: "border-4 border-[var(--menu-border)] bg-[var(--menu-card-bg)] shadow-lg rounded-2xl",
      logoFallback: "bg-gradient-to-tr from-slate-500 to-slate-700 border-4 border-[var(--menu-border)] shadow-lg rounded-2xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-[var(--menu-text-primary)]",
      description: "text-[var(--menu-text-sec)] text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-[var(--menu-text-sec)] text-xs transition-colors hover:text-[var(--menu-text-primary)]",
      metaIcon: "opacity-75",
      stickyContainer: "sticky top-0 z-40 shrink-0",
      searchInput: "w-full border border-[var(--menu-border)] bg-[var(--menu-card-bg)] rounded-2xl py-2.5 px-4 focus:outline-none transition-all text-sm text-[var(--menu-text-primary)] placeholder-[var(--menu-text-sec)]/50",
      searchIcon: "opacity-60 text-[var(--menu-text-sec)]",
      categoryTab: (isActive) => isActive 
        ? "custom-category-tab-active font-bold" 
        : "custom-category-tab-inactive",
      sectionHeader: "text-md font-bold tracking-tight text-[var(--menu-text-primary)]",
      itemCard: "custom-menu-card overflow-hidden flex p-3 gap-3 transition-all duration-300",
      itemName: "font-bold text-sm leading-snug truncate text-[var(--menu-text-primary)]",
      itemDesc: "text-[var(--menu-text-sec)] text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[var(--menu-accent)]",
      itemImageBg: "bg-[var(--menu-sec-bg)]",
      itemSoldOutOverlay: "absolute inset-0 bg-black/60 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-slate-900 px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 border border-[var(--menu-border)] bg-[var(--menu-card-bg)] rounded-3xl mt-4",
      emptyStateIcon: "opacity-40 text-[var(--menu-text-sec)]",
      emptyStateTitle: "text-base font-bold text-[var(--menu-text-primary)]",
      emptyStateDesc: "text-xs mt-1 text-[var(--menu-text-sec)]",
      footer: "fixed bottom-0 inset-x-0 border-t border-[var(--menu-border)] bg-[var(--menu-bg)] py-2.5 z-40 shrink-0 text-[var(--menu-text-sec)] text-center text-xs",
      footerScanText: "opacity-50",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all uppercase tracking-wider shadow-sm font-sans bg-[var(--menu-btn)] text-white hover:opacity-90",
      ratingBadge: "flex items-center space-x-1 gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-sans",
      ratingBadgeEmpty: "text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded font-sans border border-[var(--menu-border)] bg-[var(--menu-card-bg)] text-[var(--menu-text-sec)]",
      itemDivider: "opacity-40 border-[var(--menu-border)]",
      dashesColor: "opacity-30 border-[var(--menu-border)]",
      chefSpotlightBg: "opacity-10 bg-[var(--menu-accent)]/10",
      spotlightCard: "border border-[var(--menu-border)] bg-[var(--menu-card-bg)] rounded-3xl shadow-sm overflow-hidden flex flex-col p-0 transition-all duration-300",
      spotlightTag: "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--menu-accent)] text-white",
      modalBg: "border border-[var(--menu-border)] bg-[var(--menu-card-bg)] rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-[var(--menu-text-primary)]",
      modalTitle: "text-sm font-extrabold tracking-tight text-center mb-4 mt-2 font-sans text-[var(--menu-text-primary)]",
      modalInput: "w-full border border-[var(--menu-border)] bg-[var(--menu-bg)] rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none transition-all text-xs resize-none font-sans text-[var(--menu-text-primary)]",
      modalCloseBtn: "absolute top-4 right-4 opacity-75 hover:opacity-100 transition-colors text-[var(--menu-text-sec)]",
      modalText: "text-xs font-bold uppercase tracking-wider font-sans text-center mb-1.5 text-[var(--menu-text-sec)]",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all bg-[var(--menu-btn)] text-white"
    },
    'custom': {
      wrapper: "min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans pb-24 relative overflow-hidden selection:bg-[var(--primary-theme)] selection:text-white",
      bgDecorations: null,
      header: "relative w-full bg-[var(--color-card-bg)]/40 border-b border-[var(--color-text)]/10 shadow-xl backdrop-blur-md text-[var(--color-text)] overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-[var(--color-card-bg)] bg-[var(--color-bg)] shadow-xl",
      logoFallback: "bg-gradient-to-tr from-[var(--primary-theme)] to-orange-500 border-4 border-[var(--color-card-bg)] shadow-xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-[var(--color-text)]",
      description: "text-[var(--color-text)]/70 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-[var(--color-text)]/70 text-xs hover:text-[var(--color-text)] transition-colors",
      metaIcon: "text-[var(--color-text)]/50",
      stickyContainer: "sticky top-0 z-40 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-text)]/10 shadow-lg shrink-0",
      searchInput: "w-full bg-[var(--color-card-bg)]/60 border border-[var(--color-text)]/10 rounded-2xl py-2.5 text-[var(--color-text)] placeholder-[var(--color-text)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-sm",
      searchIcon: "text-[var(--color-text)]/50",
      categoryTab: (isActive) => isActive 
        ? "bg-[var(--primary-theme)] text-white shadow-sm" 
        : "bg-[var(--color-card-bg)]/85 border border-[var(--color-text)]/10 text-[var(--color-text)]/75 hover:text-[var(--color-text)]",
      sectionHeader: "text-md font-extrabold text-[var(--color-text)] tracking-tight",
      itemCard: "bg-[var(--color-card-bg)] border border-[var(--color-text)]/10 rounded-2xl shadow-xl overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:border-[var(--color-text)]/20",
      itemName: "font-bold text-[var(--color-card-text)] text-sm leading-snug truncate",
      itemDesc: "text-[var(--color-card-text)]/70 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[var(--primary-theme)]",
      itemImageBg: "bg-[var(--color-bg)]/55",
      itemSoldOutOverlay: "absolute inset-0 bg-[var(--color-bg)]/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-[var(--color-text)] uppercase tracking-wider bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-[var(--color-card-bg)]/40 border border-[var(--color-text)]/10 rounded-3xl mt-4",
      emptyStateIcon: "text-[var(--color-text)]/30",
      emptyStateTitle: "text-base font-bold text-[var(--color-text)]",
      emptyStateDesc: "text-xs text-[var(--color-text)]/60 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-[var(--color-bg)]/95 backdrop-blur-md border-t border-[var(--color-text)]/10 shadow-2xl py-2.5 z-40 shrink-0 text-[var(--color-text)]/70",
      footerScanText: "font-medium text-[var(--color-text)]/50",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 text-[var(--color-bg)] transition-all uppercase tracking-wider shadow-md font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-400 font-sans",
      ratingBadgeEmpty: "text-[10px] text-[var(--color-text)]/70 font-bold tracking-wide uppercase bg-[var(--color-card-bg)] border border-[var(--color-text)]/10 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-[var(--color-text)]/10",
      dashesColor: "border-[var(--color-text)]/10",
      chefSpotlightBg: "bg-[var(--primary-theme)]/10",
      spotlightCard: "bg-[var(--color-card-bg)] border border-[var(--color-text)]/10 rounded-3xl shadow-xl overflow-hidden flex flex-col p-0 transition-all duration-300 hover:border-[var(--color-text)]/20",
      spotlightTag: "bg-[var(--primary-theme)] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-[var(--color-card-bg)] border border-[var(--color-text)]/15 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-[var(--color-text)]",
      modalTitle: "text-sm font-extrabold text-[var(--color-text)] tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-text)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors",
      modalText: "text-xs font-bold text-[var(--color-text)]/80 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 bg-[var(--primary-theme)] text-white"
    },
    'obsidian-dark': {
      wrapper: "min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 relative overflow-hidden selection:bg-[var(--primary-theme)] selection:text-white",
      bgDecorations: (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[var(--primary-theme)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      ),
      header: "relative w-full bg-slate-900/40 border-b border-slate-900 shadow-xl backdrop-blur-md text-white overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-slate-900 bg-slate-950 shadow-xl",
      logoFallback: "bg-gradient-to-tr from-amber-500 to-orange-500 border-4 border-slate-900 shadow-xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-white",
      description: "text-slate-400 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-slate-400 text-xs hover:text-slate-200 transition-colors",
      metaIcon: "text-slate-500",
      stickyContainer: "sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 shadow-lg shrink-0",
      searchInput: "w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-sm",
      searchIcon: "text-slate-500",
      categoryTab: (isActive) => isActive 
        ? "bg-[var(--primary-theme)] text-white shadow-sm" 
        : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200",
      sectionHeader: "text-md font-extrabold text-white tracking-tight",
      itemCard: "bg-slate-900/40 border border-slate-900 rounded-2xl shadow-xl overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:border-slate-800",
      itemName: "font-bold text-white text-sm leading-snug truncate",
      itemDesc: "text-slate-400 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[var(--primary-theme)]",
      itemImageBg: "bg-slate-900",
      itemSoldOutOverlay: "absolute inset-0 bg-slate-950/70 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-slate-900/90 px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-slate-900/40 border border-slate-900 rounded-3xl mt-4",
      emptyStateIcon: "text-slate-700",
      emptyStateTitle: "text-base font-bold text-white",
      emptyStateDesc: "text-xs text-slate-500 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 shadow-2xl py-2.5 z-40 shrink-0 text-slate-400",
      footerScanText: "font-medium text-slate-500",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-950 transition-all uppercase tracking-wider shadow-md font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-400 font-sans",
      ratingBadgeEmpty: "text-[10px] text-slate-550 font-bold tracking-wide uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-slate-900/40",
      dashesColor: "border-slate-800/45",
      chefSpotlightBg: "bg-[var(--primary-theme)]/10",
      spotlightCard: "bg-slate-900/40 border border-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col p-0 transition-all duration-300 hover:border-slate-800",
      spotlightTag: "bg-[var(--primary-theme)] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-slate-900 border border-slate-850 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-white",
      modalTitle: "text-sm font-extrabold text-white tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors",
      modalText: "text-xs font-bold text-slate-455 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 bg-[var(--primary-theme)] text-white"
    },
    'pearl-light': {
      wrapper: "min-h-screen bg-slate-50 text-slate-850 font-sans pb-24 relative overflow-hidden selection:bg-[var(--primary-theme)] selection:text-white",
      bgDecorations: null,
      header: "relative w-full bg-white border-b border-slate-200 shadow-sm text-slate-805 overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-white bg-white shadow-lg",
      logoFallback: "bg-gradient-to-tr from-emerald-500 to-teal-500 border-4 border-white shadow-lg",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-slate-800",
      description: "text-slate-505 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-slate-500 text-xs hover:text-slate-800 transition-colors",
      metaIcon: "text-slate-400",
      stickyContainer: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0",
      searchInput: "w-full bg-slate-100 border border-slate-200 rounded-2xl py-2.5 text-slate-855 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-sm",
      searchIcon: "text-slate-400",
      categoryTab: (isActive) => isActive 
        ? "bg-[var(--primary-theme)] text-white shadow-sm" 
        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80",
      sectionHeader: "text-md font-extrabold text-slate-850 tracking-tight",
      itemCard: "bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:shadow-md",
      itemName: "font-bold text-slate-800 text-sm leading-snug truncate",
      itemDesc: "text-slate-550 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[var(--primary-theme)]",
      itemImageBg: "bg-slate-100",
      itemSoldOutOverlay: "absolute inset-0 bg-white/85 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-slate-955 px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-white border border-slate-200 rounded-3xl mt-4",
      emptyStateIcon: "text-slate-300",
      emptyStateTitle: "text-base font-bold text-slate-700",
      emptyStateDesc: "text-xs text-slate-450 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg py-2.5 z-40 shrink-0 text-slate-500",
      footerScanText: "font-medium text-slate-450",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all uppercase tracking-wider shadow-sm font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-50 border border-amber-200/30 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-705 font-sans",
      ratingBadgeEmpty: "text-[10px] text-slate-400 font-bold tracking-wide uppercase bg-slate-100 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-slate-200/60",
      dashesColor: "border-slate-200",
      chefSpotlightBg: "bg-[var(--primary-theme)]/5",
      spotlightCard: "bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden flex flex-col p-0 transition-all duration-300 hover:shadow-md",
      spotlightTag: "bg-[var(--primary-theme)] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-slate-800",
      modalTitle: "text-sm font-extrabold text-slate-808 tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-808 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-slate-400 hover:text-slate-606 transition-colors",
      modalText: "text-xs font-bold text-slate-500 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 bg-[var(--primary-theme)] text-white shadow-sm"
    },
    'warm-bistro': {
      wrapper: "min-h-screen bg-[#fefaf0] text-[#4a3b32] font-serif pb-24 relative overflow-hidden selection:bg-[var(--primary-theme)] selection:text-white",
      bgDecorations: (
        <div className="absolute top-0 inset-x-0 h-44 bg-[radial-gradient(circle_at_top,rgba(194,152,100,0.12),transparent_70%)] pointer-events-none" />
      ),
      header: "relative w-full bg-[#fefaf0] border-b border-[#e2d5c3] text-[#4a3b32] overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-[#fefaf0] bg-[#fefaf0] shadow-md",
      logoFallback: "bg-gradient-to-tr from-[#8b5a2b] to-[#c29864] border-4 border-[#fefaf0] shadow-md",
      restaurantName: "text-2xl font-bold tracking-tight mb-1 text-[#4a3b32] font-serif",
      description: "text-[#705e52] text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-[#705e52] text-xs hover:text-[#4a3b32] transition-colors font-sans",
      metaIcon: "text-[#8b7355]",
      stickyContainer: "sticky top-0 z-40 bg-[#fefaf0]/95 backdrop-blur-md border-b border-[#e2d5c3] shadow-sm shrink-0 font-sans",
      searchInput: "w-full bg-[#fcf8ee] border border-[#d8c3a5] rounded-2xl py-2.5 text-[#4a3b32] placeholder-[#a6917e] focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-sm",
      searchIcon: "text-[#a6917e]",
      categoryTab: (isActive) => isActive 
        ? "bg-[var(--primary-theme)] text-white shadow-sm" 
        : "bg-[#e8dec9]/40 text-[#705e52] hover:text-[#4a3b32]",
      sectionHeader: "text-md font-bold text-[#4a3b32] tracking-tight font-serif",
      itemCard: "bg-[#fffdec] border border-[#ebdcc4] rounded-2xl shadow-sm overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:border-[#d8c3a5]",
      itemName: "font-bold text-[#36271c] text-sm leading-snug truncate font-serif",
      itemDesc: "text-[#786455] text-[11px] leading-relaxed line-clamp-2 mb-2 text-start font-sans",
      itemPrice: "font-bold text-sm shrink-0 text-[var(--primary-theme)] font-sans",
      itemImageBg: "bg-[#e8dec9]/30",
      itemSoldOutOverlay: "absolute inset-0 bg-[#fefaf0]/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-[#4a3b32] px-1.5 py-0.5 rounded font-sans",
      emptyState: "text-center py-16 px-4 bg-[#fffdec] border border-[#ebdcc4] rounded-3xl mt-4 font-sans",
      emptyStateIcon: "text-[#c4b19b]",
      emptyStateTitle: "text-base font-bold text-[#4a3b32]",
      emptyStateDesc: "text-xs text-[#705e52] mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-[#fefaf0]/95 backdrop-blur-md border-t border-[#e2d5c3] shadow-lg py-2.5 z-40 shrink-0 text-[#705e52] font-sans",
      footerScanText: "font-medium text-[#8b7355]",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#4a3b32] hover:bg-[#3d3027] text-white transition-all uppercase tracking-wider shadow-md font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-[#c29864]/10 border border-[#c29864]/25 px-2.5 py-0.5 rounded-full text-xs font-bold text-[#a0743b] font-sans",
      ratingBadgeEmpty: "text-[10px] text-[#705e52]/75 font-bold tracking-wide uppercase bg-[#e8dec9]/30 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-[#ebdcc4]",
      dashesColor: "border-[#d8c3a5]/50",
      chefSpotlightBg: "bg-[#c29864]/5",
      spotlightCard: "bg-[#fffdec] border border-[#ebdcc4] rounded-3xl shadow-sm overflow-hidden flex flex-col p-0 transition-all duration-300 hover:border-[#d8c3a5]",
      spotlightTag: "bg-[var(--primary-theme)] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-sans",
      modalBg: "bg-[#fffdec] border border-[#ebdcc4] rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-[#4a3b32]",
      modalTitle: "text-sm font-bold text-[#4a3b32] tracking-tight text-center mb-4 mt-2 font-serif",
      modalInput: "w-full bg-[#fcf8ee] border border-[#ebdcc4] rounded-xl px-4 py-2.5 text-[#4a3b32] placeholder-[#a6917e] focus:outline-none focus:ring-1 focus:ring-[var(--primary-theme)] focus:border-[var(--primary-theme)] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-[#786455] hover:text-[#4a3b32] transition-colors",
      modalText: "text-xs font-bold text-[#705e52] uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 bg-[#4a3b32] text-white shadow-sm font-sans"
    },
    'crimson-retro': {
      wrapper: "min-h-screen bg-[#fafaf9] text-slate-905 font-sans pb-24 relative overflow-hidden selection:bg-red-600 selection:text-white",
      bgDecorations: (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0f172a_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
      ),
      header: "relative w-full bg-[#fafaf9] border-b-2 border-slate-900 text-slate-900 overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-2 border-slate-900 bg-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] rounded-2xl",
      logoFallback: "bg-gradient-to-tr from-red-500 to-orange-500 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] rounded-2xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-slate-900 uppercase",
      description: "text-slate-650 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-slate-655 text-xs hover:text-slate-900 transition-colors font-bold",
      metaIcon: "text-slate-900",
      stickyContainer: "sticky top-0 z-40 bg-[#fafaf9] border-b-2 border-slate-900 shadow-sm shrink-0",
      searchInput: "w-full bg-white border-2 border-slate-900 rounded-xl py-2.5 text-slate-900 placeholder-slate-404 focus:outline-none focus:ring-0 focus:border-red-600 transition-all text-sm shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:shadow-none",
      searchIcon: "text-slate-900",
      categoryTab: (isActive) => isActive 
        ? "bg-red-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" 
        : "bg-white text-slate-800 border-2 border-slate-900 hover:bg-slate-50",
      sectionHeader: "text-md font-black text-slate-900 tracking-wide uppercase",
      itemCard: "bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex p-3 gap-3 transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
      itemName: "font-bold text-slate-900 text-sm leading-snug truncate",
      itemDesc: "text-slate-650 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-red-650",
      itemImageBg: "bg-slate-50 border border-slate-900",
      itemSoldOutOverlay: "absolute inset-0 bg-white/90 flex items-center justify-center border-slate-900",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-red-650 border border-slate-900 px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-white border-2 border-slate-900 rounded-3xl mt-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
      emptyStateIcon: "text-slate-400",
      emptyStateTitle: "text-base font-black text-slate-955",
      emptyStateDesc: "text-xs text-slate-500 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-white border-t-2 border-slate-900 shadow-lg py-2.5 z-40 shrink-0 text-slate-900 font-sans",
      footerScanText: "font-bold text-slate-400",
      rateUsBtn: "text-[10px] font-black px-2.5 py-1 rounded-full bg-red-650 hover:bg-red-750 text-white border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all uppercase tracking-wider font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-100 border-2 border-slate-900 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] font-sans",
      ratingBadgeEmpty: "text-[10px] text-slate-550 font-bold tracking-wide uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-slate-900",
      dashesColor: "border-slate-900",
      chefSpotlightBg: "bg-red-50",
      spotlightCard: "bg-white border-2 border-slate-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col p-0 transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
      spotlightTag: "bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-white border-2 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-6 w-full max-w-sm relative text-slate-900",
      modalTitle: "text-sm font-black text-slate-955 tracking-tight text-center mb-4 mt-2 uppercase font-sans",
      modalInput: "w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-red-650 transition-all text-xs resize-none font-sans shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:shadow-none",
      modalCloseBtn: "absolute top-4 right-4 text-slate-900 hover:text-slate-655 transition-colors",
      modalText: "text-xs font-black text-slate-900 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 border-slate-900 bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
    },
    'emerald-palace': {
      wrapper: "min-h-screen bg-emerald-955 text-emerald-100 font-sans pb-24 relative overflow-hidden",
      bgDecorations: <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />,
      header: "relative w-full bg-emerald-900/20 border-b border-emerald-900 shadow-xl backdrop-blur-md text-emerald-100 overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-emerald-900 bg-emerald-950 shadow-xl",
      logoFallback: "bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-emerald-900 shadow-xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-amber-400",
      description: "text-emerald-300 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-emerald-300 text-xs hover:text-white transition-colors",
      metaIcon: "text-amber-400",
      stickyContainer: "sticky top-0 z-40 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-900 shadow-lg shrink-0",
      searchInput: "w-full bg-emerald-900/30 border border-emerald-800 rounded-2xl py-2.5 text-white placeholder-emerald-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all text-sm",
      searchIcon: "text-emerald-500",
      categoryTab: (isActive) => isActive ? "bg-amber-400 text-emerald-950 shadow-sm font-bold" : "bg-emerald-900/80 border border-emerald-800 text-emerald-300 hover:text-white",
      sectionHeader: "text-md font-extrabold text-amber-400 tracking-tight",
      itemCard: "bg-emerald-900/20 border border-emerald-900 rounded-2xl shadow-xl overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:border-emerald-800",
      itemName: "font-bold text-white text-sm leading-snug truncate",
      itemDesc: "text-emerald-300 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-amber-400",
      itemImageBg: "bg-emerald-900",
      itemSoldOutOverlay: "absolute inset-0 bg-emerald-950/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-emerald-955 uppercase tracking-wider bg-amber-400 px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-emerald-900/20 border border-emerald-900 rounded-3xl mt-4",
      emptyStateIcon: "text-emerald-800",
      emptyStateTitle: "text-base font-bold text-white",
      emptyStateDesc: "text-xs text-emerald-400 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-900 shadow-2xl py-2.5 z-40 shrink-0 text-emerald-450",
      footerScanText: "font-medium text-emerald-500",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-500 text-emerald-950 transition-all uppercase tracking-wider shadow-md font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-400 font-sans",
      ratingBadgeEmpty: "text-[10px] text-emerald-400 font-bold tracking-wide uppercase bg-emerald-900 border border-emerald-850 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-emerald-900/40",
      dashesColor: "border-emerald-800/45",
      chefSpotlightBg: "bg-amber-400/10",
      spotlightCard: "bg-emerald-900/20 border border-emerald-900 rounded-3xl shadow-xl overflow-hidden flex flex-col p-0 transition-all duration-300 hover:border-emerald-800",
      spotlightTag: "bg-amber-400 text-emerald-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-emerald-900 border border-emerald-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-emerald-100",
      modalTitle: "text-sm font-extrabold text-amber-400 tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-emerald-955 border border-emerald-800 rounded-xl px-4 py-2.5 text-white placeholder-emerald-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-emerald-400 hover:text-white transition-colors",
      modalText: "text-xs font-bold text-emerald-400 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-amber-400 text-emerald-950"
    },
    'rose-gold': {
      wrapper: "min-h-screen bg-[#fff1f2] text-rose-950 font-sans pb-24 relative overflow-hidden",
      bgDecorations: null,
      header: "relative w-full bg-white border-b border-rose-100 shadow-sm text-rose-900 overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-white bg-white shadow-lg",
      logoFallback: "bg-gradient-to-tr from-rose-500 to-pink-500 border-4 border-white shadow-lg",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-rose-900",
      description: "text-rose-700 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-rose-600 text-xs hover:text-rose-900 transition-colors",
      metaIcon: "text-[#f43f5e]",
      stickyContainer: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm shrink-0",
      searchInput: "w-full bg-rose-50 border border-rose-150 rounded-2xl py-2.5 text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-1 focus:ring-[#f43f5e] focus:border-[#f43f5e] transition-all text-sm",
      searchIcon: "text-[#f43f5e]",
      categoryTab: (isActive) => isActive ? "bg-[#f43f5e] text-white shadow-sm font-bold" : "bg-rose-100/50 text-rose-700 hover:bg-rose-100",
      sectionHeader: "text-md font-extrabold text-rose-900 tracking-tight",
      itemCard: "bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:shadow-md",
      itemName: "font-bold text-rose-900 text-sm leading-snug truncate",
      itemDesc: "text-rose-600 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[#f43f5e]",
      itemImageBg: "bg-rose-50",
      itemSoldOutOverlay: "absolute inset-0 bg-[#fff1f2]/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-[#f43f5e] px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-white border border-rose-100 rounded-3xl mt-4",
      emptyStateIcon: "text-rose-200",
      emptyStateTitle: "text-base font-bold text-rose-900",
      emptyStateDesc: "text-xs text-rose-500 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-lg py-2.5 z-40 shrink-0 text-rose-600",
      footerScanText: "font-medium text-rose-400",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-white transition-all uppercase tracking-wider shadow-sm font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-705 font-sans",
      ratingBadgeEmpty: "text-[10px] text-rose-400 font-bold tracking-wide uppercase bg-rose-50 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-rose-100",
      dashesColor: "border-rose-100",
      chefSpotlightBg: "bg-[#f43f5e]/5",
      spotlightCard: "bg-white border border-rose-100 rounded-3xl shadow-sm overflow-hidden flex flex-col p-0 transition-all duration-300 hover:shadow-md",
      spotlightTag: "bg-[#f43f5e] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-white border border-rose-100 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-rose-900",
      modalTitle: "text-sm font-extrabold text-rose-900 tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-rose-50 border border-rose-150 rounded-xl px-4 py-2.5 text-rose-900 placeholder-rose-350 focus:outline-none focus:ring-1 focus:ring-[#f43f5e] focus:border-[#f43f5e] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-rose-400 hover:text-rose-900 transition-colors",
      modalText: "text-xs font-bold text-rose-500 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-[#f43f5e] text-white shadow-sm"
    },
    'midnight-neon': {
      wrapper: "min-h-screen bg-black text-slate-100 font-sans pb-24 relative overflow-hidden",
      bgDecorations: <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />,
      header: "relative w-full bg-slate-950 border-b border-slate-900 text-white overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-slate-900 bg-black shadow-xl",
      logoFallback: "bg-gradient-to-tr from-fuchsia-600 to-indigo-600 border-4 border-slate-900 shadow-xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-white uppercase",
      description: "text-slate-400 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-slate-400 text-xs hover:text-white transition-colors",
      metaIcon: "text-fuchsia-500",
      stickyContainer: "sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-slate-900 shadow-lg shrink-0",
      searchInput: "w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 text-white placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm",
      searchIcon: "text-slate-500",
      categoryTab: (isActive) => isActive ? "bg-fuchsia-600 text-white shadow-sm font-bold" : "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white",
      sectionHeader: "text-md font-extrabold text-fuchsia-500 tracking-tight",
      itemCard: "bg-slate-950 border border-slate-900 rounded-2xl shadow-xl overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:border-slate-800",
      itemName: "font-bold text-white text-sm leading-snug truncate",
      itemDesc: "text-slate-400 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-fuchsia-400",
      itemImageBg: "bg-slate-950",
      itemSoldOutOverlay: "absolute inset-0 bg-black/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-black uppercase tracking-wider bg-fuchsia-500 px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-slate-950 border border-slate-900 rounded-3xl mt-4",
      emptyStateIcon: "text-slate-800",
      emptyStateTitle: "text-base font-bold text-white",
      emptyStateDesc: "text-xs text-slate-500 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-black/95 backdrop-blur-md border-t border-slate-900 shadow-2xl py-2.5 z-40 shrink-0 text-slate-500",
      footerScanText: "font-medium text-slate-500",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-fuchsia-500 hover:bg-fuchsia-605 text-black transition-all uppercase tracking-wider shadow-md font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-fuchsia-400 font-sans",
      ratingBadgeEmpty: "text-[10px] text-slate-500 font-bold tracking-wide uppercase bg-slate-950 border border-slate-850 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-slate-900",
      dashesColor: "border-slate-850",
      chefSpotlightBg: "bg-fuchsia-500/10",
      spotlightCard: "bg-slate-955 border border-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col p-0 transition-all duration-300 hover:border-slate-800",
      spotlightTag: "bg-fuchsia-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-slate-950 border border-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-white",
      modalTitle: "text-sm font-extrabold text-fuchsia-400 tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-black border border-slate-850 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-slate-500 hover:text-white transition-colors",
      modalText: "text-xs font-bold text-slate-500 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-fuchsia-500 text-black"
    },
    'nordic-frost': {
      wrapper: "min-h-screen bg-[#f0f4f8] text-slate-800 font-sans pb-24 relative overflow-hidden",
      bgDecorations: null,
      header: "relative w-full bg-white border-b border-[#d9e2ec] shadow-sm text-slate-800 overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-white bg-white shadow-lg",
      logoFallback: "bg-gradient-to-tr from-sky-500 to-[#0284c7] border-4 border-white shadow-lg",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-slate-800",
      description: "text-slate-600 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-slate-500 text-xs hover:text-slate-800 transition-colors",
      metaIcon: "text-[#0284c7]",
      stickyContainer: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#d9e2ec] shadow-sm shrink-0",
      searchInput: "w-full bg-[#f0f4f8] border border-[#cbd5e1] rounded-2xl py-2.5 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-1 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all text-sm",
      searchIcon: "text-[#0284c7]",
      categoryTab: (isActive) => isActive ? "bg-[#0284c7] text-white shadow-sm font-bold" : "bg-[#e2e8f0] text-slate-655 hover:bg-[#cbd5e1]",
      sectionHeader: "text-md font-extrabold text-[#102a43] tracking-tight",
      itemCard: "bg-white border border-[#d9e2ec] rounded-2xl shadow-sm overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:shadow-md",
      itemName: "font-bold text-slate-800 text-sm leading-snug truncate",
      itemDesc: "text-slate-600 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[#0284c7]",
      itemImageBg: "bg-[#f0f4f8]",
      itemSoldOutOverlay: "absolute inset-0 bg-[#f0f4f8]/85 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-[#0284c7] px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-white border border-[#d9e2ec] rounded-3xl mt-4",
      emptyStateIcon: "text-slate-300",
      emptyStateTitle: "text-base font-bold text-slate-700",
      emptyStateDesc: "text-xs text-slate-450 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#d9e2ec] shadow-lg py-2.5 z-40 shrink-0 text-slate-500",
      footerScanText: "font-medium text-slate-450",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#102a43] hover:bg-[#0284c7] text-white transition-all uppercase tracking-wider shadow-sm font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-[#0284c7]/10 border border-[#0284c7]/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-[#0284c7] font-sans",
      ratingBadgeEmpty: "text-[10px] text-slate-450 font-bold tracking-wide uppercase bg-slate-100 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-[#d9e2ec]",
      dashesColor: "border-[#cbd5e1]",
      chefSpotlightBg: "bg-[#0284c7]/5",
      spotlightCard: "bg-white border border-[#d9e2ec] rounded-3xl shadow-sm overflow-hidden flex flex-col p-0 transition-all duration-300 hover:shadow-md",
      spotlightTag: "bg-[#0284c7] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-white border border-[#d9e2ec] rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-slate-800",
      modalTitle: "text-sm font-extrabold text-[#102a43] tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-[#f0f4f8] border border-[#d9e2ec] rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0284c7] focus:border-[#0284c7] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-slate-400 hover:text-slate-606 transition-colors",
      modalText: "text-xs font-bold text-slate-500 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-[#0284c7] text-white shadow-sm"
    },
    'chocolate-truffle': {
      wrapper: "min-h-screen bg-[#271a15] text-[#f6ece5] font-sans pb-24 relative overflow-hidden",
      bgDecorations: <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#d97706]/5 rounded-full blur-3xl pointer-events-none" />,
      header: "relative w-full bg-[#3e2c24]/30 border-b border-[#4e382d] text-[#f6ece5] overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-[#4e382d] bg-[#271a15] shadow-xl",
      logoFallback: "bg-gradient-to-tr from-[#5c3d31] to-[#c29864] border-4 border-[#4e382d] shadow-xl",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-[#f6ece5]",
      description: "text-[#c4b19b] text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-[#c4b19b] text-xs hover:text-white transition-colors",
      metaIcon: "text-[#d97706]",
      stickyContainer: "sticky top-0 z-40 bg-[#271a15]/95 backdrop-blur-md border-b border-[#4e382d] shadow-lg shrink-0",
      searchInput: "w-full bg-[#3e2c24]/50 border border-[#4e382d] rounded-2xl py-2.5 text-white placeholder-[#8b7355] focus:outline-none focus:ring-1 focus:ring-[#d97706] focus:border-[#d97706] transition-all text-sm",
      searchIcon: "text-[#8b7355]",
      categoryTab: (isActive) => isActive ? "bg-[#d97706] text-white shadow-sm font-bold" : "bg-[#3e2c24]/80 border border-[#4e382d] text-[#c4b19b] hover:text-white",
      sectionHeader: "text-md font-extrabold text-[#d97706] tracking-tight",
      itemCard: "bg-[#3e2c24]/20 border border-[#4e382d] rounded-2xl shadow-xl overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:border-[#5c3d31]",
      itemName: "font-bold text-white text-sm leading-snug truncate",
      itemDesc: "text-[#c4b19b] text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[#d97706]",
      itemImageBg: "bg-[#3e2c24]",
      itemSoldOutOverlay: "absolute inset-0 bg-[#271a15]/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-[#271a15] uppercase tracking-wider bg-[#d97706] px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-[#3e2c24]/20 border border-[#4e382d] rounded-3xl mt-4",
      emptyStateIcon: "text-[#4e382d]",
      emptyStateTitle: "text-base font-bold text-white",
      emptyStateDesc: "text-xs text-[#c4b19b] mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-[#271a15]/95 backdrop-blur-md border-t border-[#4e382d] shadow-2xl py-2.5 z-40 shrink-0 text-[#c4b19b]",
      footerScanText: "font-medium text-[#8b7355]",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#d97706] hover:bg-amber-600 text-white transition-all uppercase tracking-wider shadow-md font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-[#d97706]/10 border border-[#d97706]/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-[#d97706] font-sans",
      ratingBadgeEmpty: "text-[10px] text-[#c4b19b] font-bold tracking-wide uppercase bg-[#3e2c24] border border-[#4e382d] px-2 py-0.5 rounded font-sans",
      itemDivider: "border-[#4e382d]",
      dashesColor: "border-[#4e382d]/50",
      chefSpotlightBg: "bg-[#d97706]/10",
      spotlightCard: "bg-[#3e2c24]/20 border border-[#4e382d] rounded-3xl shadow-xl overflow-hidden flex flex-col p-0 transition-all duration-300 hover:border-[#5c3d31]",
      spotlightTag: "bg-[#d97706] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-[#3e2c24] border border-[#4e382d] rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-[#f6ece5]",
      modalTitle: "text-sm font-extrabold text-[#d97706] tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-[#271a15] border border-[#4e382d] rounded-xl px-4 py-2.5 text-white placeholder-[#8b7355] focus:outline-none focus:ring-1 focus:ring-[#d97706] focus:border-[#d97706] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-[#c4b19b] hover:text-white transition-colors",
      modalText: "text-xs font-bold text-[#c4b19b] uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-[#d97706] text-white"
    },
    'sunset-glow': {
      wrapper: "min-h-screen bg-[#fff7ed] text-[#ea580c] font-sans pb-24 relative overflow-hidden",
      bgDecorations: null,
      header: "relative w-full bg-white border-b border-orange-100 shadow-sm text-slate-800 overflow-hidden shrink-0 flex flex-col",
      logoBorder: "border-4 border-white bg-white shadow-lg",
      logoFallback: "bg-gradient-to-tr from-orange-500 to-amber-500 border-4 border-white shadow-lg",
      restaurantName: "text-2xl font-black tracking-tight mb-1 text-slate-800",
      description: "text-slate-600 text-xs leading-relaxed max-w-sm mb-3.5 text-center px-2",
      metadata: "text-[#ea580c] text-xs hover:text-orange-850 transition-colors font-semibold",
      metaIcon: "text-[#ea580c]",
      stickyContainer: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm shrink-0",
      searchInput: "w-full bg-orange-50 border border-orange-100 rounded-2xl py-2.5 text-slate-800 placeholder-orange-300 focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c] transition-all text-sm",
      searchIcon: "text-[#ea580c]",
      categoryTab: (isActive) => isActive ? "bg-[#ea580c] text-white shadow-sm font-bold" : "bg-orange-100/50 text-[#ea580c] hover:bg-orange-100",
      sectionHeader: "text-md font-extrabold text-slate-800 tracking-tight",
      itemCard: "bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden flex p-3 gap-3 transition-all duration-300 hover:shadow-md",
      itemName: "font-bold text-slate-800 text-sm leading-snug truncate",
      itemDesc: "text-slate-600 text-[11px] leading-relaxed line-clamp-2 mb-2 text-start",
      itemPrice: "font-bold text-sm shrink-0 text-[#ea580c]",
      itemImageBg: "bg-orange-50",
      itemSoldOutOverlay: "absolute inset-0 bg-[#fff7ed]/80 flex items-center justify-center",
      itemSoldOutBadge: "text-[8px] font-bold text-white uppercase tracking-wider bg-[#ea580c] px-1.5 py-0.5 rounded",
      emptyState: "text-center py-16 px-4 bg-white border border-orange-100 rounded-3xl mt-4",
      emptyStateIcon: "text-orange-200",
      emptyStateTitle: "text-base font-bold text-slate-700",
      emptyStateDesc: "text-xs text-orange-400 mt-1",
      footer: "fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-lg py-2.5 z-40 shrink-0 text-[#ea580c]",
      footerScanText: "font-medium text-orange-400",
      rateUsBtn: "text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#ea580c] hover:bg-[#c2410c] text-white transition-all uppercase tracking-wider shadow-sm font-sans",
      ratingBadge: "flex items-center space-x-1 gap-1 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-705 font-sans",
      ratingBadgeEmpty: "text-[10px] text-orange-400 font-bold tracking-wide uppercase bg-orange-50 px-2 py-0.5 rounded font-sans",
      itemDivider: "border-orange-100",
      dashesColor: "border-orange-100",
      chefSpotlightBg: "bg-[#ea580c]/5",
      spotlightCard: "bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden flex flex-col p-0 transition-all duration-300 hover:shadow-md",
      spotlightTag: "bg-[#ea580c] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-white border border-orange-100 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative text-slate-800",
      modalTitle: "text-sm font-extrabold text-slate-800 tracking-tight text-center mb-4 mt-2 font-sans",
      modalInput: "w-full bg-orange-50 border border-orange-150 rounded-xl px-4 py-2.5 text-slate-800 placeholder-orange-350 focus:outline-none focus:ring-1 focus:ring-[#ea580c] focus:border-[#ea580c] transition-all text-xs resize-none font-sans",
      modalCloseBtn: "absolute top-4 right-4 text-orange-400 hover:text-slate-800 transition-colors",
      modalText: "text-xs font-bold text-orange-500 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-[#ea580c] text-white shadow-sm"
    }
  };

  const currentTheme = colorThemes[themeId] || colorThemes['obsidian-dark'];

  const renderBadge = (badge) => {
    if (!badge) return null;
    
    let styleClass = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    let inlineStyles = {};
    
    if (themeId === 'tarapeza-custom') {
      const getBadgeColor = () => {
        const badgeKey = badge.toLowerCase();
        if (theme.badges && theme.badges[`${badgeKey}Color`]) {
          return theme.badges[`${badgeKey}Color`];
        }
        switch (badge) {
          case 'new': return theme.icons?.newBadgeColor || '#22c55e';
          case 'popular': return theme.icons?.popularBadgeColor || '#f97316';
          case 'spicy': return theme.icons?.spicyBadgeColor || '#ef4444';
          case 'vegan': return theme.icons?.veganBadgeColor || '#22c55e';
          case 'halal': return theme.icons?.halalBadgeColor || '#16a34a';
          default: return 'var(--menu-accent)';
        }
      };
      
      const isBadgeShown = () => {
        const badgeKey = badge.toLowerCase();
        const capKey = badgeKey.charAt(0).toUpperCase() + badgeKey.slice(1);
        if (theme.badges && typeof theme.badges[`show${capKey}`] !== 'undefined') {
          return theme.badges[`show${capKey}`];
        }
        switch (badge) {
          case 'new': return theme.icons?.showNewBadge ?? true;
          case 'popular': return theme.icons?.showPopularBadge ?? true;
          case 'spicy': return theme.icons?.showSpicyBadge ?? true;
          case 'vegan': return theme.icons?.showVeganBadge ?? true;
          case 'halal': return theme.icons?.showHalalBadge ?? true;
          default: return true;
        }
      };
      
      if (!isBadgeShown()) return null;
      
      const badgeColor = getBadgeColor();
      inlineStyles = {
        color: badgeColor,
        borderColor: `${badgeColor}30`,
        backgroundColor: `${badgeColor}10`
      };
      styleClass = '';
    } else {
      const badgeStyles = {
        chef: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        bestseller: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        popular: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        spicy: 'bg-red-500/10 text-red-500 border-red-500/20',
      };
      styleClass = badgeStyles[badge] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
    
    const badgeIcons = {
      chef: '⭐',
      bestseller: '🔥',
      new: '✨',
      popular: '📈',
      spicy: '🌶️',
    };
    
    const icon = badgeIcons[badge] || '';
    
    const getBadgeLabel = () => {
      const badgeKey = badge.toLowerCase();
      if (theme.badges && theme.badges[`${badgeKey}Label`]) {
        return theme.badges[`${badgeKey}Label`];
      }
      return currentT[badge] || badge;
    };
    
    const text = getBadgeLabel();

    return (
      <span 
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wide uppercase font-sans shrink-0 ${styleClass} ${badge === 'chef' ? 'animate-pulse' : ''}`}
        style={inlineStyles}
      >
        {theme.icons?.style === 'Emoji' && <span>{icon}</span>}
        <span>{text}</span>
      </span>
    );
  };

  const getCardStyle = () => {
    if (themeId === 'tarapeza-custom') return 'custom-menu-card';
    if (themeId === 'custom') return 'bg-[var(--color-card-bg)] border border-[var(--color-text)]/10 text-[var(--color-text)]';
    if (themeId === 'obsidian-dark') return 'bg-slate-900/30 border border-slate-900 text-slate-100';
    if (themeId === 'pearl-light') return 'bg-slate-50 border border-slate-200/80 text-slate-800';
    if (themeId === 'warm-bistro') return 'bg-[#fcf7ee]/85 border border-[#e8d5be] text-[#4a2e1b]';
    if (themeId === 'crimson-retro') return 'bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-slate-900';
    return 'bg-slate-900/30 border border-slate-900 text-slate-100';
  };

  const getDividerStyle = () => {
    if (themeId === 'tarapeza-custom') return 'border-t border-[var(--menu-border)]/60';
    if (themeId === 'custom') return 'border-t border-[var(--color-text)]/15';
    if (themeId === 'pearl-light') return 'border-t border-slate-200';
    if (themeId === 'warm-bistro') return 'border-t border-[#e8d5be]';
    if (themeId === 'crimson-retro') return 'border-t-2 border-slate-900';
    return 'border-t border-slate-900/50';
  };

  const renderItemCard = (item, itemIdx) => {
    const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
    const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
    
    const showImage = theme.layout.showImage && item.image_url;
    const imgPos = theme.layout.imagePosition;
    const isAlternatingMagazine = theme.layout.cardStyle === 'magazine';
    const isImageRight = isAlternatingMagazine ? (itemIdx % 2 === 1) : (imgPos === 'right');
    const isCompact = theme.layout.cardStyle === 'compact' || theme.layout.cardStyle === 'compact-list';

    return (
      <div 
         key={item.id} 
         onClick={() => setSelectedItem(item)}
         className={`group border border-[var(--color-border)]/60 bg-[var(--color-card-bg)] shadow-md hover:shadow-xl hover:shadow-[var(--color-accent)]/5 hover:-translate-y-1.5 hover:scale-[1.01] hover:border-[var(--color-accent)]/40 active:scale-[0.99] rounded-[1.75rem] overflow-hidden flex cursor-pointer transition-all duration-300 ${
           item.available ? 'opacity-100' : 'opacity-60'
         } ${
           isCompact ? 'py-3 px-4 items-center justify-between' :
           ((theme.layout.cardStyle && theme.layout.cardStyle.startsWith('grid')) || imgPos === 'top') ? 'flex-col p-0' :
           isImageRight ? 'flex-row-reverse p-3 gap-3.5' : 'flex-row p-3 gap-3.5'
         }`}
         style={{
           backgroundImage: imgPos === 'background' && showImage ? `linear-gradient(to top, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.15) 100%), url(${item.image_url})` : 'none',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           color: imgPos === 'background' && showImage ? '#FFFFFF' : 'var(--color-text)'
         }}
      >
        {showImage && imgPos !== 'background' && (
          <div 
            className="relative shrink-0 bg-black/5 overflow-hidden border border-[var(--color-border)]/30 shadow-sm"
            style={{
              width: ((theme.layout.cardStyle && theme.layout.cardStyle.startsWith('grid')) || imgPos === 'top') ? '100%' : isCompact ? '45px' : '105px',
              height: ((theme.layout.cardStyle && theme.layout.cardStyle.startsWith('grid')) || imgPos === 'top') ? '135px' : isCompact ? '45px' : '105px',
              borderRadius: '20px'
            }}
          >
            <Image 
              src={item.image_url} 
              alt={displayName} 
              fill
              loading="lazy"
              className="object-cover transition-transform duration-700 group-hover:scale-108"
            />
            {!item.available && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {currentT.soldOut}
                </span>
              </div>
            )}
          </div>
        )}

        <div className={`flex-1 flex flex-col justify-between ${isCompact ? '' : 'p-2 gap-2.5'}`}>
          <div className="space-y-1.5 text-start">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-black text-sm sm:text-base leading-snug truncate flex items-center gap-1.5 flex-wrap text-[var(--color-text)]" style={{ color: imgPos === 'background' && showImage ? '#FFFFFF' : 'var(--color-text)' }}>
                <span>{displayName}</span>
                {theme.layout.showBadges && item.badge && renderBadge(item.badge)}
              </h4>
              {!isCompact && theme.layout.showCurrency && (
                <div className="flex flex-col items-end shrink-0">
                  <span className="inline-block font-black text-xs sm:text-sm text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-xl border border-[var(--color-accent)]/10 whitespace-nowrap">
                    {theme.layout.currency || theme.layout.currencySymbol || '$'}{item.price}
                  </span>
                  {theme.layout.showCalories && (item.calories || item.cal) && (
                    <span className="text-[9px] text-[var(--color-text-secondary)] mt-1">{(item.calories || item.cal)}</span>
                  )}
                  {theme.layout.showCalories && !(item.calories || item.cal) && (
                    <span className="text-[9px] text-[var(--color-text-secondary)] font-medium mt-1">350 kcal</span>
                  )}
                </div>
              )}
            </div>
            {!isCompact && theme.layout.showDescription && displayDesc && (
              <p className="text-[11px] leading-relaxed line-clamp-2 text-[var(--color-text-secondary)]/85" style={{ color: imgPos === 'background' && showImage ? '#D1D5DB' : 'var(--color-text-secondary)' }}>
                {displayDesc}
              </p>
            )}
          </div>

          {isCompact && theme.layout.showCurrency && (
            <div className="flex items-center gap-2 shrink-0">
              {theme.layout.showCalories && (item.calories || item.cal) && (
                <span className="text-[9px] text-[var(--color-text-secondary)]">{(item.calories || item.cal)}</span>
              )}
              {theme.layout.showCalories && !(item.calories || item.cal) && (
                <span className="text-[9px] text-[var(--color-text-secondary)] font-medium">350 kcal</span>
              )}
              <span className="inline-block font-black text-xs text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-xl border border-[var(--color-accent)]/10 whitespace-nowrap">
                {theme.layout.currency || theme.layout.currencySymbol || '$'}{item.price}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const themeMode = profile.theme || 'light';
  const defaultBg = themeMode === 'dark' ? '#0F1524' : '#FFFFFF';
  const defaultText = themeMode === 'dark' ? '#F8FAFC' : '#0F172A';
  const defaultCardBg = themeMode === 'dark' ? '#1E293B' : '#F8FAFC';
  const defaultCardText = themeMode === 'dark' ? '#F8FAFC' : '#0F172A';
  const defaultBorder = themeMode === 'dark' ? '#334155' : '#E2E8F0';

  return (
    <div 
      className={currentTheme.wrapper}
      style={{ 
        '--primary-theme': primaryColor,
        '--color-accent': primaryColor,
        '--color-accent-rgb': primaryColorRgb,
        '--color-bg': profile.color_bg || defaultBg,
        '--color-text': profile.color_text || defaultText,
        '--color-card-bg': profile.color_card_bg || defaultCardBg,
        '--color-card-text': profile.color_card_text || defaultCardText,
        '--color-border': profile.color_border || defaultBorder,
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {profile.temporarily_closed && (
        <div className="w-full bg-rose-600 text-white text-xs font-black py-3 px-4 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
          <span>⚠️ We are temporarily closed / مغلقين مؤقتاً</span>
        </div>
      )}

      {themeId === 'tarapeza-custom' && (
        <>
          <link rel="stylesheet" href={fontUrl} />
          <style dangerouslySetInnerHTML={{ __html: cssOverrides }} />
        </>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 12px rgba(var(--color-accent-rgb), 0.15), inset 0 0 0 1px rgba(var(--color-accent-rgb), 0.2); 
            border-color: rgba(var(--color-accent-rgb), 0.25);
          }
          50% { 
            box-shadow: 0 0 24px rgba(var(--color-accent-rgb), 0.45), inset 0 0 0 1px rgba(var(--color-accent-rgb), 0.4); 
            border-color: rgba(var(--color-accent-rgb), 0.55);
          }
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .glass-glow {
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {profile.promo_banner_active && (
        <div className={`w-full overflow-hidden text-xs py-2.5 px-4 border-b relative z-50 font-sans shadow-sm flex items-center justify-center ${
          profile.promo_banner_color === 'accent' ? 'bg-[var(--primary-theme)] text-white border-black/10' :
          profile.promo_banner_color === 'orange' ? 'bg-orange-600 text-white border-orange-700' :
          profile.promo_banner_color === 'green' ? 'bg-emerald-600 text-white border-emerald-700' :
          profile.promo_banner_color === 'red' ? 'bg-rose-600 text-white border-rose-700' :
          profile.promo_banner_color === 'indigo' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-[var(--primary-theme)] text-white border-black/10'
        }`}>
          {profile.promo_banner_scroll ? (
            <div className="w-full relative whitespace-nowrap overflow-hidden flex">
              <div className="animate-marquee whitespace-nowrap select-none flex">
                <span className="px-6 font-bold shrink-0">
                  {isRtl ? (profile.promo_banner_text_ar || profile.promo_banner_text) : (profile.promo_banner_text || profile.promo_banner_text_ar)}
                </span>
                <span className="px-6 font-bold shrink-0">
                  {isRtl ? (profile.promo_banner_text_ar || profile.promo_banner_text) : (profile.promo_banner_text || profile.promo_banner_text_ar)}
                </span>
                <span className="px-6 font-bold shrink-0">
                  {isRtl ? (profile.promo_banner_text_ar || profile.promo_banner_text) : (profile.promo_banner_text || profile.promo_banner_text_ar)}
                </span>
                <span className="px-6 font-bold shrink-0">
                  {isRtl ? (profile.promo_banner_text_ar || profile.promo_banner_text) : (profile.promo_banner_text || profile.promo_banner_text_ar)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center font-bold font-sans">
              {isRtl ? (profile.promo_banner_text_ar || profile.promo_banner_text) : (profile.promo_banner_text || profile.promo_banner_text_ar)}
            </div>
          )}
        </div>
      )}

      {currentTheme.bgDecorations}

      {/* 1. Header Hero Panel */}
      <header className="relative w-full">
        {/* Top Header Buttons Overlay */}
        <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-20 flex items-center gap-2`}>
          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="flex items-center justify-center bg-black/40 hover:bg-black/60 text-white border border-white/10 p-2 rounded-full backdrop-blur-md transition-all active:scale-95 shadow-md"
            title={isRtl ? "إضافة للمفضلة" : "Favorite this Restaurant"}
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>
          
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center space-x-1 bg-black/40 hover:bg-black/60 text-white border border-white/10 py-1.5 px-3 rounded-full text-xs font-semibold backdrop-blur-md transition-all gap-1"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{lang === 'en' ? 'العربية (AR)' : 'English (EN)'}</span>
          </button>
        </div>

        {headerStyle === 'inline-clean' ? (
          // 2. Inline Left-Aligned Header Style
          <div className="w-full flex flex-col">
            {/* Thin Cover Banner */}
            {theme.layout?.headerStyle !== 'logo-only' && (
              <div 
                style={themeId === 'tarapeza-custom' && theme.layout?.bannerHeight ? { height: `${theme.layout.bannerHeight - 60}px` } : {}}
                className="relative h-28 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden shrink-0"
              >
                {profile.cover_url ? (
                  <>
                    <Image 
                      src={profile.cover_url} 
                      alt={`${profile.name} Cover`} 
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
                )}
              </div>
            )}
            {/* Inline Left-Aligned Logo & Info */}
            <div className="relative max-w-lg mx-auto w-full px-6 py-5 flex items-center gap-4 text-start justify-start flex-wrap sm:flex-nowrap">
              {profile.logo_url ? (
                <Image 
                  src={profile.logo_url} 
                  alt={profile.name} 
                  width={72}
                  height={72}
                  priority
                  className={`rounded-2xl object-cover bg-white shrink-0 shadow-md ${currentTheme.logoBorder}`}
                />
              ) : (
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${currentTheme.logoFallback}`}>
                  <span className="text-xl font-black text-white uppercase">{profile.name[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className={`${currentTheme.restaurantName} !text-xl !text-start !mb-1`}>{profile.name}</h1>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {averageRating ? (
                    <div className={mergeStyle(currentTheme.ratingBadge, 'badge')}>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="text-xs ml-1">{averageRating}</span>
                    </div>
                  ) : (
                    <span className={mergeStyle(currentTheme.ratingBadgeEmpty, 'badge')}>{currentT.beFirstToRate}</span>
                  )}
                  <button onClick={() => setShowRateModal(true)} className={mergeStyle(`${currentTheme.rateUsBtn} !px-2 !py-0.5 !text-[9px]`, 'button')}>
                    {currentT.rateUs}
                  </button>
                </div>
                {profile.description && (
                  <p className={`${currentTheme.description} !text-start !mb-0 !px-0 text-[11px]`}>{profile.description}</p>
                )}
                {(profile.phone || profile.address) && (
                  <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 mt-2 text-[10px] font-semibold">
                    {profile.phone && (
                      <a href={`tel:${profile.phone}`} className={`flex items-center space-x-1 transition-colors gap-1 ${currentTheme.metadata}`}>
                        <Phone className={`h-3 w-3 ${currentTheme.metaIcon}`} />
                        <span>{profile.phone}</span>
                      </a>
                    )}
                    {profile.address && (
                      <span className={`flex items-center space-x-1 gap-1 ${currentTheme.metadata}`}>
                        <MapPin className={`h-3 w-3 ${currentTheme.metaIcon}`} />
                        <span className="line-clamp-1">{profile.address}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : headerStyle === 'glassy-hero' ? (
          // 3. Glassy Hero Card Header Style
          <div className="relative h-72 w-full flex items-end justify-center pb-6">
            {profile.cover_url ? (
              <>
                <Image 
                  src={profile.cover_url} 
                  alt={`${profile.name} Cover`} 
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950"></div>
            )}
            
            {/* Glassmorphic Panel */}
            <div className="relative z-10 w-[90%] max-w-md bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-4 flex flex-col items-center text-center shadow-2xl">
              {profile.logo_url ? (
                <Image 
                  src={profile.logo_url} 
                  alt={profile.name} 
                  width={56}
                  height={56}
                  priority
                  className="rounded-2xl object-cover bg-white -mt-10 mb-2 border border-white/40 shadow-lg"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center -mt-10 mb-2 bg-gradient-to-tr from-amber-500 to-orange-500 border border-white/40 shadow-lg">
                  <span className="text-lg font-black text-white uppercase">{profile.name[0]}</span>
                </div>
              )}
              <h1 className="text-lg font-extrabold text-white mb-1 shadow-sm leading-tight">{profile.name}</h1>
              <div className="flex items-center gap-2 mb-2">
                {averageRating ? (
                  <div className="flex items-center gap-1 bg-white/20 border border-white/25 px-2 py-0.5 rounded-full text-xs font-bold text-amber-300">
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300 shrink-0" />
                    <span>{averageRating}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full">{currentT.beFirstToRate}</span>
                )}
                <button onClick={() => setShowRateModal(true)} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 transition-all">
                  {currentT.rateUs}
                </button>
              </div>
              {profile.description && (
                <p className="text-[10px] text-white/90 leading-relaxed line-clamp-2">{profile.description}</p>
              )}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2.5 text-[9px] font-semibold text-white/80">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center space-x-1 hover:text-white transition-colors gap-1">
                      <Phone className="h-3 w-3 text-white/60" />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    <span className="flex items-center space-x-1 gap-1">
                      <MapPin className="h-3 w-3 text-white/60" />
                      <span className="line-clamp-1">{profile.address}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : headerStyle === 'minimalist-flat' ? (
          // 4. Flat Minimalist Header Style (No Cover Banner)
          <div className="max-w-lg mx-auto w-full px-6 py-6 flex items-center gap-4 text-start justify-start flex-wrap sm:flex-nowrap border-b border-current/10">
            {profile.logo_url ? (
              <Image 
                src={profile.logo_url} 
                alt={profile.name} 
                width={72}
                height={72}
                priority
                className={`rounded-full object-cover bg-white shrink-0 border border-current/10 ${currentTheme.logoBorder}`}
              />
            ) : (
              <div className={`h-16 w-16 rounded-full flex items-center justify-center shrink-0 ${currentTheme.logoFallback}`}>
                <span className="text-xl font-black text-white uppercase">{profile.name[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className={`${currentTheme.restaurantName} !text-xl !text-start !mb-1`}>{profile.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {averageRating ? (
                  <div className={mergeStyle(currentTheme.ratingBadge, 'badge')}>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-xs ml-1">{averageRating}</span>
                  </div>
                ) : (
                  <span className={mergeStyle(currentTheme.ratingBadgeEmpty, 'badge')}>{currentT.beFirstToRate}</span>
                )}
                <button onClick={() => setShowRateModal(true)} className={mergeStyle(`${currentTheme.rateUsBtn} !px-2 !py-0.5 !text-[9px]`, 'button')}>
                  {currentT.rateUs}
                </button>
              </div>
              {profile.description && (
                <p className={`${currentTheme.description} !text-start !mb-0 !px-0 text-[11px]`}>{profile.description}</p>
              )}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 mt-2 text-[10px] font-semibold">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className={`flex items-center space-x-1 transition-colors gap-1 ${currentTheme.metadata}`}>
                      <Phone className={`h-3 w-3 ${currentTheme.metaIcon}`} />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    <span className={`flex items-center space-x-1 gap-1 ${currentTheme.metadata}`}>
                      <MapPin className={`h-3 w-3 ${currentTheme.metaIcon}`} />
                      <span className="line-clamp-1">{profile.address}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : headerStyle === 'split-magazine' ? (
          // 5. Split Columns Header Style (Magazine)
          <div className="w-full flex flex-col md:flex-row items-stretch border-b border-current/10 bg-white/5 backdrop-blur-sm">
            {/* Cover Image Column (Left on md, top on mobile) */}
            <div className="relative h-48 md:h-auto md:w-1/2 min-h-[180px] overflow-hidden shrink-0">
              {profile.cover_url ? (
                <>
                  <Image 
                    src={profile.cover_url} 
                    alt={`${profile.name} Cover`} 
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 via-transparent to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950"></div>
              )}
            </div>

            {/* Brand Details Column (Right on md, bottom on mobile) */}
            <div className="flex-1 p-6 flex flex-col justify-center text-start items-start md:w-1/2">
              <div className="flex items-center gap-4 mb-3 w-full">
                {profile.logo_url ? (
                  <Image 
                    src={profile.logo_url} 
                    alt={profile.name} 
                    width={64}
                    height={64}
                    priority
                    className={`rounded-xl object-cover bg-white shrink-0 shadow-md ${currentTheme.logoBorder}`}
                  />
                ) : (
                  <div className={`h-16 w-16 rounded-xl flex items-center justify-center shrink-0 shadow-md ${currentTheme.logoFallback}`}>
                    <span className="text-xl font-black text-white uppercase">{profile.name[0]}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className={`${currentTheme.restaurantName} !text-xl !text-start !mb-0 font-serif line-clamp-1`}>{profile.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {averageRating ? (
                      <div className={mergeStyle(currentTheme.ratingBadge, 'badge')}>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="text-xs ml-1">{averageRating}</span>
                      </div>
                    ) : (
                      <span className={mergeStyle(currentTheme.ratingBadgeEmpty, 'badge')}>{currentT.beFirstToRate}</span>
                    )}
                    <button onClick={() => setShowRateModal(true)} className={mergeStyle(`${currentTheme.rateUsBtn} !px-2 !py-0.5 !text-[9px]`, 'button')}>
                      {currentT.rateUs}
                    </button>
                  </div>
                </div>
              </div>
              {profile.description && (
                <p className={`${currentTheme.description} !text-start !mb-0 !px-0 text-[11px] leading-relaxed line-clamp-3`}>{profile.description}</p>
              )}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 mt-3 text-[10px] font-semibold font-sans">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className={`flex items-center space-x-1 transition-colors gap-1 ${currentTheme.metadata}`}>
                      <Phone className={`h-3 w-3 ${currentTheme.metaIcon}`} />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    <span className={`flex items-center space-x-1 gap-1 ${currentTheme.metadata}`}>
                      <MapPin className={`h-3 w-3 ${currentTheme.metaIcon}`} />
                      <span className="line-clamp-1">{profile.address}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : headerStyle === 'banner-neon' ? (
          // 6. Neon Cyberpunk Header Style
          <div className="w-full bg-slate-950 border-b border-[var(--primary-theme)] shadow-[0_0_15px_rgba(var(--primary-theme),0.15)] text-slate-100 font-mono py-8 px-6 relative overflow-hidden flex flex-col items-center">
            {/* Cyberpunk background grid/lines */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(249,115,22,0.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--primary-theme)] to-transparent opacity-80"></div>
            
            {/* Cover image backdrop with grayscale/contrast styling */}
            {profile.cover_url && (
              <div className="absolute inset-0 opacity-20 filter grayscale contrast-150 pointer-events-none">
                <Image 
                  src={profile.cover_url} 
                  alt="Cyber Cover" 
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/80" />
              </div>
            )}

            {/* Neon styled Logo */}
            <div className="relative mb-4 z-10">
              {profile.logo_url ? (
                <div className="p-1 rounded-full border-2 border-[var(--primary-theme)] shadow-[0_0_10px_rgba(var(--primary-theme),0.4)] bg-slate-950">
                  <Image 
                    src={profile.logo_url} 
                    alt={profile.name} 
                    width={72}
                    height={72}
                    priority
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full flex items-center justify-center border-2 border-[var(--primary-theme)] shadow-[0_0_10px_rgba(var(--primary-theme),0.4)] bg-slate-900">
                  <span className="text-xl font-black text-[var(--primary-theme)] uppercase">{profile.name[0]}</span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-slate-950 border border-[var(--primary-theme)] text-[7px] text-[var(--primary-theme)] px-1 py-0.5 rounded font-mono uppercase tracking-wider">
                SYS.ON
              </span>
            </div>

            {/* Brand Title */}
            <div className="z-10 text-center max-w-sm">
              <h1 className="text-2xl font-black tracking-widest text-white uppercase mb-1 drop-shadow-[0_0_8px_rgba(var(--primary-theme),0.5)]">
                {profile.name}
              </h1>
              <div className="flex items-center justify-center gap-3 mb-3 text-[10px] text-slate-400">
                {averageRating ? (
                  <div className="flex items-center gap-1 border border-[var(--primary-theme)]/40 bg-slate-900/60 px-2 py-0.5 rounded text-[var(--primary-theme)] shadow-[0_0_5px_rgba(var(--primary-theme),0.2)]">
                    <span>RATING: {averageRating}</span>
                  </div>
                ) : (
                  <span className="border border-slate-800 bg-slate-900/40 px-2 py-0.5 rounded text-slate-500">NO_RATING</span>
                )}
                <button 
                  onClick={() => setShowRateModal(true)} 
                  className="px-2 py-0.5 border border-[var(--primary-theme)] bg-[var(--primary-theme)]/10 text-white rounded hover:bg-[var(--primary-theme)]/20 transition-all uppercase text-[9px] tracking-wider"
                >
                  [RATE_US]
                </button>
              </div>
              {profile.description && (
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono px-4 border-l border-r border-[var(--primary-theme)]/20">
                  {`// ${profile.description}`}
                </p>
              )}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-[9px] font-mono text-slate-400 border-t border-[var(--primary-theme)]/20 pt-2 w-full max-w-xs mx-auto">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center space-x-1 hover:text-[var(--primary-theme)] transition-colors gap-1">
                      <Phone className="h-3 w-3 text-[var(--primary-theme)]" />
                      <span>TEL:{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    <span className="flex items-center space-x-1 gap-1">
                      <MapPin className="h-3 w-3 text-[var(--primary-theme)]" />
                      <span className="line-clamp-1">LOC:{profile.address.toUpperCase()}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : headerStyle === 'newspaper-retro' ? (
          // 7. Newspaper Vintage Header Style
          <div className="w-full bg-[#fbf9f6] text-slate-900 border-b-4 border-double border-slate-900 py-8 px-6 relative overflow-hidden flex flex-col items-center font-serif">
            {/* Retro newspaper textures */}
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none"></div>
            
            <div className="w-full max-w-md border-t border-b border-slate-900 py-1.5 mb-4 flex items-center justify-between text-[9px] uppercase tracking-widest font-mono text-slate-700">
              <span>EST. {profile.created_at ? new Date(profile.created_at).getFullYear() : '2026'}</span>
              <span>• SPECIAL EDITION •</span>
              <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Vintage Monogram or Logo */}
            <div className="relative mb-3 z-10 filter grayscale contrast-125">
              {profile.logo_url ? (
                <Image 
                  src={profile.logo_url} 
                  alt={profile.name} 
                  width={80}
                  height={80}
                  priority
                  className="rounded-none border-2 border-slate-900 object-cover bg-white p-1"
                />
              ) : (
                <div className="h-16 w-16 rounded-none border-2 border-slate-900 flex items-center justify-center bg-white">
                  <span className="text-3xl font-extrabold text-slate-900 font-serif uppercase">{profile.name[0]}</span>
                </div>
              )}
            </div>

            {/* Masthead Restaurant Name */}
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase font-serif text-center mb-2 leading-none border-b-2 border-slate-900 pb-2 px-6">
              {profile.name}
            </h1>

            <div className="flex items-center justify-center gap-4 mb-3 text-xs tracking-wider uppercase font-mono text-slate-800 font-bold">
              {averageRating ? (
                <div className="flex items-center gap-1">
                  <span>★ RATING: {averageRating} / 5.0</span>
                </div>
              ) : (
                <span>NEW OPENING</span>
              )}
              <button 
                onClick={() => setShowRateModal(true)} 
                className="px-2 py-0.5 border border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white transition-all text-[9px] uppercase"
              >
                {currentT.rateUs}
              </button>
            </div>

            {profile.description && (
              <p className="text-xs text-slate-700 text-center leading-relaxed font-serif max-w-sm italic px-4 border-t border-slate-900/20 pt-2">
                "{profile.description}"
              </p>
            )}
            {(profile.phone || profile.address) && (
              <div className="w-full max-w-xs border-t border-slate-900 mt-3 pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-800 font-bold uppercase mx-auto">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center space-x-1 hover:underline gap-1">
                    <Phone className="h-3 w-3 text-slate-900" />
                    <span>PH: {profile.phone}</span>
                  </a>
                )}
                {profile.address && (
                  <span className="flex items-center space-x-1 gap-1">
                    <MapPin className="h-3 w-3 text-slate-900" />
                    <span className="line-clamp-1">ADD: {profile.address}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        ) : headerStyle === 'royal-gold' ? (
          // 8. Royal Gold Rim Header Style
          <div className="w-full bg-gradient-to-b from-[#141517] to-[#0c0d0e] text-[#f4efe6] border-b border-[#c29864]/40 py-10 px-6 relative overflow-hidden flex flex-col items-center font-serif">
            {/* Elegant subtle gold corners or border lines inside */}
            <div className="absolute inset-4 border border-[#c29864]/20 pointer-events-none"></div>
            <div className="absolute inset-5 border border-[#c29864]/10 pointer-events-none"></div>
            
            {/* Subtle gold lighting overlay */}
            <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-80 h-80 bg-[#c29864]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Luxury Logo with Gold Frame */}
            <div className="relative mb-5 z-10">
              {profile.logo_url ? (
                <div className="p-1 rounded-full border border-[#c29864] shadow-[0_0_15px_rgba(194,152,100,0.2)] bg-[#141517]">
                  <Image 
                    src={profile.logo_url} 
                    alt={profile.name} 
                    width={76}
                    height={76}
                    priority
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full flex items-center justify-center border border-[#c29864] bg-[#141517] shadow-[0_0_15px_rgba(194,152,100,0.2)]">
                  <span className="text-xl font-extrabold text-[#c29864] uppercase">{profile.name[0]}</span>
                </div>
              )}
            </div>

            {/* Royal Brand Title */}
            <div className="z-10 text-center max-w-sm">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#c29864] mb-1.5 block">
                WELCOME TO
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white font-serif mb-2 bg-gradient-to-r from-[#dfb76c] via-[#c29864] to-[#dfb76c] bg-clip-text text-transparent">
                {profile.name}
              </h1>
              
              <div className="flex items-center justify-center gap-3 mb-4 text-[10px] tracking-wider text-[#c29864]">
                {averageRating ? (
                  <div className="flex items-center gap-1 border border-[#c29864]/30 px-2.5 py-0.5 bg-[#c29864]/5 rounded-sm">
                    <Star className="h-3 w-3 fill-[#c29864] text-[#c29864] shrink-0" />
                    <span>{averageRating}</span>
                  </div>
                ) : (
                  <span className="border border-[#c29864]/20 px-2 py-0.5 text-[#c29864]/80">EXCLUSIVE EXPERIENCE</span>
                )}
                <button 
                  onClick={() => setShowRateModal(true)} 
                  className="px-2.5 py-0.5 border border-[#c29864] bg-[#c29864]/10 hover:bg-[#c29864]/20 text-[#f4efe6] transition-all uppercase text-[9px] tracking-widest font-sans rounded-none"
                >
                  {currentT.rateUs}
                </button>
              </div>

              {profile.description && (
                <p className="text-xs text-[#c29864]/70 leading-relaxed font-serif max-w-xs mx-auto italic px-2">
                  "{profile.description}"
                </p>
              )}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-[10px] font-serif text-[#c29864]/95 border-t border-[#c29864]/20 pt-2.5 w-full max-w-xs mx-auto">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center space-x-1 hover:text-white transition-colors gap-1">
                      <Phone className="h-3 w-3 text-[#c29864]" />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    <span className="flex items-center space-x-1 gap-1">
                      <MapPin className="h-3 w-3 text-[#c29864]" />
                      <span className="line-clamp-1">{profile.address}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // 1. Centered Overlap Header Style (Default)
          <div className="w-full">
            {/* Cover Photo */}
            {headerStyle !== 'logo-only' && (
              <div 
                style={themeId === 'tarapeza-custom' && theme.layout?.bannerHeight ? { height: `${theme.layout.bannerHeight}px` } : {}}
                className="relative h-72 sm:h-80 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden shrink-0 shadow-inner"
              >
                {profile.cover_url ? (
                  <>
                    <Image 
                      src={profile.cover_url} 
                      alt={`${profile.name} Cover`} 
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover transition-transform duration-1000 ease-out hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
                  </>
                ) : (
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
                )}
              </div>
            )}
            
            {/* Restaurant Info & Actions Glassmorphic Card (Centered Overlap Redesign) */}
            <div className="relative -mt-24 mx-4 mb-8 max-w-lg md:mx-auto bg-[var(--color-card-bg)]/85 backdrop-blur-3xl border border-[var(--color-border)]/75 rounded-3xl p-5 shadow-2xl z-10 flex flex-col items-center text-center space-y-4">
              
              {/* Logo Capsule */}
              <div className="relative -mt-20 shrink-0">
                {profile.logo_url ? (
                  <div className="p-1 rounded-[2rem] bg-[var(--color-card-bg)] border border-[var(--color-border)]/65 shadow-lg transition-all hover:scale-105 duration-500 animate-pulse-glow">
                    <Image 
                      src={profile.logo_url} 
                      alt={profile.name} 
                      width={96}
                      height={96}
                      priority
                      className="rounded-[1.75rem] object-cover bg-white"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-[2rem] flex items-center justify-center bg-gradient-to-tr from-[var(--color-accent)] to-orange-500 shadow-lg animate-pulse-glow">
                    <span className="text-3xl font-black text-white uppercase">{profile.name[0]}</span>
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div className="space-y-2 w-full">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)] drop-shadow-sm">{profile.name}</h1>
                
                {/* Badges Row */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {averageRating ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{averageRating}</span>
                      <span className="opacity-75 font-semibold text-[10px]">
                        ({totalReviews})
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text-secondary)]">
                      {currentT.beFirstToRate}
                    </span>
                  )}
                  
                  {isCurrentlyOpen ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{isRtl ? 'مفتوح الآن' : 'Open Now'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{isRtl ? 'مغلق الآن' : 'Closed Now'}</span>
                    </span>
                  )}

                  <button
                    onClick={() => setShowRateModal(true)}
                    className="text-[10px] font-black px-3.5 py-1 rounded-full transition-all uppercase tracking-wider shadow-md font-sans bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shrink-0"
                  >
                    {currentT.rateUs}
                  </button>
                </div>
              </div>

              {/* Description */}
              {profile.description && (
                <p className="text-xs leading-relaxed max-w-sm text-[var(--color-text-secondary)]/85 px-2 font-medium">{profile.description}</p>
              )}

              {/* Contact Chips */}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card-bg)]/60 backdrop-blur-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-sm active:scale-95 text-[var(--color-text)] text-xs font-semibold shrink-0"
                      title={isRtl ? 'اتصل بنا' : 'Call Us'}
                    >
                      <Phone className="h-3.5 w-3.5 text-[var(--color-accent)] shrink-0" />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    profile.map_link ? (
                      <a
                        href={profile.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card-bg)]/60 backdrop-blur-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all shadow-sm active:scale-95 text-[var(--color-text)] text-xs font-semibold max-w-[200px] sm:max-w-xs shrink-0"
                        title={isRtl ? 'افتح الموقع على الخريطة' : 'Open in Maps'}
                      >
                        <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)] shrink-0" />
                        <span className="truncate">{profile.address}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-card-bg)]/60 backdrop-blur-sm text-[var(--color-text)] text-xs font-semibold max-w-[200px] sm:max-w-xs shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)] shrink-0" />
                        <span className="truncate">{profile.address}</span>
                      </span>
                    )
                  )}
                </div>
              )}

              {/* Futuristic App-style Quick Actions Grid */}
              {(() => {
                const actions = [
                  {
                    id: 'hours',
                    show: true,
                    onClick: () => setShowInfoModal(true),
                    icon: <Clock className="h-4.5 w-4.5" />,
                    title: isRtl ? 'معلومات العمل' : 'Hours & Info',
                    subtitle: isCurrentlyOpen ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        {isRtl ? 'مفتوح' : 'Open'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500">
                        <span className="h-1 w-1 rounded-full bg-rose-500" />
                        {isRtl ? 'مغلق' : 'Closed'}
                      </span>
                    )
                  },
                  (profile.wifi_name || profile.wifi_password) && {
                    id: 'wifi',
                    show: true,
                    onClick: () => setShowWifiModal(true),
                    icon: <Wifi className="h-4.5 w-4.5" />,
                    title: isRtl ? 'واي فاي' : 'Free WiFi',
                    subtitle: profile.wifi_name || (isRtl ? 'متاح' : 'Available')
                  },
                  profile.website && {
                    id: 'website',
                    show: true,
                    href: profile.website,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    icon: <Globe className="h-4.5 w-4.5" />,
                    title: isRtl ? 'الموقع' : 'Website',
                    subtitle: profile.website.replace(/^https?:\/\/(www\.)?/, '')
                  },
                  profile.map_link && {
                    id: 'map',
                    show: true,
                    href: profile.map_link,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    icon: <MapPin className="h-4.5 w-4.5" />,
                    title: isRtl ? 'الموقع الجغرافي' : 'Find Us',
                    subtitle: isRtl ? 'خرائط جوجل' : 'Google Maps'
                  }
                ].filter(Boolean);

                return (
                  <div className={`grid gap-2.5 w-full pt-1 ${
                    actions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    {actions.map((act, index) => {
                      const buttonClass = `flex items-center gap-3 p-2.5 rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-card-bg)]/45 text-start transition-all hover:border-[var(--color-accent)] hover:shadow-md hover:shadow-[var(--color-accent)]/5 active:scale-98 shadow-sm group/btn ${
                        actions.length === 3 && index === 2 ? 'col-span-2' : ''
                      }`;

                      const content = (
                        <>
                          <div className="p-2 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover/btn:bg-[var(--color-accent)] group-hover/btn:text-white transition-all shrink-0">
                            {act.icon}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black text-[var(--color-text)] tracking-tight leading-none truncate">
                              {act.title}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--color-text)]/50 mt-1 truncate max-w-[150px] leading-none">
                              {act.subtitle}
                            </span>
                          </div>
                        </>
                      );

                      if (act.href) {
                        return (
                          <a
                            key={act.id}
                            href={act.href}
                            target={act.target}
                            rel={act.rel}
                            className={buttonClass}
                          >
                            {content}
                          </a>
                        );
                      }

                      return (
                        <button
                          key={act.id}
                          onClick={act.onClick}
                          className={buttonClass}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Social Channels Row with brand-specific glows */}
              {hasSocialLinks && (
                <div className="border-t border-[var(--color-border)]/60 pt-3 flex flex-col items-center justify-center gap-2.5 w-full">
                  <span className="text-[9px] font-black tracking-wider uppercase text-[var(--color-text)]/40">
                    {isRtl ? 'تابعنا على وسائل التواصل' : 'Follow Our Channels'}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {profile.instagram && (
                      <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full hover:border-pink-500 hover:text-pink-500 hover:shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="Instagram">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </a>
                    )}
                    {profile.facebook && (
                      <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full hover:border-blue-600 hover:text-blue-600 hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="Facebook">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3.3l.7-3H12V6c0-.9.2-1.2 1-1.2h2V2h-3c-2.4 0-4 1.2-4 3.6V8z"/></svg>
                      </a>
                    )}
                    {profile.whatsapp && (
                      <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full hover:border-emerald-500 hover:text-emerald-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="WhatsApp">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.729-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.458 5.463 0 9.907-4.441 9.91-9.904.002-2.648-1.02-5.138-2.879-6.997-1.86-1.86-4.347-2.883-6.997-2.885-5.47 0-9.914 4.444-9.917 9.907-.001 2.015.526 3.987 1.528 5.726L1.87 21.92l4.777-1.766z"/></svg>
                      </a>
                    )}
                    {profile.twitter && (
                      <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://x.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full hover:border-slate-800 hover:text-slate-800 dark:hover:border-white dark:hover:text-white dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.4)] hover:shadow-[0_0_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="X / Twitter">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                    {profile.tiktok && (
                      <a href={profile.tiktok.startsWith('http') ? profile.tiktok : `https://tiktok.com/${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full hover:border-teal-400 hover:text-teal-400 hover:shadow-[0_0_12px_rgba(45,212,191,0.4)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="TikTok">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.032 2.61.1 3.86.38v4.18c-.85-.14-1.72-.18-2.58-.12-.81.06-1.59.35-2.25.85-.6.48-.96 1.21-1.02 1.98-.08 1.13.01 2.26.27 3.37.16.63.48 1.21.93 1.66.45.45 1.03.77 1.66.93 1.11.26 2.24.35 3.37.27.77-.06 1.5-.42 1.98-1.02.5-.66.79-1.44.85-2.25.06-.86.02-1.73-.12-2.58h4.18c.28 1.25.41 2.55.38 3.86-.09 2.29-.98 4.47-2.51 6.16-1.53 1.69-3.62 2.76-5.89 3.03-2.91.35-5.87-.23-8.32-1.63C1.63 17.43.23 14.47.02 11.56.05 9.27.94 7.09 2.47 5.4c1.53-1.69 3.62-2.76 5.89-3.03.73-.09 1.47-.13 2.21-.12.65-.01 1.3.08 1.93.27.01-.17.02-.34.025-.5z"/></svg>
                      </a>
                    )}
                    {profile.youtube && (
                      <a href={profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full hover:border-red-600 hover:text-red-600 hover:shadow-[0_0_12px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="YouTube">
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.017 0 12 0 12s0 3.983.508 5.837a3.003 3.003 0 002.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Restaurant Info Actions Card */}
      {['inline-clean', 'glassy-hero', 'minimalist-flat', 'split-magazine', 'banner-neon', 'newspaper-retro', 'royal-gold'].includes(headerStyle) && (
        <div className="max-w-lg mx-auto px-4 py-4 border-b border-[var(--color-border)]">
          <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-3xl p-4 shadow-sm space-y-4">
            {/* Quick Actions Grid */}
            {(() => {
              const actions = [
                {
                  id: 'hours',
                  show: true,
                  onClick: () => setShowInfoModal(true),
                  icon: <Clock className="h-4.5 w-4.5" />,
                  title: isRtl ? 'معلومات العمل' : 'Hours & Info',
                  subtitle: isCurrentlyOpen ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      {isRtl ? 'مفتوح' : 'Open'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-500">
                      <span className="h-1 w-1 rounded-full bg-rose-500" />
                      {isRtl ? 'مغلق' : 'Closed'}
                    </span>
                  )
                },
                (profile.wifi_name || profile.wifi_password) && {
                  id: 'wifi',
                  show: true,
                  onClick: () => setShowWifiModal(true),
                  icon: <Wifi className="h-4.5 w-4.5" />,
                  title: isRtl ? 'واي فاي' : 'Free WiFi',
                  subtitle: profile.wifi_name || (isRtl ? 'متاح' : 'Available')
                },
                profile.website && {
                  id: 'website',
                  show: true,
                  href: profile.website,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  icon: <Globe className="h-4.5 w-4.5" />,
                  title: isRtl ? 'الموقع' : 'Website',
                  subtitle: profile.website.replace(/^https?:\/\/(www\.)?/, '')
                },
                profile.map_link && {
                  id: 'map',
                  show: true,
                  href: profile.map_link,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  icon: <MapPin className="h-4.5 w-4.5" />,
                  title: isRtl ? 'الموقع الجغرافي' : 'Find Us',
                  subtitle: isRtl ? 'خرائط جوجل' : 'Google Maps'
                }
              ].filter(Boolean);

              return (
                <div className={`grid gap-2.5 w-full ${
                  actions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                }`}>
                  {actions.map((act, index) => {
                    const buttonClass = `flex items-center gap-3 p-2.5 rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-card-bg)]/45 text-start transition-all hover:border-[var(--color-accent)] hover:shadow-md hover:shadow-[var(--color-accent)]/5 active:scale-98 shadow-sm group/btn ${
                      actions.length === 3 && index === 2 ? 'col-span-2' : ''
                    }`;

                    const content = (
                      <>
                        <div className="p-2 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover/btn:bg-[var(--color-accent)] group-hover/btn:text-white transition-all shrink-0">
                          {act.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-black text-[var(--color-text)] tracking-tight leading-none truncate">
                            {act.title}
                          </span>
                          <span className="text-[9px] font-bold text-[var(--color-text)]/50 mt-1 truncate max-w-[150px] leading-none">
                            {act.subtitle}
                          </span>
                        </div>
                      </>
                    );

                    if (act.href) {
                      return (
                        <a
                          key={act.id}
                          href={act.href}
                          target={act.target}
                          rel={act.rel}
                          className={buttonClass}
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <button
                        key={act.id}
                        onClick={act.onClick}
                        className={buttonClass}
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Social Media Row with smooth styling and dividers */}
            {hasSocialLinks && (
              <div className="border-t border-[var(--color-border)] pt-3 flex flex-col items-center justify-center gap-2.5">
                <span className="text-[9px] font-extrabold tracking-wider uppercase text-[var(--color-text)]/40">
                  {isRtl ? 'تابعنا على وسائل التواصل' : 'Follow Our Channels'}
                </span>
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  {profile.instagram && (
                    <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="Instagram">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </a>
                  )}
                  {profile.facebook && (
                    <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="Facebook">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3.3l.7-3H12V6c0-.9.2-1.2 1-1.2h2V2h-3c-2.4 0-4 1.2-4 3.6V8z"/></svg>
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="WhatsApp">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.729-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.458 5.463 0 9.907-4.441 9.91-9.904.002-2.648-1.02-5.138-2.879-6.997-1.86-1.86-4.347-2.883-6.997-2.885-5.47 0-9.914 4.444-9.917 9.907-.001 2.015.526 3.987 1.528 5.726L1.87 21.92l4.777-1.766z"/></svg>
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://x.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="X / Twitter">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {profile.tiktok && (
                    <a href={profile.tiktok.startsWith('http') ? profile.tiktok : `https://tiktok.com/${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="TikTok">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.032 2.61.1 3.86.38v4.18c-.85-.14-1.72-.18-2.58-.12-.81.06-1.59.35-2.25.85-.6.48-.96 1.21-1.02 1.98-.08 1.13.01 2.26.27 3.37.16.63.48 1.21.93 1.66.45.45 1.03.77 1.66.93 1.11.26 2.24.35 3.37.27.77-.06 1.5-.42 1.98-1.02.5-.66.79-1.44.85-2.25.06-.86.02-1.73-.12-2.58h4.18c.28 1.25.41 2.55.38 3.86-.09 2.29-.98 4.47-2.51 6.16-1.53 1.69-3.62 2.76-5.89 3.03-2.91.35-5.87-.23-8.32-1.63C1.63 17.43.23 14.47.02 11.56.05 9.27.94 7.09 2.47 5.4c1.53-1.69 3.62-2.76 5.89-3.03.73-.09 1.47-.13 2.21-.12.65-.01 1.3.08 1.93.27.01-.17.02-.34.025-.5z"/></svg>
                    </a>
                  )}
                  {profile.youtube && (
                    <a href={profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="YouTube">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.017 0 12 0 12s0 3.983.508 5.837a3.003 3.003 0 002.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                  )}
                  {profile.tripadvisor && (
                    <a href={profile.tripadvisor} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:-translate-y-0.5 hover:scale-110 active:scale-95 transition-all text-[var(--color-text-secondary)] shadow-sm" title="TripAdvisor">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.25c-3.447 0-6.25-2.803-6.25-6.25S8.553 5.75 12 5.75s6.25 2.803 6.25 6.25-2.803 6.25-6.25 6.25zM12 7c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm0 8c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Sticky Search, Dietary Filters and Category Tabs */}
      <div className="sticky top-0 z-40 bg-[var(--color-bg)]/85 backdrop-blur-3xl border-b border-[var(--color-border)]/55 shadow-md shadow-black/[0.03] shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3.5 space-y-3.5">
          
          {/* Search bar */}
          <div className="relative flex items-center group">
            <Search className={`absolute ${isRtl ? 'right-4.5' : 'left-4.5'} h-4 w-4 pointer-events-none text-[var(--color-text)]/40 group-focus-within:text-[var(--color-accent)] transition-colors`} />
            <input 
              type="text" 
              placeholder={currentT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-[var(--color-card-bg)]/60 backdrop-blur-md border border-[var(--color-border)]/75 rounded-2xl py-3 text-xs text-[var(--color-text)] placeholder-[var(--color-text)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary-theme)]/25 focus:border-[var(--primary-theme)] focus:shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.1)] transition-all ${
                isRtl ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
              }`}
            />
          </div>

          {/* Quick Dietary Filters (2030 Feature Tag Filters) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
            {[
              { id: 'all', labelEn: 'All Dishes', labelAr: 'الكل' },
              { id: 'chef', labelEn: 'Chef Specials', labelAr: 'مميز الشيف' },
              { id: 'bestseller', labelEn: 'Bestsellers', labelAr: 'الأكثر مبيعاً' },
              { id: 'popular', labelEn: 'Popular', labelAr: 'محبوب' },
              { id: 'new', labelEn: 'New Arrivals', labelAr: 'جديد' },
              { id: 'spicy', labelEn: 'Spicy', labelAr: 'حار 🌶️' }
            ].map(filter => {
              const isActive = activeFilter === filter.id;
              const hasItems = filter.id === 'all' || menuItems.some(item => item.badge?.toLowerCase() === filter.id);
              if (!hasItems) return null;

              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/25 border-none scale-102'
                      : 'bg-[var(--color-card-bg)]/50 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-text)]/30 active:scale-95'
                  }`}
                >
                  {isRtl ? filter.labelAr : filter.labelEn}
                </button>
              );
            })}
          </div>

          {/* Scrolling category list */}
          {!searchQuery && categories.length > 0 && layoutStyle !== 'sidebar' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-0.5 border-t border-[var(--color-border)]/45 scroll-smooth">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`shrink-0 px-4.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm ${
                      isActive 
                        ? 'bg-[var(--primary-theme)] text-white shadow-lg shadow-[var(--primary-theme)]/20 scale-102 border border-[var(--primary-theme)]' 
                        : 'bg-[var(--color-card-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-text)]/20 active:scale-95'
                    }`}
                  >
                    {isRtl && cat.name_ar ? cat.name_ar : cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Menu Content */}
      <main className={`${layoutStyle === 'sidebar' ? 'max-w-4xl' : 'max-w-lg'} mx-auto w-full px-4 pt-6 flex-1`}>
        {!searchQuery && activeFilter === 'all' && specialsItems.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[var(--color-accent)] animate-pulse" />
                <span>{isRtl ? 'أطباق مميزة خاصة' : 'Chef Spotlight & Specials'}</span>
              </h3>
              <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] opacity-60">
                {isRtl ? 'اسحب للمزيد' : 'Swipe for more'}
              </span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x snap-mandatory -mx-4 px-4">
              {specialsItems.map((item) => {
                const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                return (
                  <div
                    key={`special-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    className="w-[280px] shrink-0 snap-start bg-[var(--color-card-bg)] border border-[var(--color-border)]/65 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[var(--color-accent)]/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative"
                  >
                    <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-accent)]/20 rounded-[2rem] pointer-events-none transition-colors duration-300" />
                    
                    <div className="relative h-44 w-full overflow-hidden">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={displayName}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
                          <span className="text-3xl">🍽️</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-bg)] via-transparent to-black/30" />
                      
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-[var(--color-accent)] text-white shadow-sm animate-pulse">
                          <span className="h-1 w-1 rounded-full bg-white animate-ping" />
                          {isRtl ? 'مميز' : 'Special'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[var(--color-card-bg)]/80 backdrop-blur-sm border-t border-[var(--color-border)]/20">
                      <div className="space-y-1 text-start">
                        <h4 className="font-black text-sm text-[var(--color-text)] leading-snug line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
                          {displayName}
                        </h4>
                        {displayDesc && (
                          <p className="text-[10px] leading-relaxed text-[var(--color-text-secondary)] line-clamp-2">
                            {displayDesc}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="inline-block font-black text-xs text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-xl border border-[var(--color-accent)]/10 whitespace-nowrap shadow-[0_0_10px_rgba(var(--color-accent),0.1)]">
                          {theme.layout.currency || theme.layout.currencySymbol || '$'}{item.price}
                        </span>
                        {item.badge && renderBadge(item.badge)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {profile.custom_text && (
          <div className="mb-6 p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl text-xs leading-relaxed text-[var(--color-text-secondary)] shadow-sm text-center font-medium">
            {profile.custom_text}
          </div>
        )}
        {itemsByCategory.length === 0 ? (
          <div className={currentTheme.emptyState}>
            <Search className={`h-10 w-10 mx-auto mb-2 ${currentTheme.emptyStateIcon}`} />
            <h3 className={currentTheme.emptyStateTitle}>{currentT.noItems}</h3>
            <p className={currentTheme.emptyStateDesc}>{currentT.refiningText}</p>
          </div>
        ) : (
          layoutStyle === 'sidebar' && !searchQuery ? (
            /* Sidebar layout style */
            <div className="flex gap-6 items-start">
              {/* Left category list column */}
              <div className="w-20 md:w-28 shrink-0 sticky top-24 self-start flex flex-col gap-2 py-1 overflow-y-auto no-scrollbar max-h-[70vh]">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`px-3 py-3 text-start text-[10px] font-black rounded-2xl border transition-all truncate ${
                        isActive 
                          ? 'bg-[var(--color-tab-active)] text-[var(--color-tab-active-text)] border-[var(--color-tab-active)] shadow-sm'
                          : 'bg-[var(--color-card-bg)] text-[var(--color-tab-inactive-text)] border-[var(--color-border)] hover:border-slate-350 hover:border-slate-400'
                      }`}
                    >
                      {isRtl && cat.name_ar ? cat.name_ar : cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Right content items column */}
              <div className="flex-1 space-y-8">
                {itemsByCategory
                  .filter((catGroup) => catGroup.id === selectedCategory)
                  .map((catGroup) => (
                    <section 
                      key={catGroup.id} 
                      id={`category-${catGroup.id}`}
                      className="space-y-4"
                    >
                      {/* Category Header */}
                      <div className="flex items-center space-x-2 gap-2">
                        <h3 className={currentTheme.sectionHeader}>{isRtl && catGroup.name_ar ? catGroup.name_ar : catGroup.name}</h3>
                      </div>
                      
                      {/* Items list */}
                      <div className="space-y-4">
                        {catGroup.items.map((item, itemIdx) => renderItemCard(item, itemIdx))}
                      </div>
                    </section>
                  ))}
              </div>
            </div>
          ) : (
            /* Classic, Tab, Grid layouts */
            <div className="space-y-8">
              {itemsByCategory
                .filter((catGroup) => {
                  if (layoutStyle === 'tab' && !searchQuery) {
                    return catGroup.id === selectedCategory;
                  }
                  return true;
                })
                .map((catGroup) => (
                  <section 
                    key={catGroup.id} 
                    id={`category-${catGroup.id}`}
                    className="space-y-4 scroll-mt-28"
                  >
                    {/* Category Header */}
                    <div className="flex items-center space-x-2 gap-2">
                      {templateId === 'classic-dark' && <div className="h-4 w-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />}
                      <h3 className={currentTheme.sectionHeader}>{isRtl && catGroup.name_ar ? catGroup.name_ar : catGroup.name}</h3>
                    </div>

                    {/* Items Layout */}
                    {themeId === 'tarapeza-custom' ? (
                      <div className={
                        layoutStyle === 'grid' ? 'grid grid-cols-2 gap-3.5' :
                        (theme.layout.cardStyle === 'grid-3' || theme.layout.cardStyle === 'grid-3col') ? 'grid grid-cols-3 gap-2' :
                        (theme.layout.cardStyle === 'grid-2' || theme.layout.cardStyle === 'grid-2col') ? 'grid grid-cols-2 gap-3.5' :
                        'space-y-4'
                      }>
                        {catGroup.items.map((item, itemIdx) => renderItemCard(item, itemIdx))}
                      </div>
                    ) : templateId === 'modern-light' ? (
                  // 2-Column Grid Layout (modern-light)
                  <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} flex flex-col p-0 overflow-hidden cursor-pointer ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {/* Top aligned photo */}
                          {item.image_url ? (
                            <div className={`relative h-28 w-full shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`h-28 w-full flex items-center justify-center shrink-0 ${currentTheme.itemImageBg}`}>
                              <span className="text-2xl opacity-20">🍽️</span>
                            </div>
                          )}

                          {/* Card Info */}
                          <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                            <div className="space-y-1">
                              {item.badge && (
                                <div className="self-start">
                                  {renderBadge(item.badge)}
                                </div>
                              )}
                              <div className="flex justify-between items-start gap-1">
                                <h4 className={`${currentTheme.itemName} text-xs sm:text-sm leading-snug line-clamp-1 font-bold`}>
                                  {displayName}
                                </h4>
                                <span className={`${currentTheme.itemPrice} text-xs shrink-0 font-extrabold`}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                                </span>
                              </div>
                              {displayDesc && (
                                <p className={`${currentTheme.itemDesc} text-[10px] leading-relaxed line-clamp-2`}>
                                  {displayDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'forest-bistro' ? (
                  // Compact Text-Only List Layout (forest-bistro)
                  <div className="space-y-4">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`py-3 border-b ${currentTheme.itemDivider} flex flex-col gap-1 transition-all cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] px-2 rounded-xl ${
                            item.available ? 'opacity-100' : 'opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className={`flex-1 flex items-baseline ${currentTheme.itemName} text-base tracking-tight font-bold flex-wrap gap-1.5`}>
                              <span>{displayName}</span>
                              {item.badge && renderBadge(item.badge)}
                              <span className={`flex-1 mx-2 border-b border-dashed ${currentTheme.dashesColor} min-w-4`}></span>
                            </h4>
                            <span className={`${currentTheme.itemPrice} text-sm shrink-0 font-bold`}>
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                            </span>
                          </div>
                          {displayDesc && (
                            <p className={`${currentTheme.itemDesc} text-xs leading-relaxed max-w-lg`}>
                              {displayDesc}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'retro-sunset' ? (
                  // Spotlight Focus Layout (retro-sunset)
                  <div className="space-y-4">
                    {catGroup.items.map((item, idx) => {
                      const isSpotlight = idx === 0 && item.image_url;
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      if (isSpotlight) {
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className={`${mergeStyle(currentTheme.spotlightCard, 'card')} overflow-hidden flex flex-col relative min-h-52 group cursor-pointer`}
                          >
                            {/* Full card background picture */}
                            <div className={`h-44 w-full relative overflow-hidden shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                loading="lazy"
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-955 via-slate-955/20 to-transparent" />
                              
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                              
                              <div className={`absolute bottom-3 ${isRtl ? 'left-4' : 'right-4'} text-white z-10 flex justify-between items-end`}>
                                <span className={`inline-flex items-center space-x-1.5 ${currentTheme.spotlightTag}`}>
                                  🔥 chef spotlight
                                </span>
                              </div>
                            </div>

                            {/* Text overlay details */}
                            <div className="p-4 space-y-2">
                              {item.badge && (
                                <div className="self-start">
                                  {renderBadge(item.badge)}
                                </div>
                              )}
                              <div className="flex justify-between items-start gap-2">
                                <h4 className={`${currentTheme.itemName} text-base leading-snug font-extrabold`}>
                                  {displayName}
                                </h4>
                                <span className={`${currentTheme.itemPrice} text-base font-black`}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                                </span>
                              </div>
                              {displayDesc && (
                                <p className={`${currentTheme.itemDesc} text-xs leading-relaxed`}>
                                  {displayDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      // Subsequent items render as standard cards
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} overflow-hidden flex p-3 gap-3 cursor-pointer ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {item.image_url && (
                            <div className={`relative h-20 w-20 rounded-xl overflow-hidden shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="80px"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-0.5">
                                <h4 className={`${currentTheme.itemName} text-sm leading-snug truncate font-bold flex items-center gap-1.5 flex-wrap`}>
                                  <span>{displayName}</span>
                                  {item.badge && renderBadge(item.badge)}
                                </h4>
                                <span className={`${currentTheme.itemPrice} text-sm shrink-0 font-bold`}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                                </span>
                              </div>
                              {displayDesc && (
                                <p className={`${currentTheme.itemDesc} text-[11px] leading-relaxed line-clamp-2 mb-2 text-start`}>
                                  {displayDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'minimalist-rows' ? (
                  // Minimalist Rows Layout (minimalist-rows)
                  <div className="space-y-2">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} cursor-pointer p-2 flex items-center justify-between gap-3 ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.image_url && (
                              <div className={`relative h-10 w-10 rounded-lg overflow-hidden shrink-0 ${currentTheme.itemImageBg}`}>
                                <Image 
                                  src={item.image_url} 
                                  alt={displayName} 
                                  fill
                                  sizes="40px"
                                  loading="lazy"
                                  className="object-cover"
                                />
                                {!item.available && (
                                  <div className={currentTheme.itemSoldOutOverlay}>
                                    <span className="text-[6px] font-bold text-white bg-black/85 px-1 py-0.5 rounded">
                                      {currentT.soldOut}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className={`${currentTheme.itemName} text-xs font-bold truncate flex items-center gap-1.5 flex-wrap`}>
                                <span>{displayName}</span>
                                {item.badge && renderBadge(item.badge)}
                              </h4>
                            </div>
                          </div>
                          <span className={`${currentTheme.itemPrice} text-xs shrink-0 font-bold`}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'widescreen-cards' ? (
                  // Widescreen Cards Layout (widescreen-cards)
                  <div className="space-y-4">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} flex flex-col p-0 overflow-hidden cursor-pointer ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {item.image_url ? (
                            <div className={`relative w-full aspect-[21/9] shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`w-full aspect-[21/9] flex items-center justify-center shrink-0 ${currentTheme.itemImageBg}`}>
                              <span className="text-3xl opacity-20">🍽️</span>
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`${currentTheme.itemName} text-base leading-snug font-bold flex items-center gap-1.5 flex-wrap`}>
                                <span>{displayName}</span>
                                {item.badge && renderBadge(item.badge)}
                              </h4>
                              <span className={`${currentTheme.itemPrice} text-base shrink-0 font-extrabold`}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                              </span>
                            </div>
                            {displayDesc && (
                              <p className={`${currentTheme.itemDesc} text-xs leading-relaxed`}>
                                {displayDesc}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'alternating-magazine' ? (
                  // Alternating Rows Layout (alternating-magazine)
                  <div className="space-y-4">
                    {catGroup.items.map((item, idx) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      const isImageRight = idx % 2 === 1;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} cursor-pointer flex ${isImageRight ? 'flex-row-reverse' : 'flex-row'} ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {item.image_url && (
                            <div className={`relative h-24 w-24 rounded-xl overflow-hidden shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="96px"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between py-1 px-3 min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h4 className={`${currentTheme.itemName} text-sm leading-snug font-bold truncate flex items-center gap-1.5 flex-wrap`}>
                                  <span>{displayName}</span>
                                  {item.badge && renderBadge(item.badge)}
                                </h4>
                                <span className={`${currentTheme.itemPrice} text-sm shrink-0 font-bold`}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                                </span>
                              </div>
                              {displayDesc && (
                                <p className={`${currentTheme.itemDesc} text-[11px] leading-relaxed line-clamp-3 mb-2 text-start`}>
                                  {displayDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'three-column-gallery' ? (
                  // 3-Column Gallery Layout (three-column-gallery)
                  <div className="grid grid-cols-3 gap-2">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} flex flex-col p-0 overflow-hidden cursor-pointer text-center ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {item.image_url ? (
                            <div className={`relative h-20 w-full shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="80px"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className="text-[6px] font-bold text-white bg-black/80 px-1 py-0.5 rounded">
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`h-20 w-full flex items-center justify-center shrink-0 ${currentTheme.itemImageBg}`}>
                              <span className="text-xl opacity-20">🍽️</span>
                            </div>
                          )}
                          <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                            <h4 className={`${currentTheme.itemName} text-[10px] leading-snug line-clamp-2 font-bold`}>
                              {displayName}
                            </h4>
                            <span className={`${currentTheme.itemPrice} text-[10px] shrink-0 font-bold block`}>
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'dense-grid' ? (
                  // Dense Grid Layout (dense-grid)
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} flex flex-col p-0 overflow-hidden cursor-pointer ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {item.image_url ? (
                            <div className={`relative h-32 w-full shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`h-32 w-full flex items-center justify-center shrink-0 ${currentTheme.itemImageBg}`}>
                              <span className="text-2xl opacity-20">🍽️</span>
                            </div>
                          )}
                          <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                            <h4 className={`${currentTheme.itemName} text-xs sm:text-sm font-bold line-clamp-1 flex items-center gap-1 flex-wrap`}>
                              <span>{displayName}</span>
                              {item.badge && renderBadge(item.badge)}
                            </h4>
                            <span className={`${currentTheme.itemPrice} text-xs sm:text-sm shrink-0 font-extrabold block`}>
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : templateId === 'horizontal-swiper' ? (
                  // Horizontal Swiper Layout (horizontal-swiper)
                  <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-6 px-6">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} w-[220px] flex-col p-0 overflow-hidden cursor-pointer snap-start shrink-0 ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {item.image_url ? (
                            <div className={`relative h-28 w-full shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="220px"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`h-28 w-full flex items-center justify-center shrink-0 ${currentTheme.itemImageBg}`}>
                              <span className="text-2xl opacity-20">🍽️</span>
                            </div>
                          )}
                          <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                            <div>
                              <h4 className={`${currentTheme.itemName} text-xs sm:text-sm font-bold line-clamp-1`}>
                                {displayName}
                              </h4>
                              {displayDesc && (
                                <p className={`${currentTheme.itemDesc} text-[10px] leading-relaxed line-clamp-2 mt-0.5`}>
                                  {displayDesc}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className={`${currentTheme.itemPrice} text-xs font-bold`}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                              </span>
                              {item.badge && renderBadge(item.badge)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Default Classic Rows Layout (classic-dark)
                  <div className="space-y-3">
                    {catGroup.items.map((item) => {
                      const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                      const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${mergeStyle(currentTheme.itemCard, 'card')} cursor-pointer ${
                            item.available ? 'opacity-100' : 'opacity-65'
                          }`}
                        >
                          {/* Left/Right Photo based on dir */}
                          {item.image_url && (
                            <div className={`relative h-20 w-20 rounded-xl overflow-hidden shrink-0 ${currentTheme.itemImageBg}`}>
                              <Image 
                                src={item.image_url} 
                                alt={displayName} 
                                fill
                                sizes="80px"
                                loading="lazy"
                                className="object-cover"
                              />
                              {!item.available && (
                                <div className={currentTheme.itemSoldOutOverlay}>
                                  <span className={currentTheme.itemSoldOutBadge}>
                                    {currentT.soldOut}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-0.5">
                                <h4 className={`${currentTheme.itemName} text-sm leading-snug truncate font-bold flex items-center gap-1.5 flex-wrap`}>
                                  <span>{displayName}</span>
                                  {item.badge && renderBadge(item.badge)}
                                </h4>
                                <span className={`${currentTheme.itemPrice} text-sm shrink-0 font-bold`}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(item.price)}
                                </span>
                              </div>
                              
                              {displayDesc && (
                                <p className={`${currentTheme.itemDesc} text-[11px] leading-relaxed line-clamp-2 mb-2 text-start`}>
                                  {displayDesc}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
          )
        )}
      </main>

      {/* Customer Reviews Feed is commented out as requested */}
      {/* <section className={`max-w-lg mx-auto px-6 py-10 ${getDividerStyle()} space-y-6`}>
        <div className="flex items-center justify-between">
          <h2 className={currentTheme.sectionHeader}>
            {isRtl ? 'تقييمات الزوار' : 'Customer Reviews'}
          </h2>
          <span className="text-[10px] bg-slate-900/50 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full font-sans">
            {ratings.length}
          </span>
        </div>

        {ratings.length === 0 ? (
          <div className="text-center py-8 opacity-60 text-xs">
            {isRtl ? 'كن أول من يقيم هذا المطعم!' : 'Be the first to rate this restaurant!'}
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => {
              const dinerName = rating.customer_profiles?.full_name || (isRtl ? 'زائر' : 'Anonymous');
              const isVerified = !!rating.customer_id;
              return (
                <div key={rating.id} className={`${getCardStyle()} rounded-2xl p-4 space-y-2`}>
                  <div className="flex justify-between items-start border-b border-black/5 dark:border-white/5 pb-2">
                    <div>
                      <span className="font-bold text-xs block">{dinerName}</span>
                      <span className="text-[9px] opacity-50 block mt-0.5 font-sans">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {isVerified ? (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 font-sans">
                        {isRtl ? '✓ زبون موثق' : '✓ Verified Diner'}
                      </span>
                    ) : (
                      <span className="bg-slate-500/10 border border-slate-500/20 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 font-sans">
                        {isRtl ? 'مجهول' : 'Anonymous'}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-0.5 gap-0.5 select-none">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <Star
                        key={val}
                        className={`h-3.5 w-3.5 shrink-0 ${
                          val <= rating.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-800 dark:text-slate-200 opacity-20'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comments are disabled on the menu view as requested }
                  {/* rating.comment && (
                    <p className="text-xs leading-relaxed italic opacity-85">
                      &ldquo;{rating.comment}&rdquo;
                    </p>
                  ) }
                </div>
              );
            })}
          </div>
        )}
      </section> */}

      {/* 4. Customer Support Sticky Footer */}
      <footer className={currentTheme.footer}>
        <div className="max-w-lg mx-auto px-6 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center space-x-1.5 font-semibold gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-550" />
            <span>{currentT.poweredBy}</span>
          </div>
          <span className={currentTheme.footerScanText}>{currentT.scanText}</span>
        </div>
      </footer>

      {/* 6. Restaurant Info / Business Hours Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-[var(--color-card-bg)]/95 backdrop-blur-2xl border border-[var(--color-border)]/80 shadow-2xl p-6 relative text-[var(--color-text)] animate-scale-up">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-black tracking-widest text-center mb-4 mt-2 font-sans text-[var(--color-text)] uppercase">
              {isRtl ? 'معلومات وأوقات العمل' : 'Restaurant Information'}
            </h3>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {/* Address / Phone / Website / Map Link */}
              <div className="space-y-2.5 border-b border-[var(--color-border)]/55 pb-4 text-start">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">
                  {isRtl ? 'تفاصيل الاتصال' : 'Contact Details'}
                </h4>
                {profile.phone && (
                  <p className="text-xs">
                    <strong>{isRtl ? 'الهاتف:' : 'Phone:'}</strong>{' '}
                    <a href={`tel:${profile.phone}`} className="text-[var(--color-accent)] font-bold hover:underline">
                      {profile.phone}
                    </a>
                  </p>
                )}
                {profile.address && (
                  <p className="text-xs">
                    <strong>{isRtl ? 'العنوان:' : 'Address:'}</strong> {profile.address}
                  </p>
                )}
                {profile.map_link && (
                  <p className="text-xs pt-1">
                    <a href={profile.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] hover:underline border border-[var(--color-accent)]/30 px-3 py-1.5 rounded-xl bg-[var(--color-accent)]/5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{isRtl ? 'فتح في الخريطة' : 'Open in Maps'}</span>
                    </a>
                  </p>
                )}
              </div>

              {/* Business Hours */}
              <div className="space-y-2.5 text-start">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">
                    {isRtl ? 'أوقات العمل' : 'Business Hours'}
                  </h4>
                  <span className="text-[9px] font-semibold text-[var(--color-text-secondary)] opacity-60">
                    {businessHours.timezone?.replace('Asia/', '') || 'Damascus'} Time
                  </span>
                </div>

                <div className="space-y-2.5 pt-1.5">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const dayData = businessHours.days?.[day] || { isOpen: false, periods: [] };
                    return (
                      <div key={day} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]/45 last:border-0">
                        <span className="font-semibold text-[var(--color-text)]">
                          {isRtl ? translateDay(day) : day}
                        </span>
                        
                        {dayData.isOpen ? (
                          <div className="text-right space-y-0.5 font-mono">
                            {dayData.periods?.map((p, pIdx) => (
                              <span key={pIdx} className="block text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                {p.from} - {p.to}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-rose-500 font-black uppercase text-[10px]">
                            {isRtl ? 'مغلق' : 'Closed'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-6 w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span>{isRtl ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. WiFi Details Modal */}
      {showWifiModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-[var(--color-card-bg)]/95 backdrop-blur-2xl border border-[var(--color-border)]/80 shadow-2xl p-6 relative text-[var(--color-text)] animate-scale-up">
            <button
              onClick={() => setShowWifiModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-black tracking-widest text-center mb-4 mt-2 font-sans text-[var(--color-text)] uppercase">
              {isRtl ? 'تفاصيل الاتصال بالواي فاي' : 'WiFi Connection'}
            </h3>

            <div className="space-y-4 text-start">
              <div className="p-4 bg-[var(--color-bg)]/50 border border-[var(--color-border)]/65 rounded-2xl space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[var(--color-text-secondary)]/60 uppercase tracking-wider block">
                    {isRtl ? 'اسم الشبكة (SSID)' : 'Network Name (SSID)'}
                  </span>
                  <span className="text-sm font-black block font-mono">
                    {profile.wifi_name || 'Guest_WiFi'}
                  </span>
                </div>

                {profile.wifi_password && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[var(--color-text-secondary)]/60 uppercase tracking-wider block">
                      {isRtl ? 'كلمة المرور' : 'Password'}
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] px-3 py-2 rounded-xl">
                      <span className="text-sm font-bold block font-mono">
                        {showWifiPassword ? profile.wifi_password : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowWifiPassword(!showWifiPassword)}
                        className="text-[var(--color-text-secondary)]/80 hover:text-[var(--color-text)] transition-colors"
                      >
                        {showWifiPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {profile.wifi_password && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.wifi_password);
                    setCopiedWifi(true);
                    setTimeout(() => setCopiedWifi(false), 2000);
                  }}
                  className="w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] transition-all shadow-md shadow-emerald-600/10"
                >
                  {copiedWifi ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{isRtl ? 'تم نسخ كلمة المرور' : 'Password Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>{isRtl ? 'نسخ كلمة المرور' : 'Copy Password'}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={() => setShowWifiModal(false)}
              className="mt-6 w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span>{isRtl ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Star Rating Modal overlay */}
      {showRateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-[var(--color-card-bg)]/95 backdrop-blur-2xl border border-[var(--color-border)]/80 shadow-2xl p-6 relative text-[var(--color-text)] animate-scale-up">
            <button
              onClick={() => setShowRateModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-black tracking-widest text-center mb-4 mt-2 font-sans text-[var(--color-text)] uppercase">
              {currentT.rateThisCafe}
            </h3>

            {ratingSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 animate-bounce">
                  <Star className="h-6 w-6 text-emerald-500 fill-emerald-500" />
                </div>
                <h4 className="font-bold text-[var(--color-text)] text-sm font-sans">{currentT.ratingSuccessMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                {!customerUser && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 text-[10px] text-indigo-600 dark:text-indigo-400 leading-normal text-center font-sans font-medium">
                    {isRtl ? (
                      <>
                        <span>سجل الدخول كزبون لكتابة تقييم موثق وكسب طوابع الولاء! </span>
                        <a href="/login" className="underline font-bold hover:text-indigo-500">سجل الدخول هنا</a>
                      </>
                    ) : (
                      <>
                        <span>Log in as a Diner to write a verified review and earn loyalty stamps! </span>
                        <a href="/login" className="underline font-bold hover:text-indigo-500 font-sans">Log in here</a>
                      </>
                    )}
                  </div>
                )}

                {ratingError && (
                  <p className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-[11px] text-rose-600 dark:text-rose-455 font-semibold text-center font-sans">
                    {ratingError}
                  </p>
                )}

                {/* Stars selector widget */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)]/60 uppercase tracking-widest">
                    {currentT.selectStars}
                  </span>
                  <div className="flex space-x-1.5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isActive = val <= selectedStars;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSelectedStars(val)}
                          className="p-1 hover:scale-125 active:scale-95 transition-all focus:outline-none group/star"
                        >
                          <Star
                            className={`h-8 w-8 transition-all ${
                              isActive
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'text-[var(--color-text)]/20 hover:text-amber-300 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingRating}
                  className="w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 bg-[var(--primary-theme)] text-white shadow-md shadow-[var(--primary-theme)]/15"
                >
                  {submittingRating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{currentT.submitRating}...</span>
                    </>
                  ) : (
                    <span>{currentT.submitRating}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Item Detail Modal overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className={`${mergeStyle(currentTheme.modalBg, 'card')} w-full max-w-md overflow-hidden p-0 flex flex-col relative rounded-t-[2.5rem] sm:rounded-[2.5rem] h-[85vh] sm:h-auto sm:max-h-[90vh] bg-[var(--color-card-bg)] border-t sm:border border-[var(--color-border)]/80 shadow-2xl animate-slide-up sm:animate-scale-up`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Slide indicators on mobile */}
            <div className="w-12 h-1 bg-[var(--color-text)]/10 rounded-full mx-auto my-3 sm:hidden shrink-0" />

            {/* Top Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white flex items-center justify-center transition-all active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Dish Image Banner */}
            {selectedItem.image_url ? (
              <div className="h-64 sm:h-72 w-full relative overflow-hidden shrink-0 select-none">
                <Image 
                  src={selectedItem.image_url} 
                  alt={isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name} 
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-bg)] via-[var(--color-card-bg)]/20 to-black/20" />
              </div>
            ) : (
              <div className="h-40 w-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 text-slate-350 dark:text-slate-700 select-none border-b border-[var(--color-border)]/45">
                <span className="text-5xl">🍽️</span>
              </div>
            )}

            {/* Details content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar text-start">
              <div className="space-y-3">
                {/* Badge and Price */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedItem.badge && renderBadge(selectedItem.badge)}
                    {!selectedItem.available && (
                      <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider">
                        {currentT.soldOut}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-xl text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-1.5 rounded-2xl border border-[var(--color-accent)]/10 whitespace-nowrap shadow-[0_0_12px_rgba(var(--color-accent),0.1)]">
                    {theme.layout.currency || theme.layout.currencySymbol || '$'}{selectedItem.price}
                  </span>
                </div>

                {/* Dish Name */}
                <h3 className="text-xl sm:text-2xl font-black leading-snug tracking-tight text-[var(--color-text)]">
                  {isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name}
                  {!isRtl && selectedItem.name_ar && <span className="block text-[var(--color-text-secondary)] text-xs font-semibold mt-1">{selectedItem.name_ar}</span>}
                  {isRtl && selectedItem.name && <span className="block text-[var(--color-text-secondary)] text-xs font-semibold mt-1">{selectedItem.name}</span>}
                </h3>
              </div>

              {/* Description */}
              {(selectedItem.description || selectedItem.description_ar) && (
                <div className="text-[var(--color-text-secondary)]/90 text-xs leading-relaxed space-y-1.5 py-3 border-t border-[var(--color-border)]/55">
                  <p className="font-semibold">{isRtl && selectedItem.description_ar ? selectedItem.description_ar : selectedItem.description}</p>
                  {!isRtl && selectedItem.description_ar && <p className="text-[var(--color-text-secondary)]/60 text-[10px] leading-normal">{selectedItem.description_ar}</p>}
                  {isRtl && selectedItem.description && <p className="text-[var(--color-text-secondary)]/60 text-[10px] leading-normal">{selectedItem.description}</p>}
                </div>
              )}

              {/* Holographic style nutrition facts & calories */}
              <div className="grid grid-cols-3 gap-2.5 py-3 border-t border-[var(--color-border)]/55">
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[var(--color-border)]/65 bg-[var(--color-bg)]/40 text-center">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]/60 mb-0.5">{isRtl ? 'السعرات' : 'Calories'}</span>
                  <span className="text-xs font-black text-[var(--color-text)]">{selectedItem.calories || selectedItem.cal || '350 kcal'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[var(--color-border)]/65 bg-[var(--color-bg)]/40 text-center">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]/60 mb-0.5">{isRtl ? 'الوزن' : 'Weight'}</span>
                  <span className="text-xs font-black text-[var(--color-text)]">{selectedItem.weight || '250g'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[var(--color-border)]/65 bg-[var(--color-bg)]/40 text-center">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--color-text-secondary)]/60 mb-0.5">{isRtl ? 'وقت التحضير' : 'Prep Time'}</span>
                  <span className="text-xs font-black text-[var(--color-text)]">{selectedItem.prep_time || '15 mins'}</span>
                </div>
              </div>

              {/* Allergens & Dietary tags */}
              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[var(--color-border)]/55">
                  <span className="text-[9px] font-black text-[var(--color-text-secondary)]/60 uppercase tracking-widest block">
                    {isRtl ? 'معلومات الحساسية والنظام الغذائي' : 'Dietary & Allergens'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.allergens.map((alg) => (
                      <span 
                        key={alg}
                        className="text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 px-2.5 py-1 rounded-lg"
                      >
                        ⚠️ {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]/55 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const shareUrl = `${window.location.origin}/menu/${profile.slug}#item-${selectedItem.id}`;
                    const shareTitle = isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: shareTitle,
                        url: shareUrl
                      }).catch((err) => console.log(err));
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 gap-1.5 border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text)] bg-[var(--color-card-bg)] hover:bg-[var(--color-accent)]/5 py-3 px-4 rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">{isRtl ? 'تم النسخ' : 'Copied Link'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 text-[var(--color-accent)]" />
                      <span>{isRtl ? 'مشاركة الطبق' : 'Share Dish'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 inline-flex items-center justify-center bg-[var(--color-text)] hover:opacity-90 text-[var(--color-bg)] py-3 px-4 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95"
                >
                  <span>{isRtl ? 'إغلاق' : 'Close'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
