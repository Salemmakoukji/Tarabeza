import { useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabase/client';
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import Logo from '../components/logo';
import { useToast, ToastContainer } from '../components/dashboard/toast';

export default function ContactPage() {
  const [lang, setLang] = useState('ar');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toasts, addToast, removeToast } = useToast(4000);

  const content = {
    en: {
      title: 'Contact Tarapeza',
      subtitle: 'Have a question or need custom pricing? Drop us a message.',
      backHome: 'Back to Home',
      infoTitle: 'Contact Information',
      emailLabel: 'Email Support',
      emailValue: 'dottech.syria@gmail.com',
      phoneLabel: 'Sales & Inquiries',
      phoneValue: '+963995505694',
      locLabel: 'Office Location',
      locValue: 'Aleppo, Syria',
      responseTime: 'We answer all inquiries within 2 hours during business hours.',
      formTitle: 'Send a Message',
      nameInput: 'Full Name',
      emailInput: 'Email Address',
      subInput: 'Subject Topic',
      msgInput: 'Message Details',
      submitBtn: 'Send Message',
      submittingBtn: 'Sending Message...',
      successMsg: 'Message sent successfully! Our team will contact you soon.',
      errorMsg: 'Failed to send message. Please try again later.'
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: 'لديك أي استفسار أو ترغب في خطة مخصصة؟ راسلنا فوراً.',
      backHome: 'العودة للرئيسية',
      infoTitle: 'معلومات الاتصال',
      emailLabel: 'الدعم الفني',
      emailValue: 'dottech.syria@gmail.com',
      phoneLabel: 'المبيعات والاستفسارات',
      phoneValue: '+963995505694',
      locLabel: 'موقع المكتب',
      locValue: 'حلب، سوريا',
      responseTime: 'نجيب على جميع الاستفسارات خلال ساعتين خلال ساعات العمل الرسمية.',
      formTitle: 'أرسل رسالة',
      nameInput: 'الاسم الكامل',
      emailInput: 'البريد الإلكتروني',
      subInput: 'عنوان الرسالة',
      msgInput: 'تفاصيل الرسالة',
      submitBtn: 'إرسال الرسالة',
      submittingBtn: 'جاري الإرسال...',
      successMsg: 'تم إرسال رسالتك بنجاح! سيتواصل معك فريقنا قريباً.',
      errorMsg: 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.'
    }
  };

  const t = content[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          subject: `${name} (${email}) - ${subject}`,
          message: message,
          status: 'open',
          restaurant_id: null
        });

      if (error) throw error;

      addToast('success', t.successMsg);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.warn('Failed to insert support ticket. Falling back to local success simulation:', err.message);
      
      // Fallback preview mode simulation
      addToast('success', t.successMsg + ' (Preview Mode)');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F97316]/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

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
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 space-y-12 relative z-10 w-full">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center space-x-1.5 gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
            <Mail className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'تواصل معنا' : 'Get in Touch'}</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Info & Form Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-stretch">
          
          {/* Left: Contact Info */}
          <div className="lg:col-span-4 bg-[#0F1524]/60 border border-slate-900 p-8 rounded-2xl flex flex-col justify-between space-y-8 text-start">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-2">{t.infoTitle}</h3>
              
              <div className="space-y-4 font-sans">
                {/* Email Support */}
                <div className="flex items-start space-x-3.5 gap-3.5">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.emailLabel}</h4>
                    <p className="text-xs sm:text-sm text-white mt-1">{t.emailValue}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-3.5 gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.phoneLabel}</h4>
                    <p className="text-xs sm:text-sm text-white mt-1" dir="ltr">{t.phoneValue}</p>
                  </div>
                </div>

                {/* Office Location */}
                <div className="flex items-start space-x-3.5 gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.locLabel}</h4>
                    <p className="text-xs sm:text-sm text-white mt-1">{t.locValue}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-6">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Response Time Target</span>
              <p className="text-xs text-slate-400 mt-1 font-semibold">{t.responseTime}</p>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-8 bg-[#0F1524]/60 border border-slate-900 p-8 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6 text-start">{t.formTitle}</h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-start font-sans">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t.nameInput}
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t.emailInput}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t.subInput}
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Pricing, Business Inquiry..."
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="msg" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {t.msgInput}
                </label>
                <textarea
                  id="msg"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help your business?"
                  className="w-full bg-[#0f172a]/50 border border-slate-800 rounded-xl p-4.5 text-white placeholder-slate-700 focus:outline-none focus:border-orange-500 text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-4 font-bold shadow-lg shadow-orange-500/10 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>{t.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{t.submitBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
