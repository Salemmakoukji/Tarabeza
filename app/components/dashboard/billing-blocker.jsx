import BillingPortal from './billing-portal';
import Logo from '../logo';

export default function BillingBlocker({ profile, subscriptionInfo, lang = 'en' }) {
  const t = {
    en: {
      actionRequired: 'Action Required',
      accessBlocked: 'Dashboard Access Blocked',
      description: 'Your 14-day free trial has expired or your current plan is inactive. Select one of the professional plans below to immediately unlock access and keep your digital menus live.',
    },
    ar: {
      actionRequired: 'إجراء مطلوب',
      accessBlocked: 'تم حظر الوصول إلى لوحة التحكم',
      description: 'انتهت الفترة التجريبية المجانية لمدة 14 يوماً أو أن خطتك الحالية غير نشطة. اختر إحدى الخطط الاحترافية أدناه لفتح الوصول فوراً والحفاظ على قوائمك الرقمية نشطة.',
    },
  }[lang];

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 p-6 md:p-8 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
          <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-center">
            <Logo />
          </div>
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md ml-auto">
            {t.actionRequired}
          </span>
        </div>

        <div className="space-y-2 text-center py-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
          <p className="text-sm font-bold text-rose-800">
            {t.accessBlocked}
          </p>
          <p className="text-xs text-rose-600 max-w-xl mx-auto px-4 leading-relaxed">
            {t.description}
          </p>
        </div>

        <BillingPortal profile={profile} subscriptionInfo={subscriptionInfo} isBlocker={true} />
      </div>
    </div>
  );
}
