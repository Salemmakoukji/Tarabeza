'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Phone, Sparkles, Globe, Star, X, Loader2, Share2, Check, Heart } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

export default function MenuViewClient({ profile, categories = [], menuItems = [], initialRatings = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [lang, setLang] = useState('en'); // 'en' | 'ar'
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

  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / totalReviews).toFixed(1)
    : null;

  // Dynamic Theme Highlight Color
  const primaryColor = profile.theme_color || '#f97316';

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

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name_ar && item.name_ar.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description_ar && item.description_ar.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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

  const templateId = profile.template_id || 'classic-dark';
  const themeId = profile.theme_id || 'obsidian-dark';
  const styleId = profile.style_id || 'modern-minimalist';
  const headerStyle = profile.header_style || 'centered-overlap';

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
    
    const badgeStyles = {
      chef: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      bestseller: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      popular: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      spicy: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    
    const badgeIcons = {
      chef: '⭐',
      bestseller: '🔥',
      new: '✨',
      popular: '📈',
      spicy: '🌶️',
    };

    const styleClass = badgeStyles[badge] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    const icon = badgeIcons[badge] || '';
    const text = currentT[badge] || badge;

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wide uppercase font-sans shrink-0 ${styleClass} ${badge === 'chef' ? 'animate-pulse' : ''}`}>
        <span>{icon}</span>
        <span>{text}</span>
      </span>
    );
  };

  const getCardStyle = () => {
    if (themeId === 'custom') return 'bg-[var(--color-card-bg)] border border-[var(--color-text)]/10 text-[var(--color-text)]';
    if (themeId === 'obsidian-dark') return 'bg-slate-900/30 border border-slate-900 text-slate-100';
    if (themeId === 'pearl-light') return 'bg-slate-50 border border-slate-200/80 text-slate-800';
    if (themeId === 'warm-bistro') return 'bg-[#fcf7ee]/85 border border-[#e8d5be] text-[#4a2e1b]';
    if (themeId === 'crimson-retro') return 'bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-slate-900';
    return 'bg-slate-900/30 border border-slate-900 text-slate-100';
  };

  const getDividerStyle = () => {
    if (themeId === 'custom') return 'border-t border-[var(--color-text)]/15';
    if (themeId === 'pearl-light') return 'border-t border-slate-200';
    if (themeId === 'warm-bistro') return 'border-t border-[#e8d5be]';
    if (themeId === 'crimson-retro') return 'border-t-2 border-slate-900';
    return 'border-t border-slate-900/50';
  };

  return (
    <div 
      className={currentTheme.wrapper}
      style={{ 
        '--primary-theme': primaryColor,
        '--color-bg': profile.color_bg || '#0f172a',
        '--color-text': profile.color_text || '#f8fafc',
        '--color-card-bg': profile.color_card_bg || '#1e293b',
        '--color-card-text': profile.color_card_text || '#f8fafc',
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
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
      <header className={`${currentTheme.header} relative`}>
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
            <div className="relative h-28 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden shrink-0">
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
            <div className="relative h-44 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden shrink-0">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
                </>
              ) : (
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
              )}
            </div>
            {/* Restaurant Info (Centered) */}
            <div className="relative max-w-lg mx-auto w-full px-6 pb-6 flex flex-col items-center text-center">
              <div className="relative -mt-16 mb-3.5 z-10 shrink-0">
                {profile.logo_url ? (
                  <Image 
                    src={profile.logo_url} 
                    alt={profile.name} 
                    width={96}
                    height={96}
                    priority
                    className={`rounded-3xl object-cover bg-white ${currentTheme.logoBorder}`}
                  />
                ) : (
                  <div className={`h-20 w-20 rounded-3xl flex items-center justify-center ${currentTheme.logoFallback}`}>
                    <span className="text-2xl font-black text-white uppercase">{profile.name[0]}</span>
                  </div>
                )}
              </div>
              <h1 className={currentTheme.restaurantName}>{profile.name}</h1>
              <div className="flex items-center justify-center space-x-2 gap-2 mb-3">
                {averageRating ? (
                  <div className={mergeStyle(currentTheme.ratingBadge, 'badge')}>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{averageRating}</span>
                    <span className="opacity-75 font-normal">
                      ({totalReviews} {currentT.reviews})
                    </span>
                  </div>
                ) : (
                  <span className={mergeStyle(currentTheme.ratingBadgeEmpty, 'badge')}>
                    {currentT.beFirstToRate}
                  </span>
                )}
                <button
                  onClick={() => setShowRateModal(true)}
                  className={mergeStyle(currentTheme.rateUsBtn, 'button')}
                >
                  {currentT.rateUs}
                </button>
              </div>
              {profile.description && (
                <p className={currentTheme.description}>{profile.description}</p>
              )}
              {(profile.phone || profile.address) && (
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3.5 text-xs font-semibold">
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className={`flex items-center space-x-1 transition-colors gap-1 ${currentTheme.metadata}`}>
                      <Phone className={`h-3.5 w-3.5 ${currentTheme.metaIcon}`} />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {profile.address && (
                    <span className={`flex items-center space-x-1 gap-1 ${currentTheme.metadata}`}>
                      <MapPin className={`h-3.5 w-3.5 ${currentTheme.metaIcon}`} />
                      <span className="line-clamp-1">{profile.address}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Sticky Search and Category Tabs */}
      <div className={currentTheme.stickyContainer}>
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} h-4 w-4 pointer-events-none ${currentTheme.searchIcon}`} />
            <input 
              type="text" 
              placeholder={currentT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${mergeStyle(currentTheme.searchInput, 'input')} ${
                isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
              }`}
            />
          </div>

          {/* Scrolling category list */}
          {!searchQuery && categories.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={mergeStyle(`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 uppercase tracking-wider mx-1 ${currentTheme.categoryTab(isActive)}`, 'button')}
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
      <main className="max-w-lg mx-auto w-full px-4 pt-6 flex-1">
        {itemsByCategory.length === 0 ? (
          <div className={currentTheme.emptyState}>
            <Search className={`h-10 w-10 mx-auto mb-2 ${currentTheme.emptyStateIcon}`} />
            <h3 className={currentTheme.emptyStateTitle}>{currentT.noItems}</h3>
            <p className={currentTheme.emptyStateDesc}>{currentT.refiningText}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {itemsByCategory.map((catGroup) => (
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
                {templateId === 'modern-light' ? (
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

      {/* 5. Star Rating Modal overlay */}
      {showRateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className={mergeStyle(currentTheme.modalBg, 'card')}>
            <button
              onClick={() => setShowRateModal(false)}
              className={currentTheme.modalCloseBtn}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className={currentTheme.modalTitle}>
              {currentT.rateThisCafe}
            </h3>

            {ratingSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-emerald-500 fill-emerald-500" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm font-sans">{currentT.ratingSuccessMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-4">
                {!customerUser && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[10px] text-indigo-500 dark:text-indigo-400 leading-normal text-center font-sans">
                    {isRtl ? (
                      <>
                        <span>سجل الدخول كزبون لكتابة تقييم موثق وكسب طوابع الولاء! </span>
                        <a href="/login" className="underline font-bold hover:text-indigo-300">سجل الدخول هنا</a>
                      </>
                    ) : (
                      <>
                        <span>Log in as a Diner to write a verified review and earn loyalty stamps! </span>
                        <a href="/login" className="underline font-bold hover:text-indigo-450 font-sans">Log in here</a>
                      </>
                    )}
                  </div>
                )}

                {ratingError && (
                  <p className="bg-red-50 border border-red-200/55 rounded-xl p-3 text-[11px] text-red-600 font-semibold text-center font-sans">
                    {ratingError}
                  </p>
                )}

                {/* Stars selector widget */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className={currentTheme.modalText}>
                    {currentT.selectStars}
                  </span>
                  <div className="flex space-x-1 gap-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isActive = val <= selectedStars;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSelectedStars(val)}
                          className="p-1 hover:scale-110 active:scale-95 transition-all focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              isActive
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Review comment field is disabled as comments are not displayed */}
                {/* <div>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={currentT.writeComment}
                    className={currentTheme.modalInput}
                  />
                </div> */}

                <button
                  type="submit"
                  disabled={submittingRating}
                  className={mergeStyle(currentTheme.modalSubmitBtn, 'button')}
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className={`${mergeStyle(currentTheme.modalBg, 'card')} w-full max-w-md overflow-hidden p-0 flex flex-col relative animate-scale-up`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-slate-950/40 backdrop-blur-md border border-white/10 text-white hover:bg-slate-950/60 flex items-center justify-center transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Dish Image Banner */}
            {selectedItem.image_url ? (
              <div className="h-56 w-full relative overflow-hidden shrink-0 select-none">
                <Image 
                  src={selectedItem.image_url} 
                  alt={isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name} 
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/10" />
              </div>
            ) : (
              <div className="h-32 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 text-slate-350 dark:text-slate-700 select-none">
                <span className="text-4xl">🍽️</span>
              </div>
            )}

            {/* Details content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                {/* Badge and Price */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedItem.badge && renderBadge(selectedItem.badge)}
                    {!selectedItem.available && (
                      <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        {currentT.soldOut}
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold text-lg text-[var(--primary-theme)] font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency || 'USD' }).format(selectedItem.price)}
                  </span>
                </div>

                {/* Dish Name */}
                <h3 className="text-lg font-black leading-snug tracking-tight text-slate-900 dark:text-white text-start">
                  {isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name}
                  {!isRtl && selectedItem.name_ar && <span className="block text-slate-450 text-xs font-normal mt-0.5">{selectedItem.name_ar}</span>}
                  {isRtl && selectedItem.name && <span className="block text-slate-450 text-xs font-normal mt-0.5">{selectedItem.name}</span>}
                </h3>
              </div>

              {/* Description */}
              {(selectedItem.description || selectedItem.description_ar) && (
                <div className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed text-start space-y-1 py-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-semibold">{isRtl && selectedItem.description_ar ? selectedItem.description_ar : selectedItem.description}</p>
                  {!isRtl && selectedItem.description_ar && <p className="text-slate-400 text-[10px] leading-normal">{selectedItem.description_ar}</p>}
                  {isRtl && selectedItem.description && <p className="text-slate-450 text-[10px] leading-normal">{selectedItem.description}</p>}
                </div>
              )}

              {/* Allergens & Dietary tags */}
              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isRtl ? 'معلومات الحساسية / النظام الغذائي' : 'Dietary & Allergens'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.allergens.map((alg) => (
                      <span 
                        key={alg}
                        className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md"
                      >
                        {alg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 gap-1.5 border border-slate-200 dark:border-slate-800 hover:border-[var(--primary-theme)] text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">{isRtl ? 'تم النسخ' : 'Copied Link'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>{isRtl ? 'مشاركة الطبق' : 'Share Dish'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 inline-flex items-center justify-center bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md"
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
