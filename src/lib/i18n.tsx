import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const dict: Dict = {
  appName: { ar: "أثر", en: "Athar" },
  tagline: { ar: "اترك أثرًا", en: "Athar — wisdom that stays" },

  greeting_morning: { ar: "صباح الخير", en: "Good morning" },
  greeting_afternoon: { ar: "طاب مساؤك", en: "Good afternoon" },
  greeting_evening: { ar: "أهلاً بك", en: "Welcome back" },
  greeting_guest: { ar: "زائرنا الكريم", en: "Dear guest" },

  nav_home: { ar: "الرئيسية", en: "Home" },
  nav_discover: { ar: "استكشاف", en: "Discover" },
  nav_journal: { ar: "يومياتي", en: "Journal" },
  nav_profile: { ar: "حسابي", en: "Profile" },

  today_wisdom: { ar: "حكمة اليوم", en: "Today's wisdom" },
  reflect_deeply: { ar: "تأمل بعمق", en: "Reflect deeply" },
  save: { ar: "حفظ", en: "Save" },
  saved: { ar: "محفوظة", en: "Saved" },
  share: { ar: "مشاركة", en: "Share" },
  copy: { ar: "نسخ", en: "Copy" },
  copied: { ar: "تم النسخ", en: "Copied" },
  download: { ar: "تنزيل", en: "Download" },
  share_card_title: { ar: "شارك بطاقة الحكمة", en: "Share this wisdom" },
  share_image: { ar: "مشاركة الصورة", en: "Share image" },
  share_template_midnight: { ar: "ليل", en: "Midnight" },
  share_template_parchment: { ar: "رقّ", en: "Parchment" },
  share_template_gold: { ar: "ذهب", en: "Gold" },
  share_format_story: { ar: "ستوري", en: "Story" },
  share_format_square: { ar: "مربع", en: "Square" },

  mood_prompt: { ar: "كيف تشعر الآن؟", en: "How are you feeling?" },
  mood_calm: { ar: "سكينة", en: "Calm" },
  mood_grateful: { ar: "امتنان", en: "Grateful" },
  mood_balanced: { ar: "توازن", en: "Balanced" },
  mood_strong: { ar: "قوة", en: "Strong" },
  mood_low: { ar: "منخفض", en: "Low" },
  mood_hopeful: { ar: "أمل", en: "Hopeful" },

  journal_title: { ar: "مساحة التدوين", en: "Journal space" },
  journal_prompt: { ar: "ما هو الموقف الذي شعرت فيه بالامتنان اليوم؟", en: "What made you feel grateful today?" },
  journal_placeholder: { ar: "اكتب أفكارك هنا...", en: "Write your thoughts…" },
  write_now: { ar: "اكتب الآن", en: "Write now" },
  no_entries: { ar: "لا توجد تدوينات بعد", en: "No entries yet" },
  first_entry: { ar: "ابدأ رحلتك بأول تدوينة", en: "Begin with your first entry" },

  journal_lock_title: { ar: "يومياتك مشفّرة", en: "Your journal is encrypted" },
  journal_lock_desc_new: {
    ar: "اختر كلمة مرور لتشفير تدويناتك. لن يتمكن أحد، ولا حتى نحن، من قراءتها. لا يمكن استعادة كلمة المرور إذا نسيتها.",
    en: "Choose a passphrase to encrypt your entries. No one — not even us — can read them. If you forget it, encrypted entries can't be recovered.",
  },
  journal_lock_desc_existing: {
    ar: "أدخل كلمة المرور لفتح يومياتك المشفّرة.",
    en: "Enter your passphrase to unlock your encrypted journal.",
  },
  journal_lock_placeholder: { ar: "كلمة المرور", en: "Passphrase" },
  journal_unlock: { ar: "فتح", en: "Unlock" },
  journal_unlock_wrong: { ar: "كلمة المرور غير صحيحة", en: "Incorrect passphrase" },

  favorites: { ar: "المفضلة", en: "Favorites" },
  no_favorites: { ar: "لم تحفظ أي حكمة بعد", en: "No saved wisdoms yet" },
  browse_categories: { ar: "استكشف المواضيع", en: "Explore themes" },
  view_all: { ar: "الكل", en: "All" },
  tab_categories: { ar: "المواضيع", en: "Topics" },
  tab_authors: { ar: "المؤلفون", en: "Authors" },
  quotes_count: { ar: "حكمة", en: "quotes" },

  streak: { ar: "يوم متواصل", en: "day streak" },
  xp: { ar: "نقطة", en: "XP" },
  level: { ar: "المستوى", en: "Level" },

  sign_in: { ar: "تسجيل الدخول", en: "Sign in" },
  sign_up: { ar: "إنشاء حساب", en: "Sign up" },
  sign_out: { ar: "تسجيل الخروج", en: "Sign out" },
  continue_guest: { ar: "المتابعة كضيف", en: "Continue as guest" },
  continue_google: { ar: "المتابعة عبر جوجل", en: "Continue with Google" },
  continue_apple: { ar: "المتابعة عبر آبل", en: "Continue with Apple" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة السر", en: "Password" },
  display_name: { ar: "الاسم", en: "Name" },

  premium: { ar: "النسخة المميزة", en: "Premium" },
  premium_cta: { ar: "ارتقِ بتجربتك", en: "Elevate your journey" },
  premium_desc: { ar: "تفسيرات لا محدودة، تدوين، ومقاييس متقدمة", en: "Unlimited AI, journaling, and advanced insights" },
  premium_go: { ar: "ابدأ التجربة", en: "Start trial" },

  search: { ar: "ابحث عن حكمة، مؤلف، أو موضوع", en: "Search wisdoms, authors, themes" },
  no_results: { ar: "لا توجد نتائج", en: "No results" },

  admin: { ar: "لوحة الإدارة", en: "Admin" },
  admin_quotes: { ar: "الحكم", en: "Quotes" },
  admin_add: { ar: "إضافة حكمة", en: "Add quote" },
  admin_authors: { ar: "المؤلفون", en: "Authors" },
  admin_categories: { ar: "المواضيع", en: "Categories" },

  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "English", en: "English" },

  reminders: { ar: "التذكيرات", en: "Reminders" },
  reminders_desc: { ar: "إشعار يومي في الوقت الذي تختاره", en: "A daily notification at your chosen time" },
  reminders_unsupported: { ar: "المتصفح لا يدعم الإشعارات", en: "Your browser doesn't support notifications" },
  reminders_denied: { ar: "الإشعارات محظورة من إعدادات المتصفح", en: "Notifications are blocked in browser settings" },
  reminder_time_label: { ar: "وقت التذكير", en: "Reminder time" },

  curated_insight: { ar: "تأمل مُنسّق", en: "Curated insight" },
  explain_coming_soon: { ar: "تأمّلنا في هذه الحكمة قيد الإعداد وسيصل قريبًا.", en: "Our reflection on this wisdom is being written and will arrive soon." },
  action_step: { ar: "خطوتك اليوم", en: "Your action step" },
  reflection_q: { ar: "سؤال للتأمل", en: "A question to reflect" },

  loading: { ar: "جاري التحميل...", en: "Loading…" },
  something_wrong: { ar: "حدث خطأ ما", en: "Something went wrong" },
  try_again: { ar: "أعد المحاولة", en: "Try again" },

  onboarding_interests_title: { ar: "اختر اهتماماتك", en: "Pick your interests" },
  onboarding_interests_sub: { ar: "اختر 3 مواضيع على الأقل لنخصص لك التجربة", en: "Choose at least 3 themes to personalize your experience" },
  onboarding_reminder_title: { ar: "متى تحب أن نذكّرك؟", en: "When should we remind you?" },
  onboarding_reminder_sub: { ar: "سنرسل لك إشعارًا يوميًا في هذا الوقت", en: "We'll send a daily nudge at this time" },
  onboarding_mood_title: { ar: "كيف تشعر عادةً؟", en: "How do you usually feel?" },
  onboarding_mood_sub: { ar: "سيساعدنا هذا على فهمك بشكل أفضل", en: "This helps us understand you better" },
  onboarding_continue: { ar: "التالي", en: "Continue" },
  onboarding_finish: { ar: "ابدأ رحلتك", en: "Start your journey" },
  onboarding_back: { ar: "رجوع", en: "Back" },
  onboarding_min_interests: { ar: "اختر 3 مواضيع على الأقل", en: "Pick at least 3 themes" },

  badges_title: { ar: "الأوسمة", en: "Badges" },
  badges_earned_count: { ar: "محقّقة", en: "earned" },
  challenge_title: { ar: "تحدي الأسبوع", en: "This Week's Challenge" },
};

type Ctx = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof dict) => string;
  setLocale: (l: Locale) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("athar_locale")) as Locale | null;
    if (saved === "ar" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("athar_locale", l);
  };

  const value = useMemo<Ctx>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: (key) => dict[key]?.[locale] ?? String(key),
      setLocale,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function greetingKey(): keyof typeof dict {
  const h = new Date().getHours();
  if (h < 12) return "greeting_morning";
  if (h < 18) return "greeting_afternoon";
  return "greeting_evening";
}
