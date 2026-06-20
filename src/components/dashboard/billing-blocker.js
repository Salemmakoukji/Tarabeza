'use client';

import BillingPortal from './billing-portal';
import { UtensilsCrossed } from 'lucide-react';
import Logo from '@/components/logo';

export default function BillingBlocker({ profile, subscriptionInfo }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-3 gap-2 pb-4 border-b border-slate-200">
          <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-center">
            <Logo />
          </div>
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md ml-auto">
            Action Required
          </span>
        </div>

        <div className="space-y-2 text-center py-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
          <p className="text-sm font-bold text-rose-800">
            Dashboard Access Blocked
          </p>
          <p className="text-xs text-rose-600 max-w-xl mx-auto px-4 leading-relaxed">
            Your 14-day free trial has expired or your current plan is inactive. Select one of the professional plans below to immediately unlock access and keep your digital menus live.
          </p>
        </div>

        <BillingPortal profile={profile} subscriptionInfo={subscriptionInfo} isBlocker={true} />
      </div>
    </div>
  );
}
