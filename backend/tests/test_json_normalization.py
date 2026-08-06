from app.repositories.catalog import normalize_catalog_item


def test_normalizes_json_encoded_catalog_fields() -> None:
    item = {
        "name": "Example University",
        "campuses": '["Main Campus", "City Campus"]',
        "contacts": '{"admissions":{"email":"hello@example.com"}}',
        "scholarships": '[{"name":"Merit Award"}]',
        "features": "[]",
        "required_subjects": '["Mathematics", "Physics"]',
    }

    normalized = normalize_catalog_item(item)

    assert normalized["campuses"] == [
        "Main Campus",
        "City Campus",
    ]
    assert normalized["contacts"] == {
        "admissions": {
            "email": "hello@example.com",
        }
    }
    assert normalized["scholarships"] == [
        {
            "name": "Merit Award",
        }
    ]
    assert normalized["features"] == []
    assert normalized["required_subjects"] == [
        "Mathematics",
        "Physics",
    ]


def test_preserves_plain_and_invalid_strings() -> None:
    item = {
        "name": "Example Programme",
        "duration": "2",
        "features": "not-valid-json",
    }

    normalized = normalize_catalog_item(item)

    assert normalized["name"] == "Example Programme"
    assert normalized["duration"] == "2"
    assert normalized["features"] == "not-valid-json"


def test_converts_legacy_null_strings() -> None:
    item = {
        "abbreviation": "null",
        "contacts": '{"email":"null","phone":"+91-123"}',
    }

    normalized = normalize_catalog_item(item)

    assert normalized["abbreviation"] is None
    assert normalized["contacts"] == {
        "email": None,
        "phone": "+91-123",
    }
