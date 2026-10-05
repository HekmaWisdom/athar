import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { getActiveChallenge, getChallengeProgress } from "@/lib/challenges";

export function ChallengeCard() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const challenge = useQuery({ queryKey: ["active-challenge"], queryFn: getActiveChallenge });
  const progress = useQuery({
    queryKey: ["challenge-progress", user?.id, challenge.data?.id],
    queryFn: () => (user && challenge.data ? getChallengeProgress(user.id, challenge.data) : Promise.resolve(0)),
    enabled: !!user && !!challenge.data,
  });

  if (!user || !challenge.data) return null;
  const c = challenge.data;
  const title = locale === "ar" ? c.title_ar : c.title_en;
  const description = locale === "ar" ? c.description_ar : c.description_en;
  const done = progress.data ?? 0;
  const pct = Math.min(100, Math.round((done / c.goal_count) * 100));

  return (
    <section className="glass rounded-3xl p-5">
      <div className="mb-2 flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("challenge_title")}</h3>
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mono mt-1.5 text-[10px] text-primary/70">
        {done}/{c.goal_count}
      </p>
    </section>
  );
}
