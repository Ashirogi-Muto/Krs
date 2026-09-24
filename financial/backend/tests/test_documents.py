"""Document upload, magic-byte inspection, and streaming tests."""
import io
from app.models.category import Category

# Minimal valid PNG binary with proper magic bytes
VALID_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

# Minimal valid PDF binary with proper magic bytes
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"

def test_document_upload_and_stream(editor_client, viewer_client, client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    exp_res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Camera Module",
        "category_id": cat_exp.id,
        "vendor": "Electronics Mart",
        "total_amount": "2500.00",
        "amount_paid": "2500.00"
    })
    exp_id = exp_res.json()["id"]

    # 1. Editor uploads valid PNG receipt
    upload_res = editor_client.post(
        "/api/documents/upload",
        data={"entity_type": "EXPENSE", "entity_id": exp_id},
        files={"file": ("receipt.png", io.BytesIO(VALID_PNG_BYTES), "image/png")}
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["mime_type"] == "image/png"
    assert doc_data["transaction_id"] == exp_res.json()["transaction_id"]

    # 2. Unauthenticated user cannot stream document
    unauth_stream = client.get(f"/api/documents/{doc_id}/stream")
    assert unauth_stream.status_code == 401

    # 3. Viewer can securely stream document
    viewer_stream = viewer_client.get(f"/api/documents/{doc_id}/stream")
    assert viewer_stream.status_code == 200
    assert viewer_stream.headers["X-Content-Type-Options"] == "nosniff"
    assert viewer_stream.content == VALID_PNG_BYTES

def test_disallowed_extension_rejected(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    exp_res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Item",
        "category_id": cat_exp.id,
        "vendor": "Vendor",
        "total_amount": "100.00",
        "amount_paid": "0.00"
    })
    exp_id = exp_res.json()["id"]

    # Attempt to upload executable
    res = editor_client.post(
        "/api/documents/upload",
        data={"entity_type": "EXPENSE", "entity_id": exp_id},
        files={"file": ("malware.sh", io.BytesIO(b"#!/bin/bash\necho hack"), "application/x-sh")}
    )
    assert res.status_code == 400
    assert "Disallowed extension" in res.json()["detail"]

def test_fake_mime_rejected_by_magic_bytes(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    exp_res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Item",
        "category_id": cat_exp.id,
        "vendor": "Vendor",
        "total_amount": "100.00",
        "amount_paid": "0.00"
    })
    exp_id = exp_res.json()["id"]

    # Named photo.jpg, but contains plain text without JPEG magic bytes
    res = editor_client.post(
        "/api/documents/upload",
        data={"entity_type": "EXPENSE", "entity_id": exp_id},
        files={"file": ("fake_photo.jpg", io.BytesIO(b"Not an actual JPEG image!"), "image/jpeg")}
    )
    assert res.status_code == 400
    assert "signature does not match allowed types" in res.json()["detail"]
