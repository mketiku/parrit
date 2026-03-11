# Supabase Migration & Management Guide

This guide outlines how to manage the development and production lifecycle of the database schema for the **Parrit** project using the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Prerequisites

1.  **Install the Supabase CLI:**
    ```bash
    npm install supabase --save-dev
    ```
2.  **Login to your account:**
    ```bash
    npx supabase login
    ```
3.  **Link your project:**
    (You will need your database password from the Supabase dashboard.)
    ```bash
    npx supabase link --project-ref gfenvppssnepatovbnfq
    ```

---

## The Migration Workflow

To keep high code quality and prevent data loss, we follow a strict local-first migration workflow.

### 1. Make Changes Locally

First, start your local Supabase stack to test your changes.

```bash
npx supabase start
```

Make your schema changes (e.g., adding columns, new tables) directly in the local Supabase Studio or by applying SQL.

### 2. Generate a New Migration File

Once you're happy with your local changes, generate a new timestamped migration file:

```bash
npx supabase db diff -f add_new_feature_table
```

This will compare your local database to the current migration history and create a new `.sql` file in `supabase/migrations/`.

_Alternatively, create a blank migration if you prefer writing the SQL manually:_

```bash
npx supabase migration new add_new_feature_table
```

### 3. Verify & Test Locally

Before pushing anything, ensure the new migration runs cleanly from scratch:

```bash
npx supabase db reset
```

> [!WARNING]
> This command **DELETES ALL LOCAL DATA** and re-runs all migrations. Use it often during development to ensure your schema is reproducible.

### 4. Push to Production

After committing your new migration file to Git and merging it into `main`, apply the changes to the live Supabase instance:

```bash
npx supabase db push
```

---

## Safety & Best Practices

- **Never Edit Existing Migrations:** If you make a mistake in a migration that has already been pushed/deployed, create a **new** migration to fix it. Editing old files will cause a "Migration Drift" error.
- **Pull Remote Changes:** If someone else (or you) makes a change via the Supabase Dashboard directly, you must pull those changes into your local environment:
  ```bash
  npx supabase db pull
  ```
- **Backup Before Pushing:** As noted in [database.md](./database.md), always perform a data dump before pushing structural changes to production.
- **Check Migration Status:** To see which migrations have been applied to your linked project:
  ```bash
  npx supabase migration list
  ```

---

## Common Commands Reference

| Operation              | Command                             |
| :--------------------- | :---------------------------------- |
| **Start local DB**     | `npx supabase start`                |
| **Stop local DB**      | `npx supabase stop`                 |
| **Reset local state**  | `npx supabase db reset`             |
| **Pull remote schema** | `npx supabase db pull`              |
| **Create migration**   | `npx supabase migration new <name>` |
| **Push to production** | `npx supabase db push`              |
| **View status**        | `npx supabase migration list`       |
