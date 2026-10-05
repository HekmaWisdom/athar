import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { listBadges, listEarnedBadgeIds } from "@/lib/badges";

export function BadgesGrid() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const badges = useQuery({ queryKey: ["badges"], queryFn: listBadges });
  const earned = useQuery({
    queryKey: ["earned-badges", user?.id],
    queryFn: () => (user ? listEarnedBadgeIds(user.id) : Promise.resolve(new Set<string>())),
    enabled: !!user,
  });

  if (!badges.data?.length) return null;
  const earnedIds = earned.data ?? new Set<string>();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{t("badges_title")}</h3>
        <span className="mono text-xs text-muted-foreground">
          {earnedIds.size}/{badges.data.length} {t("badges_earned_count")}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {badges.data.map((b) => {
          const has = earnedIds.has(b.id);
          const name = locale === "ar" ? b.name_ar : b.name_en;
          return (
            <div
              key={b.id}
              title={name}
              className={`glass flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-opacity ${has ? "" : "opacity-35 grayscale"}`}
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="line-clamp-2 text-[9px] font-medium leading-tight">{name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
