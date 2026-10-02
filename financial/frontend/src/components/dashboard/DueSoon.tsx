"use client";

import React from "react";
import NextLink from "next/link";
import { formatINR, formatDate } from "@/lib/formatters";

type Bill = { id: string; transaction_id: string; description: string; vendor: string; amount_pending: number; due_date?: string; is_overdue: boolean };

const DAY = 86_400_000;

/** Unpaid bills that are overdue or due within the next 7 days (most urgent first). */
export function DueSoon({ bills }: { bills: Bill[] }) {
  const today = new Date(new Date().toDateString()).getTime();
  const rows = bills
    .filter((b) => b.due_date && (b.is_overdue || new Date(b.due_date).getTime() - today <= 7 * DAY))
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 8);
  if (!rows.length) return <div className="empty-state" style={{ padding: "1.5rem 0.5rem" }}>Nothing due in the next 7 days.</div>;
  return (
    <ul className="due-list">
      {rows.map((b) => {
        const days = Math.round((new Date(String(b.due_date)).getTime() - today) / DAY);
        const when = b.is_overdue || days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`;
        return (
          <li key={b.id}>
            <NextLink href={`/expenses/${b.id}`} className="due-row">
              <div style={{ minWidth: 0 }}>
                <div className="due-title">{b.description}</div>
                <div className="due-meta">
                  {b.vendor} · {formatDate(String(b.due_date))}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div className="tabular-num" style={{ fontWeight: 650 }}>{formatINR(b.amount_pending)}</div>
                <span className={`badge ${b.is_overdue || days < 0 ? "badge-danger" : days <= 2 ? "badge-warning" : "badge-muted"}`}>{when}</span>
              </div>
            </NextLink>
          </li>
        );
      })}
    </ul>
  );
}
