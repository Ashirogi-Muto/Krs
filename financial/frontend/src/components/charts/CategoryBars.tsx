"use client";

import React from "react";
import { formatINR } from "@/lib/formatters";

export type CategoryShare = { category_id: string; category_name: string; total_amount: number; percentage: number; count: number };

/** Spending per category: one hue (magnitude), sorted, direct labels in text colours; hover shows bill count. */
export function CategoryBars({ data }: { data: CategoryShare[] }) {
  const rows = [...data].sort((a, b) => b.total_amount - a.total_amount)
  const max = Math.max(1, ...rows.map((r) => r.total_amount));
  if (!rows.length) return <div className="empty-state">No expenses recorded yet.</div>;
  return (
    <ul className="cat-bars">
      {rows.map((r) => (
        <li key={r.category_id} title={`${r.category_name}: ${formatINR(r.total_amount)} · ${r.percentage}% · ${r.count} bill${r.count === 1 ? "" : "s"}`}>
          <div className="cat-head">
            <span className="cat-name">{r.category_name}</span>
            <span className="cat-val tabular-num">
              {formatINR(r.total_amount)} <span className="muted">· {r.percentage}%</span>
            </span>
          </div>
          <div className="cat-track">
            <div className="cat-fill" style={{ width: `${Math.max(1.5, (r.total_amount / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
