"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate } from "@/lib/formatters";

interface BudgetItem {
  id: string;
  category_id: string;
  category_name?: string;
  allocated_amount: number;
  actual_spent: number;
  remaining: number;
  utilization_pct: number;
}

interface BudgetRecord {
  id: string;
  name: string;
  project_id?: string;
  project_name?: string;
  period_start: string;
  period_end: string;
  total_budget: number;
  status: string;
  actual_spent: number;
  remaining: number;
  utilization_pct: number;
  items: BudgetItem[];
  created_at: string;
}

export default function BudgetsPage() {
  const { role } = useAuth();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [items, setItems] = useState<Array<{ category_id: string; allocated_amount: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canEdit = role === "EDITOR" || role === "ADMIN";

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [budRes, catRes, projRes] = await Promise.all([
        api.get<BudgetRecord[]>("/api/budgets"),
        api.get<any[]>("/api/metadata/categories?type=EXPENSE"),
        api.get<any[]>("/api/projects"),
      ]);
      setBudgets(budRes);
      setCategories(catRes.filter((c: any) => c.is_active));
      setProjects(projRes);
    } catch (err: any) {
      setError(err.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItemRow = () => {
    if (categories.length > 0) {
      setItems([...items, { category_id: categories[0].id, allocated_amount: "" }]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const tot = parseFloat(totalBudget);
    if (!tot || tot <= 0) {
      setFormError("Total budget must be greater than zero");
      setSubmitting(false);
      return;
    }

    const itemAllocations = items.map((it) => ({
      category_id: it.category_id,
      allocated_amount: parseFloat(it.allocated_amount) || 0,
    }));

    const itemsSum = itemAllocations.reduce((acc, it) => acc + it.allocated_amount, 0);
    if (itemsSum > tot) {
      setFormError(`Sum of allocations (₹${itemsSum}) exceeds total budget (₹${tot})`);
      setSubmitting(false);
      return;
    }

    try {
      await api.post("/api/budgets", {
        name: name.trim(),
        project_id: projectId || undefined,
        period_start: periodStart,
        period_end: periodEnd,
        total_budget: tot,
        items: itemAllocations,
      });

      setShowCreateModal(false);
      setName("");
      setProjectId("");
      setPeriodStart("");
      setPeriodEnd("");
      setTotalBudget("");
      setItems([]);
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressBarColor = (pct: number) => {
    if (pct > 100) return "#EF4444";
    if (pct > 80) return "#F59E0B";
    return "#10B981";
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Budgets & Allocations</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Itemized category budget allocations with live variance tracking against actual expense clearances
          </p>
        </div>
        <div>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Create Budget
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          No budgets configured yet. Create a budget plan for the academic year or an upcoming event!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {budgets.map((b) => {
            const barColor = getProgressBarColor(b.utilization_pct);
            return (
              <div key={b.id} className="card" style={{ padding: "1.75rem" }}>
                {/* Budget Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                      <h2 style={{ fontSize: "1.35rem", margin: 0 }}>{b.name}</h2>
                      <span className="badge badge-info">{b.status}</span>
                      {b.project_name && (
                        <span className="badge badge-muted">📁 {b.project_name}</span>
                      )}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Period: {formatDate(b.period_start)} to {formatDate(b.period_end)}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                      Budget Utilization
                    </div>
                    <div className="tabular-num" style={{ fontSize: "1.5rem", fontWeight: 700, color: barColor, marginTop: "0.2rem" }}>
                      {b.utilization_pct}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, b.utilization_pct)}%`,
                      backgroundColor: barColor,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Overview KPIs */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))",
                    gap: "1rem",
                    paddingBottom: "1.25rem",
                    marginBottom: "1.25rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Total Budget</span>
                    <div className="tabular-num" style={{ fontWeight: 600, fontSize: "1.15rem", color: "#F9FAFB" }}>
                      {formatINR(b.total_budget)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Actual Spend</span>
                    <div className="tabular-num" style={{ fontWeight: 600, fontSize: "1.15rem", color: "#EF4444" }}>
                      {formatINR(b.actual_spent)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Remaining</span>
                    <div
                      className="tabular-num"
                      style={{
                        fontWeight: 600,
                        fontSize: "1.15rem",
                        color: b.remaining >= 0 ? "#10B981" : "#EF4444",
                      }}
                    >
                      {formatINR(b.remaining)}
                    </div>
                  </div>
                </div>

                {/* Category Allocations Breakdown Table */}
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Category Breakdown ({b.items.length})
                </h4>

                {b.items.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No category items allocated.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Expense Category</th>
                          <th>Allocated</th>
                          <th>Actual Spent</th>
                          <th>Remaining</th>
                          <th>Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.items.map((it) => (
                          <tr key={it.id}>
                            <td style={{ fontWeight: 500 }}>{it.category_name || "Category"}</td>
                            <td className="tabular-num">{formatINR(it.allocated_amount)}</td>
                            <td className="tabular-num" style={{ color: "#EF4444" }}>{formatINR(it.actual_spent)}</td>
                            <td className="tabular-num" style={{ color: it.remaining >= 0 ? "#10B981" : "#EF4444" }}>
                              {formatINR(it.remaining)}
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div
                                  style={{
                                    flex: 1,
                                    maxWidth: "100px",
                                    height: "6px",
                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${Math.min(100, it.utilization_pct)}%`,
                                      backgroundColor: getProgressBarColor(it.utilization_pct),
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: getProgressBarColor(it.utilization_pct) }}>
                                  {it.utilization_pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "620px", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>Create Budget Plan</h2>
            {formError && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#EF4444",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateBudget}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Budget Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY 2026-27 Hardware & Competitions"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="split-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Project Association (Optional)</label>
                  <select
                    className="input"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">General Club Budget</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Total Budget Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="100000"
                    className="input"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="split-2" style={{ gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label className="label">Period Start Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Period End Date *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* Itemized Allocations */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <label className="label" style={{ margin: 0 }}>Category Allocations</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                    + Add Category Allocation
                  </button>
                </div>

                {items.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    No specific categories added yet. You can add category allocations now or later.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {items.map((it, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <select
                          className="input"
                          style={{ flex: 1 }}
                          value={it.category_id}
                          onChange={(e) => handleItemChange(idx, "category_id", e.target.value)}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Allocated ₹"
                          className="input"
                          style={{ width: "140px" }}
                          value={it.allocated_amount}
                          onChange={(e) => handleItemChange(idx, "allocated_amount", e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveItemRow(idx)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
