import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useRevalidator } from 'react-router';
import { supabase } from '../../lib/supabase/client';
import { 
  Check, 
  Loader2, 
  Star, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  CheckCircle2,
  X 
} from 'lucide-react';

export default function BillingPortal({ profile, subscriptionInfo, isBlocker = false }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [paddleLoaded, setPaddleLoaded] = useState(false);

  const addToast = useCallback((type, text) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

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

        // Expire subscription in 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

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
      case 'premium': return window.ENV?.PADDLE_PREMIUM_PRICE_ID;
      default: return null;
    }
  };

  const currentPlanName = subscriptionInfo.plan.toUpperCase();

  return (
    <div className="space-y-8">
      {/* Current Plan Status Summary */}
      <div className={`p-6 rounded-2xl border ${
        subscriptionInfo.hasPaidAccess 
          ? 'bg-emerald-50/50 border-emerald-200' 
          : subscriptionInfo.isTrialActive 
            ? 'bg-orange-50/50 border-orange-200' 
            : 'bg-rose-50/50 border-rose-200'
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
              <h3 className="text-base font-bold text-slate-800">
                {subscriptionInfo.hasPaidAccess 
                  ? `Active Subscription: ${currentPlanName}` 
                  : subscriptionInfo.isTrialActive 
                    ? `Free Trial Mode (${subscriptionInfo.trialDaysLeft} days remaining)`
                    : 'Subscription Expired'
                }
              </h3>
              <p className="text-xs text-slate-500 mt-1">
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
            <span className="bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-xl px-3 py-1.5 text-xs font-bold self-start sm:self-center">
              14-Day Free Trial
            </span>
          )}
        </div>
      </div>

      {/* Pricing Grid */}
      <div>
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Select Subscription Plan</h2>
          <p className="text-slate-500 text-sm">Choose the tier that matches your restaurant requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Plan 1: Basic */}
          <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow relative ${
            subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess ? 'ring-2 ring-emerald-500 border-transparent' : 'border-slate-200'
          }`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-slate-800">Basic</h3>
                {subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 gap-1">
                <span className="text-3xl font-black text-slate-800">$15</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <p className="text-xs text-slate-500">Perfect for single coffee shops or diners.</p>
              <div className="h-px bg-slate-100 w-full"></div>
              <ul className="space-y-2.5">
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>1 Restaurant profile</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Up to 50 menu items</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Standard QR flyer downloads</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('Basic', 15)}
              disabled={loadingPlan !== null || (subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess)}
              className={`w-full font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 ${
                subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 text-slate-700 active:scale-98'
              }`}
            >
              {loadingPlan === 'Basic' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initiating checkout...</span>
                </>
              ) : (
                <span>{subscriptionInfo.plan === 'basic' && subscriptionInfo.hasPaidAccess ? 'Active Plan' : 'Select Basic Plan'}</span>
              )}
            </button>
          </div>

          {/* Plan 2: Pro */}
          <div className={`bg-white border p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow relative ${
            subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess 
              ? 'ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-500/5' 
              : 'border-orange-200 ring-2 ring-orange-500/10'
          }`}>
            {/* Best Value Tag */}
            <span className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold uppercase tracking-wider text-[8px] px-3 py-1 rounded-full shadow-lg shadow-orange-500/10">
              Popular
            </span>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-slate-800 flex items-center space-x-1 gap-1">
                  <span>Pro</span>
                  <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                </h3>
                {subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 gap-1">
                <span className="text-3xl font-black text-slate-800">$29</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <p className="text-xs text-slate-500">Perfect for growing bistros and bars.</p>
              <div className="h-px bg-slate-100 w-full"></div>
              <ul className="space-y-2.5">
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>3 Restaurant profiles</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Unlimited menu items</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Custom QR colors & styled flyers</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Basic scan metrics</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('Pro', 29)}
              disabled={loadingPlan !== null || (subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess)}
              className={`w-full font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/10 active:scale-98'
              }`}
            >
              {loadingPlan === 'Pro' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initiating checkout...</span>
                </>
              ) : (
                <span>{subscriptionInfo.plan === 'pro' && subscriptionInfo.hasPaidAccess ? 'Active Plan' : 'Select Pro Plan'}</span>
              )}
            </button>
          </div>

          {/* Plan 3: Premium */}
          <div className={`bg-white border rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow relative ${
            subscriptionInfo.plan === 'premium' && subscriptionInfo.hasPaidAccess ? 'ring-2 ring-emerald-500 border-transparent' : 'border-slate-200'
          }`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-slate-800">Premium</h3>
                {subscriptionInfo.plan === 'premium' && subscriptionInfo.hasPaidAccess && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div className="flex items-baseline space-x-1 gap-1">
                <span className="text-3xl font-black text-slate-800">$49</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <p className="text-xs text-slate-500">For multi-location dining groups.</p>
              <div className="h-px bg-slate-100 w-full"></div>
              <ul className="space-y-2.5">
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited restaurant profiles</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited items & custom templates</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Full database analytics console</span>
                </li>
                <li className="flex items-center space-x-2 gap-2 text-xs text-slate-600">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>24/7 Premium technical support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('Premium', 49)}
              disabled={loadingPlan !== null || (subscriptionInfo.plan === 'premium' && subscriptionInfo.hasPaidAccess)}
              className={`w-full font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 ${
                subscriptionInfo.plan === 'premium' && subscriptionInfo.hasPaidAccess
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 text-slate-700 active:scale-98'
              }`}
            >
              {loadingPlan === 'Premium' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Initiating checkout...</span>
                </>
              ) : (
                <span>{subscriptionInfo.plan === 'premium' && subscriptionInfo.hasPaidAccess ? 'Active Plan' : 'Select Premium Plan'}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border bg-white shadow-2xl transition-all duration-300 animate-slide-up text-slate-800`}
            style={{ borderLeftWidth: '5px', borderLeftColor: toast.type === 'error' ? '#ef4444' : '#10b981' }}
          >
            <div className="flex items-start space-x-3 gap-3">
              {toast.type === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs text-slate-900">
                  {toast.type === 'error' ? 'Error' : 'Success'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {toast.text}
                </p>
              </div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-4 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
