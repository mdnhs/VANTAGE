# Scheduled jobs (VPS)

## Enquiry retention

`yarn jobs:retention` permanently deletes old enquiries according to Settings > Privacy:

- quotes and contact messages created more than `enquiryRetentionMonths` ago (default 24);
- closed-out "spam" older than `spamRetentionDays` (default 30), counted from the last update
  (when it was closed out). There is no literal spam status, so this means quotes with status
  `cancelled` or `archived` and contact messages with status `archived`.

It runs in one transaction and writes one audit row (`privacy.retention`) holding counts only,
never customer data. Deletion is permanent: look first with a dry run.

```sh
cd /srv/vantage && yarn jobs:retention --dry-run   # prints counts, changes nothing
cd /srv/vantage && yarn jobs:retention             # deletes
```

The script reads `.env.local` / the environment for `DATABASE_URL`, so run it from the app directory
as the app user.

### Crontab

Daily at 03:15 server time, output appended to a log:

```cron
15 3 * * * cd /srv/vantage && /usr/bin/env yarn --silent jobs:retention >> /var/log/vantage-retention.log 2>&1
```

Adjust `/srv/vantage` and the log path to the deployment. Install with `crontab -e` as the app user.
