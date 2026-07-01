import { useState, useEffect } from 'react';
import { useNavigate, useRevalidator } from 'react-router';
import { supabase } from '../../lib/supabase/client';
import { Check, Loader2, Star, ShieldCheck, Zap } from 'lucide-react';
import { useToast, ToastContainer } from '../../components/dashboard/toast';

export default function BillingPortal({ profile, subscriptionInfo, isBlocker = false }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { toasts, addToast, removeToast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [paddleLoaded, setPaddleLoaded] = useState(false);

  // Dynamically load Paddle SDK if client token exists
  useEffect(() => {
    const clientToken = typeof window !== 'undefined' ? window.ENV?.PADDLE_CLIENT_TOKEN : null;
    if (clientToken && typeof window !== 'undefined' && !window.Paddle) {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      script.onload = () => {
        if (window.Paddle) {
          window.Paddle.Environment.set('sandbox');
          window.Paddle.Initialize({ token: clientToken });
          setPaddleLoaded(true);
        }
      };
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.Paddle) {
      setPaddleLoaded(true);
    }
  }, []);

  const handleCheckout = async (planName, priceAmount) => {
    setLoadingPlan(planName);
    
    const clientToken = typeof window !== 'undefined' ? window.ENV?.PADDLE_CLIENT_TOKEN : null;
    const priceId = getPriceId(planName);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active authentication session.');

      if (clientToken && priceId && window.Paddle) {
        // Real Paddle Checkout in sandbox environment
        window.Paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customData: { restaurantId: profile.id, planName },
          customer: { email: user.email },
          settings: {
            successUrl: `${window.location.origin}/dashboard/billing?success=true&plan=${planName}`
          }
        });
      } else {
        // Fallback: Developer Sandbox Mock Checkout
        addToast('success', `Simulating Paddle checkout for ${planName} plan...`);
        
        // Wait 1.5s to simulate network payment
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Expire subscription in 30 days or 365 days
        const expiresAt = new Date();
        if (billingPeriod === 'yearly') {
          expiresAt.setDate(expiresAt.getDate() + 365);
        } else {
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            restaurant_id: profile.id,
            plan: planName.toLowerCase(),
            status: 'active',
            expires_at: expiresAt.toISOString(),
          }, { onConflict: 'restaurant_id' });

        if (error) throw error;

        addToast('success', `Successfully upgraded to the ${planName} plan!`);
        revalidator.revalidate();
      }
    } catch (err) {
      addToast('error', `Checkout failed: ${err.message}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPriceId = (planName) => {
    if (typeof window === 'undefined') return null;
    switch (planName.toLowerCase()) {
      case 'basic': return window.ENV?.PADDLE_BASIC_PRICE_ID;
      case 'pro': return window.ENV?.PADDLE_PRO_PRICE_ID;
      default: return null;
    }
  };

  const currentPlanName = subscriptionInfo.plan.toUpperCase();

  return (
    <div className="space-y-8 text-white">
      {/* Current Plan Status Summary */}
      <div className={`p-6 rounded-2xl border ${
        subscriptionInfo.hasPaidAccess 
          ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200' 
          : subscriptionInfo.isTrialActive 
            ? 'bg-orange-950/20 border-orange-850/60 text-orange-200' 
            : 'bg-rose-950/20 border-rose-850/60 text-rose-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3 gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              subscriptionInfo.hasPaidAccess 
                ? 'bg-emerald-500 text-white' 
                : subscriptionInfo.isTrialActive 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-rose-500 text-white'
            }`}>
              {subscriptionInfo.hasPaidAccess ? (
                <ShieldCheck className="h-6 w-6" />
              ) : subscriptionInfo.isTrialActive ? (
                <Zap className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {subscriptionInfo.hasPaidAccess 
                  ? `Active Subscription: ${currentPlanName}` 
                  : subscriptionInfo.isTrialActive 
                    ? `Free Trial Mode (${subscriptionInfo.trialDaysLeft} days remaining)`
                    : 'Subscription Expired'
                }
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {subscriptionInfo.hasPaidAccess 
                  ? `Your paid subscription is active. Expiration: ${subscriptionInfo.expires_at ? subscriptionInfo.expires_at.split('T')[0] : 'Never'}`
                  : subscriptionInfo.isTrialActive 
                    ? `You are currently testing all features. Upgrade at any time below.`
                    : 'Your 14-day free trial or payment period has ended. Access to your dashboard is blocked. Please select a plan to restore access.'
                }
              </p>
            </div>
          </div>
          
          {subscriptionInfo.isTrialActive && !subscriptionInfo.hasPaidAccess && (
            <span className="bg-orange-550/10 border border-orange-550/20 text-orange-400 rounded-xl px-3 py-1.5 text-xs font-bold self-start sm:self-center">
              14-Day Free Trial
            </span>
          )}
        </div>
      </div>

      {/* Pricing Grid */}
      <div>
        <div className="text-center max-w-xl mx-auto space-y-2 mb-4">
          <h2 className="text-2xl font-bold text-white">Select Subscription Plan</h2>
          <p className="text-slate-400 text-sm">Choose the tier that matches your restaurant requirements.</p>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center items-center pt-2 gap-3 mb-8">
          <span className={`text-xs font-semibold tracking-wide transition-colors duration-200 ${billingPeriod === 'monthly' ? 'text-white font-bold' : 'text-slate-500'}`}>
            Monthly
          </span>
          <button 
            type="button"
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="w-10 h-5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-full p-0.5 transition-all duration-300 relative focus:outline-none flex items-center"
            aria-label="Toggle billing cycle"
          >
            <div className={`w-3.5 h-3.5 bg-orange-500 rounded-full shadow-md transition-transform duration-300 ${billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-semibold tracking-wide transition-colors duration-200 ${billingPeriod === 'yearly' ? 'text-white font-bold' : 'text-slate-500'}`}>
            Yearly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          {/* Plan 1: Basic */}
          <div className={`bg-[#162035]/65 border rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow relative ${
            subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess ? 'ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-500/5' : 'border-slate-800'
          }`}>
            {billingPeriod === 'yearly' && (
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white font-bold uppercase tracking-wider text-[8px] px-3 py-1 rounded-full shadow-lg">
                2 Months Free
              </span>
            )}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-white">Basic</h3>
                {subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 gap-1">
                <span className="text-3xl font-black text-white">
                  {billingPeriod === 'monthly' ? '$10' : '$100'}
                </span>
                <span className="text-slate-400 text-xs">
                  {billingPeriod === 'monthly' ? '/month' : '/year'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Perfect for single coffee shops or diners.</p>
              <div className="h-px bg-slate-800 w-full"></div>
              <ul className="space-y-2.5">
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-550 shrink-0" />
                  <span>1 Restaurant profile</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-550 shrink-0" />
                  <span>Up to 50 menu items</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-300">
                  <Check className="h-3.5 w-3.5 text-emerald-550 shrink-0" />
                  <span>Standard QR Code generator</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('Basic', billingPeriod === 'monthly' ? 10 : 100)}
              disabled={loadingPlan !== null || (subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess)}
              className={`w-full font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 ${
                subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-[#1e293b] border border-slate-800 hover:border-orange-500 hover:text-orange-500 text-slate-200 active:scale-98 hover:bg-[#25324c]'
              }`}
            >
              {loadingPlan === 'Basic' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initiating checkout...</span>
                </>
              ) : (
                <span>{subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess ? 'Active Plan' : `Select Basic ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}`}</span>
              )}
            </button>
          </div>

          {/* Plan 2: Pro */}
          <div className={`bg-[#1C273E]/75 border p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-lg transition-all relative ${
            subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess 
              ? 'ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-500/5' 
              : 'border-orange-500/40 ring-4 ring-orange-500/5'
          }`}>
            {/* Best Value Tag */}
            <span className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold uppercase tracking-wider text-[8px] px-3 py-1 rounded-full shadow-lg shadow-orange-500/10">
              Popular
            </span>
            {billingPeriod === 'yearly' && (
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white font-bold uppercase tracking-wider text-[8px] px-3 py-1 rounded-full shadow-lg">
                2 Months Free
              </span>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-white flex items-center space-x-1 gap-1">
                  <span>Pro</span>
                  <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                </h3>
                {subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 gap-1">
                <span className="text-3xl font-black text-white">
                  {billingPeriod === 'monthly' ? '$20' : '$200'}
                </span>
                <span className="text-slate-400 text-xs">
                  {billingPeriod === 'monthly' ? '/month' : '/year'}
                </span>
              </div>
              <p className="text-xs text-slate-355">Perfect for growing bistros and bars.</p>
              <div className="h-px bg-slate-800/80 w-full"></div>
              <ul className="space-y-2.5">
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-200">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Unlimited menu items</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-200">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Premium styling customizer</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-200">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Full analytics & views counter</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-200">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>24/7 Priority support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('Pro', billingPeriod === 'monthly' ? 20 : 200)}
              disabled={loadingPlan !== null || (subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess)}
              className={`w-full font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-650 hover:to-amber-600 text-slate-950 shadow-orange-500/10 active:scale-98'
              }`}
            >
              {loadingPlan === 'Pro' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initiating checkout...</span>
                </>
              ) : (
                <span>{subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess ? 'Active Plan' : `Select Pro ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}`}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
