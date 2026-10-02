"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate } from "@/lib/formatters";

interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  budget_amount?: number;
  total_income: number;
  total_expenses_paid: number;
  pending_obligations: number;
  net_cash_flow: number;
  budget_remaining?: number;
  created_at: string;
}

export default function ProjectsPage() {
  const { role } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Project Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canEdit = role === "EDITOR" || role === "ADMIN";

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const data = await api.get<ProjectSummary[]>(`/api/projects${query}`);
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      await api.post("/api/projects", {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        budget_amount: budgetAmount ? parseFloat(budgetAmount) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status,
      });

      setShowCreateModal(false);
      setName("");
      setCode("");
      setDescription("");
      setBudgetAmount("");
      setStartDate("");
      setEndDate("");
      setStatus("PLANNED");
      loadProjects();
    } catch (err: any) {
      setFormError(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregated KPIs
  const totalIncome = projects.reduce((acc, p) => acc + (Number(p.total_income) || 0), 0);
  const totalPaid = projects.reduce((acc, p) => acc + (Number(p.total_expenses_paid) || 0), 0);
  const totalNet = projects.reduce((acc, p) => acc + (Number(p.net_cash_flow) || 0), 0);
  const totalPending = projects.reduce((acc, p) => acc + (Number(p.pending_obligations) || 0), 0);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "ACTIVE":
        return <span className="badge badge-success">ACTIVE</span>;
      case "COMPLETED":
        return <span className="badge badge-info">COMPLETED</span>;
      case "CANCELLED":
        return <span className="badge badge-muted">CANCELLED</span>;
      default:
        return <span className="badge badge-warning">PLANNED</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Projects & Events Ledger</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Track revenue, equipment procurement, and cash flows isolated by competition or workshop
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + New Project / Event
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Tracked Projects
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#F9FAFB", marginTop: "0.25rem" }}>
            {projects.length}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Projects Revenue
          </div>
          <div className="tabular-num" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#10B981", marginTop: "0.25rem" }}>
            {formatINR(totalIncome)}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Expenses Cleared
          </div>
          <div className="tabular-num" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#EF4444", marginTop: "0.25rem" }}>
            {formatINR(totalPaid)}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Net Projects Cashflow
          </div>
          <div
            className="tabular-num"
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: totalNet >= 0 ? "var(--primary)" : "#F59E0B",
              marginTop: "0.25rem",
            }}
          >
            {formatINR(totalNet)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {["ALL", "ACTIVE", "PLANNED", "COMPLETED", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`btn btn-sm ${statusFilter === st ? "btn-primary" : "btn-secondary"}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          No projects found under this filter. Create one to begin tracking event-specific financials!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: "1.25rem" }}>
          {projects.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "border-color 0.15s",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                        color: "var(--primary)",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                      }}
                    >
                      [{p.code}]
                    </span>
                    <h3 style={{ fontSize: "1.2rem", marginTop: "0.2rem", color: "#F9FAFB" }}>{p.name}</h3>
                  </div>
                  {getStatusBadge(p.status)}
                </div>

                {p.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.25rem", lineHeight: 1.4 }}>
                    {p.description}
                  </p>
                )}

                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "8px",
                    padding: "1rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                    fontSize: "0.85rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Income:</span>
                    <div className="tabular-num" style={{ fontWeight: 600, color: "#10B981" }}>
                      {formatINR(p.total_income)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Paid Out:</span>
                    <div className="tabular-num" style={{ fontWeight: 600, color: "#EF4444" }}>
                      {formatINR(p.total_expenses_paid)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Pending Bills:</span>
                    <div className="tabular-num" style={{ fontWeight: 600, color: p.pending_obligations > 0 ? "#F59E0B" : "var(--text-secondary)" }}>
                      {formatINR(p.pending_obligations)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Net Cashflow:</span>
                    <div className="tabular-num" style={{ fontWeight: 700, color: p.net_cash_flow >= 0 ? "var(--primary)" : "#EF4444" }}>
                      {formatINR(p.net_cash_flow)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Budget: {p.budget_amount ? formatINR(p.budget_amount) : "Not capped"}
                </span>
                <NextLink href={`/projects/${p.id}`} className="btn btn-secondary btn-sm">
                  View Ledger →
                </NextLink>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
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
            style={{ width: "100%", maxWidth: "540px", padding: "2rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>Create Project or Event</h2>
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
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Project / Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RoboWars 2026 National Competition"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="split-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Project Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RW26"
                    className="input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="label">Budget Cap (₹, Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50000"
                    className="input"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="split-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Status</label>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="PLANNED">PLANNED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label className="label">Description / Scope</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Notes on scope, team leads, or sponsor deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
