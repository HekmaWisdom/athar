-- Users need to read back their OWN analytics events to compute their own badge
-- progress (shares) and challenge progress (reads/reflections/shares) client-side —
-- the original migration only granted admins read access. Multiple SELECT
-- policies on the same table are OR'd together by Postgres RLS, so this adds to,
-- not replaces, the existing admin policy.
drop policy if exists "users can read own events" on public.analytics_events;
create policy "users can read own events" on public.analytics_events
  for select to authenticated
  using (user_id = auth.uid());

-- Weekly challenge rotation. Originally this file seeded a single one-off
-- challenge for the week of 2026-09-21, which would have expired a week after
-- being pasted and left ChallengeCard empty forever. Instead: a rotating set of
-- 3 templates, one per ISO week (Monday start, same as getActiveChallenge's
-- starts_on/ends_on window), created ahead of time by a daily pg_cron job.
-- Idempotent (slug is unique per week), so running it daily or by hand is safe.
create or replace function public.ensure_weekly_challenges()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  wk date;
begin
  -- Current week and next week, so a challenge always exists the moment a week starts.
  for wk in
    select (date_trunc('week', current_date) + make_interval(weeks => n))::date
    from generate_series(0, 1) as n
  loop
    insert into public.challenges
      (slug, title_ar, title_en, description_ar, description_en, kind, goal_type, goal_count, starts_on, ends_on)
    select
      'weekly-' || t.goal_type || '-' || to_char(wk, 'YYYY-MM-DD'),
      t.title_ar, t.title_en, t.description_ar, t.description_en,
      'weekly', t.goal_type, t.goal_count, wk, wk + 6
    from (values
      (0, 'reads', 5,
        'أسبوع الحكمة', 'A Week of Wisdom',
        'اقرأ حكمة اليوم في ٥ أيام مختلفة هذا الأسبوع', 'Read the daily wisdom on 5 different days this week'),
      (1, 'reflections', 3,
        'أسبوع التأمل', 'A Week of Reflection',
        'اكتب في دفترك في ٣ أيام مختلفة هذا الأسبوع', 'Write in your journal on 3 different days this week'),
      (2, 'shares', 2,
        'انشر الأثر', 'Spread the Wisdom',
        'شارك حكمة في يومين مختلفين هذا الأسبوع', 'Share a quote on 2 different days this week')
    ) as t(i, goal_type, goal_count, title_ar, title_en, description_ar, description_en)
    -- 2026-01-05 is a Monday; weeks since then, mod 3, picks the template.
    where t.i = ((wk - date '2026-01-05') / 7) % 3
    on conflict (slug) do nothing;
  end loop;
end;
$$;

revoke execute on function public.ensure_weekly_challenges() from public, anon, authenticated;

-- pg_cron is already enabled by 20260717120500_schedule_daily_reminders.sql.
-- Re-scheduling under the same job name replaces the existing job.
select cron.schedule('ensure-weekly-challenges', '5 0 * * *', $$select public.ensure_weekly_challenges()$$);

-- Create this week's and next week's challenge right now.
select public.ensure_weekly_challenges();

-- To pause/remove later: select cron.unschedule('ensure-weekly-challenges');
