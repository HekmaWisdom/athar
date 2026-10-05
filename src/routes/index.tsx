import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Flame, Search as SearchIcon, Settings, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuoteCard } from "@/components/QuoteCard";
import { ExplainSheet } from "@/components/ExplainSheet";
import { ChallengeCard } from "@/components/ChallengeCard";
import { greetingKey, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import { checkAndNotifyBadges } from "@/lib/badges";
import {
  getDailyQuote,
  getFavorites,
  getProfile,
  getTodayMood,
  getUserStats,
  trackDailyVisit,
  upsertMood,
  type QuoteFull,
} from "@/lib/quotes";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// Module-level (not component-local) on purpose: TanStack Router remounts
// HomePage several times while auth/onboarding settle right after sign-in, and
// a React ref/state guard resets on each of those remounts — the mount that
// gets the true "isNewDay" signal from the server can be torn down before it
// ever gets to act on it, and every later remount correctly (but uselessly)
// re-derives isNewDay:false since the row now already exists. A module-level
// value survives remounts within the same page load and only resets on a real
// reload. Keyed by user id (not a plain boolean) so switching accounts within
// one tab session — sign out, sign in as someone else, no reload — still
// tracks the new user's visit instead of staying silently latched from the
// previous one.
let dailyVisitTrackedForUserId: string | null = null;

const MOODS = [
  { key: "mood_calm", emoji: "🌙" },
  { key: "mood_grateful", emoji: "🌱" },
  { key: "mood_balanced", emoji: "🌊" },
  { key: "mood_strong", emoji: "⛰️" },
  { key: "mood_hopeful", emoji: "✨" },
  { key: "mood_low", emoji: "🕯️" },
] as const;

function HomePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [explainOpen, setExplainOpen] = useState<QuoteFull | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user ? getProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && profile.data && !profile.data.onboarded) void nav({ to: "/onboarding" });
  }, [user, profile.data, nav]);

  const dailyQ = useQuery({ queryKey: ["daily-quote"], queryFn: getDailyQuote });
  const stats = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: () => (user ? getUserStats(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const mood = useQuery({
    queryKey: ["today-mood", user?.id],
    queryFn: () => (user ? getTodayMood(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const favs = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => (user ? getFavorites(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const isFavorite = (id: string) => !!favs.data?.some((f) => f.quote_id === id);

  useEffect(() => {
    if (!user || dailyVisitTrackedForUserId === user.id) return;
    dailyVisitTrackedForUserId = user.id;
    void (async () => {
      const { isNewDay } = await trackDailyVisit(user.id);
      qc.invalidateQueries({ queryKey: ["user-stats"] });
      if (!isNewDay) return;
      // Fetch (or reuse the already-cached) daily quote via the query client
      // directly, rather than reading this component's own dailyQ.data — that
      // render-tied state may not exist yet, or may belong to an instance
      // that's already been torn down by the time this resolves.
      const quote = await qc.fetchQuery({ queryKey: ["daily-quote"], queryFn: getDailyQuote });
      if (!quote) return;
      await trackEvent("quote_read", user.id, { quote_id: quote.id });
      checkAndNotifyBadges(user.id, locale);
      // ChallengeCard's progress query likely ran before this event landed.
      void qc.invalidateQueries({ queryKey: ["challenge-progress"] });
    })();
  }, [user, qc, locale]);

  const moodMut = useMutation({
    mutationFn: (m: string) => {
      if (!user) throw new Error("not authenticated");
      return upsertMood(user.id, m);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["today-mood"] }),
    onError: () => toast.error(t("something_wrong")),
  });

  const greetName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("greeting_guest");

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-10 pb-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="glass grid size-11 shrink-0 place-items-center rounded-full text-lg font-semibold text-primary">
            {(greetName as string).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-primary/60">{t(greetingKey())}</p>
            <p className="truncate text-sm font-medium">
              {locale === "ar" ? `أهلاً، ${greetName}` : `Hi, ${greetName}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {user && (
            <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
              <Flame className="size-3.5 text-gold" />
              <span className="mono text-xs text-primary">{stats.data?.current_streak ?? 0}</span>
            </div>
          )}
          <Link to="/discover" className="glass grid size-10 place-items-center rounded-full text-primary/80 hover:text-primary">
            <SearchIcon className="size-4" />
          </Link>
          <Link to="/profile" className="glass grid size-10 place-items-center rounded-full text-primary/80 hover:text-primary">
            <Settings className="size-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {dailyQ.isLoading && (
          <div className="glass h-[360px] animate-pulse rounded-[32px]" />
        )}
        {dailyQ.data && (
          <QuoteCard
            quote={dailyQ.data}
            favored={isFavorite(dailyQ.data.id)}
            onExplain={() => setExplainOpen(dailyQ.data!)}
          />
        )}

        {user && <ChallengeCard />}

        {/* Mood check-in */}
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-medium uppercase tracking-[0.2em] text-primary/50">{t("mood_prompt")}</h3>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {MOODS.map((m) => {
              const active = mood.data === m.key;
              return (
                <button
                  key={m.key}
                  disabled={moodMut.isPending}
                  onClick={() => user && moodMut.mutate(m.key)}
                  className={`glass flex min-w-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3 transition-all disabled:opacity-50 ${
                    active ? "border-primary/50 bg-primary/10 shadow-glow" : "hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] font-medium">{t(m.key as never)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Journal prompt card */}
        <Link
          to="/journal"
          className="glass group flex items-center justify-between gap-4 rounded-3xl p-6 border-l-4 border-l-primary/40 transition-all hover:bg-primary/5"
        >
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold">{t("journal_title")}</h4>
            <p className="text-xs leading-relaxed text-primary/60">{t("journal_prompt")}</p>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <ArrowLeft className="size-4 flip-x" />
          </div>
        </Link>

        {/* Premium teaser */}
        {!user && (
          <Link
            to="/auth"
            className="block rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">{t("premium")}</p>
            <h4 className="mt-2 text-lg font-semibold">{t("premium_cta")}</h4>
            <p className="mt-1 text-xs text-primary/70">{t("premium_desc")}</p>
            <span className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              {t("premium_go")} ←
            </span>
          </Link>
        )}
      </main>

      {explainOpen && <ExplainSheet quote={explainOpen} onClose={() => setExplainOpen(null)} />}
    </AppShell>
  );
}
