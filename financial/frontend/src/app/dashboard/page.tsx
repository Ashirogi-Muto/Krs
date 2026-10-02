"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { formatINR, formatDate, formatMonthName } from "@/lib/formatters";
import { KPICard } from "@/components/KPICard";
import { PaymentModal } from "@/components/PaymentModal";
import { DocumentPreview } from "@/components/DocumentPreview";
import NextLink from "next/link";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { DueSoon } from "@/components/dashboard/DueSoon";
import { BudgetUsage, type BudgetRow } from "@/components/dashboard/BudgetUsage";

interface DashboardData {
  kpis: {
    total_income: number;
    total_expenses_paid: number;
    available_cash: number;
    pending_bills: number;
    current_month_expenses: number;
    transaction_count: number;
  };
  monthly_cash_flow: Array<{
    month: string;
    month_name: string;
    income: number;
    expenses: number;
    net_cash_flow: number;
  }>;
  category_breakdown: Array<{
    category_id: string;
    category_name: string;
    total_amount: number;
    percentage: number;
    count: number;
  }>;
  recent_expenses: Array<any>;
  pending_expenses: Array<any>;
}

export default function DashboardPage() {
  const { role } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentExpense, setPaymentExpense] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await api.get<DashboardData>("/api/dashboard");
      setData(res);
      // Budget panel is optional: never block the dashboard on it
      api.get<BudgetRow[]>("/api/budgets?status=ACTIVE").then(setBudgets).catch(() => setBudgets([]));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading financial indicators...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-container">
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: "var(--radius-md)",
            color: "#FCA5A5",
          }}
        >
          <h3>Unable to load financial data</h3>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>{error}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }} onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { kpis, monthly_cash_flow, category_breakdown, pending_expenses } = data;

  return (
    <div className="app-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Overview</h1>
          <p className="page-subtitle">
            Kalam Robotics Society — Centralized Treasury & Ledger
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <NextLink href="/expenses" className="btn btn-secondary btn-sm">
            View All Bills
          </NextLink>
          <NextLink href="/reports" className="btn btn-secondary btn-sm">
            Export Reports
          </NextLink>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid six">
        <KPICard
          label="Total Income Received"
          value={kpis.total_income}
          description="Total funds received into club accounts"
          badgeText="Inflow"
          badgeType="success"
        />
        <KPICard
          label="Total Bills Cleared"
          value={kpis.total_expenses_paid}
          description="Total amount disbursed towards bills"
          badgeText="Outflow"
          badgeType="danger"
        />
        <KPICard
          label="Net Available Cash"
          value={kpis.available_cash}
          description="Cash currently in hand (Income - Cleared)"
          badgeText="In Hand"
          badgeType={kpis.available_cash >= 0 ? "success" : "danger"}
        />
        <KPICard
          label="Pending Bill Obligations"
          value={kpis.pending_bills}
          description="Outstanding commitments to pay"
          badgeText={kpis.pending_bills > 0 ? "Outstanding" : "Zero"}
          badgeType={kpis.pending_bills > 0 ? "warning" : "muted"}
        />
        <KPICard
          label="This Month Spend"
          value={kpis.current_month_expenses}
          description="Cleared disbursements this month"
          badgeText="Monthly"
          badgeType="info"
        />
        <KPICard
          label="Transactions Logged"
          value={kpis.transaction_count}
          description="All active income and expense records"
          badgeText="Ledger"
          badgeType="muted"
          isCurrency={false}
        />
      </div>

      {/* Visual Analysis: Monthly Cash Flow & Expense Categories */}
      <div className="grid-2 grid-2-even" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="section-title">
            <span>Due in the next 7 days</span>
            <NextLink href="/expenses?status=PENDING" className="btn btn-ghost btn-sm">All pending</NextLink>
          </div>
          <DueSoon bills={data.pending_expenses as any} />
        </div>
        <div className="card">
          <div className="section-title">
            <span>Budget usage</span>
            <NextLink href="/budgets" className="btn btn-ghost btn-sm">Budgets</NextLink>
          </div>
          <BudgetUsage budgets={budgets} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        {/* Monthly Cash Flow Card */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem" }}>Monthly Cash Flow</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Last 12 months</span>
          </div>

          <CashFlowChart data={data.monthly_cash_flow} />
        </div>

        {/* Expense Category Breakdown Card */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem" }}>Spending by category</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>All-Time Share</span>
          </div>

          <CategoryBars data={data.category_breakdown} />
        </div>
      </div>

      {/* Pending / Urgent Bills Section */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem" }}>Outstanding & Pending Bills</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Expenses with remaining clearance obligations requiring treasury attention
            </p>
          </div>
          <NextLink href="/expenses?status=PENDING" className="btn btn-secondary btn-sm">
            View All Pending
          </NextLink>
        </div>

        <div className="table-container stack">
          <table className="data-table stack">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bill Date</th>
                <th>Description</th>
                <th>Vendor</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Paid</th>
                <th style={{ textAlign: "right" }}>Pending Due</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Receipt</th>
                {role === "EDITOR" && <th style={{ textAlign: "center" }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {pending_expenses.length === 0 ? (
                <tr>
                  <td colSpan={role === "EDITOR" ? 11 : 10} style={{ textAlign: "center", padding: "2rem" }}>
                    <div style={{ color: "var(--success)", fontWeight: 600 }}>All bills are currently cleared!</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      No pending or overdue payment obligations.
                    </div>
                  </td>
                </tr>
              ) : (
                pending_expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td data-label="ID">
                      <span style={{ fontWeight: 600, color: "var(--primary)" }}>{exp.transaction_id}</span>
                    </td>
                    <td data-label="Bill date">{formatDate(exp.bill_date)}</td>
                    <td className="primary-cell" style={{ fontWeight: 500 }}>{exp.description}</td>
                    <td data-label="Vendor" style={{ color: "var(--text-secondary)" }}>{exp.vendor}</td>
                    <td data-label="Total" style={{ textAlign: "right" }} className="tabular-num">
                      {formatINR(exp.total_amount)}
                    </td>
                    <td data-label="Paid" style={{ textAlign: "right", color: "var(--success)" }} className="tabular-num">
                      {formatINR(exp.amount_paid)}
                    </td>
                    <td data-label="Pending" style={{ textAlign: "right", fontWeight: 600, color: "var(--warning)" }} className="tabular-num">
                      {formatINR(exp.amount_pending)}
                    </td>
                    <td data-label="Status">
                      {exp.is_overdue ? (
                        <span className="badge badge-danger">OVERDUE</span>
                      ) : exp.status === "PARTIALLY_PAID" ? (
                        <span className="badge badge-warning">PARTIALLY PAID</span>
                      ) : (
                        <span className="badge badge-info">PENDING</span>
                      )}
                    </td>
                    <td data-label="Due" style={{ color: exp.is_overdue ? "#F87171" : "var(--text-secondary)" }}>
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
                    {role === "EDITOR" && (
                      <td className="actions-cell" data-label="" style={{ textAlign: "center" }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => setPaymentExpense(exp)}
                        >
                          Record Payment
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Clearance Modal */}
      {paymentExpense && (
        <PaymentModal
          expense={paymentExpense}
          onClose={() => setPaymentExpense(null)}
          onSuccess={() => {
            setPaymentExpense(null);
            loadDashboard();
          }}
        />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
