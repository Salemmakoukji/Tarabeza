import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Sparkles, Shield, Heart } from 'lucide-react';
import Logo from '../components/logo';

export default function AboutPage() {
  const [lang, setLang] = useState('ar');

  const content = {
    en: {
      title: 'About Tarapeza',
      subtitle: 'Modernizing the dining experience, one table at a time.',
      backHome: 'Back to Home',
      visionTitle: 'Our Vision',
      visionDesc: 'We believe that dining out should be seamless, visually stunning, and interactive. Our digital menu builder empowers restaurants to tell their story through beautiful designs, dynamic pricing, and rich translation subsets.',
      missionTitle: 'Our Mission',
      missionDesc: 'To eliminate paper menu print costs while helping cafes and restaurants elevate customer satisfaction, gather real-time feedback, and optimize table-side ordering efficiency.',
      valueTitle: 'Why Choose Tarapeza?',
      val1: 'High-speed local loading for customers',
      val2: 'Flexible design combinations',
      val3: 'Full bilingual RTL/LTR translations support',
      val4: 'Real-time analytics & views logging',
      historyTitle: 'Our Story',
      historyDesc: 'Tarapeza was built out of a desire to create a clean, elegant SaaS for modern dining. Over the past year, we have helped hundreds of venues across Cairo, Riyadh, and Amman launch their branded QR menu systems.'
    },
    ar: {
      title: 'عن طربيزة',
      subtitle: 'عصرنة تجربة تناول الطعام، طاولة تلو الأخرى.',
      backHome: 'العودة للرئيسية',
      visionTitle: 'رؤيتنا',
      visionDesc: 'نؤمن بأن زيارة المطاعم يجب أن تكون سلسة، جذابة بصرياً، وتفاعلية. يتيح منشئ قوائم الطعام الرقمي لدينا للمطاعم إبراز هويتها من خلال تصاميم مبهرة، وأسعار مرنة، ودعم كامل للغات المتعددة.',
      missionTitle: 'رسالتنا',
      missionDesc: 'القضاء على تكاليف طباعة القوائم الورقية الباهظة مع مساعدة المقاهي والمطاعم على رفع مستوى رضا الزبائن، وجمع التقييمات الفورية، وتحسين كفاءة طلب الأطعمة.',
      valueTitle: 'لماذا تختار طربيزة؟',
      val1: 'سرعة فائقة في تحميل الصور للزبائن',
      val2: 'خيارات لا حصر لها لتخصيص القوالب والألوان',
      val3: 'دعم كامل للقراءة باللغتين العربية والإنجليزية',
      val4: 'تحليلات مباشرة وإحصاءات دقيقة لمشاهدات الأطباق',
      historyTitle: 'قصتنا',
      historyDesc: 'تأسست منصة طربيزة بدافع تقديم حلول برمجية ذكية للمطاعم العصرية. على مدار العام الماضي، ساعدنا مئات المقاهي والمطاعم في القاهرة والرياض وعمّان على إطلاق وتصميم نظم القوائم الرقمية الخاصة بهم.'
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Dynamic ambient glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F97316]/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none"></div>
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
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 sm:py-24 space-y-16 relative z-10 w-full">
        
        {/* Hero Title */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'من نحن' : 'Who We Are'}</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Vision & Mission Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <div className="bg-[#0F1524]/60 border border-slate-850 p-8 rounded-2xl space-y-4 text-start">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <span>{t.visionTitle}</span>
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{t.visionDesc}</p>
          </div>

          <div className="bg-[#0F1524]/60 border border-slate-850 p-8 rounded-2xl space-y-4 text-start">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2 gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              <span>{t.missionTitle}</span>
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{t.missionDesc}</p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-[#0F1524]/40 border border-slate-850 p-8 rounded-2xl space-y-4 text-start">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2 gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <span>{t.historyTitle}</span>
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{t.historyDesc}</p>
        </div>

        {/* Core Values / Why Choose Us */}
        <div className="space-y-6 pt-4">
          <h3 className="text-2xl font-bold text-white text-center">{t.valueTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[t.val1, t.val2, t.val3, t.val4].map((v, i) => (
              <div key={i} className="flex items-center space-x-3 gap-3 bg-slate-900/30 border border-slate-900/85 p-4 rounded-xl text-start">
                <span className="h-6 w-6 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm text-slate-300 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-600 bg-slate-950 mt-auto">
        <p>© {new Date().getFullYear()} Tarapeza. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
