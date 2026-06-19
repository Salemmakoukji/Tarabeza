'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Phone, Sparkles, Globe, Star, X, Loader2, Share2, Check, Heart } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

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

  const colorThemes = {
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
      spotlightCard: "bg-white border-2 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden flex flex-col p-0 transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
      spotlightTag: "bg-red-600 border border-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
      modalBg: "bg-white border-2 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-6 w-full max-w-sm relative text-slate-900",
      modalTitle: "text-sm font-black text-slate-950 tracking-tight text-center mb-4 mt-2 uppercase font-sans",
      modalInput: "w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-red-650 transition-all text-xs resize-none font-sans shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:shadow-none",
      modalCloseBtn: "absolute top-4 right-4 text-slate-900 hover:text-slate-655 transition-colors",
      modalText: "text-xs font-black text-slate-900 uppercase tracking-wider font-sans text-center mb-1.5",
      modalSubmitBtn: "w-full font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-2 border-slate-900 bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
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
    if (themeId === 'obsidian-dark') return 'bg-slate-900/30 border border-slate-900 text-slate-100';
    if (themeId === 'pearl-light') return 'bg-slate-50 border border-slate-200/80 text-slate-800';
    if (themeId === 'warm-bistro') return 'bg-[#fcf7ee]/85 border border-[#e8d5be] text-[#4a2e1b]';
    if (themeId === 'crimson-retro') return 'bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-slate-900';
    return 'bg-slate-900/30 border border-slate-900 text-slate-100';
  };

  const getDividerStyle = () => {
    if (themeId === 'pearl-light') return 'border-t border-slate-200';
    if (themeId === 'warm-bistro') return 'border-t border-[#e8d5be]';
    if (themeId === 'crimson-retro') return 'border-t-2 border-slate-900';
    return 'border-t border-slate-900/50';
  };

  return (
    <div 
      className={currentTheme.wrapper}
      style={{ '--primary-theme': primaryColor }}
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
      <header className={currentTheme.header}>
        {/* Cover Photo / Background Banner */}
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

        {/* Restaurant Header & Info Container */}
        <div className="relative max-w-lg mx-auto w-full px-6 pb-6 flex flex-col items-center text-center">
          {/* Logo Overlapping Cover Banner */}
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
          
          {/* Average Rating Star Score */}
          <div className="flex items-center justify-center space-x-2 gap-2 mb-3">
            {averageRating ? (
              <div className={currentTheme.ratingBadge}>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{averageRating}</span>
                <span className="opacity-75 font-normal">
                  ({totalReviews} {currentT.reviews})
                </span>
              </div>
            ) : (
              <span className={currentTheme.ratingBadgeEmpty}>
                {currentT.beFirstToRate}
              </span>
            )}

            <button
              onClick={() => setShowRateModal(true)}
              className={currentTheme.rateUsBtn}
            >
              {currentT.rateUs}
            </button>
          </div>

          {/* Description Paragraph */}
          {profile.description && (
            <p className={currentTheme.description}>
              {profile.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-semibold font-sans">
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
        </div>
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
              className={`${currentTheme.searchInput} ${
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
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 uppercase tracking-wider mx-1 ${currentTheme.categoryTab(isActive)}`}
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
                          className={`${currentTheme.itemCard} flex flex-col p-0 overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
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
                        return <div 
                              key={item.id} 
                              onClick={() => setSelectedItem(item)}
                              className={`${currentTheme.spotlightCard} overflow-hidden flex flex-col relative min-h-52 group cursor-pointer hover:scale-[1.01]`}
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
                        ;
                      }
                      
                      // Subsequent items render as standard cards
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`${currentTheme.itemCard} overflow-hidden flex p-3 gap-3 cursor-pointer hover:scale-[1.01] ${
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
                          className={`${currentTheme.itemCard} cursor-pointer hover:scale-[1.01] ${
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

      {/* Customer Reviews Feed */}
      <section className={`max-w-lg mx-auto px-6 py-10 ${getDividerStyle()} space-y-6`}>
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

                  {rating.comment && (
                    <p className="text-xs leading-relaxed italic opacity-85">
                      &ldquo;{rating.comment}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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
          <div className={currentTheme.modalBg}>
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

                {/* Review comment field */}
                <div>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={currentT.writeComment}
                    className={currentTheme.modalInput}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingRating}
                  className={currentTheme.modalSubmitBtn}
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
            className={`${currentTheme.modalBg} w-full max-w-md overflow-hidden p-0 rounded-3xl border border-slate-250 flex flex-col shadow-2xl relative animate-scale-up`}
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
