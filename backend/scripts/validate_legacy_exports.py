from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

IMPORT_DIR = Path(__file__).resolve().parents[1] / "database" / "supabase" / "import"
EXPECTED = {
    "universities_rows.csv": (268, {"id", "name", "slug", "country", "city"}),
    "programs_rows.csv": (4102, {"id", "institution_id", "name", "level"}),
    "accommodations_rows.csv": (2, {"id", "name", "slug", "country", "city"}),
    "users_rows.csv": (5, {"id", "email", "password"}),
    "favorites_rows.csv": (1, {"id", "user_id", "institution_id"}),
    "search_history_rows.csv": (9, {"id", "user_id", "query"}),
    "contact_messages_rows.csv": (1, {"id", "email", "message"}),
}


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def main() -> int:
    errors: list[str] = []
    summary: dict[str, dict[str, object]] = {}

    for filename, (expected_rows, required_columns) in EXPECTED.items():
        path = IMPORT_DIR / filename
        if not path.exists():
            errors.append(f"Missing: {path}")
            continue

        headers, rows = read_csv(path)
        missing_columns = sorted(required_columns.difference(headers))
        ids = [row.get("id", "") for row in rows]
        duplicate_ids = len(ids) - len(set(ids))

        summary[filename] = {
            "rows": len(rows),
            "expected_rows": expected_rows,
            "missing_columns": missing_columns,
            "duplicate_ids": duplicate_ids,
        }

        if len(rows) != expected_rows:
            errors.append(f"{filename}: expected {expected_rows} rows, found {len(rows)}")
        if missing_columns:
            errors.append(f"{filename}: missing columns {', '.join(missing_columns)}")
        if duplicate_ids:
            errors.append(f"{filename}: found {duplicate_ids} duplicate IDs")

    print(json.dumps(summary, indent=2))
    if errors:
        print("\nValidation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("\nAll seven legacy exports passed the basic validation checks.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
