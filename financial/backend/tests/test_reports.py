"""Report generation and resource control tests."""
import io
import openpyxl
from datetime import date, timedelta

def test_excel_report_generation(viewer_client):
    res = viewer_client.post("/api/reports/excel")
    assert res.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in res.headers["content-type"]

    # Verify workbook structure
    wb = openpyxl.load_workbook(io.BytesIO(res.content))
    expected_sheets = ["Summary", "Income", "Expenses", "Pending Bills", "Monthly Analysis", "Document Index"]
    for s in expected_sheets:
        assert s in wb.sheetnames

def test_pdf_report_generation(viewer_client):
    res = viewer_client.post("/api/reports/pdf")
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert res.content.startswith(b"%PDF-")

def test_date_range_exceeding_12_months_rejected(viewer_client):
    start = (date.today() - timedelta(days=450)).isoformat()
    end = date.today().isoformat()
    res = viewer_client.post(f"/api/reports/excel?start_date={start}&end_date={end}")
    assert res.status_code == 400
    assert "exceeds maximum allowed period" in res.json()["detail"]
