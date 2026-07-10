-- Onboarding data: interests (category slugs), reminder time, mood baseline.
-- DESIGN-SYSTEM.md Flow 1 — interest picker (min 3), reminder time (default 07:00), mood baseline.
ALTER TABLE public.profiles
  ADD COLUMN interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN reminder_time time NOT NULL DEFAULT '07:00',
  ADD COLUMN mood_baseline text;
