import { useState, useEffect } from 'react';
import { redirect, Outlet, useLoaderData } from 'react-router';
import { createClient } from '../lib/supabase/server';
import Sidebar from '../components/dashboard/sidebar';
import Navbar from '../components/dashboard/navbar';
import BillingBlocker from '../components/dashboard/billing-blocker';
import { supabase as browserSupabase } from '../lib/supabase/client';

export async function loader({ request }) {
  const supabase = await createClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    const errMsg = userError?.message || 'no_user';
    return redirect(`/login?from=layout&reason=${encodeURIComponent(errMsg)}`);
  }

  // Fetch the restaurant profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    return redirect('/login?from=layout_no_profile');
  }

  if (!profile.phone || !profile.address) {
    return redirect('/onboarding');
  }

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('restaurant_id', profile.id)
    .maybeSingle();

  // Calculate Trial details (14 days)
  const createdDate = new Date(profile.created_at);
  const now = new Date();
  const trialDurationDays = 14;
  const elapsedMs = now.getTime() - createdDate.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const trialDaysLeft = Math.max(0, trialDurationDays - elapsedDays);
  const isTrialActive = elapsedDays < trialDurationDays;

  // Subscription verification
  const hasPaidAccess = subscription && 
    (subscription.status === 'active' || subscription.status === 'trialing') && 
    (!subscription.expires_at || new Date(subscription.expires_at) > now);

  const isBlocked = !hasPaidAccess && !isTrialActive;

  const subscriptionInfo = {
    plan: subscription?.plan || 'free',
    status: subscription?.status || (isTrialActive ? 'trialing' : 'expired'),
    expires_at: subscription?.expires_at || null,
    trialDaysLeft,
    isTrialActive,
    hasPaidAccess
  };

  return {
    profile,
    user,
    subscriptionInfo,
    isBlocked
  };
}

export default function DashboardLayout() {
  const { profile, user, subscriptionInfo, isBlocked } = useLoaderData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIdx, setCurrentAnnouncementIdx] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      browserSupabase
        .from('announcements')
        .select('*')
        .or(`restaurant_id.is.null,restaurant_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setAnnouncements(data);
        });
    }
  }, [profile?.id]);

  if (isBlocked) {
    return <BillingBlocker profile={profile} subscriptionInfo={subscriptionInfo} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#0F1524] overflow-hidden text-[#FEFEFE]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar 
          onMenuToggle={() => setSidebarOpen(true)} 
          profile={profile} 
          user={user}
          subscriptionInfo={subscriptionInfo} 
        />
        {announcements.length > 0 && announcements[currentAnnouncementIdx] && (
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-orange-500/20 px-6 py-3.5 flex items-center justify-between text-xs text-orange-300">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-orange-500 text-slate-950 px-2 py-0.5 rounded text-[9px]">
                Platform Notice
              </span>
              <strong className="text-slate-200">{announcements[currentAnnouncementIdx].title}:</strong>
              <span>{announcements[currentAnnouncementIdx].message}</span>
            </div>
            <button 
              onClick={() => {
                setAnnouncements(prev => prev.filter((_, idx) => idx !== currentAnnouncementIdx));
              }}
              className="text-orange-400 hover:text-white font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ profile, user, subscriptionInfo }} />
          </div>
        </main>
      </div>
    </div>
  );
}
