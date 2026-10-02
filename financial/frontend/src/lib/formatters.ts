// Display helpers. Recreated 2 Oct 2026: the original src/lib was never committed.
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

/** ₹1,05,275.00 style (accepts numbers or decimal strings from the API) */
export function formatINR(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return inr.format(Number.isFinite(n) ? (n as number) : 0);
}

/** "02 Oct 2026" (accepts ISO dates / datetimes); "—" when empty */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** Month label from 1-12, "YYYY-MM" or a date: "Oct 2026" / "October" */
export function formatMonthName(value: number | string | Date): string {
  if (typeof value === "number") {
    return new Date(2000, value - 1, 1).toLocaleDateString("en-IN", { month: "long" });
  }
  const s = value instanceof Date ? value : /^\d{4}-\d{2}$/.test(value) ? new Date(`${value}-01T00:00:00`) : new Date(value);
  if (Number.isNaN(s.getTime())) return String(value);
  return s.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
