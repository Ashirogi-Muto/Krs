"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate } from "@/lib/formatters";
import { PaymentModal } from "@/components/PaymentModal";
import { DocumentPreview } from "@/components/DocumentPreview";
import { TransactionModal } from "@/components/TransactionModal";

interface ExpenseRecord {
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
  attachments: Array<any>;
}

export default function ExpensesPage() {
  const { role } = useAuth();
  const canEdit = role === "EDITOR" || role === "ADMIN";
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const [paymentExpense, setPaymentExpense] = useState<ExpenseRecord | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category_id", categoryFilter);
      if (monthFilter) params.append("month", monthFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const [expRes, catRes] = await Promise.all([
        api.get<ExpenseRecord[]>(`/api/expenses?${params.toString()}`),
        api.get<any[]>("/api/metadata/categories?type=EXPENSE"),
      ]);

      setExpenses(expRes);
      setCategories(catRes);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, monthFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCancelExpense = async (exp: ExpenseRecord) => {
    if (!confirm(`Are you sure you want to void/cancel ${exp.transaction_id} (${exp.description})? This will be recorded in the audit trail.`)) {
      return;
    }
    try {
      await api.post(`/api/expenses/${exp.id}/cancel`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel transaction.");
    }
  };

  // Filter totals
  const totalBilled = expenses
    .filter((e) => e.status !== "CANCELLED")
    .reduce((sum, e) => sum + (typeof e.total_amount === "string" ? parseFloat(e.total_amount) : e.total_amount), 0);

  const totalCleared = expenses
    .filter((e) => e.status !== "CANCELLED")
    .reduce((sum, e) => sum + (typeof e.amount_paid === "string" ? parseFloat(e.amount_paid) : e.amount_paid), 0);

  const totalPending = expenses
    .filter((e) => e.status !== "CANCELLED")
    .reduce((sum, e) => sum + (typeof e.amount_pending === "string" ? parseFloat(e.amount_pending) : e.amount_pending), 0);

  const overdueCount = expenses.filter((e) => e.status !== "CANCELLED" && e.is_overdue).length;

  const statusOptions = [
    { label: "All Bills", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Partially Paid", value: "PARTIALLY_PAID" },
    { label: "Overdue", value: "OVERDUE" },
    { label: "Fully Paid", value: "PAID" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses & Bills Tracker</h1>
          <p className="page-subtitle">
            Consolidated ledger of club commitments, vendor bills, and payment clearances
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              + Record Expense / Bill
            </button>
          )}
        </div>
      </div>

      {/* Summary Chips for Active Filter */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="card" style={{ padding: "0.875rem 1.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Billed
          </span>
          <div className="tabular-num" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {formatINR(totalBilled)}
          </div>
        </div>

        <div className="card" style={{ padding: "0.875rem 1.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Cleared (Paid)
          </span>
          <div className="tabular-num" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--success)" }}>
            {formatINR(totalCleared)}
          </div>
        </div>

        <div className="card" style={{ padding: "0.875rem 1.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Pending (Due)
          </span>
          <div
            className="tabular-num"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: totalPending > 0 ? "var(--warning)" : "var(--text-secondary)",
            }}
          >
            {formatINR(totalPending)}
          </div>
        </div>

        <div className="card" style={{ padding: "0.875rem 1.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Overdue Commitments
          </span>
          <div
            className="tabular-num"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: overdueCount > 0 ? "var(--danger)" : "var(--text-muted)",
            }}
          >
            {overdueCount} bills
          </div>
        </div>
      </div>

      {/* Filter Tabs and Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          {(["ALL", "PENDING", "OVERDUE", "PAID"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`btn btn-sm ${statusFilter === tab ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "var(--radius-full)" }}
            >
              {tab === "ALL"
                ? "All Expenses"
                : tab === "PENDING"
                ? "Pending / Unsettled"
                : tab === "OVERDUE"
                ? "Overdue Bills"
                : "Cleared / Paid"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            placeholder="Search description, vendor, ref no..."
            className="input-text"
            style={{ minWidth: "220px", flex: 1 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Expense Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="month"
            className="input-text"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            title="Filter by month"
          />

          <button type="submit" className="btn btn-secondary btn-sm">
            Filter
          </button>

          {(search || categoryFilter || monthFilter || statusFilter !== "ALL") && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setMonthFilter("");
                setStatusFilter("ALL");
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Expenses & Bills Table */}
      <div className="table-container stack">
        <table className="data-table stack">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bill Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Vendor</th>
              <th style={{ textAlign: "right" }}>Total Bill</th>
              <th style={{ textAlign: "right" }}>Paid</th>
              <th style={{ textAlign: "right" }}>Pending Due</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Receipt</th>
              {canEdit && <th style={{ textAlign: "center" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canEdit ? 12 : 11} style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-muted)" }}>Loading expenses and bills...</p>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 12 : 11} style={{ textAlign: "center", padding: "3rem" }}>
                  <div className="empty-state" style={{ padding: 0 }}>
                    <h3>No transactions match current filters</h3>
                    <p>Try resetting filters or adding a new expense entry.</p>
                  </div>
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const isCancelled = exp.status === "CANCELLED";
                const hasPending = exp.amount_pending > 0;

                return (
                  <tr key={exp.id} style={{ opacity: isCancelled ? 0.5 : 1 }}>
                    <td data-label="ID">
                      <NextLink
                        href={`/expenses/${exp.id}`}
                        style={{
                          fontWeight: 600,
                          color: isCancelled ? "var(--text-muted)" : "var(--primary)",
                          textDecoration: "underline",
                        }}
                      >
                        {exp.transaction_id}
                      </NextLink>
                    </td>
                    <td data-label="Bill Date">{formatDate(exp.bill_date)}</td>
                    <td className="primary-cell" style={{ fontWeight: 500 }}>
                      <div>{exp.description}</div>
                      {exp.notes && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td data-label="Category">
                      <span className="badge badge-info">{exp.category_name || "General"}</span>
                    </td>
                    <td data-label="Vendor" style={{ color: "var(--text-secondary)" }}>{exp.vendor}</td>
                    <td data-label="Total Bill"
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                      className="tabular-num"
                    >
                      {formatINR(exp.total_amount)}
                    </td>
                    <td data-label="Paid" style={{ textAlign: "right", color: "var(--success)" }} className="tabular-num">
                      {formatINR(exp.amount_paid)}
                    </td>
                    <td data-label="Pending Due"
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: hasPending ? "var(--warning)" : "var(--text-muted)",
                      }}
                      className="tabular-num"
                    >
                      {formatINR(exp.amount_pending)}
                    </td>
                    <td data-label="Status">
                      {isCancelled ? (
                        <span className="badge badge-danger">CANCELLED</span>
                      ) : exp.is_overdue ? (
                        <span className="badge badge-danger">OVERDUE</span>
                      ) : exp.status === "PAID" ? (
                        <span className="badge badge-success">PAID</span>
                      ) : exp.status === "PARTIALLY_PAID" ? (
                        <span className="badge badge-warning">PARTIALLY PAID</span>
                      ) : (
                        <span className="badge badge-info">PENDING</span>
                      )}
                    </td>
                    <td data-label="Due Date" style={{ color: exp.is_overdue ? "#F87171" : "var(--text-secondary)" }}>
                      {formatDate(exp.due_date)}
                    </td>
                    <td data-label="Receipt">
                      {exp.attachments && exp.attachments.length > 0 ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}
                          onClick={() => setPreviewDoc(exp.attachments[0])}
                        >
                          View ({exp.attachments.length})
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>None</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="actions-cell" data-label="" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {!isCancelled && (
                          <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                            {hasPending && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                                onClick={() => setPaymentExpense(exp)}
                              >
                                Record Payment
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                              onClick={() => handleCancelExpense(exp)}
                              title="Void this bill entry"
                            >
                              Void
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <TransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}

      {paymentExpense && (
        <PaymentModal
          expense={paymentExpense}
          onClose={() => setPaymentExpense(null)}
          onSuccess={() => {
            setPaymentExpense(null);
            loadData();
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
