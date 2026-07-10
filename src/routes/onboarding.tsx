import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { completeOnboarding, getProfile, listCategories } from "@/lib/quotes";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "ابدأ رحلتك · Get started — Athar" }],
  }),
  component: OnboardingPage,
});

const MOODS = [
  { key: "mood_calm", emoji: "🌙" },
  { key: "mood_grateful", emoji: "🌱" },
  { key: "mood_balanced", emoji: "🌊" },
  { key: "mood_strong", emoji: "⛰️" },
  { key: "mood_hopeful", emoji: "✨" },
  { key: "mood_low", emoji: "🕯️" },
] as const;

const MIN_INTERESTS = 3;

function OnboardingPage() {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState("07:00");
  const [mood, setMood] = useState<string | null>(null);

  const cats = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user ? getProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) void nav({ to: "/auth" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (profile.data?.onboarded) void nav({ to: "/" });
  }, [profile.data, nav]);

  const finishMut = useMutation({
    mutationFn: () => {
      if (!user || !mood) throw new Error("incomplete");
      return completeOnboarding(user.id, { interests, reminder_time: reminderTime, mood_baseline: mood });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile"] });
      void qc.invalidateQueries({ queryKey: ["today-mood"] });
      void nav({ to: "/" });
    },
    onError: () => toast.error(t("something_wrong")),
  });

  const toggleInterest = (slug: string) => {
    setInterests((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  };

  const steps = [
    {
      title: t("onboarding_interests_title"),
      sub: t("onboarding_interests_sub"),
      canContinue: interests.length >= MIN_INTERESTS,
      blockedHint: t("onboarding_min_interests"),
    },
    {
      title: t("onboarding_reminder_title"),
      sub: t("onboarding_reminder_sub"),
      canContinue: true,
      blockedHint: "",
    },
    {
      title: t("onboarding_mood_title"),
      sub: t("onboarding_mood_sub"),
      canContinue: !!mood,
      blockedHint: "",
    },
  ] as const;
  const current = steps[step];

  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col px-5 pt-14 pb-10">
      <div className="mb-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-white/10"}`}
          />
        ))}
      </div>

      <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" key={step}>
        <div>
          <h1 className="text-2xl font-bold">{current.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{current.sub}</p>
        </div>

        {step === 0 && (
          <div className="flex flex-wrap gap-2.5">
            {cats.data?.map((c) => {
              const active = interests.includes(c.slug);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleInterest(c.slug)}
                  className={`glass flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                    active ? "border-primary/50 bg-primary/10 text-primary shadow-glow" : "hover:border-primary/30"
                  }`}
                >
                  {c.icon && <span>{c.icon}</span>}
                  {locale === "ar" ? c.name_ar : c.name_en}
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="glass-strong rounded-3xl p-6">
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full rounded-2xl bg-input px-4 py-3 text-center text-2xl font-semibold outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-3 gap-2.5">
            {MOODS.map((m) => {
              const active = mood === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  className={`glass flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-4 transition-all ${
                    active ? "border-primary/50 bg-primary/10 shadow-glow" : "hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[11px] font-medium">{t(m.key as never)}</span>
                </button>
              );
            })}
          </div>
        )}

        {!current.canContinue && current.blockedHint && (
          <p className="text-xs text-muted-foreground">{current.blockedHint}</p>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => (s - 1) as typeof step)}
            className="flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 flip-x" />
            {t("onboarding_back")}
          </button>
        )}
        <button
          disabled={!current.canContinue || finishMut.isPending}
          onClick={() => {
            if (step < 2) setStep((s) => (s + 1) as typeof step);
            else finishMut.mutate();
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {step < 2 ? t("onboarding_continue") : t("onboarding_finish")}
          <ArrowRight className="size-4 flip-x" />
        </button>
      </div>
    </div>
  );
}
