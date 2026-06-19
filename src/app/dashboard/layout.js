import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './layout-client';
import BillingBlocker from '@/components/dashboard/billing-blocker';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    const errMsg = userError?.message || 'no_user';
    redirect(`/login?from=layout&reason=${encodeURIComponent(errMsg)}`);
  }

  // Fetch the restaurant profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    redirect('/login?from=layout_no_profile');
  }

  if (!profile.phone || !profile.address) {
    redirect('/onboarding');
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

  if (isBlocked) {
    return <BillingBlocker profile={profile} subscriptionInfo={subscriptionInfo} />;
  }

  return (
    <DashboardLayoutClient profile={profile} user={user} subscriptionInfo={subscriptionInfo}>
      {children}
    </DashboardLayoutClient>
  );
}
