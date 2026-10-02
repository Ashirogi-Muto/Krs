"use client";

import React from "react";
import { formatINR } from "@/lib/formatters";

interface KPICardProps {
  label: string;
  value: number | string;
  description: string;
  badgeText?: string;
  badgeType?: "success" | "danger" | "warning" | "info" | "muted";
  isCurrency?: boolean;
}

/** Headline number: label, value, then a short tag + description underneath (tag never crowds the label). */
export function KPICard({ label, value, description, badgeText, badgeType = "info", isCurrency = true }: KPICardProps) {
  const displayValue = isCurrency ? formatINR(value) : value.toLocaleString("en-IN");
  return (
    <div className="kpi-card">
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value tabular-num">{displayValue}</div>
      </div>
      <div className="kpi-foot">
        {badgeText && <span className={`badge badge-${badgeType}`}>{badgeText}</span>}
        <span className="kpi-desc">{description}</span>
      </div>
    </div>
  );
}
