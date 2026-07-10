import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Sparkles, LogOut, Languages, Crown, Heart, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuoteCard } from "@/components/QuoteCard";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { getFavorites, getUserStats } from "@/lib/quotes";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "حسابي · Profile — Athar" },
      { name: "description", content: "إعدادات الحساب، المفضلة، والاشتراك." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, locale, setLocale } = useI18n();
  const { user, isAdmin, signOut } = useAuth();

  const stats = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: () => (user ? getUserStats(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const favs = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => (user ? getFavorites(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center px-5 pt-20">
          <div className="glass w-full rounded-3xl p-8 text-center">
            <Sparkles className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">
              {locale === "ar" ? "أهلاً بك في أثر" : "Welcome to Athar"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "ar" ? "سجّل دخولك لتحفظ رحلتك" : "Sign in to save your journey"}
            </p>
            <Link
              to="/auth"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("sign_in")}
            </Link>
            <button
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="mx-auto mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Languages className="size-3.5" />
              {locale === "ar" ? "English" : "العربية"}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-6">
        <div className="glass-strong flex items-center gap-4 rounded-3xl p-5">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/15 text-2xl font-semibold text-primary">
            {(name as string).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            {isAdmin && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                <ShieldCheck className="size-3" /> {t("admin")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard icon={<Flame className="size-4 text-gold" />} label={t("streak")} value={stats.data?.current_streak ?? 0} />
          <StatCard icon={<Sparkles className="size-4 text-primary" />} label={t("xp")} value={stats.data?.xp ?? 0} />
          <StatCard icon={<Crown className="size-4 text-gold" />} label={t("level")} value={stats.data?.level ?? 1} />
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5">
        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="glass flex w-full items-center justify-between rounded-2xl p-4"
        >
          <span className="flex items-center gap-3 text-sm">
            <Languages className="size-4 text-primary" />
            {t("language")}
          </span>
          <span className="text-xs text-muted-foreground">{locale === "ar" ? "العربية · AR" : "English · EN"}</span>
        </button>

        {isAdmin && (
          <Link to="/admin" className="glass flex w-full items-center justify-between rounded-2xl p-4">
            <span className="flex items-center gap-3 text-sm font-medium">
              <ShieldCheck className="size-4 text-gold" />
              {t("admin")}
            </span>
            <span className="text-xs text-muted-foreground">←</span>
          </Link>
        )}

        {/* Favorites */}
        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Heart className="size-4 text-primary" />
              {t("favorites")} · {favs.data?.length ?? 0}
            </h3>
          </div>
          {favs.data?.length === 0 ? (
            <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">{t("no_favorites")}</div>
          ) : (
            <div className="space-y-4">
              {favs.data?.slice(0, 6).map((f) => (
                <QuoteCard key={f.quote_id} quote={f.quote} favored showDate={false} />
              ))}
            </div>
          )}
        </section>

        <button
          onClick={signOut}
          className="glass mt-2 flex w-full items-center justify-center gap-2 rounded-2xl p-4 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          {t("sign_out")}
        </button>
      </main>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="glass flex flex-col items-center gap-1 rounded-2xl p-3">
      {icon}
      <p className="mono text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
