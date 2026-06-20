import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Shield } from 'lucide-react';
import Logo from '../components/logo';

export default function TermsPage() {
  const [lang, setLang] = useState('ar');

  const content = {
    en: {
      title: 'Terms of Service',
      subtitle: 'Please review our terms before setting up your digital restaurant menus.',
      backHome: 'Back to Home',
      sections: [
        { title: '1. Acceptance of Terms', text: 'By signing up or using the Tarapeza platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.' },
        { title: '2. Subscription Plans & Billing', text: 'We offer 14-Day Free Trials for all new restaurant profiles. After the trial period, merchants must choose a subscription plan (Basic, Pro, or Premium) billed monthly. Subscriptions are handled securely via third-party checkout integrations.' },
        { title: '3. Acceptable Content', text: 'Restaurants are solely responsible for all images, menu item titles, prices, descriptions, and translations uploaded. Tarapeza reserves the right to moderate and remove inappropriate or illicit content from public menus.' },
        { title: '4. Service Availability', text: 'We strive to maintain 99.9% uptime for public restaurant menu routes. However, we are not liable for transient network disruptions, ISP DNS issues, or database outages beyond our control.' }
      ]
    },
    ar: {
      title: 'شروط الخدمة',
      subtitle: 'يرجى مراجعة شروط الخدمة الخاصة بنا قبل إنشاء قوائم طعامك الرقمية.',
      backHome: 'العودة للرئيسية',
      sections: [
        { title: '١. قبول الشروط', text: 'بتسجيلك أو استخدامك لمنصة طربيزة، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى التوقف عن استخدام البرنامج.' },
        { title: '٢. خطط الاشتراكات والفوترة', text: 'نقدم تجربة مجانية لمدة ١٤ يوماً لجميع ملفات تعريف المطاعم الجديدة. بعد انتهاء التجربة، يجب على أصحاب المطاعم اختيار خطة اشتراك (الأساسية، الاحترافية، أو الممتازة) تدفع شهرياً. تتم معالجة المدفوعات بشكل آمن.' },
        { title: '٣. المحتوى المقبول', text: 'يتحمل أصحاب المطاعم المسؤولية الكاملة عن الصور، وأسماء الأطباق، والأسعار، والأوصاف المرفوعة. وتحتفظ إدارة طربيزة بالحق الكامل في تعديل أو حذف أي محتوى غير لائق.' },
        { title: '٤. توافر الخدمة والضمان', text: 'نعمل جاهدين لضمان بقاء القوائم متاحة بنسبة ٩٩.٩٪. ومع ذلك، نحن لا نتحمل المسؤولية عن أي انقطاع مؤقت في شبكات الاتصال أو الأعطال الخارجة عن إرادتنا.' }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F1524]/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center active:scale-95 transition-transform">
            <Logo className="h-9 sm:h-10" variant="white" />
          </Link>
          <div className="flex items-center space-x-4 gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:border-orange-500 bg-slate-900 text-xs font-semibold text-slate-300 transition-all active:scale-95 cursor-pointer"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <Link
              to="/"
              className="flex items-center space-x-1 gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              <span>{t.backHome}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-12 relative z-10 w-full">
        
        {/* Title */}
        <div className="space-y-4 text-start">
          <span className="inline-flex items-center space-x-1.5 gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'البنود القانونية' : 'Legal Terms'}</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Terms list */}
        <div className="space-y-6 pt-6 text-start">
          {t.sections.map((sec, i) => (
            <div key={i} className="bg-[#0F1524]/40 border border-slate-905 p-6 rounded-2xl space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2 gap-2">
                <span>{sec.title}</span>
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{sec.text}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-600 bg-slate-950 mt-auto">
        <p>© {new Date().getFullYear()} Tarapeza. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
