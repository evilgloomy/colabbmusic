-- Remove the redundant 6-hour sync job (jobid 1)
SELECT cron.unschedule(1);

-- Remove the old Friday weekly sync (jobid 2)
SELECT cron.unschedule(2);