# Wellyura Supabase database

This folder contains the migration for the **new Supabase project**. It uses the existing database exports as the source of truth, then transforms them into normalized production tables.

## Structure

- `migrations/` — SQL scripts to run in Supabase SQL Editor, in numeric order.
- `import/` — local-only location for CSV exports from the existing project. CSV files are ignored by Git.

## Data preservation model

- `legacy` schema: exact source rows imported from the existing database.
- `public` schema: normalized tables used by Wellyura.
- `internal` schema: migration batches, conversion warnings, and helper functions.
- Every core migrated row preserves its original ID in `legacy_id`.
- Complex original JSON is also retained in `legacy_payload` where applicable.

Start with `migrations/00_READ_FIRST.md` and run `00_verify_new_project.sql` first.
