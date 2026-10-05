// Supabase Edge Function — send-daily-reminders
//
// Triggered every minute by pg_cron (see supabase/migrations/…_schedule_reminders.sql).
// For every profile whose local time (per profiles.timezone) currently matches
// profiles.reminder_time, and who hasn't already been sent today's reminder,
// sends a web push notification with today's quote to all of that user's
// push_subscriptions. Expired subscriptions (410/404 from the push service) are
// deleted so they stop being retried.
//
// Deploy: supabase functions deploy send-daily-reminders
// Secrets needed (Supabase Dashboard -> Edge Functions -> send-daily-reminders -> Secrets,
// or `supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=... VAPID_SUBJECT=...`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — same pair as apps/web/.env
//   VAPID_SUBJECT                        — "mailto:you@example.com" (required by the push spec)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically, no need to set them.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SELECT_QUOTE = `
  id, text_ar, text_en,
  author:authors(name_ar, name_en)
`;

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@athar.app";

  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, reminder_time, timezone, last_reminder_sent_date")
    .not("reminder_time", "is", null);

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), { status: 500 });
  }

  const now = new Date();
  // Track each user's own local calendar date alongside their id — last_reminder_sent_date
  // must be compared and written in the SAME (local) date space, never mixed with UTC,
  // or users far from UTC would get double-sent or skipped near midnight UTC.
  const due: { id: string; localDate: string }[] = [];

  for (const p of profiles ?? []) {
    let localHHMM: string;
    let localDate: string;
    try {
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: p.timezone || "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      localHHMM = fmt.format(now); // "HH:MM"
      localDate = new Intl.DateTimeFormat("en-CA", { timeZone: p.timezone || "UTC" }).format(now); // "YYYY-MM-DD"
    } catch {
      continue; // invalid timezone string, skip rather than crash the whole sweep
    }

    const reminderHHMM = (p.reminder_time as string).slice(0, 5);
    if (reminderHHMM !== localHHMM) continue;
    if (p.last_reminder_sent_date === localDate) continue; // already sent today, in their own timezone

    due.push({ id: p.id, localDate });
  }

  if (due.length === 0) {
    return new Response(JSON.stringify({ sent: 0, checked: profiles?.length ?? 0 }), { status: 200 });
  }

  // Today's quote: scheduled pick if one exists, else deterministic fallback (mirrors getDailyQuote()).
  const todayKey = new Date().toISOString().slice(0, 10);
  let quote: { text_ar: string; text_en: string | null; author: { name_ar: string; name_en: string | null } | null } | null = null;

  const { data: scheduled } = await supabase
    .from("daily_quotes")
    .select(`quote:quotes(${SELECT_QUOTE})`)
    .eq("the_date", todayKey)
    .maybeSingle();

  if (scheduled?.quote) {
    quote = scheduled.quote as unknown as typeof quote;
  } else {
    const { data: allIds } = await supabase.from("quotes").select("id").eq("published", true).order("id", { ascending: true });
    if (allIds && allIds.length > 0) {
      const dayIndex = Math.floor(Date.now() / 86400000) % allIds.length;
      const { data: picked } = await supabase.from("quotes").select(SELECT_QUOTE).eq("id", allIds[dayIndex]!.id).maybeSingle();
      quote = picked as unknown as typeof quote;
    }
  }

  const body = quote
    ? `"${quote.text_ar}"${quote.author ? ` — ${quote.author.name_ar}` : ""}`
    : "حكمة اليوم بانتظارك";

  let sent = 0;
  for (const { id: userId, localDate } of due) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title: "أثر · حكمة اليوم", body, url: "/" }),
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          // Subscription is gone (user revoked permission, uninstalled, etc.) — stop retrying it.
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    // Mark sent using THIS user's local date, matching what the lookup above compares against.
    await supabase.from("profiles").update({ last_reminder_sent_date: localDate }).eq("id", userId);
  }

  return new Response(JSON.stringify({ sent, users: due.length, checked: profiles?.length ?? 0 }), { status: 200 });
});
