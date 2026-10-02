"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/formatters";

export type CashFlowMonth = { month: string; month_name: string; income: number; expenses: number; net_cash_flow: number };

// Validated pair (dataviz validator, dark surface #0d1527): all checks pass, CVD ΔE 26.8
const INCOME = "#3987e5";
const EXPENSES = "#d95926";

const short = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
};
/** Top-rounded bar anchored to the baseline (4px rounded data end). */
const bar = (x: number, y: number, w: number, h: number) => {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

/** Monthly income vs expenses: grouped bars on one axis, legend, hover tooltip per month, table view below. */
export function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 220;
  const pad = { top: 12, right: 8, bottom: 28, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  const nice = (() => {
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    const m = max / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  })();
  const y = (v: number) => pad.top + innerH - (v / nice) * innerH;
  const band = innerW / Math.max(1, data.length);
  const barW = Math.max(4, Math.min(22, (band - 10) / 2));
  const ticks = [0, 0.5, 1].map((t) => t * nice);

  return (
    <div>
      <div className="chart-legend" aria-hidden>
        <span><i style={{ background: INCOME }} /> Income</span>
        <span><i style={{ background: EXPENSES }} /> Expenses</span>
      </div>
      <div ref={ref} className="chart-box" onMouseLeave={() => setHover(null)}>
        {data.length === 0 ? (
          <div className="empty-state">No transactions recorded yet.</div>
        ) : (
          <svg width={width} height={H} role="img" aria-label="Monthly income and expenses">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#1a2745" strokeDasharray={t === 0 ? undefined : "3 4"} />
                <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">
                  ₹{short(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = pad.left + band * i + band / 2;
              const x1 = cx - barW - 1; // 2px gap between the pair
              const x2 = cx + 1;
              return (
                <g key={d.month}>
                  {hover === i && <rect x={pad.left + band * i + 2} y={pad.top} width={band - 4} height={innerH} fill="rgba(148,163,184,0.07)" rx={6} />}
                  <path d={bar(x1, y(d.income), barW, y(0) - y(d.income))} fill={INCOME} />
                  <path d={bar(x2, y(d.expenses), barW, y(0) - y(d.expenses))} fill={EXPENSES} />
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
                    {d.month_name.slice(0, 3)}
                  </text>
                  {/* hit target larger than the marks */}
                  <rect x={pad.left + band * i} y={pad.top} width={band} height={innerH + 20} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
                </g>
              );
            })}
          </svg>
        )}
        {hover !== null && data[hover] && (
          <div
            className="chart-tooltip"
            style={{ left: Math.min(width - 180, Math.max(0, pad.left + band * hover + band / 2 - 90)), top: 4 }}
            role="status"
          >
            <div className="tt-title">{data[hover].month_name}</div>
            <div className="tt-row"><i style={{ background: INCOME }} />Income<b className="tabular-num">{formatINR(data[hover].income)}</b></div>
            <div className="tt-row"><i style={{ background: EXPENSES }} />Expenses<b className="tabular-num">{formatINR(data[hover].expenses)}</b></div>
            <div className="tt-row tt-net">Net<b className={`tabular-num ${data[hover].net_cash_flow < 0 ? "negative" : "positive"}`}>{formatINR(data[hover].net_cash_flow)}</b></div>
          </div>
        )}
      </div>
      <details className="chart-table">
        <summary>Show as table</summary>
        <div className="table-container" style={{ marginTop: "0.6rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Income</th>
                <th className="num">Expenses</th>
                <th className="num">Net</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.month}>
                  <td>{m.month_name}</td>
                  <td className="num">{formatINR(m.income)}</td>
                  <td className="num">{formatINR(m.expenses)}</td>
                  <td className={`num ${m.net_cash_flow < 0 ? "negative" : "positive"}`}>{formatINR(m.net_cash_flow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
