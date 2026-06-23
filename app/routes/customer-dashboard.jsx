import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase/client';
import { 
  Loader2, User, Heart, Star, Sparkles, LogOut, Check, X,
  AlertCircle, Coffee, Compass, Trash2, Calendar, MessageSquare,
  Edit, Share2, Copy, ExternalLink
} from 'lucide-react';
import Logo from '../components/logo';
import QRCode from 'qrcode';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'lactose-free', label: 'Lactose-Free' },
  { id: 'nut-allergy', label: 'Nut Allergy' },
  { id: 'halal', label: 'Halal' },
];

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loyalty, setLoyalty] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'loyalty' | 'reviews' | 'settings'
  
  // Settings tab state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newDietaryPreferences, setNewDietaryPreferences] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Loyalty reward redemption state
  const [selectedLoyaltyReward, setSelectedLoyaltyReward] = useState(null);
  const [rewardQrUrl, setRewardQrUrl] = useState('');

  // Edit reviews state
  const [editingReview, setEditingReview] = useState(null);
  const [editStars, setEditStars] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (selectedLoyaltyReward) {
      QRCode.toDataURL(`TRBZ-LOYAL-${selectedLoyaltyReward.id}-${selectedLoyaltyReward.restaurant_id}`, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => setRewardQrUrl(url))
        .catch(err => console.error('Error generating loyalty QR:', err));
    } else {
      setRewardQrUrl('');
    }
  }, [selectedLoyaltyReward]);

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

  const toggleDietaryPreference = (prefId) => {
    setNewDietaryPreferences((prev) =>
      prev.includes(prefId)
        ? prev.filter((p) => p !== prefId)
        : [...prev, prefId]
    );
  };

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
      setNewName(profileData.full_name || '');
      setNewPhone(profileData.phone || '');
      setNewBirthDate(profileData.birth_date || '');
      setNewDietaryPreferences(profileData.dietary_preferences || []);

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
            main_color,
            address
          )
        `)
        .eq('customer_id', userId);

      if (favsErr) throw favsErr;
      
      // Fetch ratings for saved places in parallel to calculate average
      const restaurantIds = (favsData || []).map(fav => fav.restaurant_id);
      let ratingsMap = {};
      if (restaurantIds.length > 0) {
        const { data: favRatings, error: ratingsErr } = await supabase
          .from('ratings')
          .select('restaurant_id, stars')
          .in('restaurant_id', restaurantIds);
          
        if (!ratingsErr && favRatings) {
          favRatings.forEach(r => {
            if (!ratingsMap[r.restaurant_id]) {
              ratingsMap[r.restaurant_id] = { sum: 0, count: 0 };
            }
            ratingsMap[r.restaurant_id].sum += r.stars;
            ratingsMap[r.restaurant_id].count += 1;
          });
        }
      }

      const favoritesWithRatings = (favsData || []).map(fav => {
        const ratingInfo = ratingsMap[fav.restaurant_id];
        return {
          ...fav,
          averageRating: ratingInfo ? (ratingInfo.sum / ratingInfo.count).toFixed(1) : null,
          totalRatings: ratingInfo ? ratingInfo.count : 0
        };
      });

      setFavorites(favoritesWithRatings || []);

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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }
      setUser(authUser);
      loadDashboardData(authUser.id);
    }
    checkUser();
  }, [navigate, loadDashboardData]);

  // Handle Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    document.cookie = 'sb-access-token=; path=/; max-age=0;';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0;';
    navigate('/login');
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

  // Handle profile details update (Name, Phone, Birthdate, Dietary Preferences)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showNotification('error', 'Name cannot be empty.');
      return;
    }
    setUpdatingName(true);
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          full_name: newName.trim(),
          phone: newPhone.trim() || null,
          birth_date: newBirthDate || null,
          dietary_preferences: newDietaryPreferences
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile((prev) => ({
        ...prev,
        full_name: newName.trim(),
        phone: newPhone.trim() || null,
        birth_date: newBirthDate || null,
        dietary_preferences: newDietaryPreferences
      }));
      showNotification('success', 'Profile details updated successfully.');
    } catch (error) {
      showNotification('error', error.message);
    } finally {
      setUpdatingName(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Passwords do not match.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      showNotification('success', 'Password updated successfully.');
    } catch (error) {
      showNotification('error', error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Handle Share Menu
  const handleShareMenu = (e, slug) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/menu/${slug}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Digital QR Menu',
        url: shareUrl
      }).catch((err) => console.log(err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      showNotification('success', 'Link copied to clipboard.');
    }
  };

  // Start editing review
  const handleStartEditReview = (review) => {
    setEditingReview(review);
    setEditStars(review.stars);
    setEditComment(review.comment || '');
  };

  // Update existing review
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          stars: editStars,
          comment: editComment.trim() || null
        })
        .eq('id', editingReview.id);

      if (error) throw error;

      // Update local state
      setReviews(reviews.map(r => r.id === editingReview.id ? { ...r, stars: editStars, comment: editComment.trim() || null } : r));
      showNotification('success', 'Review updated successfully.');
      setEditingReview(null);
    } catch (error) {
      showNotification('error', error.message);
    } finally {
      setSavingEdit(false);
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

      {/* Floating Toast Notifications */}
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
            <Logo variant="white" />
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center space-x-1.5 border border-slate-800 hover:border-red-500 hover:text-red-400 bg-slate-900/60 text-slate-400 py-2 px-4 rounded-xl text-xs font-bold transition-all gap-1.5 shadow-sm cursor-pointer"
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
            <div className="text-start">
              <span className="inline-flex items-center space-x-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mb-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Verified Diner</span>
              </span>
              <h1 className="text-xl md:text-2xl font-black text-white">{getGreeting()}, {profile?.full_name || 'Welcome'}!</h1>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              {profile?.dietary_preferences && profile.dietary_preferences.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
                  {profile.dietary_preferences.map((pref) => {
                    const label = DIETARY_OPTIONS.find(o => o.id === pref)?.label || pref;
                    return (
                      <span key={pref} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-bold">
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
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
        <div className="grid grid-cols-2 md:flex md:flex-row bg-slate-900/60 p-1.5 rounded-2xl border border-slate-900 gap-2 w-full max-w-2xl">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>My Reviews</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center space-x-1.5 gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile Settings</span>
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
                    to="/restaurants"
                    className="inline-flex items-center space-x-1.5 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Explore Directory</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => {
                    const r = fav.restaurants;
                    if (!r) return null;
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
                              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-red-500 hover:text-red-400 transition-all shadow cursor-pointer"
                              title="Remove Favorite"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="p-5 space-y-2 text-start">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-white text-sm leading-snug truncate">{r.name}</h3>
                              {fav.averageRating && (
                                <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded font-bold shrink-0">
                                  ⭐ {fav.averageRating}
                                </span>
                              )}
                            </div>
                            {r.address && <p className="text-[11px] text-slate-500 truncate">{r.address}</p>}
                          </div>
                        </div>

                        <div className="p-5 pt-0 flex gap-2">
                          <Link
                            to={`/menu/${r.slug}`}
                            className="flex-1 inline-flex items-center justify-center bg-indigo-500 hover:bg-indigo-650 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center gap-1.5 shadow-md shadow-indigo-500/10"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Open Menu</span>
                          </Link>
                          <button
                            onClick={(e) => handleShareMenu(e, r.slug)}
                            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                            title="Share Menu"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
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
                    to="/restaurants"
                    className="inline-flex items-center space-x-1.5 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
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
                          <p className="text-[10px] text-slate-505 leading-normal font-sans">
                            {isCompleted 
                              ? 'Congratulations! Show this card to claim your free reward at the counter.' 
                              : 'Leave reviews on our menu. Collect 6 stamps to get your 6th drink/meal free!'}
                          </p>
                        </div>

                        {/* Visual loyalty stamp slots */}
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
                                      ? 'bg-emerald-500 text-slate-955 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                      : 'bg-indigo-500 text-white shadow-[0_0_6px_rgba(99,102,241,0.4)]'
                                    : 'border border-dashed border-slate-800 text-slate-700 bg-slate-900/20'
                                }`}
                              >
                                {isStamped ? (
                                  isLastSlot ? '🎁' : <Coffee className="h-4 w-4 fill-white text-white" />
                                ) : (
                                  slot
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {isCompleted ? (
                          <button
                            onClick={() => setSelectedLoyaltyReward(item)}
                            className="w-full inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-955 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                          >
                            <span>Claim Free Reward 🎁</span>
                          </button>
                        ) : (
                          <Link
                            to={`/menu/${item.restaurants?.slug}`}
                            className="text-center bg-slate-950/60 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white py-2 px-4 rounded-xl transition-all"
                          >
                            Visit Menu
                          </Link>
                        )}
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
                    to="/restaurants"
                    className="inline-flex items-center space-x-1.5 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Rate a Restaurant</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-sm space-y-3 flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0 text-start">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                          <Link to={`/menu/${rev.restaurants?.slug}`} className="font-extrabold text-sm text-indigo-400 hover:underline truncate">
                            {rev.restaurants?.name}
                          </Link>
                          <div className="flex items-center space-x-1 gap-1 font-sans text-xs">
                            <span className="text-slate-400 text-[10px] flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>

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

                      <div className="flex gap-2 shrink-0 mt-0.5">
                        <button
                          onClick={() => handleStartEditReview(rev)}
                          className="p-2 rounded-lg bg-slate-950/60 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 border border-slate-800/80 hover:border-indigo-950/20 transition-all cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.restaurant_id)}
                          className="p-2 rounded-lg bg-slate-950/60 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-800/80 hover:border-red-950/20 transition-all cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-start text-start">
              
              {/* Profile details form */}
              <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-3xl p-6 lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white">Account Details</h2>
                  <p className="text-slate-400 text-[11px] mt-0.5">Manage your personal customer profile details.</p>
                </div>
                     <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label htmlFor="settings-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-[#0f172a]/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none transition-all text-sm"
                    />
                  </div>

                  {/* Phone & Birth Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settings-phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        id="settings-phone"
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 000-0000"
                        className="w-full bg-[#0f172a]/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="settings-birthdate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        id="settings-birthdate"
                        type="date"
                        value={newBirthDate}
                        onChange={(e) => setNewBirthDate(e.target.value)}
                        className="w-full bg-[#0f172a]/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white focus:outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Dietary Preferences & Allergies
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((opt) => {
                        const isSelected = newDietaryPreferences.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleDietaryPreference(opt.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-500 border-indigo-500 text-white shadow-md'
                                : 'border-slate-800 bg-[#0f172a]/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={updatingName}
                    className="inline-flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-650 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 gap-1.5 cursor-pointer"
                  >
                    {updatingName ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </form>

                <div className="h-px bg-slate-900" />

                <div>
                  <h2 className="text-base font-bold text-white">Change Password</h2>
                  <p className="text-slate-400 text-[11px] mt-0.5">Secure your diner account with a new login password.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settings-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        New Password
                      </label>
                      <input
                        id="settings-password"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full bg-[#0f172a]/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="settings-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        id="settings-confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-[#0f172a]/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="inline-flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 gap-1.5"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Sidebar stats panel */}
              <div className="space-y-6">
                <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                  <h2 className="text-sm font-bold text-white pb-3 border-b border-slate-900">Diner Analytics</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-450">Member Since</span>
                      <span className="text-slate-200 font-bold">
                        {profile?.created_at 
                          ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'
                        }
                      </span>
                    </div>
                    {profile?.phone && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-450">Phone Number</span>
                        <span className="text-slate-200 font-bold">{profile.phone}</span>
                      </div>
                    )}
                    {profile?.birth_date && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-450">Date of Birth</span>
                        <span className="text-slate-200 font-bold">
                          {new Date(profile.birth_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-450">Reviews Written</span>
                      <span className="text-indigo-400 font-black">{reviews.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-450">Cafes Bookmarked</span>
                      <span className="text-indigo-400 font-black">{favorites.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-450">Loyalty Stamps</span>
                      <span className="text-indigo-400 font-black">
                        {loyalty.reduce((sum, item) => sum + item.stamps_count, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111A2E]/20 border border-slate-900 rounded-3xl p-6 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400">Security Tips</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Make sure to choose a unique password that is at least 6 characters long. Keep your session active, or sign out on shared public devices.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Loyalty Reward Redemption Modal */}
      {selectedLoyaltyReward && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedLoyaltyReward(null)}
        >
          <div
            className="w-full max-w-md bg-[#0F1524] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-start"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedLoyaltyReward(null)}
              className="absolute top-4 right-4 z-25 h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 space-y-6 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coffee className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">Redeem Free Reward!</h3>
                <p className="text-slate-400 text-xs px-4">
                  Show this validation code to the cashier/waiter at <strong className="text-white">{selectedLoyaltyReward.restaurants?.name}</strong> to claim your free drink or meal.
                </p>
              </div>

              {/* QR Code Container */}
              {rewardQrUrl ? (
                <div className="p-4 bg-white border border-slate-800 rounded-2xl shadow-inner select-none">
                  <img src={rewardQrUrl} alt="Validation QR Code" className="h-44 w-44" />
                </div>
              ) : (
                <div className="h-44 w-44 bg-slate-900 rounded-2xl flex items-center justify-center border border-dashed border-slate-800">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              )}

              <div className="bg-slate-950/80 px-5 py-2.5 rounded-xl border border-slate-900 select-all font-mono text-xs font-bold text-emerald-400 tracking-wider">
                Code: TRBZ-LOYAL-{selectedLoyaltyReward.id.substring(0, 4).toUpperCase()}
              </div>

              <button
                onClick={() => setSelectedLoyaltyReward(null)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setEditingReview(null)}
        >
          <div
            className="w-full max-w-md bg-[#0F1524] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-start"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setEditingReview(null)}
              className="absolute top-4 right-4 z-25 h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <form onSubmit={handleUpdateReview} className="p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Edit your review</h3>
                <p className="text-slate-400 text-xs">For: <strong className="text-slate-300">{editingReview.restaurants?.name}</strong></p>
              </div>

              {/* Star selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Stars
                </label>
                <div className="flex space-x-1.5 gap-1.5 select-none">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditStars(val)}
                      className="p-1 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          val <= editStars ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text area */}
              <div className="space-y-2">
                <label htmlFor="edit-comment" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Review Comment (Optional)
                </label>
                <textarea
                  id="edit-comment"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Tell us what you liked or disliked..."
                  className="w-full bg-[#0f172a]/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-all text-sm resize-none h-24"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 border border-slate-800 hover:bg-slate-900 text-slate-350 font-bold py-3.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-650 text-white font-bold py-3.5 px-4 rounded-xl text-xs active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
