"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR } from "@/lib/formatters";

interface ImportRowError {
  row_number: number;
  field?: string;
  error_type: string;
  message: string;
}

interface ImportPreviewResponse {
  import_key: string;
  filename: string;
  total_rows: number;
  valid_rows: number;
  warning_count: number;
  error_count: number;
  duplicate_count: number;
  errors: ImportRowError[];
  preview_rows: Array<any>;
}

interface ImportResultResponse {
  total_processed: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  message: string;
}

export default function AdminImportPage() {
  const { role } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "UPDATE">("SKIP");
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<ImportResultResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (role && role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [role]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setResult(null);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setPreview(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await api.upload<ImportPreviewResponse>("/api/import/preview", formData);
      setPreview(data);
    } catch (err: any) {
      setError(err.message || "Failed to preview and parse import file");
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setCommitting(true);
    setError(null);

    try {
      const data = await api.post<ImportResultResponse>("/api/import/commit", {
        import_key: preview.import_key,
        duplicate_action: duplicateAction,
      });
      setResult(data);
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to commit import transaction");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Controlled Financial Data Import</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Ingest external legacy Excel spreadsheets (.xlsx) or CSV files with pre-commit dry run and duplicate detection
          </p>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>1. Select Financial Spreadsheet</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          Upload a spreadsheet containing income or expense columns (e.g. Date, Type, Description/Vendor, Category, Amount, Payment Method, Ref).
        </p>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm,.csv"
            onChange={handleFileChange}
            style={{
              padding: "0.6rem",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px dashed rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "#F9FAFB",
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handlePreview}
            disabled={!file || uploading}
          >
            {uploading ? "Analyzing & Validating..." : "Preview & Dry-Run Validate"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.85rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#EF4444",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              color: "#10B981",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "#10B981" }}>Import Completed!</h3>
            <p style={{ fontSize: "0.92rem", color: "#D1FAE5" }}>{result.message}</p>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", fontSize: "0.88rem" }}>
              <span>Created: <strong>{result.created_count}</strong></span>
              <span>Updated: <strong>{result.updated_count}</strong></span>
              <span>Skipped: <strong>{result.skipped_count}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Preview & Dry Run Section */}
      {preview && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Summary Badges */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))",
              gap: "1rem",
            }}
          >
            <div className="card" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Total Rows</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F9FAFB", marginTop: "0.2rem" }}>
                {preview.total_rows}
              </div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Valid Rows</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#10B981", marginTop: "0.2rem" }}>
                {preview.valid_rows}
              </div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Duplicate IDs</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: preview.duplicate_count > 0 ? "#F59E0B" : "var(--text-secondary)", marginTop: "0.2rem" }}>
                {preview.duplicate_count}
              </div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Errors</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: preview.error_count > 0 ? "#EF4444" : "var(--text-secondary)", marginTop: "0.2rem" }}>
                {preview.error_count}
              </div>
            </div>
          </div>

          {/* Errors List */}
          {preview.errors.length > 0 && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#EF4444" }}>
                Validation Issues ({preview.errors.length})
              </h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Field</th>
                      <th>Level</th>
                      <th>Issue Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((err, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>Row {err.row_number}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{err.field || "—"}</td>
                        <td>
                          <span className={`badge ${err.error_type === "ERROR" ? "badge-danger" : "badge-warning"}`}>
                            {err.error_type}
                          </span>
                        </td>
                        <td style={{ color: "#F3F4F6" }}>{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staged Data Preview */}
          {preview.preview_rows.length > 0 && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#F9FAFB" }}>
                Staged Rows Preview (Showing up to 25 rows)
              </h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Type</th>
                      <th>Txn ID</th>
                      <th>Date</th>
                      <th>Title / Vendor</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.slice(0, 25).map((row, idx) => (
                      <tr key={idx}>
                        <td>{row._row_num}</td>
                        <td>
                          <span className={`badge ${row._type === "INCOME" ? "badge-success" : "badge-danger"}`}>
                            {row._type}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{row._txn_id || "Auto"}</td>
                        <td>{row._date || "—"}</td>
                        <td style={{ fontWeight: 500 }}>{row._title}</td>
                        <td>{row._category}</td>
                        <td className="tabular-num" style={{ fontWeight: 600 }}>
                          {formatINR(row._amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commit Options Box */}
          <div className="card" style={{ padding: "1.75rem", backgroundColor: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.2)" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", color: "#F9FAFB" }}>2. Commit to Financial Ledger</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              Choose how duplicate transaction IDs (if any) should be handled during the atomic commit:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.9rem" }}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateAction === "SKIP"}
                  onChange={() => setDuplicateAction("SKIP")}
                />
                <span><strong>Skip duplicates</strong> — Only insert new transactions; leave existing records untouched.</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.9rem" }}>
                <input
                  type="radio"
                  name="dupAction"
                  checked={duplicateAction === "UPDATE"}
                  onChange={() => setDuplicateAction("UPDATE")}
                />
                <span><strong>Update duplicates</strong> — Overwrite matching transaction IDs with spreadsheet data.</span>
              </label>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCommit}
              disabled={committing || preview.valid_rows === 0}
            >
              {committing ? "Committing Staged Records..." : `Commit ${preview.valid_rows} Records to Ledger`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
