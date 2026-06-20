import { useState } from 'react';
import { Link } from 'react-router';
import { 
  UtensilsCrossed, 
  QrCode, 
  Sparkles, 
  Globe, 
  BarChart3, 
  Palette, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Zap, 
  Shield, 
  Star,
  Menu,
  X
} from 'lucide-react';
import Logo from '../components/logo';

const content = {
  en: {
    dir: 'ltr',
    brand: 'Tarapeza',
    signIn: 'Sign In',
    getStarted: 'Get Started',
    exploreDirectory: 'Explore Directory',
    heroBadge: 'Interactive QR Menu SaaS',
    heroTitle: 'Beautiful Digital Menus For Modern Restaurants',
    heroSubtitle: 'Allow your customers to scan, view, and search your menu instantly from their phone. No app downloads required. Set up your brand style in minutes.',
    startTrial: 'Start Free Trial',
    merchantSignIn: 'Merchant Sign In',
    mockupBurgerName: 'Signature Smoked Burger',
    mockupBurgerDesc: 'Angus beef, caramelized onions, smoked cheese, special house sauce',
    mockupFriesName: 'Truffle Parmesan Fries',
    mockupFriesDesc: 'Golden potato fries, black truffle oil, freshly grated parmesan cheese',
    mockupSteakHouse: 'Steakhouse Prime',
    mockupActiveCategory: 'Mains',
    mockupCategory2: 'Sides',
    mockupCategory3: 'Drinks',
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Get your digital menu up and running in three simple steps',
    step1Title: '1. Create Menu',
    step1Desc: 'Add categories and items with high-res images, pricing, and allergen tags.',
    step2Title: '2. Get QR Code',
    step2Desc: 'Customize code colors, add your logo, and export print-ready table flyers.',
    step3Title: '3. Customers Scan',
    step3Desc: 'Patrons scan the QR to view your fast, mobile-friendly menu on their phone.',
    featuresTitle: 'Everything you need for table-side dining',
    featuresSubtitle: 'Ditch printing expensive physical menus. Manage operations digitally with a system built for speed and visual excellence.',
    feature1Title: 'Digital Menu Builder',
    feature1Desc: 'Easily add, edit, and organize menu items. Update descriptions and pricing in real time.',
    feature2Title: 'Custom QR Codes',
    feature2Desc: 'Download customized high-res PNG or PDF flyers matching your restaurant theme.',
    feature3Title: 'Fast Load Speeds',
    feature3Desc: 'Client-side image optimizer compresses photos automatically to load in milliseconds.',
    feature4Title: 'Bilingual Support',
    feature4Desc: 'Supports Arabic RTL and English LTR layouts automatically to delight all guests.',
    feature5Title: 'Live Analytics',
    feature5Desc: 'Track menu views and scan counts directly from your interactive merchant dashboard.',
    feature6Title: 'Brand Accent Styling',
    feature6Desc: 'Personalize accents and color schemes to match your physical restaurant design.',
    pricingTitle: 'Simple, transparent pricing',
    pricingSubtitle: 'Choose the perfect plan for your business. No hidden fees.',
    planBasic: 'Basic',
    planPro: 'Pro',
    planPremium: 'Premium',
    priceBasic: '$15',
    pricePro: '$29',
    pricePremium: '$49',
    perMonth: '/mo',
    popular: 'Popular',
    feature1: '1 Restaurant profile',
    feature2: 'Up to 50 menu items',
    feature3: 'Standard QR Code generator',
    feature4: '3 Restaurant profiles',
    feature5: 'Unlimited menu items',
    feature6: 'Custom QR color generator',
    feature7: 'Basic analytics dashboard',
    feature8: 'Unlimited restaurants & items',
    feature9: 'Premium styling customizer',
    feature10: 'Full analytics & views counter',
    feature11: '24/7 Priority support',
    choosePlan: 'Choose Plan',
    footerDesc: 'Modernize your restaurant dining experience with interactive digital QR menus.',
    product: 'Product',
    company: 'Company',
    legal: 'Legal',
    about: 'About Us',
    careers: 'Careers',
    contact: 'Contact',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    allRightsReserved: 'All rights reserved.'
  },
  ar: {
    dir: 'rtl',
    brand: 'طربيزة',
    signIn: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',
    exploreDirectory: 'استكشف المطاعم',
    heroBadge: 'نظام إدارة قوائم الطعام الرقمية QR',
    heroTitle: 'قوائم طعام رقمية أنيقة للمطاعم العصرية',
    heroSubtitle: 'اسمح لزبائنك بمسح الرمز واستعراض قائمة طعامك والبحث فيها فوراً من هواتفهم. لا حاجة لتحميل أي تطبيق. أنشئ هويتك الخاصة في دقائق معدودة.',
    startTrial: 'ابدأ التجربة المجانية',
    merchantSignIn: 'بوابة المطاعم',
    mockupBurgerName: 'برجر مدخن مميز',
    mockupBurgerDesc: 'لحم أنجوس، بصل مكرمل، جبن مدخن، صلصة الدار الخاصة',
    mockupFriesName: 'بطاطس مقرمشة بالترافل والبارميزان',
    mockupFriesDesc: 'بطاطس ذهبية مقلية، زيت ترافل أسود، جبن بارميزان مبشور طازج',
    mockupSteakHouse: 'ستيك هاوس برايم',
    mockupActiveCategory: 'الرئيسية',
    mockupCategory2: 'الجانبية',
    mockupCategory3: 'المشروبات',
    howItWorksTitle: 'كيف يعمل البرنامج',
    howItWorksSubtitle: 'ابدأ تشغيل قائمة طعامك الرقمية في ثلاث خطوات بسيطة',
    step1Title: '١. أنشئ قائمة طعامك',
    step1Desc: 'أضف الأقسام والأطباق مع صور عالية الدقة والأسعار ومسببات الحساسية.',
    step2Title: '٢. احصل على رمز QR',
    step2Desc: 'خصص ألوان الرمز، أضف شعارك، وقم بتحميل مطبوعات الطاولات الجاهزة.',
    step3Title: '٣. الزبائن يمسحون الرمز',
    step3Desc: 'يمسح الزبائن الرمز لمشاهدة قائمة طعامك السريعة والمتوافقة مع الهواتف.',
    featuresTitle: 'كل ما تحتاجه لتجربة طعام ممتازة',
    featuresSubtitle: 'تخلص من تكاليف طباعة القوائم الورقية الباهظة. أدر عملياتك رقمياً بنظام مصمم للسرعة والأناقة.',
    feature1Title: 'منشئ القائمة الرقمي',
    feature1Desc: 'أضف الأقسام والأطباق وعدلها بسهولة. حدّث الأسعار والوصف في الوقت الفعلي.',
    feature2Title: 'رموز QR مخصصة',
    feature2Desc: 'حمّل منشورات طاولة عالية الدقة بصيغة PNG أو PDF متوافقة مع هويتك.',
    feature3Title: 'تحميل فائق السرعة',
    feature3Desc: 'يقوم ضاغط الصور التلقائي بضغط صور الأطباق لضمان التحميل في أجزاء من الثانية.',
    feature4Title: 'دعم ثنائي اللغة',
    feature4Desc: 'يدعم القراءة باللغتين العربية والإنجليزية لتقديم أفضل تجربة لجميع الزبائن.',
    feature5Title: 'تحليلات مباشرة',
    feature5Desc: 'تتبع مشاهدات القائمة وعدد عمليات المسح مباشرة من لوحة التحكم التفاعلية.',
    feature6Title: 'ألوان الهوية المخصصة',
    feature6Desc: 'اضبط ألوان القائمة واللمسات الجمالية لتناسب الهوية البصرية لمطعمك.',
    pricingTitle: 'خطط أسعار بسيطة وشفافة',
    pricingSubtitle: 'اختر الخطة المثالية لعملك. بدون رسوم خفية.',
    planBasic: 'الأساسية',
    planPro: 'الاحترافية',
    planPremium: 'الممتازة',
    priceBasic: '$15',
    pricePro: '$29',
    pricePremium: '$49',
    perMonth: '/شهرياً',
    popular: 'الأكثر شعبية',
    feature1: 'ملف تعريف مطعم واحد',
    feature2: 'حتى 50 طبق وقسم',
    feature3: 'منشئ رموز QR قياسي',
    feature4: '3 ملفات تعريف مطاعم',
    feature5: 'أطباق وأقسام غير محدودة',
    feature6: 'منشئ رموز QR بألوان مخصصة',
    feature7: 'لوحة تحليلات وإحصاءات أساسية',
    feature8: 'مطاعم وأطباق غير محدودة',
    feature9: 'تخصيص كامل للألوان والتصميم',
    feature10: 'إحصائيات كاملة للمشاهدات والزيارات',
    feature11: 'دعم فني ذو أولوية على مدار الساعة',
    choosePlan: 'اختر الخطة',
    footerDesc: 'عصرن تجربة زوار مطعمك من خلال قوائم الطعام الرقمية التفاعلية برموز الاستجابة السريعة.',
    product: 'المنتج',
    company: 'الشركة',
    legal: 'قانوني',
    about: 'من نحن',
    careers: 'الوظائف',
    contact: 'اتصل بنا',
    terms: 'شروط الخدمة',
    privacy: 'سياسة الخصوصية',
    allRightsReserved: 'جميع الحقوق محفوظة.'
  }
};

export default function Home() {
  const [lang, setLang] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = content[lang];
  const isRtl = lang === 'ar';

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const planFeatures = {
    basic: [t.feature1, t.feature2, t.feature3],
    pro: [t.feature4, t.feature5, t.feature6, t.feature7],
    premium: [t.feature8, t.feature9, t.feature10, t.feature11]
  };

  const featureCards = [
    { title: t.feature1Title, desc: t.feature1Desc, icon: UtensilsCrossed, color: 'from-orange-500 to-amber-500' },
    { title: t.feature2Title, desc: t.feature2Desc, icon: QrCode, color: 'from-blue-500 to-indigo-500' },
    { title: t.feature3Title, desc: t.feature3Desc, icon: Sparkles, color: 'from-emerald-500 to-teal-500' },
    { title: t.feature4Title, desc: t.feature4Desc, icon: Globe, color: 'from-violet-500 to-purple-500' },
    { title: t.feature5Title, desc: t.feature5Desc, icon: BarChart3, color: 'from-pink-500 to-rose-500' },
    { title: t.feature6Title, desc: t.feature6Desc, icon: Palette, color: 'from-yellow-500 to-amber-500' },
  ];

  return (
    <div 
      className="min-h-screen bg-slate-950 text-white flex flex-col font-sans overflow-x-hidden selection:bg-orange-500 selection:text-white"
      dir={t.dir}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center active:scale-95 transition-transform">
              <Logo className="h-10 sm:h-11 md:h-12" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-orange-500 bg-slate-900 text-xs font-semibold text-slate-300 transition-all active:scale-95"
            >
              <Globe className="h-4 w-4" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <Link
              to="/restaurants"
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {t.exploreDirectory}
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {t.signIn}
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-2.5 px-5 text-xs font-bold shadow-md hover:shadow-orange-500/10 active:scale-[0.98] transition-all"
            >
              {t.getStarted}
            </Link>
          </div>

          {/* Mobile Actions Header */}
          <div className="flex md:hidden items-center gap-2">
            {/* Language Switcher Button (Compact for Mobile) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-300 transition-all active:scale-95"
              aria-label="Toggle Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 transition-all active:scale-95"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-900 bg-slate-950/95 backdrop-blur-lg absolute top-20 left-0 right-0 z-40 transition-all duration-300 ease-in-out">
            <div className="px-6 py-6 flex flex-col space-y-4">
              <Link
                to="/restaurants"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-300 hover:text-white py-2 border-b border-slate-900/50 transition-colors flex items-center justify-between"
              >
                <span>{t.exploreDirectory}</span>
                <ArrowRight className={`h-4 w-4 text-slate-500 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-slate-300 hover:text-white py-2 border-b border-slate-900/50 transition-colors flex items-center justify-between"
              >
                <span>{t.signIn}</span>
                <ArrowRight className={`h-4 w-4 text-slate-500 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:shadow-orange-500/20 active:scale-[0.98] transition-all block mt-2"
              >
                {t.getStarted}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Decorative blur spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

        {/* Text Area */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <span className="inline-flex items-center space-x-1.5 gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.heroBadge}</span>
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {t.heroTitle}
            </h1>
            <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center space-x-2 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl py-4 px-8 font-bold shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all text-sm group"
            >
              <span>{t.startTrial}</span>
              {isRtl ? (
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </Link>
            <Link
              to="/restaurants"
              className="inline-flex items-center justify-center space-x-2 gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl py-4 px-8 font-bold transition-all text-sm active:scale-[0.98]"
            >
              <span>{t.exploreDirectory}</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center space-x-2 gap-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-900 hover:border-slate-800 rounded-xl py-4 px-8 font-bold transition-all text-sm active:scale-[0.98]"
            >
              <span>{t.merchantSignIn}</span>
            </Link>
          </div>
        </div>

        {/* Mockup Interactive Frame Area */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="relative group">
            {/* Ambient glow behind device */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>

            {/* Device Wrapper Frame */}
            <div className="relative w-[300px] h-[580px] bg-slate-950 border-[10px] border-slate-900 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden select-none">
              
              {/* Device Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-950 rounded-full mb-1"></div>
              </div>

              {/* Mobile Viewport Screen */}
              <div className="flex-1 flex flex-col pt-6 bg-slate-950 text-slate-200 font-sans text-xs overflow-y-auto no-scrollbar pb-6">
                
                {/* Simulated Header */}
                <div className="px-4 py-3 border-b border-slate-900 flex items-center space-x-3 gap-2 mt-2">
                  <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shadow-inner">
                    SP
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 leading-tight">{t.mockupSteakHouse}</h4>
                    <p className="text-[9px] text-slate-500">5th Avenue, NYC</p>
                  </div>
                </div>

                {/* Categories Scrollbar */}
                <div className="px-4 py-2.5 flex items-center space-x-2 gap-2 overflow-x-auto no-scrollbar">
                  <span className="bg-orange-500 text-white rounded-full px-3 py-1 font-semibold text-[9px] whitespace-nowrap">
                    {t.mockupActiveCategory}
                  </span>
                  <span className="bg-slate-900 text-slate-400 border border-slate-800 rounded-full px-3 py-1 text-[9px] whitespace-nowrap">
                    {t.mockupCategory2}
                  </span>
                  <span className="bg-slate-900 text-slate-400 border border-slate-800 rounded-full px-3 py-1 text-[9px] whitespace-nowrap">
                    {t.mockupCategory3}
                  </span>
                </div>

                {/* Simulated Menu Items List */}
                <div className="px-4 py-2 space-y-3 flex-1">
                  {/* Dish Card 1 */}
                  <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-3 space-y-2">
                    {/* Simulated Dish Image Placeholder */}
                    <div className="h-24 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center text-slate-800 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
                      <div className="h-16 w-16 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center font-black text-orange-500 text-[18px]">
                        🍔
                      </div>
                      <span className="absolute top-2 right-2 z-20 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                        $14.99
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">{t.mockupBurgerName}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal line-clamp-2">
                        {t.mockupBurgerDesc}
                      </p>
                    </div>
                  </div>

                  {/* Dish Card 2 */}
                  <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-3 space-y-2">
                    <div className="h-24 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center text-slate-800 relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
                      <div className="h-16 w-16 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center font-black text-orange-500 text-[18px]">
                        🍟
                      </div>
                      <span className="absolute top-2 right-2 z-20 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                        $7.50
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-100">{t.mockupFriesName}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal line-clamp-2">
                        {t.mockupFriesDesc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Floating QR Scanning Overlay */}
                <div className="px-4 py-2 mt-auto border-t border-slate-900/50 bg-slate-950/90 backdrop-blur flex items-center justify-between">
                  <div className="flex items-center space-x-2 gap-2 text-[10px] text-slate-400">
                    <QrCode className="h-4 w-4 text-orange-500" />
                    <span>{lang === 'ar' ? 'مشغل بواسطة طربيزة' : 'Powered by Tarapeza'}</span>
                  </div>
                  <span className="bg-slate-900 border border-slate-800 text-[9px] px-2.5 py-1 rounded-md text-slate-300 font-medium">
                    EN / AR
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-950 border-t border-slate-900 py-20 lg:py-28 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              {t.howItWorksTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors text-center">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mx-auto shadow-inner text-[18px]">
                ✍️
              </div>
              <h3 className="text-lg font-bold text-white">{t.step1Title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{t.step1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors text-center">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto shadow-inner text-[18px]">
                🖨️
              </div>
              <h3 className="text-lg font-bold text-white">{t.step2Title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{t.step2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors text-center">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner text-[18px]">
                📱
              </div>
              <h3 className="text-lg font-bold text-white">{t.step3Title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-slate-950 border-t border-slate-900 py-20 lg:py-28 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              {t.featuresTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feat, i) => (
              <div 
                key={i} 
                className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${feat.color} bg-opacity-10 flex items-center justify-center shadow-inner`}>
                    <feat.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white">{feat.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-950 border-t border-slate-900 py-20 lg:py-28 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              {t.pricingTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.pricingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Basic Plan */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl flex flex-col justify-between space-y-8 hover:border-slate-800 transition-colors relative">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-100">{t.planBasic}</h3>
                <div className="flex items-baseline space-x-1 gap-1">
                  <span className="text-4xl font-black text-white">{t.priceBasic}</span>
                  <span className="text-slate-500 text-xs">{t.perMonth}</span>
                </div>
                <div className="h-px bg-slate-900 w-full"></div>
                <ul className="space-y-3">
                  {planFeatures.basic.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2 gap-2 text-xs text-slate-400">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold text-center py-3.5 px-4 rounded-xl transition-all active:scale-98"
              >
                {t.choosePlan}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 border-2 border-orange-500/50 p-8 rounded-2xl flex flex-col justify-between space-y-8 shadow-xl shadow-orange-500/5 hover:border-orange-500 transition-colors relative">
              {/* Popular stamp */}
              <span className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold uppercase tracking-wider text-[8px] px-3 py-1 rounded-full shadow-lg shadow-orange-500/10">
                {t.popular}
              </span>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2 gap-2">
                  <span>{t.planPro}</span>
                  <Star className="h-4 w-4 text-orange-500 fill-orange-500 shrink-0" />
                </h3>
                <div className="flex items-baseline space-x-1 gap-1">
                  <span className="text-4xl font-black text-white">{t.pricePro}</span>
                  <span className="text-slate-400 text-xs">{t.perMonth}</span>
                </div>
                <div className="h-px bg-slate-800 w-full"></div>
                <ul className="space-y-3">
                  {planFeatures.pro.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2 gap-2 text-xs text-slate-200">
                      <Check className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold text-center py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/10 active:scale-98"
              >
                {t.choosePlan}
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-slate-900/40 border border-slate-900 p-8 rounded-2xl flex flex-col justify-between space-y-8 hover:border-slate-800 transition-colors relative">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-100">{t.planPremium}</h3>
                <div className="flex items-baseline space-x-1 gap-1">
                  <span className="text-4xl font-black text-white">{t.pricePremium}</span>
                  <span className="text-slate-500 text-xs">{t.perMonth}</span>
                </div>
                <div className="h-px bg-slate-900 w-full"></div>
                <ul className="space-y-3">
                  {planFeatures.premium.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2 gap-2 text-xs text-slate-400">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold text-center py-3.5 px-4 rounded-xl transition-all active:scale-98"
              >
                {t.choosePlan}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-16 px-6 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 gap-2">
              <Logo variant="white" lang={lang} />
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              {t.footerDesc}
            </p>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">{t.product}</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link to="/restaurants" className="hover:text-orange-400 transition-colors">{t.exploreDirectory}</Link></li>
              <li><Link to="#features" className="hover:text-orange-400 transition-colors">{t.featuresTitle}</Link></li>
              <li><Link to="#pricing" className="hover:text-orange-400 transition-colors">{t.pricingTitle}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">{t.company}</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link to="/about" className="hover:text-orange-400 transition-colors">{t.about}</Link></li>
              <li><Link to="/careers" className="hover:text-orange-400 transition-colors">{t.careers}</Link></li>
              <li><Link to="/contact" className="hover:text-orange-400 transition-colors">{t.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">{t.legal}</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link to="/terms" className="hover:text-orange-400 transition-colors">{t.terms}</Link></li>
              <li><Link to="/privacy" className="hover:text-orange-400 transition-colors">{t.privacy}</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto h-px bg-slate-900 my-8"></div>

        <div className="max-w-7xl mx-auto text-center text-[10px] text-slate-600">
          <p suppressHydrationWarning>© {new Date().getFullYear()} {t.brand}. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
}
