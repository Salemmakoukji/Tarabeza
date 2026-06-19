import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BillingPortal from '@/components/dashboard/billing-portal';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect('/login?from=billing');
  }

  // Fetch the restaurant profile
  const { data: profile } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
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

  const subscriptionInfo = {
    plan: subscription?.plan || 'free',
    status: subscription?.status || (isTrialActive ? 'trialing' : 'expired'),
    expires_at: subscription?.expires_at || null,
    trialDaysLeft,
    isTrialActive,
    hasPaidAccess
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Subscription & Billing</h1>
        <p className="text-slate-500 text-sm">Manage your premium membership plan, billing periods, and checkout.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <BillingPortal profile={profile} subscriptionInfo={subscriptionInfo} />
      </div>
    </div>
  );
}
