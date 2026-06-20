'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import Logo from '@/components/logo';

export default function PrivacyPage() {
  const [lang, setLang] = useState('ar');

  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'We value your privacy and protect your restaurant profile information.',
      backHome: 'Back to Home',
      sections: [
        { title: '1. Information We Collect', text: 'When you register as a merchant, we collect your name, email, phone, restaurant name, address, and billing tokens. For customers viewing menus, we log menu item scans anonymously for analytics (e.g. view count statistics).' },
        { title: '2. Cookie Policy', text: 'We use cookies strictly to authenticate dashboard session states, maintain user logins, and persist language preferences (RTL/LTR switches).' },
        { title: '3. Data Sharing & Security', text: 'We do not sell, rent, or trade merchant profile details or customer analytics logs to third parties. All database transfers are secured using SSL encryption and Supabase Row Level Security (RLS) policies.' },
        { title: '4. Your Data Rights', text: 'Restaurant owners can update business names, upload new logos, or permanently delete restaurant profiles and menu item structures directly from the settings panel at any time.' }
      ]
    },
    ar: {
      title: 'سياسة الخصوصية',
      subtitle: 'نحن نقدر خصوصيتك ونعمل على حماية معلوماتك وحساباتك بكل دقة.',
      backHome: 'العودة للرئيسية',
      sections: [
        { title: '١. البيانات التي نجمعها', text: 'عند قيامك بإنشاء حساب، نجمع اسمك، والبريد الإلكتروني، والهاتف، واسم المطعم وعنوانه. وبالنسبة لزبائنك، نجمع إحصاءات زيارات الأطباق بشكل مجهول الهوية لدعم تحليلات لوحة التحكم.' },
        { title: '٢. ملفات تعريف الارتباط (Cookies)', text: 'نستخدم ملفات الارتباط بشكل أساسي لتأمين جلسات الدخول للوحة التحكم، وإبقاء خيار اللغات مفصلاً (عربي / إنجليزي) بشكل ثابت.' },
        { title: '٣. مشاركة البيانات وتأمينها', text: 'لا نقوم ببيع أو تأجير بيانات مطعمك أو تحليلات زوارك لأي طرف ثالث. وتتم كامل الاتصالات بقاعدة البيانات باستخدام تشفير آمن ونظام سياسات الأمان على مستوى الصف (RLS).' },
        { title: '٤. التحكم في بياناتك', text: 'يملك أصحاب المطاعم الصلاحية الكاملة لتحديث معلوماتهم، تغيير شعاراتهم، أو مسح ملفات مطاعمهم وأطباقهم بالكامل من لوحة التحكم في أي وقت.' }
      ]
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

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
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 sm:py-24 space-y-12 relative z-10 w-full">
        
        {/* Title */}
        <div className="space-y-4">
          <span className="inline-flex items-center space-x-1.5 gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'أمان البيانات' : 'Privacy Protection'}</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Sections list */}
        <div className="space-y-6 pt-6">
          {t.sections.map((sec, i) => (
            <div key={i} className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-3">
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
        <p suppressHydrationWarning>© {new Date().getFullYear()} Tarapeza. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
      </footer>
    </div>
  );
}
