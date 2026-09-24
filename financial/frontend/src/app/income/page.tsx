"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate } from "@/lib/formatters";
import { DocumentPreview } from "@/components/DocumentPreview";
import { TransactionModal } from "@/components/TransactionModal";

interface IncomeRecord {
  id: string;
  transaction_id: string;
  date: string;
  source: string;
  category_id: string;
  category_name?: string;
  amount: number;
  payment_method_name?: string;
  received_by: string;
  reference_number?: string;
  notes?: string;
  status: string;
  attachments: Array<any>;
}

export default function IncomePage() {
  const { role } = useAuth();
  const canEdit = role === "EDITOR" || role === "ADMIN";
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category_id", categoryFilter);
      if (monthFilter) params.append("month", monthFilter);

      const [incRes, catRes] = await Promise.all([
        api.get<IncomeRecord[]>(`/api/income?${params.toString()}`),
        api.get<any[]>("/api/metadata/categories?type=INCOME"),
      ]);

      setIncomes(incRes);
      setCategories(catRes);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load income records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, monthFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCancelIncome = async (inc: IncomeRecord) => {
    if (!confirm(`Are you sure you want to void/cancel ${inc.transaction_id} (${inc.source})? This action will be audited.`)) {
      return;
    }
    try {
      await api.post(`/api/income/${inc.id}/cancel`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel transaction.");
    }
  };

  // Total active income in current view
  const currentTotal = incomes
    .filter((i) => i.status === "CLEARED")
    .reduce((sum, i) => sum + (typeof i.amount === "string" ? parseFloat(i.amount) : i.amount), 0);

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Income Tracker</h1>
          <p className="page-subtitle">
            Monetary inflows from sponsorships, registrations, university funding, and fees
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            style={{
              padding: "0.4rem 0.875rem",
              backgroundColor: "var(--success-bg)",
              border: "1px solid var(--success-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "var(--text-secondary)", marginRight: "0.5rem" }}>Filter Total:</span>
            <strong className="tabular-num" style={{ color: "var(--success)" }}>
              {formatINR(currentTotal)}
            </strong>
          </div>

          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              + Record Income
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            placeholder="Search source, ref no, notes..."
            className="input-text"
            style={{ minWidth: "240px", flex: 1 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Income Categories</option>
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
            Search
          </button>

          {(search || categoryFilter || monthFilter) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("");
                setMonthFilter("");
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Income Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Source / Contributor</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th>Payment Method</th>
              <th>Received By</th>
              <th>Reference / Notes</th>
              <th>Status</th>
              <th>Receipt</th>
              {canEdit && <th style={{ textAlign: "center" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canEdit ? 11 : 10} style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-muted)" }}>Loading income records...</p>
                </td>
              </tr>
            ) : incomes.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 11 : 10} style={{ textAlign: "center", padding: "3rem" }}>
                  <div className="empty-state" style={{ padding: 0 }}>
                    <h3>No income records found</h3>
                    <p>Try adjusting your search filters or record a new transaction.</p>
                  </div>
                </td>
              </tr>
            ) : (
              incomes.map((inc) => {
                const isCancelled = inc.status === "CANCELLED";
                return (
                  <tr key={inc.id} style={{ opacity: isCancelled ? 0.5 : 1 }}>
                    <td>
                      <NextLink
                        href={`/income/${inc.id}`}
                        style={{
                          fontWeight: 600,
                          color: isCancelled ? "var(--text-muted)" : "var(--primary)",
                          textDecoration: "underline",
                        }}
                      >
                        {inc.transaction_id}
                      </NextLink>
                    </td>
                    <td>{formatDate(inc.date)}</td>
                    <td style={{ fontWeight: 500 }}>{inc.source}</td>
                    <td>
                      <span className="badge badge-info">{inc.category_name || "Income"}</span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: isCancelled ? "var(--text-muted)" : "var(--success)",
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                      className="tabular-num"
                    >
                      {formatINR(inc.amount)}
                    </td>
                    <td>{inc.payment_method_name || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{inc.received_by}</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "200px" }}>
                      {inc.reference_number && <strong style={{ display: "block" }}>{inc.reference_number}</strong>}
                      {inc.notes || "—"}
                    </td>
                    <td>
                      {isCancelled ? (
                        <span className="badge badge-danger">CANCELLED</span>
                      ) : (
                        <span className="badge badge-success">CLEARED</span>
                      )}
                    </td>
                    <td>
                      {inc.attachments && inc.attachments.length > 0 ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}
                          onClick={() => setPreviewDoc(inc.attachments[0])}
                        >
                          View ({inc.attachments.length})
                        </button>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>None</span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: "center" }}>
                        {!isCancelled && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                            onClick={() => handleCancelIncome(inc)}
                            title="Void this income entry"
                          >
                            Void
                          </button>
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

      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
