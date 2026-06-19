'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Loader2, UtensilsCrossed, FolderHeart, QrCode, Settings, 
  ExternalLink, Sparkles, Copy, Check, Eye, Star
} from 'lucide-react';
import QRCode from 'qrcode';

export default function DashboardClient({ 
  profile, 
  initialCategories = [], 
  initialMenuItems = [], 
  initialRatings = [], 
  initialScans = [] 
}) {
  const [categoriesCount] = useState(initialCategories.length);
  const [itemsCount] = useState(initialMenuItems.length);
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [ratings] = useState(initialRatings);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [scansCount] = useState(initialScans.length);
  const [weeklyViews, setWeeklyViews] = useState([]);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    // 1. Calculate category weight distribution
    const catMap = {};
    initialCategories.forEach(c => {
      catMap[c.id] = { name: c.name, count: 0 };
    });
    initialMenuItems.forEach(item => {
      if (catMap[item.category_id]) {
        catMap[item.category_id].count += 1;
      }
    });
    const distribution = Object.values(catMap).sort((a, b) => b.count - a.count);
    setCategoryDistribution(distribution);

    // 2. Calculate scans per day for the last 7 days
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayName = daysOfWeek[d.getDay()];
      last7Days.push({
        dateStr,
        day: dayName,
        count: 0
      });
    }

    initialScans.forEach(scan => {
      if (!scan.scanned_at) return;
      const scanDateStr = new Date(scan.scanned_at).toDateString();
      const matchingDay = last7Days.find(item => item.dateStr === scanDateStr);
      if (matchingDay) {
        matchingDay.count += 1;
      }
    });
    setWeeklyViews(last7Days);

    // 3. Generate QR code
    async function generateQR() {
      if (!profile || !origin) return;
      try {
        const fullMenuUrl = `${origin}/menu/${profile.slug}`;
        const qrDataUrl = await QRCode.toDataURL(fullMenuUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          }
        });
        setQrUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
    generateQR();
  }, [initialCategories, initialMenuItems, initialScans, profile, origin]);

  const handleCopyLink = () => {
    if (!profile || !origin) return;
    const fullMenuUrl = `${origin}/menu/${profile.slug}`;
    navigator.clipboard.writeText(fullMenuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReviews = ratings.length;
  const averageRating = totalReviews > 0
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / totalReviews).toFixed(1)
    : null;

  const starPercentages = [5, 4, 3, 2, 1].map(stars => {
    const count = ratings.filter(r => r.stars === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percentage };
  });

  const maxScans = Math.max(...weeklyViews.map(v => v.count), 1);
  const totalItemsCount = itemsCount || 1;
  const publicLink = profile && origin ? `${origin}/menu/${profile.slug}` : '';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-950/10 border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full filter blur-3xl opacity-10 translate-x-12 -translate-y-12"></div>
        <div className="relative z-10 max-w-lg space-y-3">
          <span className="inline-flex items-center space-x-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3" />
            <span>Active Subscription</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Welcome to {profile?.name || 'Tarapeza'}!
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Your QR-based digital menu is ready. Add categories and dishes, customize your flyer layout, and start taking scans at tables.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/dashboard/menu"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
            >
              Build Menu
            </Link>
            {publicLink && (
              <a
                href={publicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
              >
                <span>View Public Menu</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Categories</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{categoriesCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
            <FolderHeart className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu Items</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{itemsCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu Views</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{scansCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
            <Eye className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Average Rating</span>
            <div className="flex items-baseline space-x-1.5 mt-1.5 gap-1.5">
              <h3 className="text-2xl font-black text-slate-800">{averageRating || '—'}</h3>
              {averageRating && <span className="text-slate-450 text-[10px] font-bold">({totalReviews} reviews)</span>}
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Analytics Visual Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Weight Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Category Weight Distribution</h2>
            <p className="text-slate-450 text-[11px]">Percentage distribution of menu dishes across active categories.</p>
          </div>

          <div className="space-y-4 pt-1">
            {categoryDistribution.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold">No menu categories created yet.</div>
            ) : (
              categoryDistribution.slice(0, 5).map((cat) => {
                const percentage = Math.round((cat.count / totalItemsCount) * 100);
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-700 truncate max-w-[180px]">{cat.name}</span>
                      <span className="text-slate-550 shrink-0 font-sans">{cat.count} {cat.count === 1 ? 'item' : 'items'} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rating Star Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Ratings Breakdown</h2>
            <p className="text-slate-450 text-[11px]">Percentage score analysis of customer star ratings.</p>
          </div>

          <div className="space-y-3 pt-1.5">
            {totalReviews === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold">No ratings received yet.</div>
            ) : (
              starPercentages.map((item) => (
                <div key={item.stars} className="flex items-center space-x-3 gap-3 text-xs font-semibold">
                  <span className="w-12 text-slate-500 font-bold shrink-0 flex items-center gap-1">
                    <span>{item.stars}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 relative">
                    <div 
                      className="bg-amber-400 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400 font-bold shrink-0 font-sans">{item.percentage}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weekly scans bar chart & Quick link side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly views chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Weekly Scans Ticker</h2>
            <p className="text-slate-450 text-[11px]">Daily scanner hits showing cafe menu views over the past week.</p>
          </div>

          <div className="flex items-end justify-between h-36 pt-4 px-2 border-b border-slate-100">
            {weeklyViews.map((view) => {
              const heightPercent = (view.count / maxScans) * 100;
              return (
                <div key={view.dateStr} className="flex flex-col items-center flex-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-10 whitespace-nowrap">
                    {view.count} scans
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-7 sm:w-10 bg-indigo-500/10 hover:bg-indigo-500 rounded-t-lg transition-all duration-300 relative overflow-hidden group-hover:shadow-[0_0_8px_rgba(99,102,241,0.4)] cursor-pointer animate-fade-in"
                    style={{ height: view.count > 0 ? `${heightPercent}%` : '4px' }}
                  >
                    <div className="absolute bottom-0 inset-x-0 bg-indigo-500 h-full origin-bottom transform scale-y-[0.8] group-hover:scale-y-[1.0] transition-transform duration-300" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 font-sans">{view.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* QR Preview Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live QR Preview</span>
          {qrUrl ? (
            <div className="p-3 border border-slate-100 rounded-2xl shadow-inner bg-white">
              <img src={qrUrl} alt="QR Code" className="h-36 w-36" />
            </div>
          ) : (
            <div className="h-36 w-36 bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200 text-slate-300">
              <QrCode className="h-8 w-8" />
            </div>
          )}
          <span className="text-[10px] text-slate-400 mt-3 font-semibold">Scan with phone to test</span>
        </div>
      </div>

      {/* Quick Link Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 pb-3 border-b border-slate-100">
          <QrCode className="h-4 w-4 text-slate-400" />
          <span>Quick QR Menu Link</span>
        </h2>

        <div className="space-y-4">
          <p className="text-slate-500 text-xs leading-normal">
            Below is the direct URL that users will see when scanning your flyer. Copy it to share on social media or embed in business listings.
          </p>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden pr-2">
            <input
              type="text"
              readOnly
              value={publicLink}
              className="flex-1 bg-transparent border-0 px-4 py-3 text-xs text-slate-600 focus:ring-0 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 hover:bg-slate-200/60 text-slate-700 py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all border border-slate-200 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/dashboard/qr"
              className="inline-flex items-center justify-center space-x-2 border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Customize QR Code Colors</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center space-x-2 border border-slate-200 hover:border-orange-500 hover:text-orange-500 bg-white text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Edit Brand Highlight Color</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
