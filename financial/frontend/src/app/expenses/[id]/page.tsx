"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate } from "@/lib/formatters";
import { PaymentModal } from "@/components/PaymentModal";
import { DocumentPreview } from "@/components/DocumentPreview";

interface ExpensePayment {
  id: string;
  expense_id: string;
  amount: number;
  payment_date: string;
  payment_method_name?: string;
  reference_number?: string;
  notes?: string;
  creator_name?: string;
  created_at: string;
}

interface ExpenseAttachment {
  id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  document_type?: string;
}

interface ExpenseDetail {
  id: string;
  transaction_id: string;
  bill_date: string;
  description: string;
  category_id: string;
  category_name?: string;
  vendor: string;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  status: string;
  is_overdue: boolean;
  due_date?: string;
  payment_date?: string;
  payment_method_name?: string;
  reference_number?: string;
  notes?: string;
  project_id?: string;
  project_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachments: ExpenseAttachment[];
  payments: ExpensePayment[];
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const canEdit = role === "EDITOR" || role === "ADMIN";

  const loadExpense = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<ExpenseDetail>(`/api/expenses/${params.id}`);
      setExpense(data);
    } catch (err: any) {
      setError(err.message || "Failed to load expense record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadExpense();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "#9CA3AF" }}>Loading expense details...</p>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="app-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
          <h3 style={{ color: "#EF4444", marginBottom: "1rem" }}>Record Not Found</h3>
          <p style={{ color: "#9CA3AF", marginBottom: "1.5rem" }}>
            {error || "The requested expense transaction does not exist."}
          </p>
          <NextLink href="/expenses" className="btn btn-primary">
            ← Return to Expenses
          </NextLink>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) return <span className="badge badge-danger">OVERDUE</span>;
    switch (status) {
      case "PAID":
        return <span className="badge badge-success">PAID</span>;
      case "PARTIALLY_PAID":
        return <span className="badge badge-warning">PARTIAL</span>;
      case "CANCELLED":
        return <span className="badge badge-muted">CANCELLED</span>;
      default:
        return <span className="badge badge-info">PENDING</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation & Breadcrumb */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#9CA3AF" }}>
          <NextLink href="/expenses" style={{ color: "#3B82F6", textDecoration: "none" }}>
            Expenses & Bills
          </NextLink>
          <span>/</span>
          <span style={{ color: "#F9FAFB", fontWeight: 600 }}>{expense.transaction_id}</span>
        </div>
        <NextLink href="/expenses" className="btn btn-secondary btn-sm">
          ← Back to Expenses
        </NextLink>
      </div>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{expense.description}</h1>
              {getStatusBadge(expense.status, expense.is_overdue)}
              {expense.project_name && (
                <NextLink
                  href={`/projects/${expense.project_id}`}
                  className="badge badge-info"
                  style={{ textDecoration: "none" }}
                  title="Tagged Project"
                >
                  📁 {expense.project_name}
                </NextLink>
              )}
            </div>
            <p style={{ color: "#9CA3AF", fontSize: "0.95rem" }}>
              Vendor: <strong style={{ color: "#F3F4F6" }}>{expense.vendor}</strong> • Bill Date: {formatDate(expense.bill_date)}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {canEdit && expense.status !== "PAID" && expense.status !== "CANCELLED" && (
              <button
                className="btn btn-primary"
                onClick={() => setShowPaymentModal(true)}
              >
                + Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Financial Stat Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>Total Bill</div>
            <div className="tabular-num" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F9FAFB", marginTop: "0.25rem" }}>
              {formatINR(expense.total_amount)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>Amount Paid</div>
            <div className="tabular-num" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10B981", marginTop: "0.25rem" }}>
              {formatINR(expense.amount_paid)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>Pending Balance</div>
            <div
              className="tabular-num"
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: expense.amount_pending > 0 ? "#EF4444" : "#9CA3AF",
                marginTop: "0.25rem",
              }}
            >
              {formatINR(expense.amount_pending)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>Due Date</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: expense.is_overdue ? "#EF4444" : "#F3F4F6", marginTop: "0.45rem" }}>
              {expense.due_date ? formatDate(expense.due_date) : "None (Immediate)"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Bill Metadata Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1.25rem", color: "#F9FAFB" }}>Bill Metadata</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Transaction ID</span>
              <span style={{ fontWeight: 600, color: "#F3F4F6" }}>{expense.transaction_id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Expense Category</span>
              <span style={{ fontWeight: 500, color: "#F3F4F6" }}>{expense.category_name || "Uncategorized"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Default Payment Method</span>
              <span style={{ color: "#F3F4F6" }}>{expense.payment_method_name || "None specified"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Reference / Invoice #</span>
              <span style={{ color: "#F3F4F6" }}>{expense.reference_number || "None"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9CA3AF" }}>Recorded On</span>
              <span style={{ color: "#F3F4F6" }}>{formatDate(expense.created_at)}</span>
            </div>
            {expense.notes && (
              <div style={{ marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <span style={{ color: "#9CA3AF", display: "block", marginBottom: "0.3rem" }}>Internal Notes:</span>
                <p style={{ color: "#E2E8F0", whiteSpace: "pre-line", fontSize: "0.88rem" }}>{expense.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Vault Attachments Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", margin: 0, color: "#F9FAFB" }}>
              Vault Documents ({expense.attachments.length})
            </h3>
          </div>

          {expense.attachments.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280", fontSize: "0.9rem" }}>
              No receipts, bills, or invoices attached to this record yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {expense.attachments.map((att) => (
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
                    <div style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>
                      {att.document_type || "OTHER"} • {Math.round(att.file_size / 1024)} KB
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

      {/* Canonical Payment History */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: 0, color: "#F9FAFB" }}>
              Payment History ({expense.payments.length})
            </h3>
            <p style={{ color: "#9CA3AF", fontSize: "0.85rem", marginTop: "0.2rem" }}>
              Canonical audit of partial and full clearances toward this obligation
            </p>
          </div>
          {canEdit && expense.status !== "PAID" && expense.status !== "CANCELLED" && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)}>
              + Record Payment
            </button>
          )}
        </div>

        {expense.payments.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#6B7280" }}>
            No payments have been recorded yet. Total obligation of {formatINR(expense.total_amount)} remains outstanding.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Payment Date</th>
                  <th>Amount Paid</th>
                  <th>Payment Method</th>
                  <th>Reference / UPI Txn</th>
                  <th>Notes</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {expense.payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#9CA3AF" }}>
                      {p.id.slice(0, 8)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatDate(p.payment_date)}</td>
                    <td className="tabular-num" style={{ fontWeight: 600, color: "#10B981" }}>
                      {formatINR(p.amount)}
                    </td>
                    <td>{p.payment_method_name || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                      {p.reference_number || "—"}
                    </td>
                    <td style={{ color: "#9CA3AF", fontSize: "0.85rem" }}>{p.notes || "—"}</td>
                    <td style={{ color: "#E2E8F0" }}>{p.creator_name || "Staff"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          expense={expense as any}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadExpense();
          }}
        />
      )}

      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
