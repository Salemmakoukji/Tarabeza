import { useState, useRef, useEffect } from 'react';
import { Menu, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import UserAvatar from '../user-avatar';

export default function Navbar({ onMenuToggle, profile, user, subscriptionInfo }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0F1524]/80 backdrop-blur px-6 shadow-sm">
      {/* Left section: Mobile menu toggle + page heading */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 hover:bg-slate-800 lg:hidden text-slate-400 hover:text-white focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3">
          {profile?.logo_url && (
            <img
              src={profile.logo_url}
              alt={`${profile.name} Logo`}
              className="h-8 w-8 rounded-lg object-cover border border-slate-800"
            />
          )}
          <h2 className="text-lg font-bold text-white tracking-tight">
            {profile?.name || 'Dashboard'}
          </h2>
        </div>
      </div>

      {/* Right section: Link to public menu + User picture and dropdown menu */}
      <div className="flex items-center space-x-4 gap-2">
        {subscriptionInfo?.isTrialActive && !subscriptionInfo?.hasPaidAccess && (
          <Link
            to="/dashboard/billing"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500 rounded-lg text-xs font-bold text-orange-400 hover:text-orange-300 transition-all shadow-sm"
          >
            <span>Trial: {subscriptionInfo.trialDaysLeft} days left</span>
            <span className="hidden md:inline font-normal opacity-80">| Upgrade Now</span>
          </Link>
        )}

        {profile?.slug && (
          <Link
            to={`/menu/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-orange-500 hover:text-orange-500 text-xs font-semibold text-slate-350 hover:bg-slate-900 transition-all"
          >
            <span>View Menu</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
        <div className="h-8 w-px bg-slate-800" />

        {/* User profile picture and dropdown menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 focus:outline-none hover:opacity-90 active:scale-95 transition-all text-left"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <UserAvatar user={user} profile={profile} className="h-9 w-9 cursor-pointer" />
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.user_metadata?.full_name || profile?.name || 'Owner'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Logged In</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-800 bg-[#0F1524]/95 backdrop-blur-md text-white shadow-2xl p-1.5 z-50 origin-top-right animate-slide-up">
              {/* User Metadata */}
              <div className="px-3.5 py-3 border-b border-slate-800/80">
                <div className="text-xs font-bold truncate flex items-center gap-1.5 text-slate-200">
                  <span>👤</span>
                  <span className="truncate">{user?.user_metadata?.full_name || profile?.name || 'Restaurant Owner'}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 ml-5">
                  {user?.email}
                </div>
              </div>
              {/* Quick Links */}
              <div className="py-1">
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-850/60 rounded-lg transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <span>🏠</span>
                  <span>Landing Page</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850/60 rounded-lg transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <span>📊</span>
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-850/60 rounded-lg transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </Link>
              </div>
              {/* Action Link */}
              <div className="border-t border-slate-800/80 pt-1 mt-1">
                <Link
                  to="/auth/logout"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
