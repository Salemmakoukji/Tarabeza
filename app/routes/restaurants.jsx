import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { 
  Search, MapPin, Phone, Star, 
  Sparkles, Loader2, Globe, ArrowRight, ArrowLeft
} from 'lucide-react';
import Logo from '../components/logo';

export async function loader() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      ratings (
        stars
      )
    `);

  if (error) {
    console.error('Error fetching restaurants:', error);
  }

  // Calculate average ratings
  const computed = (data || []).map(r => {
    const starsList = r.ratings?.map(rt => rt.stars) || [];
    const totalReviews = starsList.length;
    const avgRating = totalReviews > 0
      ? (starsList.reduce((sum, val) => sum + val, 0) / totalReviews).toFixed(1)
      : null;
    return {
      ...r,
      avgRating,
      totalReviews
    };
  });

  // Sort by avg rating descending, then name
  computed.sort((a, b) => {
    if (b.avgRating !== a.avgRating) {
      return (b.avgRating || 0) - (a.avgRating || 0);
    }
    return a.name.localeCompare(b.name);
  });

  return { restaurants: computed };
}

export default function RestaurantsDirectory() {
  const { restaurants } = useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState('en'); // 'en' | 'ar'

  const isRtl = lang === 'ar';

  const t = {
    en: {
      title: 'Explore Dining Spotlights',
      subtitle: 'Browse through our premium registered restaurants, cafes, and digital menus.',
      searchPlaceholder: 'Search by name or address...',
      noSpots: 'No Spotlights Found',
      refineSearch: 'Try refining your keyword search.',
      viewMenu: 'View Menu',
      reviews: 'reviews',
      noReviews: 'No reviews yet',
      backToHome: 'Back to Home',
      loadingText: 'Discovering culinary spots...',
    },
    ar: {
      title: 'استكشف وجهات الطعام المميزة',
      subtitle: 'تصفح المقاهي والمطاعم المسجلة والقوائم الرقمية الخاصة بها.',
      searchPlaceholder: 'البحث بالاسم أو العنوان...',
      noSpots: 'لم يتم العثور على نتائج',
      refineSearch: 'حاول تغيير كلمة البحث الخاصة بك.',
      viewMenu: 'عرض المنيو',
      reviews: 'تقييمات',
      noReviews: 'لا توجد تقييمات بعد',
      backToHome: 'العودة للرئيسية',
      loadingText: 'جاري اكتشاف الوجهات المتاحة...',
    }
  };

  const currentT = t[lang];

  const filtered = restaurants.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.address && r.address.toLowerCase().includes(q))
    );
  });

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#0F1524] to-indigo-950 text-slate-100 font-sans pb-16 relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-slate-800/60 relative z-10">
        <Link href="/" className="flex items-center space-x-2 gap-2 text-white hover:text-orange-400 transition-colors">
          <Logo variant="white" lang={lang} />
        </Link>

        <div className="flex items-center space-x-4 gap-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 py-1.5 px-3 rounded-full text-xs font-semibold backdrop-blur-md transition-all gap-1.5 cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span>{lang === 'en' ? 'العربية (AR)' : 'English (EN)'}</span>
          </button>
          
          <Link 
            to="/"
            className="text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center space-x-1 gap-1"
          >
            {isRtl ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
            <span>{currentT.backToHome}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-12 md:pt-16 relative z-10">
        {/* Title area */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <span className="inline-flex items-center space-x-1.5 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-bold tracking-wider uppercase px-3.5 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            <span>SaaS Directory</span>
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {currentT.title}
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            {currentT.subtitle}
          </p>
        </div>

        {/* Search Bar section */}
        <div className="max-w-md mx-auto mb-16 relative">
          <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-3.5 h-5 w-5 text-slate-500`} />
          <input
            type="text"
            placeholder={currentT.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-2xl py-3.5 text-white placeholder-slate-500 focus:outline-none transition-all text-sm shadow-xl ${
              isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'
            }`}
          />
        </div>

        {/* Restaurant Directory Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800/80 rounded-3xl max-w-md mx-auto">
            <Search className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">{currentT.noSpots}</h3>
            <p className="text-sm text-slate-500">{currentT.refineSearch}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover:shadow-orange-500/5 hover:border-slate-700/80 transition-all duration-300 flex flex-col group relative"
              >
                {/* 1. Cover Banner */}
                <div className="h-32 w-full bg-gradient-to-r from-orange-500/20 to-indigo-500/20 relative overflow-hidden shrink-0">
                  {item.cover_url ? (
                    <img 
                      src={item.cover_url} 
                      alt={`${item.name} Cover`} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                </div>

                {/* 2. Brand Identity Block */}
                <div className="px-6 pb-6 flex-1 flex flex-col relative">
                  {/* Logo Overlay */}
                  <div className="-mt-10 mb-4 inline-block shrink-0 relative z-10">
                    {item.logo_url ? (
                      <img 
                        src={item.logo_url} 
                        alt={item.name} 
                        loading="lazy"
                        className="w-16 h-16 rounded-2xl object-cover border-4 border-slate-900 shadow-xl bg-white"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center border-4 border-slate-900 shadow-xl">
                        <span className="text-xl font-black text-white uppercase">{item.name[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 space-y-3 text-start">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-orange-400 transition-colors leading-tight">
                        {item.name}
                      </h2>
                      
                      {/* Ratings stars display */}
                      <div className="flex items-center space-x-1.5 gap-1.5 mt-1.5 text-xs">
                        {item.avgRating ? (
                          <div className="flex items-center space-x-1 gap-1 text-amber-400 font-bold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.avgRating}</span>
                            <span className="text-slate-500 font-normal">
                              ({item.totalReviews} {currentT.reviews})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            {currentT.noReviews}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Contact details */}
                    <div className="pt-2 space-y-1.5 border-t border-slate-800/50 text-slate-400 text-[11px] font-medium">
                      {item.phone && (
                        <p className="flex items-center space-x-1.5 gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{item.phone}</span>
                        </p>
                      )}
                      {item.address && (
                        <p className="flex items-center space-x-1.5 gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span className="truncate">{item.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View Menu CTA Button */}
                  <div className="mt-6 pt-2 shrink-0">
                    <Link 
                      to={`/menu/${item.slug}`}
                      className="w-full bg-slate-900/80 hover:bg-[#F97316] hover:text-white border border-slate-800 hover:border-[#F97316] text-slate-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <span>{currentT.viewMenu}</span>
                      {isRtl ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
