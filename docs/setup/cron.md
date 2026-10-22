# Scheduled jobs (VPS)

## Enquiry retention

`yarn jobs:retention` permanently deletes old enquiries according to Settings > Privacy. Only
finished records are touched, aged from their last update (`updated_at`):

- quotes with status `completed`, `cancelled` or `archived`, no invoice number and payment status
  `unpaid`, older than `enquiryRetentionMonths` (default 24). A quote with any invoice or payment
  data is never deleted;
- contact messages with status `replied` or `archived`, older than `enquiryRetentionMonths`;
- enquiries with status exactly `spam`, older than `spamRetentionDays` (default 30). Spam marking
  does not exist yet, so this matches nothing today.

New, read and in-progress enquiries are never deleted. After the rows are gone, their Cloudinary
photos are removed best-effort (skipped when Cloudinary is not configured; failures are logged).

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
15 3 * * * bash -lc 'cd /srv/vantage && yarn --silent jobs:retention' >> /var/log/vantage-retention.log 2>&1
```

`bash -lc` loads a login shell so `yarn`/`node` are on PATH when Node comes from nvm or corepack
(cron's own PATH is minimal). Otherwise use absolute paths to `yarn`. Adjust `/srv/vantage` and
the log path to the deployment; install with `crontab -e` as the app user.
