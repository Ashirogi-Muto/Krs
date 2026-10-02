"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/formatters";
import { DocumentPreview } from "@/components/DocumentPreview";

interface IncomeAttachment {
  id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  document_type?: string;
}

interface IncomeDetail {
  id: string;
  transaction_id: string;
  date: string;
  source: string;
  category_id: string;
  category_name?: string;
  amount: number;
  payment_method_id: string;
  payment_method_name?: string;
  received_by: string;
  reference_number?: string;
  notes?: string;
  project_id?: string;
  project_name?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachments: IncomeAttachment[];
}

export default function IncomeDetailPage() {
  const params = useParams();
  const [income, setIncome] = useState<IncomeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const loadIncome = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<IncomeDetail>(`/api/income/${params.id}`);
      setIncome(data);
    } catch (err: any) {
      setError(err.message || "Failed to load income record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadIncome();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading income record...</p>
      </div>
    );
  }

  if (error || !income) {
    return (
      <div className="app-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
          <h3 style={{ color: "#EF4444", marginBottom: "1rem" }}>Record Not Found</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {error || "The requested income transaction does not exist."}
          </p>
          <NextLink href="/income" className="btn btn-primary">
            ← Return to Income
          </NextLink>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation & Breadcrumb */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          <NextLink href="/income" style={{ color: "var(--primary)", textDecoration: "none" }}>
            Income
          </NextLink>
          <span>/</span>
          <span style={{ color: "#F9FAFB", fontWeight: 600 }}>{income.transaction_id}</span>
        </div>
        <NextLink href="/income" className="btn btn-secondary btn-sm">
          ← Back to Income
        </NextLink>
      </div>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{income.source}</h1>
              <span className="badge badge-success">CLEARED</span>
              {income.project_name && (
                <NextLink
                  href={`/projects/${income.project_id}`}
                  className="badge badge-info"
                  style={{ textDecoration: "none" }}
                  title="Tagged Project"
                >
                  📁 {income.project_name}
                </NextLink>
              )}
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Received by: <strong style={{ color: "#F3F4F6" }}>{income.received_by}</strong> • Date: {formatDate(income.date)}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Total Received
            </div>
            <div className="tabular-num" style={{ fontSize: "1.85rem", fontWeight: 700, color: "#10B981", marginTop: "0.25rem" }}>
              {formatINR(income.amount)}
            </div>
          </div>
        </div>
      </div>

      <div className="split-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Income Metadata Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1.25rem", color: "#F9FAFB" }}>Income Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Transaction ID</span>
              <span style={{ fontWeight: 600, color: "#F3F4F6" }}>{income.transaction_id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Income Category</span>
              <span style={{ fontWeight: 500, color: "#F3F4F6" }}>{income.category_name || "Uncategorized"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Payment Channel</span>
              <span style={{ color: "#F3F4F6" }}>{income.payment_method_name || "Direct Deposit"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Reference #</span>
              <span style={{ color: "#F3F4F6" }}>{income.reference_number || "None"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Recorded On</span>
              <span style={{ color: "#F3F4F6" }}>{formatDate(income.created_at)}</span>
            </div>
            {income.notes && (
              <div style={{ marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>Notes:</span>
                <p style={{ color: "var(--text-primary)", whiteSpace: "pre-line", fontSize: "0.88rem" }}>{income.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Linked Documents Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1.25rem", color: "#F9FAFB" }}>
            Vault Documents ({income.attachments.length})
          </h3>

          {income.attachments.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No receipts or payment confirmations attached to this income record.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {income.attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.92rem", color: "#F9FAFB" }}>{att.filename}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {att.document_type || "RECEIPT"} • {Math.round(att.file_size / 1024)} KB
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewDoc(att)}
                  >
                    View Document
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
