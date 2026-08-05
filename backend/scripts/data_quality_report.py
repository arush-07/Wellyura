#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

catalog_path = Path(sys.argv[1] if len(sys.argv) > 1 else "frontend/src/data/catalog.json")
output_path = Path(sys.argv[2] if len(sys.argv) > 2 else "backend/reports/data-quality-report.json")
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
universities = catalog["universities"]
programmes = catalog["programmes"]

report = {
    "summary": {
        "universities": len(universities),
        "programmes": len(programmes),
        "countries": len(catalog["countries"]),
    },
    "universities": {
        "missing_website": sum(not row.get("website") for row in universities),
        "missing_city": sum(not row.get("city") for row in universities),
        "missing_fee_range": sum(not row.get("annualFeeCadMin") for row in universities),
        "without_scholarship_notes": sum(not row.get("scholarships") for row in universities),
        "by_country": Counter(row.get("country") for row in universities),
    },
    "programmes": {
        "missing_annual_fee": sum(not row.get("annualFeeCad") for row in programmes),
        "missing_duration": sum(not row.get("durationYears") for row in programmes),
        "missing_requirements": sum(not row.get("requirements") for row in programmes),
        "by_subject": Counter(row.get("subject") for row in programmes),
        "by_level": Counter(row.get("level") for row in programmes),
    },
    "rules": [
        "Zero-valued fees are treated as missing, never as free tuition.",
        "All legacy values remain unverified until linked to a primary source and effective date.",
        "University and programme names should be deduplicated through official domains and human review.",
    ],
}

output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(report, indent=2, ensure_ascii=False, default=dict), encoding="utf-8")
print(f"Wrote {output_path}")
