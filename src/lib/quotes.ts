import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  onboarded: boolean;
  interests: string[];
  reminder_time: string;
  mood_baseline: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, onboarded, interests, reminder_time, mood_baseline")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function completeOnboarding(
  userId: string,
  input: { interests: string[]; reminder_time: string; mood_baseline: string },
) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...input, onboarded: true })
    .eq("id", userId);
  if (error) throw error;
}

export type QuoteFull = {
  id: string;
  text_ar: string;
  text_en: string | null;
  source: string | null;
  tags: string[] | null;
  author: { id: string; name_ar: string; name_en: string | null } | null;
  category: { id: string; slug: string; name_ar: string; name_en: string; icon: string | null; accent: string | null } | null;
};

const SELECT = `
  id, text_ar, text_en, source, tags,
  author:authors(id, name_ar, name_en),
  category:categories(id, slug, name_ar, name_en, icon, accent)
`;

export async function getDailyQuote(): Promise<QuoteFull | null> {
  const today = new Date().toISOString().slice(0, 10);

  // Try scheduled daily quote
  const { data: sched } = await supabase
    .from("daily_quotes")
    .select(`quote:quotes(${SELECT})`)
    .eq("the_date", today)
    .maybeSingle();

  if (sched?.quote) return sched.quote as unknown as QuoteFull;

  // Fallback: deterministic by day-of-year using published quotes ordered by id
  const { data: all } = await supabase
    .from("quotes")
    .select("id")
    .eq("published", true)
    .order("id", { ascending: true });

  if (!all || all.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86400000) % all.length;
  const chosenId = all[dayIndex]!.id;

  const { data } = await supabase.from("quotes").select(SELECT).eq("id", chosenId).maybeSingle();
  return (data as unknown as QuoteFull) ?? null;
}

export async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listQuotesByCategory(categorySlug: string, limit = 50) {
  const { data: cat } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
  if (!cat) return [];
  const { data } = await supabase
    .from("quotes")
    .select(SELECT)
    .eq("category_id", cat.id)
    .eq("published", true)
    .limit(limit);
  return (data as unknown as QuoteFull[]) ?? [];
}

export async function searchQuotes(query: string, limit = 30) {
  if (!query.trim()) return [];
  const q = `%${query.trim()}%`;
  const { data } = await supabase
    .from("quotes")
    .select(SELECT)
    .eq("published", true)
    .or(`text_ar.ilike.${q},text_en.ilike.${q}`)
    .limit(limit);
  return (data as unknown as QuoteFull[]) ?? [];
}

export async function getFavorites(userId: string) {
  const { data } = await supabase
    .from("favorites")
    .select(`quote_id, created_at, quote:quotes(${SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as { quote_id: string; created_at: string; quote: QuoteFull }[];
}

export async function toggleFavorite(userId: string, quoteId: string, on: boolean) {
  if (on) {
    await supabase.from("favorites").insert({ user_id: userId, quote_id: quoteId });
  } else {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("quote_id", quoteId);
  }
}

export async function isFavorite(userId: string, quoteId: string) {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("quote_id", quoteId)
    .maybeSingle();
  return !!data;
}

export async function upsertMood(userId: string, mood: string) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("mood_checkins").upsert({ user_id: userId, mood, the_date: today }, { onConflict: "user_id,the_date" });
}

export async function getTodayMood(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("mood_checkins")
    .select("mood")
    .eq("user_id", userId)
    .eq("the_date", today)
    .maybeSingle();
  return data?.mood ?? null;
}

export async function getUserStats(userId: string) {
  const { data } = await supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export async function trackDailyVisit(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await getUserStats(userId);
  if (!existing) {
    await supabase.from("user_stats").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
      xp: 10,
      level: 1,
    });
    return;
  }
  if (existing.last_active_date === today) return;
  const last = existing.last_active_date ? new Date(existing.last_active_date) : null;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const isContinuous = last && existing.last_active_date === yStr;
  const newStreak = isContinuous ? existing.current_streak + 1 : 1;
  const newXp = existing.xp + 10;
  const newLevel = 1 + Math.floor(newXp / 100);
  await supabase
    .from("user_stats")
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(existing.longest_streak, newStreak),
      last_active_date: today,
      xp: newXp,
      level: newLevel,
    })
    .eq("user_id", userId);
}

export async function listJournal(userId: string) {
  const { data } = await supabase
    .from("journal_entries")
    .select(`*, quote:quotes(${SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function addJournalEntry(userId: string, content: string, quoteId?: string | null, mood?: string | null) {
  const { data } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, content, quote_id: quoteId ?? null, mood: mood ?? null })
    .select()
    .maybeSingle();
  return data;
}
