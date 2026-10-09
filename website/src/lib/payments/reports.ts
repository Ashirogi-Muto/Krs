import crypto from 'node:crypto'
import type { Payload } from 'payload'
import { REPORT_TYPES, type ReportKind } from './report-file'

/** Stored Razorpay reports kept (owner, 9 Oct 2026: "the last 3 reports are maintained, others deleted"). */
export const KEEP_REPORTS = 3

export type StoredReport = { id: number; originalName: string; uploadedBy: string; rowCount: number; createdAt: string; paymentIds: string[] }

const toStored = (d: any): StoredReport => ({
  id: d.id,
  originalName: d.originalName || d.filename || '',
  uploadedBy: d.uploadedBy || '',
  rowCount: d.rowCount ?? 0,
  createdAt: d.createdAt,
  paymentIds: Array.isArray(d.paymentIds) ? d.paymentIds.map(String) : [],
})

const SELECT = { originalName: true, filename: true, uploadedBy: true, rowCount: true, createdAt: true, paymentIds: true } as const

/** Unique, plausible payment IDs from one column of the report. */
export function paymentIdsOf(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => /^[A-Za-z0-9_-]{1,64}$/.test(v)))].slice(0, 10_000)
}

/** Day (India time) of a timestamp, e.g. "2026-10-09". */
export const istDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** Stores the uploaded file in the private volume under a server-chosen name, then drops all but the newest KEEP_REPORTS. */
export async function saveReport(
  payload: Payload,
  r: { buf: Buffer; kind: ReportKind; originalName: string; uploadedBy: string; rowCount: number; paymentIds: string[] }
): Promise<StoredReport> {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  const name = `razorpay-${stamp}-${crypto.randomBytes(4).toString('hex')}.${r.kind}`
  const doc = await payload.create({
    collection: 'payment-reports',
    overrideAccess: true,
    data: { originalName: r.originalName.slice(0, 200), uploadedBy: r.uploadedBy.slice(0, 200), rowCount: r.rowCount, paymentIds: r.paymentIds },
    file: { data: r.buf, mimetype: REPORT_TYPES[r.kind], name, size: r.buf.length },
  })
  await pruneReports(payload)
  return toStored(doc)
}

/** Deletes every report but the newest `keep` (Payload removes the stored files too). */
export async function pruneReports(payload: Payload, keep = KEEP_REPORTS) {
  const { docs } = await payload.find({ collection: 'payment-reports', overrideAccess: true, sort: '-id', depth: 0, pagination: false, select: {} })
  for (const d of docs.slice(keep) as any[]) {
    await payload.delete({ collection: 'payment-reports', id: d.id, overrideAccess: true }).catch(() => null)
  }
}

/** Stored reports, newest first. */
export async function listReports(payload: Payload): Promise<StoredReport[]> {
  const { docs } = await payload.find({ collection: 'payment-reports', overrideAccess: true, sort: '-id', depth: 0, pagination: false, select: SELECT })
  return (docs as any[]).map(toStored)
}

/**
 * The report to compare `report` with: the newest one from an earlier day (India time), as the owner put it "the
 * report of the previous day"; if none of the kept ones is from an earlier day, the upload just before it.
 */
export async function previousReport(payload: Payload, reportId: number): Promise<StoredReport | null> {
  const all = await listReports(payload)
  const me = all.find((r) => r.id === reportId)
  if (!me) return null
  const before = all.filter((r) => r.id < reportId)
  return before.find((r) => istDay(r.createdAt) < istDay(me.createdAt)) || before[0] || null
}

/** After staff change the payment-ID column, the stored list follows (used by the next upload's comparison). */
export async function setReportPaymentIds(payload: Payload, reportId: number, ids: string[]) {
  await payload.update({ collection: 'payment-reports', id: reportId, overrideAccess: true, data: { paymentIds: ids } }).catch(() => null)
}
