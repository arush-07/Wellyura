# Wellyura

Clean full-stack project structure for the Wellyura global study platform.

## Structure

```text
Wellyura/
├── frontend/                 # Next.js 16 + React 19 + TypeScript
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # FastAPI + database assets
│   ├── app/
│   ├── tests/
│   ├── database/supabase/migrations/
│   ├── scripts/
│   ├── reports/
│   ├── .env.example
│   └── pyproject.toml
├── docs/
├── start-local.ps1
├── verify-local.ps1
└── .gitignore
```

## Run frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.

## Run both

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

## Database

The new Supabase project schema belongs under `backend/database/supabase/migrations/`.
The previous live-project migration scripts were intentionally excluded because this project is moving to a new clean Supabase database.

## New normalized Supabase database

The current database migration is located at:

```text
backend/database/supabase/migrations/
```

It uses CSV exports from the existing Supabase project as the source of truth. Place private exports locally in:

```text
backend/database/supabase/import/
```

Run the migration scripts in numeric order, beginning with `00_verify_new_project.sql`. Full instructions are in `docs/DATABASE_MIGRATION.md`.

The frontend and FastAPI backend still use the bundled JSON catalogue during the migration. They will be switched to the new Supabase project only after migration validation succeeds.
