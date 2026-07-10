import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/lib/quotes";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · Sign in — Athar" },
      { name: "description", content: "أنشئ حسابك أو سجل الدخول." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, locale, setLocale } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user ? getProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    if (profile.isLoading) return;
    void nav({ to: profile.data?.onboarded ? "/" : "/onboarding" });
  }, [user, profile.data, profile.isLoading, nav]);

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message || t("something_wrong"));
      setBusy(false);
    }
    // On success Supabase redirects the browser to Google immediately; no local nav needed.
  };

  const apple = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message || t("something_wrong"));
      setBusy(false);
    }
  };

  const guest = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    void nav({ to: "/" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success(locale === "ar" ? "تم إنشاء الحساب" : "Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      void nav({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("something_wrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col px-5 pt-16 pb-10">
      <div className="mb-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
          <Sparkles className="size-6" />
        </div>
        <h1 className="mt-4 naskh text-3xl font-bold">أثر</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
      </div>

      <div className="glass-strong flex-1 space-y-4 rounded-3xl p-6">
        <div className="glass grid grid-cols-2 gap-1 rounded-2xl p-1">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-xl py-2 text-xs font-semibold transition-all ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {t("sign_in")}
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-xl py-2 text-xs font-semibold transition-all ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {t("sign_up")}
          </button>
        </div>

        <button
          onClick={google}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-foreground py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          <GoogleIcon /> {t("continue_google")}
        </button>
        <button
          onClick={apple}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-black py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <span className="text-lg"></span> {t("continue_apple")}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] text-muted-foreground">{locale === "ar" ? "أو" : "or"}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("display_name")}
              className="w-full rounded-2xl bg-input px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              dir="auto"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            className="w-full rounded-2xl bg-input px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            dir="ltr"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            className="w-full rounded-2xl bg-input px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {mode === "signin" ? t("sign_in") : t("sign_up")}
            <ArrowRight className="size-4 flip-x" />
          </button>
        </form>

        <button
          onClick={guest}
          disabled={busy}
          className="w-full rounded-2xl border border-dashed border-border py-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("continue_guest")}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between px-2">
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {locale === "ar" ? "English" : "العربية"}
        </button>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          {locale === "ar" ? "تصفح كضيف" : "Browse as guest"}
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
