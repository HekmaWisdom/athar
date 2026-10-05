-- Web push subscriptions + timezone (needed to fire the daily reminder at each
-- user's actual local time, not a naive UTC interpretation of reminder_time).
ALTER TABLE public.profiles
  ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tracks the last date a reminder was sent per user, so the cron sweep (which runs
-- every few minutes) doesn't send the same day's notification twice.
ALTER TABLE public.profiles
  ADD COLUMN last_reminder_sent_date date;
