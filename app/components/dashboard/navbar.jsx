import { Menu, User, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

export default function Navbar({ onMenuToggle, profile, subscriptionInfo }) {
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

      {/* Right section: Link to public menu + User email */}
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
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-205 leading-tight">Owner</span>
            <span className="text-[10px] text-slate-500 font-medium">Logged In</span>
          </div>
        </div>
      </div>
    </header>
  );
}
