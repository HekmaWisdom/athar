import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, BookOpen, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const loc = useLocation();
  const path = loc.pathname;

  const tabs = [
    { to: "/", label: t("nav_home"), Icon: Home, match: (p: string) => p === "/" },
    { to: "/discover", label: t("nav_discover"), Icon: Compass, match: (p: string) => p.startsWith("/discover") },
    { to: "/journal", label: t("nav_journal"), Icon: BookOpen, match: (p: string) => p.startsWith("/journal") },
    { to: "/profile", label: t("nav_profile"), Icon: User, match: (p: string) => p.startsWith("/profile") },
  ] as const;

  return (
    <div className="mx-auto flex min-h-screen max-w-[440px] flex-col pb-28">
      {children}

      {/* Decorative ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-15%] end-[-25%] -z-10 h-[380px] w-[380px] rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-[-10%] start-[-25%] -z-10 h-[320px] w-[320px] rounded-full bg-primary/5 blur-[100px]"
      />

      <nav
        className="glass-strong fixed inset-x-4 bottom-4 z-40 mx-auto flex h-[68px] max-w-[408px] items-center justify-around rounded-3xl px-3 shadow-card"
      >
        {tabs.map(({ to, label, Icon, match }) => {
          const active = match(path);
          return (
            <Link
              key={to}
              to={to}
              className={`group flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid size-9 place-items-center rounded-xl transition-all ${
                  active ? "bg-primary/15 shadow-glow" : "group-hover:bg-white/5"
                }`}
              >
                <Icon className="size-4" strokeWidth={active ? 2.4 : 1.8} />
              </span>
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
