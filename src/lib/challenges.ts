import { supabase } from "@/integrations/supabase/client";
import { countUserEventDays, type AnalyticsEventName } from "@/lib/analytics";

export type Challenge = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  kind: "weekly" | "monthly";
  goal_type: "reads" | "reflections" | "shares";
  goal_count: number;
  starts_on: string;
  ends_on: string;
  badge_id: string | null;
};

const GOAL_EVENT: Record<Challenge["goal_type"], AnalyticsEventName> = {
  reads: "quote_read",
  reflections: "journal_entry_created",
  shares: "quote_shared",
};

export async function getActiveChallenge(): Promise<Challenge | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .lte("starts_on", today)
    .gte("ends_on", today)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Challenge | null;
}

// Progress = distinct days the goal event happened within the challenge window,
// not a raw event count — otherwise refreshing the page all day would trivially
// complete a "read on 5 different days" goal in one sitting.
export async function getChallengeProgress(userId: string, challenge: Challenge): Promise<number> {
  const progress = await countUserEventDays(userId, GOAL_EVENT[challenge.goal_type], {
    from: challenge.starts_on,
    to: challenge.ends_on,
  });
  await supabase.from("challenge_progress").upsert(
    {
      user_id: userId,
      challenge_id: challenge.id,
      progress,
      completed_at: progress >= challenge.goal_count ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,challenge_id" },
  );
  return progress;
}
