import { inflateRawSync } from 'node:zlib'
import { parseCsv } from './match'

/**
 * Reading an uploaded Razorpay payment report (owner, 9 Oct 2026): Excel (.xlsx) or CSV, judged from the file's bytes.
 * Server-only (node:zlib). No spreadsheet library: an .xlsx is a zip of XML parts, and only three parts are read
 * (workbook, its relationships, the first sheet) plus the shared strings. Every size is capped before anything is
 * unpacked, so a crafted file can't exhaust memory (zip bomb) or CPU.
 */
export const REPORT_LIMITS = {
  maxFileBytes: 2 * 1024 * 1024, // the real report is ~10 KB; 2 MB = thousands of payments (and the site-wide upload cap)
  maxPartBytes: 20 * 1024 * 1024, // largest unpacked XML part
  maxEntries: 2000, // zip directory entries
  maxRows: 5000, // payment rows (the header row comes on top)
  maxCols: 100,
}
export const REPORT_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
} as const
export type ReportKind = keyof typeof REPORT_TYPES

/** Error codes map to CMS wording (Staff & admin texts → Payment matching: errType, errBroken, errTooBig, errEmpty, errTooMany). */
export type ReportErrorCode = 'type' | 'broken' | 'tooBig' | 'empty' | 'tooMany'
export class ReportFileError extends Error {
  constructor(public code: ReportErrorCode) {
    super(code)
  }
}

/** What the bytes are: an .xlsx (zip), a CSV (UTF-8 text), or neither. Old .xls and password-protected files are OLE. */
export function sniffReport(buf: Buffer): ReportKind | null {
  if (buf.length >= 4 && buf.readUInt32LE(0) === 0x04034b50) return 'xlsx'
  const head = buf.subarray(0, 4096)
  if (head.includes(0)) return null // binary (incl. .xls / encrypted .xlsx: D0 CF 11 E0)
  // Text must be valid UTF-8 (a stray Latin-1 byte would garble emails silently)
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return null
  }
  return 'csv'
}

/** The report as a table of strings: row 0 = headers. Throws ReportFileError. */
export function readReport(buf: Buffer, fileName: string): { kind: ReportKind; table: string[][] } {
  if (buf.length > REPORT_LIMITS.maxFileBytes) throw new ReportFileError('tooBig')
  if (!buf.length) throw new ReportFileError('empty')
  const kind = sniffReport(buf)
  const ext = (fileName.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase()
  // The name and the bytes must agree (a renamed file is refused rather than guessed)
  if (!kind || ext !== kind) throw new ReportFileError('type')
  const table = kind === 'xlsx' ? readXlsx(buf) : parseCsv(buf.toString('utf8'))
  const rows = table.map((r) => r.slice(0, REPORT_LIMITS.maxCols).map((c) => c.trim()))
  if (rows.length < 2) throw new ReportFileError('empty')
  if (rows.length - 1 > REPORT_LIMITS.maxRows) throw new ReportFileError('tooMany')
  return { kind, table: rows }
}

// ---------------------------------------------------------------------------------------------------------------
// .xlsx

type ZipEntry = { method: number; flags: number; compSize: number; size: number; offset: number }

function zipDirectory(buf: Buffer): Map<string, ZipEntry> {
  // End of central directory: in the last 22 + 65535 (max comment) bytes
  let eocd = -1
  for (let i = buf.length - 22, min = Math.max(0, buf.length - 22 - 0xffff); i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new ReportFileError('broken')
  const count = buf.readUInt16LE(eocd + 10)
  const dirSize = buf.readUInt32LE(eocd + 12)
  const dirStart = buf.readUInt32LE(eocd + 16)
  // Zip64 (0xFFFFFFFF markers) never happens for a 5 MB file and fails this check too
  if (count > REPORT_LIMITS.maxEntries || dirStart + dirSize > eocd) throw new ReportFileError('broken')
  const out = new Map<string, ZipEntry>()
  let p = dirStart
  for (let n = 0; n < count; n++) {
    if (p + 46 > eocd || buf.readUInt32LE(p) !== 0x02014b50) throw new ReportFileError('broken')
    const nameLen = buf.readUInt16LE(p + 28)
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8')
    out.set(name, {
      flags: buf.readUInt16LE(p + 8),
      method: buf.readUInt16LE(p + 10),
      compSize: buf.readUInt32LE(p + 20),
      size: buf.readUInt32LE(p + 24),
      offset: buf.readUInt32LE(p + 42),
    })
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32)
  }
  return out
}

function zipPart(buf: Buffer, dir: Map<string, ZipEntry>, name: string): string | null {
  const e = dir.get(name)
  if (!e) return null
  if (e.flags & 1) throw new ReportFileError('broken') // encrypted entry
  const p = e.offset
  if (p + 30 > buf.length || buf.readUInt32LE(p) !== 0x04034b50) throw new ReportFileError('broken')
  const start = p + 30 + buf.readUInt16LE(p + 26) + buf.readUInt16LE(p + 28)
  if (start + e.compSize > buf.length) throw new ReportFileError('broken')
  const data = buf.subarray(start, start + e.compSize)
  let out: Buffer
  if (e.method === 0) out = data
  else if (e.method === 8) {
    try {
      // maxOutputLength stops a zip bomb while unpacking, whatever the directory claims
      out = inflateRawSync(data, { maxOutputLength: REPORT_LIMITS.maxPartBytes })
    } catch (err: any) {
      throw new ReportFileError(err?.code === 'ERR_BUFFER_TOO_LARGE' || err instanceof RangeError ? 'tooBig' : 'broken')
    }
  } else throw new ReportFileError('broken')
  if (out.length > REPORT_LIMITS.maxPartBytes) throw new ReportFileError('tooBig')
  return out.toString('utf8')
}

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }
/** XML text → string (entities, numeric references and Excel's _xHHHH_ escapes). */
export function xmlText(s: string): string {
  return s
    .replace(/&(?:#x([0-9a-f]{1,6})|#(\d{1,7})|(lt|gt|amp|quot|apos));/gi, (m, hex, dec, name) => {
      if (name) return ENTITIES[name.toLowerCase()]
      const code = hex ? parseInt(hex, 16) : parseInt(dec, 10)
      return code <= 0x10ffff ? String.fromCodePoint(code) : ''
    })
    .replace(/_x([0-9A-F]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}
const attrs = (s: string): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const m of s.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) out[m[1]] = xmlText(m[2])
  return out
}
/** Text of every <t> run inside an element (rich text = several runs); phonetic hints (<rPh>) are skipped. */
const runs = (s: string) =>
  [...s.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*?(?:\/>|>([^<]*)<\/t>)/g)].map((m) => xmlText(m[1] || '')).join('')

/** "B" → 1, "AA" → 26 (0-based column of a cell reference such as "B12"). */
export const columnIndex = (ref: string) => {
  const letters = (ref.match(/^[A-Z]+/i)?.[0] || '').toUpperCase()
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** First worksheet of an .xlsx as a table of strings (empty rows dropped). */
export function readXlsx(buf: Buffer): string[][] {
  const dir = zipDirectory(buf)
  const workbook = zipPart(buf, dir, 'xl/workbook.xml')
  if (workbook === null) throw new ReportFileError('broken')
  // The first <sheet> → its relationship id → the part that holds it
  const firstSheet = workbook.match(/<sheet\b([^>]*)\/?>/)
  const relId = firstSheet ? attrs(firstSheet[1])['r:id'] : undefined
  let sheetPath = 'xl/worksheets/sheet1.xml'
  const rels = zipPart(buf, dir, 'xl/_rels/workbook.xml.rels')
  if (rels && relId) {
    for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
      const a = attrs(m[1])
      if (a.Id === relId && a.Target) sheetPath = a.Target.startsWith('/') ? a.Target.slice(1) : `xl/${a.Target.replace(/^\.\//, '')}`
    }
  }
  const sheet = zipPart(buf, dir, sheetPath)
  if (sheet === null) throw new ReportFileError('broken')
  const sharedXml = zipPart(buf, dir, 'xl/sharedStrings.xml')
  const shared = sharedXml ? [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => runs(m[1])) : []

  const table: string[][] = []
  for (const row of sheet.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    if (table.length > REPORT_LIMITS.maxRows + 1) throw new ReportFileError('tooMany')
    const cells: string[] = []
    let next = 0
    for (const c of (row[1] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = attrs(c[1])
      const col = a.r ? columnIndex(a.r) : next
      next = col + 1
      if (col < 0 || col >= REPORT_LIMITS.maxCols) continue
      const body = c[2] || ''
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
      let value = ''
      if (a.t === 's') value = shared[Number(v)] ?? ''
      else if (a.t === 'inlineStr') value = runs(body.match(/<is>([\s\S]*?)<\/is>/)?.[1] || '')
      else if (a.t === 'b') value = v === '1' ? 'TRUE' : v === '0' ? 'FALSE' : ''
      else if (a.t === 'e') value = ''
      else value = v !== undefined ? xmlText(v) : ''
      while (cells.length < col) cells.push('')
      cells[col] = value
    }
    if (cells.some((x) => x.trim() !== '')) table.push(cells)
  }
  // Every row as wide as the header row (Excel omits trailing empty cells)
  const width = Math.max(0, ...table.map((r) => r.length))
  return table.map((r) => (r.length < width ? [...r, ...Array(width - r.length).fill('')] : r))
}

// ---------------------------------------------------------------------------------------------------------------
// Payment time

const IST_MS = (5 * 60 + 30) * 60 * 1000
const fromIst = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0): string | undefined => {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return undefined
  const t = Date.UTC(y, mo - 1, d, h, mi, s)
  const back = new Date(t)
  if (back.getUTCDate() !== d || back.getUTCMonth() !== mo - 1) return undefined // 31/02 etc.
  return new Date(t - IST_MS).toISOString()
}

/**
 * The report's payment time → ISO (UTC). Razorpay writes "09/10/2026 13:09": day first, India time, which
 * `Date.parse` would read as 10 September. Also: Excel date numbers, Unix seconds, ISO with or without a zone
 * (without = India time). Anything else → undefined (the caller then uses the time of recording).
 */
export function parsePaidAt(raw: string | null | undefined): string | undefined {
  const s = String(raw ?? '').trim()
  if (!s || s.length > 60) return undefined
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?)?$/i)
  if (m) {
    let h = Number(m[4] || 0)
    const pm = m[7]?.toLowerCase().startsWith('p')
    if (m[7]) {
      if (h < 1 || h > 12) return undefined
      h = (h % 12) + (pm ? 12 : 0)
    }
    return fromIst(Number(m[3]), Number(m[2]), Number(m[1]), h, Number(m[5] || 0), Number(m[6] || 0))
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/)
  if (m) return fromIst(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0))
  // ISO with an explicit zone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = Date.parse(s)
    return Number.isNaN(t) ? undefined : new Date(t).toISOString()
  }
  if (/^\d{10}$/.test(s)) return new Date(Number(s) * 1000).toISOString() // Unix seconds (Razorpay API exports)
  // Excel date number (days since 1899-12-30, fraction = time of day), India time; 2000-01-01 .. 2099
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const n = Number(s)
    if (n < 36526 || n > 73050) return undefined
    return new Date(Math.round((n - 25569) * 86_400_000) - IST_MS).toISOString()
  }
  return undefined
}
