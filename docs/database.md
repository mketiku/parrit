# Database Management & Backups

## Current Status

We are currently using the **Supabase Free Tier**.

> [!IMPORTANT]
> Because we are on the free tier, we do not have automated Point-in-Time Recovery (PITR). Database safety relies on manual backups and safe migration practices.

## Investigating Backup Strategy

We are currently investigating a robust automated backup strategy for the production database.

**Proposed Approach:**

- **GitHub Actions Cron:** A scheduled action to run `supabase db dump --data-only --role service_role` and commit the encrypted SQL to a private repository or upload to an S3 bucket.
- **pg_dump:** Direct usage of `pg_dump` via a management script.

## Manual Backups

Before any major release or data migration, performing a manual backup is required:

```bash
# Dump only the data (excludes schema definitions which are in migrations/)
npx supabase db dump --data-only -p YOUR_DB_PASSWORD > backups/backup_$(date +%Y%m%d).sql
```

## Migration Safety

To protect active user data, do not run "destructive" scripts (like `drop table cascade`) in production.

- Use incremental migrations in `supabase/migrations/`.
- Test migrations locally using `npx supabase db reset` before applying to production.
- Use "Soft Deletes" for critical records where possible.
