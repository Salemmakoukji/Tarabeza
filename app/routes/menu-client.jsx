'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Sparkles, Globe, Star, X, Loader2, Share2, Check, Heart, Clock, Wifi, Eye, EyeOff, Bell, PhoneCall, CreditCard, HelpCircle, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
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

export default function MenuViewClient({ profile, categories = [], menuItems = [], initialRatings = [], initialLang = 'en', tableId = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter] = useState('all'); // 'all' | 'chef' | 'bestseller' | 'new' | 'popular' | 'spicy'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lang, setLang] = useState(initialLang); // 'en' | 'ar'
  const [isFromQr, setIsFromQr] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsFromQr(params.get('qr') === 'true');
    }
  }, []);

  const handleOpenRateModal = () => {
    const isRtl = lang === 'ar';
    if (!isFromQr) {
      alert(isRtl 
        ? 'عذراً، يجب عليك مسح رمز QR من الطاولة لتتمكن من كتابة تقييم.' 
        : 'Sorry, you must scan the QR code at the table to leave a review.'
      );
      return;
    }
    setReviewsViewMode('write');
    setShowReviewsModal(true);
  };

  const handleOpenReviewsModal = () => {
    setReviewsViewMode('list');
    setShowReviewsModal(true);
  };
  
  const formatPrice = (price) => {
    const c = profile.currency || 'USD';
    const p = profile.customization?.currencyPosition || 'left';
    const formatted = Number(price).toFixed(2);
    return p === 'right' ? `${formatted} ${c}` : `${c} ${formatted}`;
  };

  useEffect(() => {
    if (initialLang) {
      setLang(initialLang);
    }
  }, [initialLang]);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSocialPopup, setShowSocialPopup] = useState(false);

  // Call Waiter state
  const [showCallWaiterModal, setShowCallWaiterModal] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState(null);
  const [submittingCall, setSubmittingCall] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);
  const [callError, setCallError] = useState('');

  // Cart / Ordering state
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menu_item_id: item.id,
        item_name: item.name,
        item_name_ar: item.name_ar,
        unit_price: parseFloat(item.price),
        quantity: 1,
        notes: ''
      }];
    });
  };

  const updateCartQty = (menuItemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.menu_item_id !== menuItemId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null : { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const updateCartNotes = (menuItemId, notes) => {
    setCart(prev => prev.map(i => i.menu_item_id === menuItemId ? { ...i, notes } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Fetch table info
  const [tableInfo, setTableInfo] = useState(null);
  useEffect(() => {
    if (tableId && profile?.id) {
      supabase
        .from('restaurant_tables')
        .select('table_number, table_name')
        .eq('id', tableId)
        .eq('restaurant_id', profile.id)
        .single()
        .then(({ data }) => {
          if (data) setTableInfo(data);
        });
    }
  }, [tableId, profile?.id]);

  // Diner client auth state
  const [customerUser, setCustomerUser] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Ratings state
  const [ratings, setRatings] = useState(initialRatings);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsViewMode, setReviewsViewMode] = useState('list'); // 'list' | 'write'
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Screen width monitoring for responsive sidebar
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Diner user status effect & toggle favorite
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
    if (catId === 'all') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      const offset = 80; // sticky header offset
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
  const isGrid = layoutStyle === 'grid';
  const showTabs = layoutStyle === 'tab' || (layoutStyle === 'sidebar' && isMobile);
  const showSidebar = layoutStyle === 'sidebar' && !isMobile;

  // Active category observer for sticky tabs
  useEffect(() => {
    if (layoutStyle === 'classic' || showSidebar || searchQuery) return;

    const handleScroll = () => {
      if (window.scrollY < 120) {
        setSelectedCategory('all');
      }
    };
    window.addEventListener('scroll', handleScroll);

    const observerOptions = {
      root: null,
      rootMargin: '-110px 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.id.replace('category-', '');
          setSelectedCategory(categoryId);
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section[id^="category-"]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [layoutStyle, showSidebar, searchQuery, categories]);

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

  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / totalReviews).toFixed(1)
    : null;

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

      const ratingsData = {
        ...data,
        customer_profiles: customerUser ? { full_name: customerUser.user_metadata?.full_name || 'Diner' } : null
      };

      setRatings([...ratings, ratingsData]);

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
        setReviewsViewMode('list');
        setRatingSuccess(false);
      }, 2000);
    } catch (error) {
      setRatingError(currentT.ratingErrorMsg);
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderBadge = (badge) => {
    if (!badge) return null;
    const badgeLabel = currentT[badge.toLowerCase()] || badge;
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] font-semibold uppercase tracking-wider">
        {badgeLabel}
      </span>
    );
  };

  const renderItemCard = (item) => {
    const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
    const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
    const showImage = displayMode !== 'text' && item.image_url;

    if (isGrid) {
      // Grid Card Layout
      return (
        <div
          key={item.id}
          onClick={() => setSelectedItem(item)}
          className={`group bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 active:scale-[0.98] relative shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] ${item.available ? 'opacity-100' : 'opacity-50'
            }`}
        >
          {displayMode !== 'text' && (
            <div className="relative w-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 select-none" style={{ height: 'var(--image-size, 130px)' }}>
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={displayName}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="text-3xl opacity-30 select-none">🍽️</span>
              )}
              {!item.available && (
                <div className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} bg-slate-900/90 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded`}>
                  {currentT.soldOut}
                </div>
              )}
            </div>
          )}

          <div className="p-2.5 flex-1 flex flex-col justify-between gap-1 text-start">
            <div className="space-y-1">
              <h4 className="font-semibold text-[13px] leading-snug line-clamp-2 text-[var(--text)]">
                {displayName}
              </h4>
              {displayDesc && (
                <p className="text-[11px] leading-relaxed line-clamp-2 text-[var(--text-2)] mt-0.5">
                  {displayDesc}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5 pt-1.5 flex-wrap">
              <span className="font-bold text-[14px] text-[var(--accent)]">
                {formatPrice(item.price)}
              </span>
              <div className="flex items-center gap-1.5">
                {item.badge && renderBadge(item.badge)}
                {tableId && item.available && (
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="h-7 w-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-bold hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // List Card Layout
    return (
      <div
        key={item.id}
        onClick={() => setSelectedItem(item)}
        className={`group bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3 flex gap-3 cursor-pointer transition-all duration-200 active:scale-[0.99] items-center relative shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] ${item.available ? 'opacity-100' : 'opacity-50'
          }`}
      >
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 text-start">
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {tableId && item.available && (
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="h-6 w-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold hover:scale-110 active:scale-95 transition-all duration-200 shrink-0 shadow-sm"
                  >
                    +
                  </button>
                )}
                <h4 className="font-semibold text-[13px] sm:text-sm leading-snug line-clamp-2 text-[var(--text)]">
                  {displayName}
                </h4>
              </div>
              <span className="font-bold text-[14px] text-[var(--accent)] shrink-0">
                {formatPrice(item.price)}
              </span>
            </div>
            {displayDesc && (
              <p className="text-[11px] leading-relaxed line-clamp-2 text-[var(--text-2)]">
                {displayDesc}
              </p>
            )}
          </div>

          {item.badge && (
            <div className="pt-1.5 self-start">
              {renderBadge(item.badge)}
            </div>
          )}
        </div>

        {showImage && (
          <div className="relative w-20 h-20 rounded-[12px] overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 select-none">
            <img
              src={item.image_url}
              alt={displayName}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {!item.available && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded">
                  {currentT.soldOut}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const themeMode = profile.theme || 'light';
  const accentColor = profile.main_color || '#f97316';

  const bgVal = themeMode === 'dark' ? '#0B0F19' : '#FAFAF8';
  const cardVal = themeMode === 'dark' ? '#10182A' : '#FFFFFF';
  const textVal = themeMode === 'dark' ? '#F5F5F5' : '#10182A';
  const text2Val = themeMode === 'dark' ? '#9CA3AF' : '#6B7280';
  const borderVal = themeMode === 'dark' ? '#10182aaf' : '#F0EDE8';

  const imageSizeMap = { XS: '90px', S: '120px', M: '130px', L: '200px', XL: '250px' };
  const resolvedImageHeight = profile.image_size ? imageSizeMap[profile.image_size] : '130px';

  const menuCss = `
    :root {
      --accent: ${accentColor};
      --bg: ${bgVal};
      --card: ${cardVal};
      --text: ${textVal};
      --text-2: ${text2Val};
      --border: ${borderVal};
      --font: ${profile.font_family || 'Inter'};
      --image-size: ${resolvedImageHeight};
      --shadow-sm: ${themeMode === 'dark' ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.03)'};
      --shadow-md: ${themeMode === 'dark' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'};
      --shadow-lg: ${themeMode === 'dark' ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)'};
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    @keyframes marquee {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }
    .animate-marquee {
      display: inline-flex;
      animation: marquee 25s linear infinite;
    }
  `;

  return (
    <div
      className="mx-auto max-w-[480px] min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative transition-colors duration-200 pb-20 selection:bg-[var(--accent)] selection:text-white"
      style={{ fontFamily: 'var(--font), sans-serif' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style dangerouslySetInnerHTML={{ __html: menuCss }} />

      {profile.promo_banner_active && (
        <div className={`w-full overflow-hidden text-xs py-2 px-4 relative z-50 font-sans shadow-sm flex items-center justify-center shrink-0 ${profile.promo_banner_color === 'accent' ? 'bg-[var(--accent)] text-white' :
          profile.promo_banner_color === 'orange' ? 'bg-orange-600 text-white' :
            profile.promo_banner_color === 'green' ? 'bg-emerald-600 text-white' :
              profile.promo_banner_color === 'red' ? 'bg-rose-600 text-white' :
                profile.promo_banner_color === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-[var(--accent)] text-white'
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
              </div>
            </div>
          ) : (
            <div className="text-center font-bold">
              {isRtl ? (profile.promo_banner_text_ar || profile.promo_banner_text) : (profile.promo_banner_text || profile.promo_banner_text_ar)}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="relative w-full pb-4 bg-[var(--bg)]">
        {/* Cover Image */}
        {profile.cover_url ? (
          <div className="relative w-full h-[180px] overflow-hidden shrink-0 select-none">
            <img
              src={profile.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Floating Reviews Button - on cover */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={handleOpenReviewsModal}
                className="w-9 h-9 flex items-center justify-center bg-black/45 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 shadow-sm"
                title={isRtl ? "تقييمات الزبائن" : "Customer Reviews"}
              >
                <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
              </button>
            </div>
          </div>
        ) : (
          /* Reviews button when no cover */
          <div className="flex justify-end px-4 pt-3">
            <button
              onClick={handleOpenReviewsModal}
              className="w-9 h-9 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--accent)] rounded-full transition-all duration-200 active:scale-90"
              title={isRtl ? "تقييمات الزبائن" : "Customer Reviews"}
            >
              <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
            </button>
          </div>
        )}

        {/* Logo — below cover, left-aligned */}
        <div className={`px-5 ${profile.cover_url ? '-mt-8' : 'mt-2'} relative z-10`}>
          <div className="w-[68px] h-[68px] rounded-[16px] border-[3px] border-[var(--bg)] shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden bg-white flex items-center justify-center shrink-0">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold uppercase text-[var(--accent)]">{profile.name ? profile.name[0] : '?'}</span>
            )}
          </div>
        </div>

        {/* Name + description + custom text */}
        <div className="px-5 mt-3 text-start">
          <h1 className="text-[20px] font-bold leading-snug text-[var(--text)]">{profile.name}</h1>
          {profile.description && (
            <p className="text-[13px] text-[var(--text-2)] mt-1 leading-relaxed">
              {profile.description}
            </p>
          )}
          {profile.custom_text && (
            <p className="text-[13px] text-[var(--text-2)] mt-0.5">
              {profile.custom_text}
            </p>
          )}
        </div>

        {/* Status Badge + Rating Row */}
        <div className="flex items-center gap-3 px-5 mt-3 select-none">
          {/* Status Pill Badge — bigger */}
          {isCurrentlyOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[12px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#16A34A]" />
              <span>{isRtl ? 'مفتوح الآن' : 'Open Now'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#DC2626]">
              <span className="h-[6px] w-[6px] rounded-full bg-[#DC2626]" />
              <span>{isRtl ? 'مغلق الآن' : 'Closed'}</span>
            </span>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-2)]">
            {averageRating ? (
              <span>⭐ {averageRating} ({totalReviews})</span>
            ) : (
              <span>{currentT.beFirstToRate}</span>
            )}
            <span>·</span>
            <button
              onClick={handleOpenRateModal}
              className="hover:text-[var(--accent)] underline decoration-dotted transition-colors"
            >
              {currentT.rateUs}
            </button>
          </div>
        </div>

        {/* Contact Details Row */}
        {(profile.phone || profile.address) && (
          <div className="flex flex-wrap items-center gap-4 mt-3 px-5 text-xs text-[var(--text-2)] select-none">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[var(--text-2)]" />
                <span>{profile.phone}</span>
              </a>
            )}
            {profile.address && (
              profile.map_link ? (
                <a
                  href={profile.map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors max-w-[240px]"
                >
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                  <span className="truncate">{profile.address}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 max-w-[240px]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-2)] shrink-0" />
                  <span className="truncate">{profile.address}</span>
                </span>
              )
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[var(--border)] mt-4 mb-3 mx-5" />

        {/* Info Pill Row — single horizontal pill */}
        <div className="flex justify-center px-5 select-none">
          <div className="inline-flex items-center gap-0 bg-[var(--card)] border border-[var(--border)] rounded-full px-4 py-2">
            {/* Hours / Info */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 hover:text-[var(--accent)] transition-colors active:scale-95"
            >
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[12px] font-medium text-[var(--text)]">{isCurrentlyOpen ? (isRtl ? 'مفتوح' : 'Open') : (isRtl ? 'مغلق' : 'Closed')}</span>
            </button>

            {/* WiFi divider + button */}
            {(profile.wifi_ssid || profile.wifi_password) && (
              <>
                <span className="text-[var(--border)] text-sm mx-2 select-none">|</span>
                <button
                  onClick={() => setShowWifiModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 hover:text-[var(--accent)] transition-colors active:scale-95"
                >
                  <Wifi className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[12px] font-medium text-[var(--text)] truncate max-w-[80px]">{profile.wifi_ssid || (isRtl ? 'واي فاي' : 'WiFi')}</span>
                </button>
              </>
            )}

            {/* Website divider + link */}
            {profile.website && (
              <>
                <span className="text-[var(--border)] text-sm mx-2 select-none">|</span>
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 hover:text-[var(--accent)] transition-colors active:scale-95"
                >
                  <Globe className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-[12px] font-medium text-[var(--text)]">{isRtl ? 'الموقع' : 'Website'}</span>
                </a>
              </>
            )}
            {/* Social divider + button */}
            {hasSocialLinks && (
              <>
                <span className="text-[var(--border)] text-sm mx-2 select-none">|</span>
                <div className="relative">
                  <button
                    onClick={() => setShowSocialPopup(!showSocialPopup)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 hover:text-[var(--accent)] transition-colors active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-[12px] font-medium text-[var(--text)]">{isRtl ? 'تابعنا' : 'Social'}</span>
                  </button>

                  {/* Social Popup */}
                  {showSocialPopup && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSocialPopup(false)} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 animate-[slideUp_0.15s_ease-out]">
                        {profile.instagram && (
                          <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors duration-200" title="Instagram">
                            <svg className="h-[20px] w-[20px] fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                          </a>
                        )}
                        {profile.facebook && (
                          <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors duration-200" title="Facebook">
                            <svg className="h-[20px] w-[20px] fill-current" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h3v-9h3.3l.7-3H12V6c0-.9.2-1.2 1-1.2h2V2h-3c-2.4 0-4 1.2-4 3.6V8z" /></svg>
                          </a>
                        )}
                        {profile.whatsapp && (
                          <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors duration-200" title="WhatsApp">
                            <svg className="h-[20px] w-[20px] fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.729-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.458 5.463 0 9.907-4.441 9.91-9.904.002-2.648-1.02-5.138-2.879-6.997-1.86-1.86-4.347-2.883-6.997-2.885-5.47 0-9.914 4.444-9.917 9.907-.001 2.015.526 3.987 1.528 5.726L1.87 21.92l4.777-1.766z" /></svg>
                          </a>
                        )}
                        {profile.twitter && (
                          <a href={profile.twitter.startsWith('http') ? profile.twitter : `https://x.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors duration-200" title="Twitter / X">
                            <svg className="h-[20px] w-[20px] fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                          </a>
                        )}
                        {profile.tiktok && (
                          <a href={profile.tiktok.startsWith('http') ? profile.tiktok : `https://tiktok.com/${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-2)] hover:text-[var(--accent)] transition-colors duration-200" title="TikTok">
                            <svg className="h-[20px] w-[20px] fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.032 2.61.1 3.86.38v4.18c-.85-.14-1.72-.18-2.58-.12-.81.06-1.59.35-2.25.85-.6.48-.96 1.21-1.02 1.98-.08 1.13.01 2.26.27 3.37.16.63.48 1.21.93 1.66.45.45 1.03.77 1.66.93 1.11.26 2.24.35 3.37.27.77-.06 1.5-.42 1.98-1.02.5-.66.79-1.44.85-2.25.06-.86.02-1.73-.12-2.58h4.18c.28 1.25.41 2.55.38 3.86-.09 2.29-.98 4.47-2.51 6.16-1.53 1.69-3.62 2.76-5.89 3.03-2.91.35-5.87-.23-8.32-1.63C1.63 17.43.23 14.47.02 11.56.05 9.27.94 7.09 2.47 5.4c1.53-1.69 3.62-2.76 5.89-3.03.73-.09 1.47-.13 2.21-.12.65-.01 1.3.08 1.93.27.01-.17.02-.34.025-.5z" /></svg>
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>



      {/* Search Bar */}
      <div className="mx-4 my-3 relative flex items-center group">
        <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} h-4 w-4 pointer-events-none text-[var(--text-2)] group-focus-within:text-[var(--accent)] transition-colors`} />
        <input
          type="text"
          placeholder={currentT.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full h-11 bg-[var(--card)] border border-[var(--border)] rounded-[22px] text-sm text-[var(--text)] focus:outline-none transition-colors duration-200 placeholder-[var(--text-2)] ${isRtl ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
            }`}
        />
      </div>

      {/* Category Tabs (Sticky) - Rendered if showTabs is active */}
      {!searchQuery && categories.length > 0 && showTabs && (
        <div className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] py-2 select-none shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 scroll-smooth">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`shrink-0 h-9 px-4 rounded-full text-xs transition-all duration-200 ${selectedCategory === 'all'
                ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-2)]'
                }`}
            >
              {currentT.all}
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`shrink-0 h-9 px-4 rounded-full text-xs transition-all duration-200 ${isActive
                    ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-2)]'
                    }`}
                >
                  {isRtl && cat.name_ar ? cat.name_ar : cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full flex-1 pt-4">
        {/* Specials Spotlight Section */}
        {!searchQuery && selectedCategory === 'all' && specialsItems.length > 0 && (
          <div className="mb-6 space-y-3 px-4 select-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[var(--accent)] animate-pulse" />
                <span>{isRtl ? 'الأطباق المميزة' : 'Specials'}</span>
              </h3>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 scroll-smooth snap-x snap-mandatory -mx-4 px-4">
              {specialsItems.map((item) => {
                const displayName = isRtl && item.name_ar ? item.name_ar : item.name;
                const displayDesc = isRtl && item.description_ar ? item.description_ar : item.description;
                return (
                  <div
                    key={`special-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    className="w-[240px] shrink-0 snap-start bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer flex flex-col relative"
                  >
                    {item.image_url ? (
                      <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                        <img
                          src={item.image_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--accent)] text-white shadow-sm">
                          {isRtl ? 'مميز' : 'Special'}
                        </span>
                      </div>
                    ) : (
                      <div className="relative h-32 w-full bg-[var(--card)] flex items-center justify-center border-b border-[var(--border)]">
                        <span className="text-3xl opacity-30">🍽️</span>
                      </div>
                    )}

                    <div className="p-3 flex-1 flex flex-col justify-between gap-1 text-start">
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-[13px] text-[var(--text)] leading-snug truncate">
                          {displayName}
                        </h4>
                        {displayDesc && (
                          <p className="text-[11px] leading-relaxed text-[var(--text-2)] line-clamp-2">
                            {displayDesc}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="font-bold text-[14px] text-[var(--accent)]">
                          {formatPrice(item.price)}
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

        {itemsByCategory.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl mx-4">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-35 text-[var(--text-2)]" />
            <h3 className="text-sm font-bold text-[var(--text)]">{currentT.noItems}</h3>
            <p className="text-xs text-[var(--text-2)] mt-1">{currentT.refiningText}</p>
          </div>
        ) : (
          showSidebar && !searchQuery ? (
            /* Sidebar Layout Mode (tablet/desktop) */
            <div className="flex gap-4 items-start px-4">
              {/* Left category list column */}
              <div className="w-[100px] shrink-0 sticky top-20 self-start flex flex-col gap-2 py-1 overflow-y-auto no-scrollbar max-h-[70vh] select-none">
                <button
                  onClick={() => handleCategoryClick('all')}
                  className={`px-3 py-2.5 text-[11px] text-start font-semibold rounded-xl border transition-all duration-200 truncate ${selectedCategory === 'all'
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--card)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--accent)]/30'
                    }`}
                >
                  {currentT.all}
                </button>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`px-3 py-2.5 text-[11px] text-start font-semibold rounded-xl border transition-all duration-200 truncate ${isActive
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--card)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--accent)]/30'
                        }`}
                    >
                      {isRtl && cat.name_ar ? cat.name_ar : cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Right content items column */}
              <div className="flex-1 space-y-6">
                {itemsByCategory
                  .filter((catGroup) => {
                    if (selectedCategory !== 'all') {
                      return catGroup.id === selectedCategory;
                    }
                    return true;
                  })
                  .map((catGroup) => (
                    <section
                      key={catGroup.id}
                      id={`category-${catGroup.id}`}
                      className="space-y-3"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 mb-2 select-none">
                        <h3 className="text-sm font-bold text-[var(--text)]">{isRtl && catGroup.name_ar ? catGroup.name_ar : catGroup.name}</h3>
                        <span className="text-[10px] text-[var(--text-2)] bg-[var(--card)] border border-[var(--border)] px-2 py-0.5 rounded-full font-bold">
                          {catGroup.items.length}
                        </span>
                      </div>

                      {/* Items list */}
                      <div className={isGrid ? 'grid grid-cols-2 gap-[10px]' : 'space-y-3'}>
                        {catGroup.items.map((item) => renderItemCard(item))}
                      </div>
                    </section>
                  ))}
              </div>
            </div>
          ) : (
            /* Classic, Tab, Grid, and Collapsed Mobile Sidebar Layouts */
            <div className="space-y-6">
              {itemsByCategory.map((catGroup) => (
                <section
                  key={catGroup.id}
                  id={`category-${catGroup.id}`}
                  className="space-y-3 scroll-mt-20"
                >
                  {/* Category Section Header */}
                  <div className="pt-4 pb-2 px-4 flex items-center justify-between gap-3 border-b border-[var(--border)] mb-3 select-none">
                    <h3 className="text-base font-bold text-[var(--text)]">{isRtl && catGroup.name_ar ? catGroup.name_ar : catGroup.name}</h3>
                    <span className="text-xs text-[var(--text-2)] bg-[var(--card)] border border-[var(--border)] px-2.5 py-0.5 rounded-full font-semibold">
                      {catGroup.items.length}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className={isGrid ? 'grid grid-cols-2 gap-[10px] px-3' : 'space-y-3 px-4'}>
                    {catGroup.items.map((item) => renderItemCard(item))}
                  </div>
                </section>
              ))}
            </div>
          )
        )}
      </main>

      {/* Order Cart FAB — visible when items in cart */}
      {tableId && cartCount > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed bottom-20 left-4 z-40 h-14 w-14 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-white text-[10px] font-bold px-1" style={{ color: 'var(--accent)' }}>
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        </button>
      )}

      {/* Call Waiter FAB — visible when diner scans a table QR */}
      {tableId && (
        <button
          onClick={() => setShowCallWaiterModal(true)}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 animate-bounce"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Bell className="h-6 w-6" />
        </button>
      )}

      {/* Fixed Bottom Bar */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-14 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--border)] px-4 py-2 flex items-center justify-between z-50">
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200 text-xs font-semibold"
        >
          <Globe className="h-4 w-4 text-[var(--accent)]" />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] text-[var(--text-2)] select-none font-medium">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
          <span>{currentT.poweredBy}</span>
        </div>

        <button
          onClick={() => {
            const shareUrl = window.location.href;
            if (navigator.share) {
              navigator.share({
                title: profile.name,
                url: shareUrl
              }).catch((err) => console.log(err));
            } else {
              navigator.clipboard.writeText(shareUrl);
              setCopiedLink(true);
              alert(isRtl ? 'تم نسخ الرابط!' : 'Link copied to clipboard!');
              setTimeout(() => setCopiedLink(false), 2000);
            }
          }}
          className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-200 active:scale-90"
          title={isRtl ? 'مشاركة المنيو' : 'Share Menu'}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </footer>

      {/* Hours Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 relative text-[var(--text)] shadow-2xl animate-[scaleUp_200ms_ease-out_forwards]">
            <button
              onClick={() => setShowInfoModal(false)}
              className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200`}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold tracking-widest text-center mb-4 mt-2 uppercase">
              {isRtl ? 'معلومات وأوقات العمل' : 'Restaurant Information'}
            </h3>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar text-start">
              <div className="space-y-2 border-b border-[var(--border)] pb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                  {isRtl ? 'تفاصيل الاتصال' : 'Contact Details'}
                </h4>
                {profile.phone && (
                  <p className="text-xs">
                    <strong>{isRtl ? 'الهاتف:' : 'Phone:'}</strong>{' '}
                    <a href={`tel:${profile.phone}`} className="text-[var(--accent)] font-semibold hover:underline">
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
                    <a href={profile.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline border border-[var(--accent)]/30 px-3 py-1.5 rounded-xl bg-[var(--accent)]/5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{isRtl ? 'فتح في الخريطة' : 'Open in Maps'}</span>
                    </a>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                    {isRtl ? 'أوقات العمل' : 'Business Hours'}
                  </h4>
                  <span className="text-[9px] font-semibold text-[var(--text-2)]">
                    {businessHours.timezone?.replace('Asia/', '') || 'Damascus'} Time
                  </span>
                </div>

                <div className="space-y-2 pt-1.5">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const dayData = businessHours.days?.[day] || { isOpen: false, periods: [] };
                    return (
                      <div key={day} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border)]/55 last:border-0">
                        <span className="font-semibold text-[var(--text)]">
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
                          <span className="text-rose-500 font-bold uppercase text-[10px]">
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
              className="mt-6 w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center bg-[var(--text)] text-[var(--bg)] hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              <span>{isRtl ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>
        </div>
      )}

      {/* WiFi Details Modal */}
      {showWifiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 relative text-[var(--text)] shadow-2xl animate-[scaleUp_200ms_ease-out_forwards]">
            <button
              onClick={() => setShowWifiModal(false)}
              className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200`}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold tracking-widest text-center mb-4 mt-2 uppercase">
              {isRtl ? 'تفاصيل الاتصال بالواي فاي' : 'WiFi Connection'}
            </h3>

            <div className="space-y-4 text-start">
              <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[var(--text-2)] uppercase tracking-wider block">
                    {isRtl ? 'اسم الشبكة (SSID)' : 'Network Name (SSID)'}
                  </span>
                  <span className="text-sm font-bold block font-mono">
                    {profile.wifi_ssid || profile.wifi_name || 'Guest_WiFi'}
                  </span>
                </div>

                {profile.wifi_password && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-[var(--text-2)] uppercase tracking-wider block">
                      {isRtl ? 'كلمة المرور' : 'Password'}
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-[var(--card)] border border-[var(--border)] px-3 py-2 rounded-xl">
                      <span className="text-sm font-bold block font-mono">
                        {showWifiPassword ? profile.wifi_password : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowWifiPassword(!showWifiPassword)}
                        className="text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200"
                      >
                        {showWifiPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  className="w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] transition-all duration-200 shadow-md shadow-emerald-600/10"
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
              className="mt-6 w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center bg-[var(--text)] text-[var(--bg)] hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              <span>{isRtl ? 'إغلاق' : 'Close'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Ratings / Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 relative text-[var(--text)] shadow-2xl animate-[scaleUp_200ms_ease-out_forwards] flex flex-col max-h-[80vh]">
            <button
              onClick={() => setShowReviewsModal(false)}
              className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200 z-10`}
            >
              <X className="h-5 w-5" />
            </button>

            {reviewsViewMode === 'list' ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <h3 className="text-sm font-bold text-center mb-4 mt-2 uppercase tracking-wider shrink-0">
                  {isRtl ? 'تقييمات الزبائن' : 'Customer Reviews'}
                </h3>

                {/* Score summary */}
                <div className="flex items-center justify-center gap-4 bg-[var(--bg)] border border-[var(--border)] p-4 rounded-2xl mb-4 shrink-0">
                  <div className="text-center">
                    <span className="text-3xl font-black text-[var(--text)]">{averageRating || '—'}</span>
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <Star 
                          key={val} 
                          className={`h-3 w-3 ${averageRating && val <= Math.round(Number(averageRating)) ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-2)]/30'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[var(--text-2)] block mt-1 font-semibold">
                      ({totalReviews} {isRtl ? 'تقييم' : 'reviews'})
                    </span>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-start">
                  {ratings.filter(r => !profile.customization?.hiddenReviews?.[r.id]).length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-2)] text-xs font-semibold">
                      {isRtl ? 'لا توجد تقييمات بعد.' : 'No reviews yet.'}
                    </div>
                  ) : (
                    ratings
                      .filter(r => !profile.customization?.hiddenReviews?.[r.id])
                      .map((r) => {
                        const reviewerName = r.customer_profiles?.full_name || (isRtl ? 'زائر' : 'Guest');
                        const dateStr = new Date(r.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        return (
                          <div key={r.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[var(--text)]">{reviewerName}</span>
                              <span className="text-[9px] text-[var(--text-2)]">{dateStr}</span>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <Star 
                                  key={val} 
                                  className={`h-2.5 w-2.5 ${val <= r.stars ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-2)]/20'}`} 
                                />
                              ))}
                            </div>
                            {r.comment && (
                              <p className="text-xs text-[var(--text-2)] leading-normal italic">"{r.comment}"</p>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Footer Write Button (Only for QR Scanners) */}
                {isFromQr && (
                  <button
                    onClick={() => setReviewsViewMode('write')}
                    className="mt-4 w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 shrink-0"
                  >
                    <span>{isRtl ? 'اكتب تقييمك' : 'Write a Review'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <h3 className="text-sm font-bold text-center mb-4 mt-2 uppercase tracking-wider shrink-0">
                  {currentT.rateThisCafe}
                </h3>

                {ratingSuccess ? (
                  <div className="text-center py-12 space-y-2 flex-1 flex flex-col items-center justify-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <Star className="h-6 w-6 text-emerald-500 fill-emerald-500" />
                    </div>
                    <h4 className="font-bold text-sm">{currentT.ratingSuccessMsg}</h4>
                  </div>
                ) : (
                  <form onSubmit={handleRatingSubmit} className="space-y-4 text-center flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
                    <div className="space-y-4">
                      {ratingError && (
                        <p className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-600 font-bold">
                          {ratingError}
                        </p>
                      )}

                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-2)] uppercase tracking-wider">
                          {currentT.selectStars}
                        </span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isActive = val <= selectedStars;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setSelectedStars(val)}
                                className="p-1 hover:scale-125 active:scale-95 transition-all duration-200"
                              >
                                <Star
                                  className={`h-8 w-8 transition-colors ${isActive
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-[var(--text-2)]/30'
                                    }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        placeholder={currentT.writeComment}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-2)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all duration-200 text-xs resize-none h-24"
                      />
                    </div>

                    <div className="space-y-2 pt-4 shrink-0">
                      <button
                        type="submit"
                        disabled={submittingRating}
                        className="w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-200 bg-[var(--accent)] text-white disabled:opacity-50"
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
                      <button
                        type="button"
                        onClick={() => setReviewsViewMode('list')}
                        className="w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center border border-[var(--border)] hover:bg-[var(--card)] active:scale-[0.98] transition-all duration-200 text-[var(--text-2)]"
                      >
                        <span>{isRtl ? 'العودة للتقييمات' : 'Back to Reviews'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart / Order Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-end justify-center">
          <div
            className="w-full max-w-[480px] bg-[var(--bg)] rounded-t-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border-t border-[var(--border)]"
            style={{ animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <h3 className="text-sm font-bold tracking-widest uppercase">
                {isRtl ? 'طلبي' : 'My Order'}
              </h3>
              <span className="text-xs text-[var(--text-2)]">{cartCount} {isRtl ? 'صنف' : 'items'}</span>
            </div>

            {orderSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold">{isRtl ? 'تم إرسال الطلب!' : 'Order Sent!'}</h3>
                <p className="text-sm text-[var(--text-2)] max-w-xs">
                  {isRtl
                    ? 'تم إرسال طلبك إلى المطبخ. سيتم تجهيزه قريباً.'
                    : 'Your order has been sent to the kitchen. It will be prepared shortly.'}
                </p>
                {tableInfo && (
                  <p className="text-xs font-bold text-[var(--accent)]">
                    {isRtl ? `طاولة ${tableInfo.table_number}` : `Table ${tableInfo.table_number}`}
                  </p>
                )}
                <button
                  onClick={() => { setShowCartModal(false); setOrderSuccess(false); setCart([]); setCustomerName(''); setSpecialNotes(''); }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-[var(--text)] text-[var(--bg)] text-xs font-bold hover:opacity-90 transition-all"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 no-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-2)] text-sm">
                      {isRtl ? 'سلة الطلبات فارغة' : 'Your cart is empty'}
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.menu_item_id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[var(--text)]">{isRtl && item.item_name_ar ? item.item_name_ar : item.item_name}</h4>
                          <span className="text-sm font-bold text-[var(--accent)]">{formatPrice(item.unit_price * item.quantity)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQty(item.menu_item_id, -1)}
                              className="h-7 w-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all"
                            >
                              {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-rose-400" /> : <Minus className="h-3.5 w-3.5" />}
                            </button>
                            <span className="text-sm font-bold text-[var(--text)] min-w-[20px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.menu_item_id, 1)}
                              className="h-7 w-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-[var(--text-2)]">{formatPrice(item.unit_price)} {isRtl ? 'للقطعة' : 'each'}</span>
                        </div>
                        <input
                          type="text"
                          placeholder={isRtl ? 'ملاحظات إضافية...' : 'Add special instructions...'}
                          value={item.notes}
                          onChange={(e) => updateCartNotes(item.menu_item_id, e.target.value)}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-2)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="shrink-0 border-t border-[var(--border)] px-6 py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={isRtl ? 'اسمك (اختياري)' : 'Your name (optional)'}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-2)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={isRtl ? 'ملاحظات عامة للطلب (اختياري)' : 'General order notes (optional)'}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-2)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text)]">{isRtl ? 'المجموع' : 'Total'}</span>
                    <span className="text-lg font-bold text-[var(--accent)]">{formatPrice(cartTotal)}</span>
                  </div>
                  {orderError && (
                    <p className="text-xs text-rose-500 font-semibold text-center">{orderError}</p>
                  )}
                  <button
                    onClick={async () => {
                      if (cart.length === 0) return;
                      setSubmittingOrder(true);
                      setOrderError('');
                      try {
                        const { data: order, error: orderErr } = await supabase
                          .from('orders')
                          .insert({
                            restaurant_id: profile.id,
                            table_id: tableId,
                            customer_name: customerName.trim() || null,
                            special_notes: specialNotes.trim() || null,
                            status: 'pending',
                            total_amount: cartTotal
                          })
                          .select('id')
                          .single();
                        if (orderErr) throw orderErr;

                        const itemsPayload = cart.map(i => ({
                          order_id: order.id,
                          menu_item_id: i.menu_item_id,
                          item_name: i.item_name,
                          item_name_ar: i.item_name_ar,
                          quantity: i.quantity,
                          unit_price: i.unit_price,
                          notes: i.notes || null
                        }));

                        const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
                        if (itemsErr) throw itemsErr;

                        setOrderSuccess(true);
                      } catch (err) {
                        setOrderError(err.message || (isRtl ? 'فشل إرسال الطلب' : 'Failed to place order'));
                      } finally {
                        setSubmittingOrder(false);
                      }
                    }}
                    disabled={cart.length === 0 || submittingOrder}
                    className="w-full py-3 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingOrder ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /><span>{isRtl ? 'جاري الإرسال...' : 'Placing Order...'}</span></>
                    ) : (
                      <span>{isRtl ? 'إرسال الطلب' : 'Place Order'}</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Call Waiter Modal */}
      {showCallWaiterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 relative text-[var(--text)] shadow-2xl animate-[scaleUp_200ms_ease-out_forwards]">
            <button
              onClick={() => { setShowCallWaiterModal(false); setCallSuccess(false); setCallError(''); setSelectedCallType(null); }}
              className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-[var(--text-2)] hover:text-[var(--text)] transition-colors duration-200`}
            >
              <X className="h-5 w-5" />
            </button>

            {callSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="h-7 w-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold">{isRtl ? 'تم إرسال الطلب!' : 'Request Sent!'}</h3>
                <p className="text-sm text-[var(--text-2)]">
                  {isRtl
                    ? 'تم إبلاغ النادل بطلبك. سيتم الرد عليك قريباً.'
                    : 'The waiter has been notified. You will be attended to shortly.'}
                </p>
                {tableInfo && (
                  <p className="text-xs font-bold text-[var(--accent)]">
                    {isRtl ? `طاولة ${tableInfo.table_number}` : `Table ${tableInfo.table_number}`}
                  </p>
                )}
                <button
                  onClick={() => { setShowCallWaiterModal(false); setCallSuccess(false); }}
                  className="mt-4 w-full font-bold text-xs py-3 px-4 rounded-xl bg-[var(--text)] text-[var(--bg)] hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                >
                  <span>{isRtl ? 'إغلاق' : 'Close'}</span>
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold tracking-widest text-center mb-2 mt-2 uppercase">
                  {isRtl ? 'استدعاء النادل' : 'Call Waiter'}
                </h3>
                {tableInfo && (
                  <p className="text-center text-xs text-[var(--text-2)] mb-4">
                    {isRtl ? `طاولة ${tableInfo.table_number}` : `Table ${tableInfo.table_number}`}
                    {tableInfo.table_name && ` — ${tableInfo.table_name}`}
                  </p>
                )}

                {callError && (
                  <p className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-600 font-bold mb-4 text-center">
                    {callError}
                  </p>
                )}

                <div className="space-y-3">
                  {[
                    { type: 'service', icon: PhoneCall, labelEn: 'Service', labelAr: 'خدمة', descEn: 'General assistance', descAr: 'مساعدة عامة' },
                    { type: 'bill', icon: CreditCard, labelEn: 'Bill', labelAr: 'الفاتورة', descEn: 'Request the check', descAr: 'طلب الفاتورة' },
                    { type: 'help', icon: HelpCircle, labelEn: 'Help', labelAr: 'مساعدة', descEn: 'Urgent assistance needed', descAr: 'بحاجة لمساعدة عاجلة' },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedCallType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => setSelectedCallType(opt.type)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-start ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                            : 'border-[var(--border)] hover:border-[var(--accent)]/30'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--text-2)] border border-[var(--border)]'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-sm block">{isRtl ? opt.labelAr : opt.labelEn}</span>
                          <span className="text-xs text-[var(--text-2)]">{isRtl ? opt.descAr : opt.descEn}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={async () => {
                    if (!selectedCallType) return;
                    setSubmittingCall(true);
                    setCallError('');
                    try {
                      const { error } = await supabase.from('waiter_calls').insert({
                        restaurant_id: profile.id,
                        table_id: tableId,
                        call_type: selectedCallType,
                        status: 'pending'
                      });
                      if (error) throw error;
                      setCallSuccess(true);
                    } catch (err) {
                      setCallError(err.message || (isRtl ? 'فشل إرسال الطلب' : 'Failed to send request'));
                    } finally {
                      setSubmittingCall(false);
                    }
                  }}
                  disabled={!selectedCallType || submittingCall}
                  className="mt-6 w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {submittingCall ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isRtl ? 'جاري الإرسال...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <span>{isRtl ? 'إرسال' : 'Send Request'}</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Sheet Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-end justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-[480px] bg-[var(--bg)] rounded-t-3xl overflow-hidden flex flex-col relative max-h-[85vh] shadow-2xl border-t border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            {/* Slide indicator */}
            <div className="w-12 h-1 bg-[var(--text)]/15 rounded-full mx-auto my-3 shrink-0" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-20 h-8 w-8 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 active:scale-90`}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Dish Image Banner */}
            {selectedItem.image_url ? (
              <div className="h-[250px] w-full relative overflow-hidden shrink-0 select-none bg-slate-100 dark:bg-zinc-800">
                <img
                  src={selectedItem.image_url}
                  alt={isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] to-transparent" />
              </div>
            ) : (
              <div className="h-40 w-full bg-[var(--card)] flex items-center justify-center shrink-0 border-b border-[var(--border)] select-none">
                <span className="text-5xl opacity-30">🍽️</span>
              </div>
            )}

            {/* Content Details */}
            <div className="p-6 space-y-4 overflow-y-auto no-scrollbar text-start flex-1 pb-8">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <h3 className="text-xl font-bold text-[var(--text)]">
                  {isRtl && selectedItem.name_ar ? selectedItem.name_ar : selectedItem.name}
                </h3>
                <span className="font-bold text-lg text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-xl whitespace-nowrap">
                  {formatPrice(selectedItem.price)}
                </span>
              </div>

              {(selectedItem.description || selectedItem.description_ar) && (
                <p className="text-sm text-[var(--text-2)] leading-relaxed">
                  {isRtl && selectedItem.description_ar ? selectedItem.description_ar : selectedItem.description}
                </p>
              )}

              {/* Badges Row */}
              {selectedItem.badge && (
                <div className="pt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-[var(--accent)]/10 text-[var(--accent)] font-semibold uppercase tracking-wider">
                    {selectedItem.badge}
                  </span>
                </div>
              )}

              {/* Share & Close buttons */}
              <div className="flex gap-3 pt-6 border-t border-[var(--border)] mt-4">
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
                      alert(isRtl ? 'تم نسخ الرابط!' : 'Link copied to clipboard!');
                      setTimeout(() => setCopiedLink(false), 2000);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] bg-[var(--card)] py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">{isRtl ? 'تم النسخ' : 'Copied Link'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 text-[var(--accent)]" />
                      <span>{isRtl ? 'مشاركة الطبق' : 'Share'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 inline-flex items-center justify-center bg-[var(--text)] text-[var(--bg)] py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm hover:opacity-90"
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
