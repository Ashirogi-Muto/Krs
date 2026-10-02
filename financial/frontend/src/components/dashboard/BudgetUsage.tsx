"use client";

import React from "react";
import NextLink from "next/link";
import { formatINR } from "@/lib/formatters";

export type BudgetRow = { id: string; name: string; project_name?: string | null; total_budget: number | string; actual_spent: number | string; utilization_pct: number; period_end: string };

/** Active budgets: spent vs allocated. Status is shown as text too (never colour alone). */
export function BudgetUsage({ budgets }: { budgets: BudgetRow[] }) {
  if (!budgets.length)
    return (
      <div className="empty-state" style={{ padding: "1.5rem 0.5rem" }}>
        No active budgets. <NextLink href="/budgets" style={{ color: "var(--primary-hover)" }}>Create one</NextLink>
      </div>
    );
  return (
    <ul className="cat-bars">
      {budgets.map((b) => {
        const pct = Math.round(Number(b.utilization_pct) || 0);
        const state = pct > 100 ? "over" : pct >= 80 ? "near" : "ok";
        return (
          <li key={b.id}>
            <div className="cat-head">
              <span className="cat-name">{b.name}</span>
              <span className="cat-val tabular-num">
                {formatINR(Number(b.actual_spent))} <span className="muted">/ {formatINR(Number(b.total_budget))}</span>
              </span>
            </div>
            <div className="cat-track" title={`${pct}% used`}>
              <div className={`cat-fill budget-${state}`} style={{ width: `${Math.min(100, Math.max(1.5, pct))}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.72rem" }}>
              <span className="muted">{b.project_name || "General"}</span>
              <span className={state === "over" ? "negative" : state === "near" ? "" : "muted"} style={state === "near" ? { color: "#fcd34d" } : undefined}>
                {pct}% used{state === "over" ? " · over budget" : state === "near" ? " · nearly used" : ""}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
