# Database migration: existing project to normalized project

The existing Supabase database is the source of truth. The new project does not recreate catalogue data manually.

## Exact local paths

```text
Wellyura/
└── backend/
    └── database/
        └── supabase/
            ├── README.md
            ├── import/
            │   └── README.md
            └── migrations/
                ├── 00_READ_FIRST.md
                ├── 00_verify_new_project.sql
                ├── 01_create_normalized_schema.sql
                ├── 02_security_rls_and_grants.sql
                ├── 03_create_legacy_import_tables.sql
                ├── 04_transform_catalogue_data.sql
                ├── 05_verify_catalogue_migration.sql
                ├── 06_link_auth_users_and_activity.sql
                └── 07_final_verification.sql
```

## Expected source totals

- Universities: 268
- Programmes: 4,102
- Accommodations: 2
- Users: 5
- Favorites: 1
- Search history: 9
- Contact messages: 1

## Migration order

1. Confirm the SQL Editor belongs to the new Supabase project.
2. Run `00_verify_new_project.sql`; continue only when `safe_new_project` is `true`.
3. Run `01_create_normalized_schema.sql`.
4. Run `02_security_rls_and_grants.sql`.
5. Run `03_create_legacy_import_tables.sql`.
6. Import the seven CSV exports into their corresponding `legacy.*_raw` tables.
7. Run `04_transform_catalogue_data.sql`.
8. Run `05_verify_catalogue_migration.sql` and confirm source/target counts match.
9. Create/invite the five users in Supabase Auth using the same email addresses.
10. Run `06_link_auth_users_and_activity.sql`.
11. Run `07_final_verification.sql`.

The old password hashes never become Supabase Auth passwords. Users set new passwords through Supabase Auth invitations.
