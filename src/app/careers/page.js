'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Clock, Sparkles } from 'lucide-react';
import Logo from '@/components/logo';

export default function CareersPage() {
  const [lang, setLang] = useState('ar');
  const [appliedRole, setAppliedRole] = useState(null);

  const content = {
    en: {
      title: 'Careers at Tarapeza',
      subtitle: 'Join our team to shape the future of smart, bilingual restaurant operations.',
      backHome: 'Back to Home',
      openPositions: 'Open Positions',
      noOpenings: 'No positions matching your filters.',
      applyNow: 'Apply Now',
      appSuccess: 'Application sent successfully! Our HR team will contact you soon.',
      locRemote: 'Remote',
      locCairo: 'Cairo, EG',
      locRiyadh: 'Riyadh, SA',
      typeFullTime: 'Full-Time',
      noCareersMsg: 'There are no open positions at the moment. Please check back later!',
      roles: []
    },
    ar: {
      title: 'الوظائف في طربيزة',
      subtitle: 'انضم إلى فريقنا لتساهم في تشكيل مستقبل العمليات الذكية وثنائية اللغة للمطاعم.',
      backHome: 'العودة للرئيسية',
      openPositions: 'الوظائف الشاغرة',
      noOpenings: 'لا توجد شواغر مطابقة حالياً.',
      applyNow: 'تقدم للوظيفة',
      appSuccess: 'تم إرسال طلبك بنجاح! سيتواصل معك فريق التوظيف قريباً.',
      locRemote: 'عن بعد',
      locCairo: 'القاهرة، مصر',
      locRiyadh: 'الرياض، السعودية',
      typeFullTime: 'دوام كامل',
      noCareersMsg: 'لا توجد شواغر وظيفية في الوقت الحالي. يرجى التحقق لاحقاً!',
      roles: []
    }
  };

  const t = content[lang];

  const handleApply = (roleTitle) => {
    setAppliedRole(roleTitle);
    setTimeout(() => setAppliedRole(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Toast popup */}
      {appliedRole && (
        <div className="fixed bottom-5 right-5 z-55 flex items-center px-4 py-3 bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-xl shadow-xl animate-fade-in text-xs font-bold">
          {t.appSuccess}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center active:scale-95 transition-transform">
            <Logo className="h-9 sm:h-10" />
          </Link>
          <div className="flex items-center space-x-4 gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:border-orange-500 bg-slate-900 text-xs font-semibold text-slate-300 transition-all active:scale-95"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
            <Link
              href="/"
              className="flex items-center space-x-1 gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              <span>{t.backHome}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 sm:py-24 space-y-12 relative z-10 w-full">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
            <Briefcase className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'فرص العمل' : 'Join Us'}</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight animate-fade-in">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Roles List */}
        <div className="space-y-6 pt-8">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-900 pb-3 flex items-center space-x-2 gap-2">
            <span>{t.openPositions}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">{t.roles.length}</span>
          </h3>

          <div className="space-y-4">
            {t.roles.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-900 p-12 rounded-2xl text-center space-y-3 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </div>
                  <p className="text-slate-350 text-sm sm:text-base font-medium max-w-md">
                    {t.noCareersMsg}
                  </p>
                </div>
              </div>
            ) : (
              t.roles.map((role) => (
                <div 
                  key={role.id} 
                  className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:border-slate-800 transition-colors"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-lg font-bold text-white">{role.title}</h4>
                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {role.dept}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{role.desc}</p>
                    
                    <div className="flex items-center space-x-4 gap-4 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center space-x-1 gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-650" />
                        <span>{role.loc}</span>
                      </span>
                      <span className="flex items-center space-x-1 gap-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-650" />
                        <span>{role.type}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(role.title)}
                    className="px-5 py-2.5 shrink-0 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-orange-400 hover:text-orange-300 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                  >
                    {t.applyNow}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-600 bg-slate-950 mt-auto">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Tarapeza. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
