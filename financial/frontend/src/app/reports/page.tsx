"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { FileSpreadsheet, FileText, Download, AlertTriangle, Calendar, Database, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const { user, role } = useAuth();

  // Date Range state
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split("T")[0];
  const defaultEnd = today.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Preset Handlers
  const handlePreset = (type: "THIS_MONTH" | "LAST_3_MONTHS" | "YTD" | "LAST_12_MONTHS") => {
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    let startStr = "";

    if (type === "THIS_MONTH") {
      startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    } else if (type === "LAST_3_MONTHS") {
      startStr = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0];
    } else if (type === "YTD") {
      // Indian Financial Year starts April 1st, or calendar year Jan 1st
      startStr = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    } else if (type === "LAST_12_MONTHS") {
      startStr = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1).toISOString().split("T")[0];
    }

    setStartDate(startStr);
    setEndDate(endStr);
  };

  const validateRange = (): boolean => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return false;
    }
    if (startDate && endDate) {
      const diffDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24);
      if (diffDays > 366) {
        setError("Report range cannot exceed 12 months per request to prevent server timeouts.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleDownloadExcel = async () => {
    if (!validateRange()) return;
    try {
      setLoadingExcel(true);
      setError(null);
      setSuccessMessage(null);

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await fetch(`/api/reports/excel?${params.toString()}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Excel generation failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRS_Financial_Report_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage("6-Sheet Financial Workbook downloaded successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to download Excel report.");
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validateRange()) return;
    try {
      setLoadingPdf(true);
      setError(null);
      setSuccessMessage(null);

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await fetch(`/api/reports/pdf?${params.toString()}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `PDF generation failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KRS_Financial_Statement_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage("Official Institutional PDF Statement downloaded successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to download PDF statement.");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setLoadingExport(true);
      setError(null);
      setSuccessMessage(null);

      const res = await api.get<any>("/api/reports/export");
      const jsonStr = JSON.stringify(res, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `krs_financial_snapshot_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage("Raw database snapshot exported successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to export JSON data.");
    } finally {
      setLoadingExport(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Export Hub</h1>
          <p className="page-subtitle">
            Generate audited financial statements, multi-sheet workbooks, and archival snapshots
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius-md)",
            color: "#F87171",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "1rem",
            backgroundColor: "var(--success-bg)",
            border: "1px solid var(--success-border)",
            borderRadius: "var(--radius-md)",
            color: "#34D399",
            marginBottom: "1.5rem",
          }}
        >
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {/* Date Range Selection Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.125rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={20} style={{ color: "var(--primary)" }} /> Reporting Timeframe
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          Select the reporting period. Note: Reports are bounded to a maximum of 12 months per generation to ensure fast response times.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "flex-end" }}>
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-text"
              style={{ width: "180px" }}
            />
          </div>

          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-text"
              style={{ width: "180px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handlePreset("THIS_MONTH")}>
              This Month
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handlePreset("LAST_3_MONTHS")}>
              Last 3 Months
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handlePreset("YTD")}>
              Year to Date
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handlePreset("LAST_12_MONTHS")}>
              Last 12 Months
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Multi-Sheet Excel Card */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderColor: "rgba(16, 185, 129, 0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", color: "#FFFFFF" }}>6-Sheet Excel Workbook</h3>
                <span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>
                  Official Audit Format
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Comprehensive multi-sheet workbook matching institutional club accounting standards. Contains:
            </p>

            <ul
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                paddingLeft: "1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <li>Financial Summary (Key KPIs & Ratios)</li>
              <li>Income Register (All categorized inflows)</li>
              <li>Expense & Bills Register (Consolidated tracker)</li>
              <li>Outstanding Bills Register (Urgent dues)</li>
              <li>Monthly Cash Flow (Inflows vs Outflows)</li>
              <li>Category-wise Expense Breakdown</li>
            </ul>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", backgroundColor: "#10B981", borderColor: "#059669" }}
            onClick={handleDownloadExcel}
            disabled={loadingExcel}
          >
            {loadingExcel ? "Generating Workbook..." : <><Download size={16} /> Download .XLSX</>}
          </button>
        </div>

        {/* Institutional PDF Card */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderColor: "rgba(239, 68, 68, 0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", color: "#FFFFFF" }}>Institutional PDF Statement</h3>
                <span className="badge badge-danger" style={{ fontSize: "0.6875rem" }}>
                  University / Dean Submission
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Formal, print-ready PDF statement designed for submission to university authorities, club patron, or faculty advisor.
            </p>

            <ul
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                paddingLeft: "1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              <li>Official Kalam Robotics Society Header</li>
              <li>Period Net Cash Flow & Balance Table</li>
              <li>Outstanding Liabilities & Unpaid Bills</li>
              <li>Category Allocation Table</li>
              <li>Executive Sign-off / Verification section</li>
            </ul>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", backgroundColor: "#EF4444", borderColor: "#DC2626" }}
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
          >
            {loadingPdf ? "Generating Statement..." : <><Download size={16} /> Download .PDF</>}
          </button>
        </div>

        {/* Data Snapshot Export Card */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderColor: "rgba(6, 182, 212, 0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(6, 182, 212, 0.15)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Database size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", color: "#FFFFFF" }}>Data Snapshot Export</h3>
                <span className="badge badge-info" style={{ fontSize: "0.6875rem" }}>
                  JSON Snapshot
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Export complete structured JSON data containing all income entries, expenses, bills, categories, and payment methods.
            </p>

            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", color: "var(--warning)" }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "0.75rem", lineHeight: 1.4, color: "var(--text-secondary)" }}>
                  <strong style={{ color: "#FBBF24" }}>Archival Notice:</strong> This data snapshot is for manual migration or offline archiving. It does not replace automated database disaster recovery backups.
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={handleExportJson}
            disabled={loadingExport}
          >
            {loadingExport ? "Exporting Data..." : <><Download size={16} /> Export JSON Snapshot</>}
          </button>
        </div>
      </div>
    </div>
  );
}
