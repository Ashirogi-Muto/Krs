"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";

/** Client-side sorting for list pages (the API already returns every matching row). */
export function useSortable<T>(rows: T[], initialKey?: keyof T, initialDir: "asc" | "desc" = "desc") {
  const [key, setKey] = useState<keyof T | undefined>(initialKey);
  const [dir, setDir] = useState<"asc" | "desc">(initialDir);
  const sorted = useMemo(() => {
    if (!key) return rows;
    const k = key;
    return [...rows].sort((a, b) => {
      const x = a[k] as unknown;
      const y = b[k] as unknown;
      const nx = typeof x === "number" ? x : Number.NaN;
      const ny = typeof y === "number" ? y : Number.NaN;
      const c = !Number.isNaN(nx) && !Number.isNaN(ny) ? nx - ny : String(x ?? "").localeCompare(String(y ?? ""), "en", { numeric: true });
      return dir === "asc" ? c : -c;
    });
  }, [rows, key, dir]);
  const toggle = (k: keyof T) => {
    if (k === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setKey(k);
      setDir("asc");
    }
  };
  return { sorted, key, dir, toggle };
}

/** Clickable table header with a sort indicator. */
export function SortTh<T>({
  label,
  field,
  sort,
  align,
}: {
  label: string;
  field: keyof T;
  sort: { key?: keyof T; dir: "asc" | "desc"; toggle: (k: keyof T) => void };
  align?: "right";
}) {
  const active = sort.key === field;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th style={{ textAlign: align, cursor: "pointer", userSelect: "none" }} onClick={() => sort.toggle(field)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: active ? "var(--text-primary)" : undefined }}>
        {label}
        <Icon style={{ width: 12, height: 12, opacity: active ? 1 : 0.45 }} />
      </span>
    </th>
  );
}

export type CsvColumn<T> = { label: string; value: (row: T) => unknown };

/** Download rows as CSV (Excel-friendly UTF-8 BOM; values that look like formulas are neutralised). */
export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]) {
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [columns.map((c) => cell(c.label)).join(","), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(","))];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One line above a list: how many rows are shown, their totals, and an export button. */
export function ListSummary({ items, onExport }: { items: { label: string; value: string; tone?: "positive" | "negative" | "warning" }[]; onExport?: () => void }) {
  return (
    <div className="list-summary">
      {items.map((i) => (
        <div key={i.label} className="ls-item">
          <span className="ls-label">{i.label}</span>
          <span className={`ls-value tabular-num ${i.tone || ""}`}>{i.value}</span>
        </div>
      ))}
      {onExport && (
        <button type="button" className="btn btn-secondary btn-sm ls-export" onClick={onExport}>
          <Download />
          Export CSV
        </button>
      )}
    </div>
  );
}
