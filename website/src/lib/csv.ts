/** One CSV cell: quoted, and spreadsheet formulas in user-entered text neutralised (=, +, -, @, tab, CR first). */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

/** A CSV file body with a BOM (Excel opens UTF-8, e.g. ₹ and Hindi names, correctly). */
export const csvBody = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
