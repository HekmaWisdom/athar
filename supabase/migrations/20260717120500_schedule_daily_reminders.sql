-- Schedules the send-daily-reminders Edge Function to run every minute via pg_cron.
-- Two-step setup — see the README note in supabase/functions/send-daily-reminders/ too.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- STEP 1 (run this line separately, by hand, in the SQL Editor — replace the placeholder
-- with your actual service_role key from Project Settings -> API Keys. Do NOT commit the
-- filled-in version of this line to git; keep the placeholder in the file in the repo.):
--
--   SELECT vault.create_secret('PASTE_YOUR_SERVICE_ROLE_KEY_HERE', 'service_role_key');
--
-- Vault encrypts it at rest; the cron job below reads it back via vault.decrypted_secrets.
-- If you ever need to update it: SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name = 'service_role_key'), 'NEW_KEY');

-- STEP 2: the actual schedule (safe to run as-is, contains no secret).
SELECT cron.schedule(
  'send-daily-reminders',
  '* * * * *', -- every minute; the function itself only sends to users whose local reminder time is now
  $$
  SELECT net.http_post(
    url := 'https://wydnzsgepqqdqibxgyea.supabase.co/functions/v1/send-daily-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To pause/remove later: SELECT cron.unschedule('send-daily-reminders');
