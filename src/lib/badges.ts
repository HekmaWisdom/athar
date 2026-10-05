import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { countUserEvents } from "@/lib/analytics";

export type BadgeKind = "streak" | "xp" | "journal" | "share" | "favorite";

export type Badge = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string;
  kind: BadgeKind;
  threshold: number;
  sort_order: number;
};

export async function listBadges(): Promise<Badge[]> {
  const { data, error } = await supabase.from("badges").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Badge[];
}

export async function listEarnedBadgeIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("user_badges").select("badge_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.badge_id));
}

async function currentCount(userId: string, kind: BadgeKind): Promise<number> {
  switch (kind) {
    case "streak": {
      const { data } = await supabase.from("user_stats").select("current_streak").eq("user_id", userId).maybeSingle();
      return data?.current_streak ?? 0;
    }
    case "xp": {
      const { data } = await supabase.from("user_stats").select("xp").eq("user_id", userId).maybeSingle();
      return data?.xp ?? 0;
    }
    case "journal": {
      const { count } = await supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", userId);
      return count ?? 0;
    }
    case "favorite": {
      const { count } = await supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", userId);
      return count ?? 0;
    }
    case "share":
      return countUserEvents(userId, "quote_shared");
  }
}

// Call after any action that could cross a threshold (daily visit, journal save,
// favorite, share). One query per distinct badge *kind* still unearned, not per
// badge, so this stays cheap even as the badge catalog grows. Already-earned
// badges are never re-awarded (checked via user_badges first).
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const [all, earned] = await Promise.all([listBadges(), listEarnedBadgeIds(userId)]);
  const unearned = all.filter((b) => !earned.has(b.id));
  if (unearned.length === 0) return [];

  const kinds = [...new Set(unearned.map((b) => b.kind))];
  const countPairs = await Promise.all(kinds.map(async (k) => [k, await currentCount(userId, k)] as const));
  const counts = Object.fromEntries(countPairs) as Record<BadgeKind, number>;

  const toAward = unearned.filter((b) => counts[b.kind] >= b.threshold);
  if (toAward.length === 0) return [];

  const { error } = await supabase
    .from("user_badges")
    .upsert(
      toAward.map((b) => ({ user_id: userId, badge_id: b.id })),
      { onConflict: "user_id,badge_id", ignoreDuplicates: true },
    );
  if (error) {
    console.warn("[badges] award failed", error.message);
    return [];
  }
  return toAward;
}

export function toastNewBadges(badges: Badge[], locale: "ar" | "en") {
  for (const b of badges) {
    const name = locale === "ar" ? b.name_ar : b.name_en;
    toast.success(`${b.icon}  ${locale === "ar" ? "وسام جديد: " : "New badge: "}${name}`);
  }
}

// Fire-and-forget wrapper for the common case: check + toast, never throw
// (badge awarding must never break the action it's attached to).
export function checkAndNotifyBadges(userId: string, locale: "ar" | "en") {
  void checkAndAwardBadges(userId)
    .then((earned) => toastNewBadges(earned, locale))
    .catch((e) => console.warn("[badges] check failed", e));
}
