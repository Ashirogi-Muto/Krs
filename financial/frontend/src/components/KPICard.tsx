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

export function KPICard({
  label,
  value,
  description,
  badgeText,
  badgeType = "info",
  isCurrency = true,
}: KPICardProps) {
  const displayValue = isCurrency ? formatINR(value) : value.toLocaleString();

  return (
    <div className="kpi-card">
      <div>
        <div className="kpi-label">
          <span>{label}</span>
          {badgeText && <span className={`badge badge-${badgeType}`}>{badgeText}</span>}
        </div>
        <div className="kpi-value tabular-num">{displayValue}</div>
      </div>
      <div className="kpi-desc">{description}</div>
    </div>
  );
}
