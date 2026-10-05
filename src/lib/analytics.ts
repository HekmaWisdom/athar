import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// Our own event log (see documentation/ROADMAP.md — no PostHog, no paid service).
// Fire-and-forget: analytics must never block or break the UI it's attached to.

function getSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  let id: string | null = null;
  try {
    id = sessionStorage.getItem("athar_session_id");
  } catch {
    // sessionStorage can throw in private-browsing edge cases — fall through to a fresh id.
  }
  if (!id) {
    id = crypto.randomUUID();
    try {
      sessionStorage.setItem("athar_session_id", id);
    } catch {
      // best-effort only
    }
  }
  return id;
}

export type AnalyticsEventName = "quote_read" | "quote_shared" | "quote_favorited" | "journal_entry_created";

// Returns a promise that resolves once the row has actually landed. Callers
// that immediately re-count this event (e.g. checkAndNotifyBadges for the
// "share" kind) must await this first — otherwise the badge check can race
// the insert and read a stale (pre-increment) count.
export async function trackEvent(
  eventName: AnalyticsEventName,
  userId: string | null,
  properties: Record<string, Json> = {},
): Promise<void> {
  const { error } = await supabase
    .from("analytics_events")
    .insert({ event_name: eventName, properties, user_id: userId, session_id: getSessionId() });
  if (error) console.warn("[analytics]", eventName, error.message);
}

export async function countUserEvents(
  userId: string,
  eventName: AnalyticsEventName,
  range?: { from: string; to: string },
): Promise<number> {
  let query = supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_name", eventName);
  if (range) query = query.gte("occurred_at", `${range.from}T00:00:00Z`).lte("occurred_at", `${range.to}T23:59:59Z`);
  const { count } = await query;
  return count ?? 0;
}

// Distinct calendar days a given event happened in a date range — used for
// "read N different days" style challenges, so refreshing the page all day
// doesn't trivially complete the goal.
export async function countUserEventDays(
  userId: string,
  eventName: AnalyticsEventName,
  range: { from: string; to: string },
): Promise<number> {
  const { data } = await supabase
    .from("analytics_events")
    .select("occurred_at")
    .eq("user_id", userId)
    .eq("event_name", eventName)
    .gte("occurred_at", `${range.from}T00:00:00Z`)
    .lte("occurred_at", `${range.to}T23:59:59Z`);
  const days = new Set((data ?? []).map((r) => (r.occurred_at as string).slice(0, 10)));
  return days.size;
}
