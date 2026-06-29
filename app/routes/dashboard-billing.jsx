import { useOutletContext } from 'react-router';
import BillingPortal from '../components/dashboard/billing-portal';

export default function DashboardBillingPage() {
  const { profile, subscriptionInfo } = useOutletContext();

  return (
    <div className="space-y-6 font-sans text-white">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription & Billing</h1>
        <p className="text-slate-400 text-sm">Manage your subscription plan, billing periods, and checkout.</p>
      </div>

      <div className="bg-[#111A2E]/60 border border-slate-800/80 rounded-2xl shadow-sm p-6">
        <BillingPortal profile={profile} subscriptionInfo={subscriptionInfo} />
      </div>
    </div>
  );
}
