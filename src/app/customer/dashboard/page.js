'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, User, Heart, Star, Sparkles, LogOut, Check, X,
  AlertCircle, Coffee, Compass, Trash2, Calendar, MessageSquare
} from 'lucide-react';
import Logo from '@/components/logo';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loyalty, setLoyalty] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'loyalty' | 'reviews'
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((type, text) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const loadDashboardData = useCallback(async (userId) => {
    try {
      // 1. Fetch Diner Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) throw profileErr;
      setProfile(profileData);

      // 2. Fetch Favorites (joined with restaurant profiles)
      const { data: favsData, error: favsErr } = await supabase
        .from('customer_favorites')
        .select(`
          id,
          restaurant_id,
          restaurants (
            id,
            name,
            slug,
            logo_url,
            cover_url,
            theme_color,
            address
          )
        `)
        .eq('customer_id', userId);

      if (favsErr) throw favsErr;
      setFavorites(favsData || []);

      // 3. Fetch Reviews left by customer
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('ratings')
        .select(`
          id,
          stars,
          comment,
          created_at,
          restaurant_id,
          restaurants (
            name,
            slug
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (reviewsErr) throw reviewsErr;
      setReviews(reviewsData || []);

      // 4. Fetch Loyalty Stamps
      const { data: loyaltyData, error: loyaltyErr } = await supabase
        .from('customer_loyalty')
        .select(`
          id,
          stamps_count,
          restaurant_id,
          restaurants (
            name,
            slug
          )
        `)
        .eq('customer_id', userId);

      if (loyaltyErr) throw loyaltyErr;
      setLoyalty(loyaltyData || []);

    } catch (error) {
      console.error('Error loading diner stats:', error);
      showNotification('error', `Failed to load dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Handle load authentication
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      loadDashboardData(user.id);
    }
    checkUser();
  }, [router, loadDashboardData]);

  // Handle Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Remove a restaurant from favorites
  const handleRemoveFavorite = async (e, favId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('id', favId);

      if (error) throw error;
      setFavorites(favorites.filter(fav => fav.id !== favId));
      showNotification('success', 'Removed from favorites.');
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  // Delete a review left by diner
  const handleDeleteReview = async (reviewId, restaurantId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      // Update local state
      setReviews(reviews.filter(rev => rev.id !== reviewId));
      
      // Decrease loyalty stamps for deleting review
      const existingLoyalty = loyalty.find(l => l.restaurant_id === restaurantId);
      if (existingLoyalty && existingLoyalty.stamps_count > 0) {
        const newCount = Math.max(0, existingLoyalty.stamps_count - 1);
        if (newCount === 0) {
          await supabase.from('customer_loyalty').delete().eq('id', existingLoyalty.id);
          setLoyalty(loyalty.filter(l => l.id !== existingLoyalty.id));
        } else {
          await supabase
            .from('customer_loyalty')
            .update({ stamps_count: newCount, updated_at: new Date() })
            .eq('id', existingLoyalty.id);
          setLoyalty(loyalty.map(l => l.id === existingLoyalty.id ? { ...l, stamps_count: newCount } : l));
        }
      }

      showNotification('success', 'Review deleted. Loyalty stamp adjusted.');
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 relative overflow-hidden">
      {/* Visual background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Stackable Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between p-4 rounded-xl border bg-slate-900 shadow-2xl transition-all duration-300 animate-slide-up border-slate-800 text-slate-100"
            style={{ borderLeftWidth: '5px', borderLeftColor: toast.type === 'error' ? '#ef4444' : '#6366f1' }}
          >
            <div className="flex items-start space-x-3 gap-3">
              {toast.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <Check className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs text-white">
                  {toast.type === 'error' ? 'Error' : 'Success'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {toast.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors ml-4 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo />
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center space-x-1.5 border border-slate-800 hover:border-red-500 hover:text-red-400 bg-slate-900/60 text-slate-400 py-2 px-4 rounded-xl text-xs font-bold transition-all gap-1.5 shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Hero Section Banner */}
      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10 relative z-10">
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 rounded-3xl p-6 md:p-8 border border-indigo-900/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl opacity-10 translate-x-12 -translate-y-12"></div>
          <div className="flex items-center space-x-4 gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <User className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mb-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Verified Diner</span>
              </span>
              <h1 className="text-xl md:text-2xl font-black text-white">{profile?.full_name || 'Welcome!'}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 bg-slate-950/60 border border-slate-900 p-4 rounded-2xl w-full md:w-auto text-center shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Favorites</span>
              <span className="text-lg font-black text-indigo-400 mt-1 block">{favorites.length}</span>
            </div>
            <div className="border-x border-slate-900 px-6">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Reviews</span>
              <span className="text-lg font-black text-indigo-400 mt-1 block">{reviews.length}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Loyalty</span>
              <span className="text-lg font-black text-indigo-400 mt-1 block">{loyalty.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-900 gap-2 w-full max-w-md">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 ${
              activeTab === 'favorites'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Saved Places</span>
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 ${
              activeTab === 'loyalty'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coffee className="h-4 w-4" />
            <span>Loyalty Wallet</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>My Reviews</span>
          </button>
        </div>

        {/* Display Content based on Active Tab */}
        <div className="space-y-6">
          {activeTab === 'favorites' && (
            <>
              {favorites.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-12 text-center flex flex-col items-center">
                  <Heart className="h-10 w-10 text-slate-700 mb-3" />
                  <h3 className="text-sm font-bold text-slate-400 mb-1">No bookmarked spots</h3>
                  <p className="text-slate-500 text-xs max-w-sm mb-6">Explore the restaurant directory and click the heart icon on menus to bookmark them.</p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Explore Directory</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => {
                    const r = fav.restaurants;
                    return (
                      <div key={fav.id} className="bg-slate-900/50 border border-slate-900 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:border-indigo-900/40 transition-colors">
                        <div>
                          {/* Cover Image fallback */}
                          <div className="h-28 w-full bg-slate-900 relative">
                            {r.cover_url ? (
                              <img src={r.cover_url} alt={r.name} className="w-full h-full object-cover opacity-60" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-slate-950 to-indigo-950 opacity-60" />
                            )}
                            
                            {/* Logo Overlay */}
                            <div className="absolute bottom-3 left-4 flex items-center space-x-3 gap-3">
                              {r.logo_url ? (
                                <img src={r.logo_url} alt={r.name} className="h-10 w-10 rounded-xl object-cover bg-slate-950 border border-slate-800" />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs border border-slate-800">
                                  {r.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => handleRemoveFavorite(e, fav.id)}
                              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-red-500 hover:text-red-400 transition-all shadow"
                              title="Remove Favorite"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="p-5 space-y-2">
                            <h3 className="font-bold text-white text-sm leading-snug">{r.name}</h3>
                            {r.address && <p className="text-[11px] text-slate-500 truncate">{r.address}</p>}
                          </div>
                        </div>

                        <div className="p-5 pt-0">
                          <Link
                            href={`/menu/${r.slug}`}
                            className="w-full inline-flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center"
                          >
                            <span>Open Digital Menu</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'loyalty' && (
            <>
              {loyalty.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-12 text-center flex flex-col items-center">
                  <Coffee className="h-10 w-10 text-slate-700 mb-3" />
                  <h3 className="text-sm font-bold text-slate-400 mb-1">No loyalty stamps yet</h3>
                  <p className="text-slate-500 text-xs max-w-sm mb-6">Write ratings and reviews on restaurant menus to automatically earn customer loyalty stamps.</p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Find Cafés to Visit</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loyalty.map((item) => {
                    const stampsCount = item.stamps_count;
                    const isCompleted = stampsCount >= 6;
                    return (
                      <div 
                        key={item.id} 
                        className={`bg-slate-900/60 border rounded-2xl p-5 shadow-lg relative flex flex-col justify-between gap-5 transition-colors duration-300 ${
                          isCompleted ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800'
                        }`}
                      >
                        <div className="space-y-1.5 text-start">
                          <div className="flex justify-between items-start">
                            <h3 className="font-extrabold text-sm text-white">{item.restaurants?.name}</h3>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {isCompleted ? 'Reward Ready! 🎁' : `${stampsCount} / 6 stamps`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            {isCompleted 
                              ? 'Congratulations! Show this card to claim your free reward at the counter.' 
                              : 'Leave reviews on our menu. Collect 6 stamps to get your 6th drink/meal free!'}
                          </p>
                        </div>

                        {/* Visual interactive stamp slots */}
                        <div className="grid grid-cols-6 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-900/50 justify-items-center select-none shadow-inner">
                          {[1, 2, 3, 4, 5, 6].map((slot) => {
                            const isStamped = slot <= stampsCount;
                            const isLastSlot = slot === 6;
                            return (
                              <div 
                                key={slot}
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                  isStamped 
                                    ? isLastSlot 
                                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                      : 'bg-indigo-500 text-white shadow-[0_0_6px_rgba(99,102,241,0.4)]'
                                    : 'border border-dashed border-slate-800 text-slate-700 bg-slate-900/20'
                                }`}
                              >
                                {isStamped ? (
                                  isLastSlot ? '🎁' : <Coffee className="h-4 w-4 fill-white" />
                                ) : (
                                  slot
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <Link
                          href={`/menu/${item.restaurants?.slug}`}
                          className="text-center bg-slate-950/60 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white py-2 px-4 rounded-xl transition-all"
                        >
                          Visit Menu
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'reviews' && (
            <>
              {reviews.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-12 text-center flex flex-col items-center">
                  <MessageSquare className="h-10 w-10 text-slate-700 mb-3" />
                  <h3 className="text-sm font-bold text-slate-400 mb-1">No reviews written</h3>
                  <p className="text-slate-500 text-xs max-w-sm mb-6">Write ratings and reviews on restaurant menus to see them listed in your history archive.</p>
                  <Link
                    href="/restaurants"
                    className="inline-flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Rate a Restaurant</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-sm space-y-3 flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <Link href={`/menu/${rev.restaurants?.slug}`} className="font-extrabold text-sm text-indigo-400 hover:underline truncate">
                            {rev.restaurants?.name}
                          </Link>
                          <div className="flex items-center space-x-1 gap-1 font-sans text-xs">
                            <span className="text-slate-400 text-[10px] flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>

                        {/* Stars output */}
                        <div className="flex space-x-0.5 gap-0.5 select-none">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <Star 
                              key={val} 
                              className={`h-4 w-4 shrink-0 ${
                                val <= rev.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                              }`} 
                            />
                          ))}
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-slate-300 leading-relaxed italic pr-2">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteReview(rev.id, rev.restaurant_id)}
                        className="p-2 rounded-lg bg-slate-950/60 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-800/80 hover:border-red-950/20 transition-all shrink-0 mt-0.5"
                        title="Delete Review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
