import { useOutletContext } from 'react-router';
import BillingPortal from '../components/dashboard/billing-portal';

export default function DashboardBillingPage() {
  const { profile, subscriptionInfo } = useOutletContext();

  return (
    <div className="space-y-6 font-sans">
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
