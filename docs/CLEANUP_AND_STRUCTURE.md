# Cleanup and Structure

## Safe to delete from the previous folder

- `node_modules/`
- `apps/web/.next/`
- every `__pycache__/` folder and `*.pyc` file
- `apps/api/.pytest_cache/`
- `apps/web/tsconfig.tsbuildinfo`
- `FILE_MANIFEST.txt` because it describes an older package
- `CHANGELOG_FINAL.md` and `CHANGELOG_V3.2.md` after the clean package is accepted
- `docs/FRONTEND_FIXES_V2_3.md`, `docs/FRONTEND_FIXES_V2_4.md`, and `docs/FRONTEND_UPGRADE_V2_1.md`
- `public/images/wellyuralogo_old.png` because it is not referenced
- `infra/supabase/live-migration/` because those scripts target the old Supabase project
- the old root `package.json` and `package-lock.json` after moving npm ownership into `frontend/`

## Do not delete

- `frontend/src/`
- `frontend/public/`
- `frontend/package.json`
- `backend/app/`
- `backend/tests/`
- `backend/pyproject.toml`
- `backend/database/supabase/migrations/`
- `.env.example` files
- catalogue JSON files until the frontend and API are fully reading from the new Supabase database

## Generated folders

`node_modules`, `.next`, `.venv`, `__pycache__`, `.pytest_cache`, and `*.tsbuildinfo` are recreated automatically and should never be included in a ZIP or Git repository.
