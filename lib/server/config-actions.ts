"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherAction } from "@/lib/auth";

export type LandingContent = {
  brand: { name: string; tagline: string };
  hero: { badge: string; title1: string; title2: string; subtitle: string; trustText: string };
  stats: {
    teachers: { value: string; label: string };
    sessions: { value: string; label: string };
    notes: { value: string; label: string };
    uptime: { value: string; label: string };
  };
  features: { title: string; subtitle: string; items: { icon: string; title: string; desc: string }[] };
  showcase: { title: string; subtitle: string };
  pricing: {
    title: string;
    subtitle: string;
    plans: { name: string; price: string; desc: string; features: string[]; hot: boolean }[];
  };
  testimonials: { title: string; items: { name: string; role: string; text: string }[] };
  faq: { title: string; items: { q: string; a: string }[] };
  cta: { title: string; subtitle: string };
  footer: { rights: string; made: string };
};

export type SiteConfigData = { fa: LandingContent; en: LandingContent };

const DEFAULT_FA: LandingContent = {
  brand: { name: "دستیار کلاس", tagline: "مدیریت کلاس زبان" },
  hero: {
    badge: "طراحی‌شده برای معلم‌های خصوصی زبان",
    title1: "مدیریت کلاس‌های زبان،",
    title2: "به زیباییِ کاغذ و شیشه",
    subtitle: "شاگردها، جلسات، شهریه و دفترچه‌ی مشق دیجیتال — همه در یک اپلیکیشن شیشه‌ای، دوزبانه و سریع.",
    trustText: "مورد اعتماد معلم‌های خصوصی در ۱۲ کشور",
  },
  stats: {
    teachers: { value: "۱,۲۰۰+", label: "معلم فعال" },
    sessions: { value: "۴۸,۰۰۰+", label: "جلسه‌ی مدیریت‌شده" },
    notes: { value: "۱۲۰,۰۰۰+", label: "صفحه‌ی دفترچه" },
    uptime: { value: "۹.۹٪", label: "پایداری سرویس" },
  },
  features: {
    title: "هر آنچه یک معلم خصوصی نیاز دارد",
    subtitle: "ابزارهایی که با وسواس طراحی شده‌اند",
    items: [
      { icon: "NotebookPen", title: "دفترچه‌ی مشق دیجیتال", desc: "صفحه‌هایی که واقعاً ورق می‌خورند؛ با خط‌کشی کاغذ، حاشیه‌ی قرمز و پیوست تصویر و فایل." },
      { icon: "FileDown", title: "کارنامه‌ی PDF", desc: "با یک کلیک، گزارش رسمی فارسی یا انگلیسی با جدول جلسات و پرداخت‌ها." },
      { icon: "BarChart3", title: "تحلیل‌های زنده", desc: "روند درآمد، وضعیت جلسات و توزیع سطح شاگردها با نمودارهای انیمیشنی." },
      { icon: "Languages", title: "دوزبانه و راست‌چین", desc: "فارسی و انگلیسی با تقویم شمسی و اعداد بومی؛ بدون هیچ سازشِ طراحی." },
      { icon: "Moon", title: "حالت تاریک لوکس", desc: "شیشه‌ی دودی و کاغذِ شب؛ مطابق تنظیم سیستمِ کاربر." },
      { icon: "ShieldCheck", title: "امنیت چندلایه", desc: "رمز bcrypt، کوکی httpOnly، گارد نقش در هر لایه و هدرهای امنیتی." },
    ],
  },
  showcase: { title: "امضای محصول: دفترچه‌ی مشق", subtitle: "همین‌جا امتحانش کن — ورق بزن!" },
  pricing: {
    title: "تعرفه‌های شفاف",
    subtitle: "رایگان شروع کن، هر وقت خواستی ارتقا بده",
    plans: [
      { name: "رایگان", price: "۰ تومان", desc: "برای شروع", features: ["تا ۵ شاگرد", "دفترچه‌ی مشق", "پشتیبانی ایمیلی"], hot: false },
      { name: "حرفه‌ای", price: "۱۴,۰۰۰ تومان / ماه", desc: "برای معلم تمام‌وقت", features: ["شاگرد نامحدود", "کارنامه‌ی PDF", "تحلیل‌های زنده", "اعلان‌های هوشمند"], hot: true },
      { name: "استودیو", price: "۴۴۹,۰۰۰ تومان / ماه", desc: "برای آموزشگاه‌ها", features: ["همه‌ی امکانات حرفه‌ای", "چند معلم هم‌زمان", "برند اختصاصی", "پشتیبانی اولویت‌دار"], hot: false },
    ],
  },
  testimonials: {
    title: "معلم‌ها چه می‌گویند",
    items: [
      { name: "لیلا احمدی", role: "معلم آیلتس، تهران", text: "دفترچه‌ی مشق یعنی همون چیزی که سال‌ها دنبالش بودم؛ شاگردها عاشقشن." },
      { name: "Daniel Roth", role: "IELTS Coach, Berlin", text: "The PDF reports alone saved me hours every month. Gorgeous and fast." },
      { name: "سارا موسوی", role: "معلم مکالمه، استانبول", text: "بالاخره اپی که هم فارسیِ درست داره هم انگلیسی؛ بدون هیچ باگِ RTL." },
    ],
  },
  faq: {
    title: "پرسش‌های پرتکرار",
    items: [
      { q: "آیا داده‌های من امن است؟", a: "بله؛ رمزها با bcrypt هش می‌شوند، جلسه‌ها با کوکی httpOnly مدیریت می‌شوند و هر Server Action نقش شما را دوباره بررسی می‌کند." },
      { q: "آیا نسخه‌ی رایگان محدودیت زمانی دارد؟", a: "خیر؛ برای همیشه رایگان است با حداکثر ۵ شاگرد." },
      { q: "اپ روی موبایل هم نصب می‌شود؟", a: "بله؛ به‌صورت PWA روی اندروید، iOS و دسکتاپ نصب می‌شود و آفلاین هم کار می‌کند." },
      { q: "می‌توانم زبان اپ را عوض کنم؟", a: "بله؛ فارسی و انگلیسی با یک کلیک، همراه تقویم و اعداد بومی هر زبان." },
    ],
  },
  cta: { title: "آماده‌ای کلاس‌هایت را لوکس مدیریت کنی؟", subtitle: "همین امروز رایگان شروع کن — بدون کارت اعتباری." },
  footer: { rights: "تمام حقوق محفوظ است.", made: "ساخته‌شده با وسواس، برای معلم‌های سراسر جهان" },
};

const DEFAULT_EN: LandingContent = {
  brand: { name: "Class Assistant", tagline: "Language class management" },
  hero: {
    badge: "Built for private language teachers",
    title1: "Language class management,",
    title2: "as beautiful as paper & glass",
    subtitle: "Students, sessions, tuition and a digital exercise notebook — all in one glassy, bilingual, blazing-fast app.",
    trustText: "Trusted by private teachers in 12 countries",
  },
  stats: {
    teachers: { value: "1,200+", label: "Active teachers" },
    sessions: { value: "48,000+", label: "Sessions managed" },
    notes: { value: "120,000+", label: "Notebook pages" },
    uptime: { value: "99.9%", label: "Service uptime" },
  },
  features: {
    title: "Everything a private teacher needs",
    subtitle: "Tools crafted with obsession",
    items: [
      { icon: "NotebookPen", title: "Digital exercise notebook", desc: "Pages that truly flip; ruled paper, red margin, image & file attachments." },
      { icon: "FileDown", title: "PDF reports", desc: "One click to an official Persian or English report with session & payment tables." },
      { icon: "BarChart3", title: "Live analytics", desc: "Income trend, session status and student level distribution with animated charts." },
      { icon: "Languages", title: "Bilingual & RTL-native", desc: "Persian and English with native calendars and numerals; zero design compromise." },
      { icon: "Moon", title: "Luxurious dark mode", desc: "Smoked glass and night paper; follows the user's system preference." },
      { icon: "ShieldCheck", title: "Multi-layer security", desc: "bcrypt hashing, httpOnly cookies, role guards on every layer and security headers." },
    ],
  },
  showcase: { title: "The signature: exercise notebook", subtitle: "Try it right here — flip the pages!" },
  pricing: {
    title: "Transparent pricing",
    subtitle: "Start free, upgrade whenever you like",
    plans: [
      { name: "Free", price: "$0", desc: "To get started", features: ["Up to 5 students", "Exercise notebook", "Email support"], hot: false },
      { name: "Pro", price: "$9 / mo", desc: "For full-time teachers", features: ["Unlimited students", "PDF reports", "Live analytics", "Smart notifications"], hot: true },
      { name: "Studio", price: "$29 / mo", desc: "For language schools", features: ["Everything in Pro", "Multiple teachers", "Custom branding", "Priority support"], hot: false },
    ],
  },
  testimonials: {
    title: "What teachers say",
    items: [
      { name: "Leila Ahmadi", role: "IELTS Teacher, Tehran", text: "The exercise notebook is exactly what I searched for for years; my students love it." },
      { name: "Daniel Roth", role: "IELTS Coach, Berlin", text: "The PDF reports alone saved me hours every month. Gorgeous and fast." },
      { name: "Sara Mousavi", role: "Conversation Coach, Istanbul", text: "Finally an app with perfect Persian AND English; zero RTL bugs." },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      { q: "Is my data safe?", a: "Yes; passwords are bcrypt-hashed, sessions use httpOnly cookies and every Server Action re-checks your role." },
      { q: "Does the free plan expire?", a: "No; free forever with up to 5 students." },
      { q: "Can I install it on my phone?", a: "Yes; as a PWA on Android, iOS and desktop — it even works offline." },
      { q: "Can I switch the app language?", a: "Yes; Persian and English with one click, with native calendars and numerals." },
    ],
  },
  cta: { title: "Ready to run your classes in style?", subtitle: "Start free today — no credit card required." },
  footer: { rights: "All rights reserved.", made: "Crafted with obsession, for teachers worldwide" },
};

export async function getSiteConfig(): Promise<SiteConfigData> {
  const row = await prisma.siteConfig.findFirst();
  const stored = (row?.config ?? {}) as Partial<SiteConfigData>;
  return {
    fa: { ...DEFAULT_FA, ...(stored.fa ?? {}) },
    en: { ...DEFAULT_EN, ...(stored.en ?? {}) },
  };
}

export async function updateSiteConfig(input: SiteConfigData): Promise<{ ok: boolean }> {
  await requireTeacherAction();
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    create: { id: 1, config: input },
    update: { config: input },
  });
  return { ok: true };
}