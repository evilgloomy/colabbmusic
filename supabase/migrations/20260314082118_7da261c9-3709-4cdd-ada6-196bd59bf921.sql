SELECT cron.schedule(
  'weekly-sync-releases-saturday',
  '0 1 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://tfcrxvnfuagmqwkxoyei.supabase.co/functions/v1/sync-releases',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY3J4dm5mdWFnbXF3a3hveWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODQ5MDYsImV4cCI6MjA4ODY2MDkwNn0.Ky_orFFBvDAeb1l7ywl-pyjY34GuSA8gr8PAaJ_YfEI"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);