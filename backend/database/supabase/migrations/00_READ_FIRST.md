# Wellyura New Supabase Database Migration

This migration builds a clean, normalized Supabase database while preserving every record from the existing database.

## Core design

- `legacy` schema: exact raw CSV imports from the existing Supabase project. It is not exposed to the Data API.
- `public` schema: normalized production tables used by the website.
- `internal` schema: migration logs, conversion issues, and helper functions. It is not exposed to the Data API.
- Every migrated core record stores its original `legacy_id`.
- Complex source fields are normalized into child tables and also retained in `legacy_payload` JSONB fields.
- Legacy password hashes are never copied into Supabase Auth or public tables.

## Run order

1. Run `00_verify_new_project.sql` and confirm `safe_new_project = true`.
2. Run `01_create_normalized_schema.sql` in the new project's SQL Editor.
3. Run `02_security_rls_and_grants.sql`.
4. Run `03_create_legacy_import_tables.sql`.
5. Import the existing CSV files into the matching tables under the `legacy` schema.
6. Run `04_transform_catalogue_data.sql`.
7. Run `05_verify_catalogue_migration.sql`.
8. Create/invite the five users in Supabase Auth using the same email addresses.
9. Run `06_link_auth_users_and_activity.sql`.
10. Run `07_final_verification.sql`.

## CSV-to-table mapping

| Existing CSV | New raw-import table |
|---|---|
| `universities_rows.csv` | `legacy.universities_raw` |
| `programs_rows.csv` | `legacy.programmes_raw` |
| `accommodations_rows.csv` | `legacy.accommodations_raw` |
| `users_rows.csv` | `legacy.users_raw` |
| `favorites_rows.csv` | `legacy.favorites_raw` |
| `search_history_rows.csv` | `legacy.search_history_raw` |
| `contact_messages_rows.csv` | `legacy.contact_messages_raw` |

Do not import the old password column anywhere except `legacy.users_raw`. The `legacy` schema remains private and is never granted to browser roles.
