"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate } from "@/lib/formatters";

interface ProjectTransactionItem {
  id: string;
  transaction_id: string;
  type: string;
  date: string;
  title: string;
  amount: number;
  status: string;
}

interface ProjectDetail {
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
  incomes: ProjectTransactionItem[];
  expenses: ProjectTransactionItem[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"incomes" | "expenses">("expenses");

  const canEdit = role === "EDITOR" || role === "ADMIN";

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<ProjectDetail>(`/api/projects/${params.id}`);
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadProject();
    }
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!canEdit) return;
    try {
      await api.put(`/api/projects/${params.id}`, { status: newStatus });
      loadProject();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading project ledger...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="app-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
          <h3 style={{ color: "#EF4444", marginBottom: "1rem" }}>Project Not Found</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {error || "The requested project ledger does not exist."}
          </p>
          <NextLink href="/projects" className="btn btn-primary">
            ← Return to Projects
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
          <NextLink href="/projects" style={{ color: "var(--primary)", textDecoration: "none" }}>
            Projects & Events
          </NextLink>
          <span>/</span>
          <span style={{ color: "#F9FAFB", fontWeight: 600 }}>[{project.code}] {project.name}</span>
        </div>
        <NextLink href="/projects" className="btn btn-secondary btn-sm">
          ← Back to Projects
        </NextLink>
      </div>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1rem",
                  color: "var(--primary)",
                  fontWeight: 700,
                  backgroundColor: "rgba(6, 182, 212, 0.15)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "6px",
                }}
              >
                {project.code}
              </span>
              <h1 style={{ fontSize: "1.7rem", margin: 0 }}>{project.name}</h1>
            </div>
            {project.description && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "800px", lineHeight: 1.4 }}>
                {project.description}
              </p>
            )}
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span>Period: {project.start_date ? formatDate(project.start_date) : "TBD"} – {project.end_date ? formatDate(project.end_date) : "Ongoing"}</span>
              <span>Created: {formatDate(project.created_at)}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {canEdit && (
              <select
                className="input"
                style={{ width: "auto", fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            )}
          </div>
        </div>

        {/* Financial Stat Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Project Revenue
            </div>
            <div className="tabular-num" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#10B981", marginTop: "0.25rem" }}>
              {formatINR(project.total_income)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Expenses Paid Out
            </div>
            <div className="tabular-num" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#EF4444", marginTop: "0.25rem" }}>
              {formatINR(project.total_expenses_paid)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Pending Bills
            </div>
            <div
              className="tabular-num"
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: project.pending_obligations > 0 ? "#F59E0B" : "var(--text-secondary)",
                marginTop: "0.25rem",
              }}
            >
              {formatINR(project.pending_obligations)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Net Event Cash Flow
            </div>
            <div
              className="tabular-num"
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: project.net_cash_flow >= 0 ? "var(--primary)" : "#EF4444",
                marginTop: "0.25rem",
              }}
            >
              {formatINR(project.net_cash_flow)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
              Budget Remaining
            </div>
            <div
              className="tabular-num"
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginTop: "0.25rem",
              }}
            >
              {project.budget_remaining !== undefined && project.budget_remaining !== null
                ? formatINR(project.budget_remaining)
                : "No budget cap"}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`btn btn-sm ${activeTab === "expenses" ? "btn-primary" : "btn-secondary"}`}
        >
          Tagged Expenses ({project.expenses.length})
        </button>
        <button
          onClick={() => setActiveTab("incomes")}
          className={`btn btn-sm ${activeTab === "incomes" ? "btn-primary" : "btn-secondary"}`}
        >
          Tagged Revenue & Sponsorships ({project.incomes.length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: "1.25rem" }}>
        {activeTab === "expenses" ? (
          project.expenses.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
              No expenses have been tagged with project code [{project.code}] yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Date</th>
                    <th>Vendor / Item</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {project.expenses.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{tx.transaction_id}</td>
                      <td>{formatDate(tx.date)}</td>
                      <td>{tx.title}</td>
                      <td className="tabular-num" style={{ fontWeight: 600, color: "#EF4444" }}>
                        {formatINR(tx.amount)}
                      </td>
                      <td>
                        <span className="badge badge-info">{tx.status}</span>
                      </td>
                      <td>
                        <NextLink href={`/expenses/${tx.transaction_id}`} className="btn btn-secondary btn-sm">
                          View Bill →
                        </NextLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : project.incomes.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            No revenue or funding records have been tagged with project code [{project.code}] yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {project.incomes.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{tx.transaction_id}</td>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.title}</td>
                    <td className="tabular-num" style={{ fontWeight: 600, color: "#10B981" }}>
                      {formatINR(tx.amount)}
                    </td>
                    <td>
                      <span className="badge badge-success">{tx.status}</span>
                    </td>
                    <td>
                      <NextLink href={`/income/${tx.transaction_id}`} className="btn btn-secondary btn-sm">
                        View Record →
                      </NextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
