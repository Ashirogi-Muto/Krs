import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import { columnIndex, parsePaidAt, readReport, readXlsx, REPORT_LIMITS, ReportFileError, sniffReport } from '../src/lib/payments/report-file'
import { guessColumns, matchPayments, type RegForMatch } from '../src/lib/payments/match'
import { paymentIdsOf } from '../src/lib/payments/reports'
import { can, canAll, PRESETS } from '../src/payload/access/permissions'

/**
 * Razorpay report upload (owner, 9 Oct 2026): .xlsx and CSV, day-first India-time dates, cumulative daily reports
 * (earlier days' payments never offered again), and who may use payment matching.
 */

// --- a minimal .xlsx built by hand (same layout as Razorpay's "payment_links" export; made-up payers)
const crc32 = (buf: Buffer) => {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function zip(files: [string, string | Buffer, boolean?][]): Buffer {
  const locals: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  for (const [name, content, store] of files) {
    const raw = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8')
    const data = store ? raw : deflateRawSync(raw)
    const n = Buffer.from(name, 'utf8')
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0)
    lh.writeUInt16LE(20, 4)
    lh.writeUInt16LE(store ? 0 : 8, 8)
    lh.writeUInt32LE(crc32(raw), 14)
    lh.writeUInt32LE(data.length, 18)
    lh.writeUInt32LE(raw.length, 22)
    lh.writeUInt16LE(n.length, 26)
    const ch = Buffer.alloc(46)
    ch.writeUInt32LE(0x02014b50, 0)
    ch.writeUInt16LE(20, 4)
    ch.writeUInt16LE(20, 6)
    ch.writeUInt16LE(store ? 0 : 8, 10)
    ch.writeUInt32LE(crc32(raw), 16)
    ch.writeUInt32LE(data.length, 20)
    ch.writeUInt32LE(raw.length, 24)
    ch.writeUInt16LE(n.length, 28)
    ch.writeUInt32LE(offset, 42)
    locals.push(lh, n, data)
    central.push(ch, n)
    offset += 30 + n.length + data.length
  }
  const cd = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(cd.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, end])
}
const HEADERS = ['payment page id', 'payment page title', 'payment date', 'order_id', 'item name', 'item amount', 'item quantity', 'item payment amount', 'total payment amount', 'currency', 'payment status', 'payment id', 'payer__name', 'email', 'phone', 'name_of_university_/college', 'select_event-']
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function xlsx(rows: (string | number)[][], opts: { sheetPath?: string; storeSheet?: boolean } = {}): Buffer {
  const shared: string[] = []
  const sid = (s: string) => (shared.includes(s) ? shared.indexOf(s) : shared.push(s) - 1)
  const col = (i: number) => String.fromCharCode(65 + (i % 26)).padStart(i >= 26 ? 2 : 1, 'A')
  const sheetRows = rows
    .map((r, ri) => {
      const cells = r
        .map((v, ci) => {
          const ref = `${ci >= 26 ? 'A' : ''}${col(ci)}${ri + 1}`
          if (v === '') return ''
          if (typeof v === 'number') return `<c r="${ref}" s="1"><v>${v}</v></c>`
          if (v.startsWith('inline:')) return `<c r="${ref}" t="inlineStr"><is><t>${esc(v.slice(7))}</t></is></c>`
          return `<c r="${ref}" t="s"><v>${sid(v)}</v></c>`
        })
        .join('')
      return `<row r="${ri + 1}" spans="1:17">${cells}</row>`
    })
    .join('')
  const sheetPath = opts.sheetPath || 'worksheets/sheet1.xml'
  return zip([
    ['[Content_Types].xml', '<?xml version="1.0"?><Types/>'],
    ['xl/workbook.xml', '<?xml version="1.0"?><workbook xmlns:r="r"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0"?><Relationships><Relationship Id="rId1" Type="worksheet" Target="${sheetPath}"/><Relationship Id="rId2" Type="sharedStrings" Target="sharedStrings.xml"/></Relationships>`],
    [`xl/${sheetPath}`, `<?xml version="1.0"?><worksheet><cols><col min="1" max="3"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`, opts.storeSheet],
    ['xl/sharedStrings.xml', `<?xml version="1.0"?><sst>${shared.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`],
  ])
}
const realRow = (over: Partial<Record<string, string | number>> = {}) => {
  const v: Record<string, string | number> = {
    'payment page id': 'pl_TEST', 'payment page title': 'Robotics Fest Aurix 2026', 'payment date': '09/10/2026 13:09', order_id: 'order_1',
    'item name': 'Amount', 'item amount': '499.00', 'item quantity': 1, 'item payment amount': '499.00', 'total payment amount': '499.00',
    currency: 'INR', 'payment status': 'captured', 'payment id': 'pay_A1', payer__name: 'Test Payer', email: 'lead1@college.edu',
    phone: 9876543201, 'name_of_university_/college': 'IILMUniversity', 'select_event-': 'Robo-soccer', ...over,
  }
  return HEADERS.map((h) => v[h])
}

test('xlsx: reads the first sheet with shared strings, numbers, inline strings and gaps', () => {
  const buf = xlsx([HEADERS, realRow(), realRow({ 'payment id': 'pay_B2', email: 'inline:a&b@x.in', phone: '' })])
  const t = readXlsx(buf)
  assert.equal(t.length, 3)
  assert.deepEqual(t[0], HEADERS)
  assert.equal(t[1][HEADERS.indexOf('phone')], '9876543201')
  assert.equal(t[1][HEADERS.indexOf('select_event-')], 'Robo-soccer')
  assert.equal(t[2][HEADERS.indexOf('email')], 'a&b@x.in')
  assert.equal(t[2][HEADERS.indexOf('phone')], '', 'missing cell stays empty, later cells keep their column')
  assert.equal(t[2][HEADERS.indexOf('select_event-')], 'Robo-soccer')
  // Stored (not compressed) parts and another sheet path work too
  assert.equal(readXlsx(xlsx([HEADERS, realRow()], { sheetPath: 'worksheets/data.xml', storeSheet: true })).length, 2)
  assert.equal(columnIndex('Q12'), 16)
  assert.equal(columnIndex('AA1'), 26)
})

test('readReport: type from the bytes, and the name must agree', () => {
  const x = xlsx([HEADERS, realRow()])
  assert.equal(readReport(x, 'payment_links - 29 Sep 26 (2).xlsx').kind, 'xlsx')
  const csv = Buffer.from('﻿Payment ID,Email\r\npay_1,a@b.c\r\n')
  assert.deepEqual(readReport(csv, 'r.CSV').table, [['Payment ID', 'Email'], ['pay_1', 'a@b.c']])
  const code = (fn: () => unknown) => {
    try {
      fn()
    } catch (e) {
      return e instanceof ReportFileError ? e.code : 'other'
    }
    return 'ok'
  }
  assert.equal(code(() => readReport(csv, 'renamed.xlsx')), 'type')
  assert.equal(code(() => readReport(x, 'renamed.csv')), 'type')
  assert.equal(code(() => readReport(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]), 'old.xls')), 'type')
  assert.equal(code(() => readReport(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), 'cut.xlsx')), 'broken')
  assert.equal(code(() => readReport(Buffer.from('caf\xe9,x\n1,2\n', 'latin1'), 'latin1.csv')), 'type', 'not UTF-8')
  assert.equal(code(() => readReport(Buffer.from('Payment ID,Email\n'), 'r.csv')), 'empty')
  assert.equal(code(() => readReport(Buffer.alloc(0), 'r.csv')), 'empty')
  assert.equal(code(() => readReport(Buffer.alloc(REPORT_LIMITS.maxFileBytes + 1, 65), 'r.csv')), 'tooBig')
  const many = 'id\n' + Array.from({ length: REPORT_LIMITS.maxRows + 1 }, (_, i) => `pay_${i}`).join('\n')
  assert.equal(code(() => readReport(Buffer.from(many), 'r.csv')), 'tooMany')
  // Zip bomb: a tiny part that unpacks past the cap is stopped while unpacking
  const bomb = zip([
    ['xl/workbook.xml', '<workbook><sheets><sheet r:id="rId1"/></sheets></workbook>'],
    ['xl/worksheets/sheet1.xml', Buffer.alloc(REPORT_LIMITS.maxPartBytes + 1024, 32)],
  ])
  assert.ok(bomb.length < 100_000)
  assert.equal(code(() => readReport(bomb, 'bomb.xlsx')), 'tooBig')
  assert.equal(sniffReport(Buffer.from('%PDF-1.7\n\0')), null)
})

test('payment time: Razorpay writes day first, India time', () => {
  assert.equal(parsePaidAt('09/10/2026 13:09'), '2026-10-09T07:39:00.000Z') // 9 Oct, not 10 Sep
  assert.equal(parsePaidAt('02/10/2026 10:24:31'), '2026-10-02T04:54:31.000Z')
  assert.equal(parsePaidAt('9/10/2026 1:09 pm'), '2026-10-09T07:39:00.000Z')
  assert.equal(parsePaidAt('2026-10-09 13:09:00'), '2026-10-09T07:39:00.000Z')
  assert.equal(parsePaidAt('2026-10-09T07:39:00Z'), '2026-10-09T07:39:00.000Z')
  assert.equal(parsePaidAt('1791531540'), new Date(1791531540 * 1000).toISOString())
  assert.equal(parsePaidAt('46304.5'), '2026-10-09T06:30:00.000Z') // Excel date number, noon IST
  for (const bad of ['31/02/2026', '13/13/2026', '2 Oct, 10:00', '', 'pay_1', '99999999', '25/10/2026 25:00']) assert.equal(parsePaidAt(bad), undefined, bad)
})

test('column guess on the real Razorpay report headers', () => {
  const g = guessColumns(HEADERS)
  assert.equal(g.paymentId, 'payment id')
  assert.equal(g.email, 'email')
  assert.equal(g.phone, 'phone')
  assert.equal(g.amount, 'total payment amount')
  assert.equal(g.event, 'select_event-', 'not "item name" (always "Amount")')
  assert.equal(g.status, 'payment status')
  assert.equal(g.paidAt, 'payment date')
})

const reg = (id: number, over: Partial<RegForMatch> = {}): RegForMatch => ({
  id, code: `AX26-SOC-${id}`, team: `Team ${id}`, leaderEmail: `lead${id}@college.edu`, leaderPhone: `98765432${String(id).padStart(2, '0')}`,
  eventLabel: 'Robo-soccer', eventTitle: 'Robo Soccer', amountDue: 499, paymentStatus: 'AWAITING_PAYMENT', paymentReference: null, ...over,
})
const row = (over: Record<string, any> = {}) => ({ paymentId: 'pay_1', email: 'lead1@college.edu', phone: '9876543201', amount: 499, event: 'Robo-soccer', status: 'captured', ...over })

test('cumulative reports: earlier days are never offered again', () => {
  // Day 2's report repeats day 1's payment (recorded then) and has one new payment
  const regs = [reg(1, { paymentStatus: 'PAID_VERIFIED', paymentReference: 'pay_1' }), reg(2)]
  const res = matchPayments([row(), row({ paymentId: 'pay_2', email: 'lead2@college.edu', phone: '9876543202' })], regs)
  assert.deepEqual(res.map((r) => r.kind), ['ALREADY_RECORDED', 'MATCH'])
  // A team marked paid by hand (no payment ID) is not offered again either; a second payment from it is flagged
  const hand = [reg(1, { paymentStatus: 'PAID_VERIFIED', paymentReference: null })]
  const res2 = matchPayments([row(), row({ paymentId: 'pay_9' })], hand)
  assert.deepEqual(res2.map((r) => r.kind), ['ALREADY_RECORDED', 'DUPLICATE'])
  assert.match(res2[0].reasons[0], /without a payment ID/)
  // Paid with another payment ID → possible second payment, never selectable as a match
  const [r3] = matchPayments([row({ paymentId: 'pay_7' })], [reg(1, { paymentStatus: 'PAID_VERIFIED', paymentReference: 'pay_1' })])
  assert.equal(r3.kind, 'DUPLICATE')
})

test('payment IDs kept from a report: unique and plausible only', () => {
  assert.deepEqual(paymentIdsOf(['pay_A1', ' pay_A1 ', '', 'x y', 'pay_B2', '<script>']), ['pay_A1', 'pay_B2'])
})

test('payment matching: Finance, Treasurer, President and admins; Event Head no longer; any role can be given it', () => {
  const legacy = (r: string) => ({ id: 1, role: 'STAFF', roles: [r] })
  for (const r of ['FINANCE', 'TREASURER', 'PRESIDENT']) assert.equal(can(legacy(r), 'tools.paymentMatching'), true, r)
  for (const r of ['EVENT_HEAD', 'REGISTRATION', 'MEDIA', 'CORE_MEMBER']) assert.equal(can(legacy(r), 'tools.paymentMatching'), false, r)
  assert.equal(can({ id: 2, role: 'ADMIN' }, 'tools.paymentMatching'), true)
  assert.equal(can({ id: 3, role: 'SUPER_ADMIN' }, 'tools.paymentMatching'), true)
  assert.equal(can({ id: 4, role: 'PARTICIPANT', roles: ['FINANCE'] }, 'tools.paymentMatching'), false)
  const custom = (eventLimit: 'all' | 'chosen') => ({ id: 5, role: 'STAFF', legacyRolesMigrated: true, accessRoles: { docs: [{ name: 'Payments desk', permissions: ['tools.paymentMatching'], eventLimit, events: [1] }] } })
  assert.equal(can(custom('all'), 'tools.paymentMatching'), true)
  // Stored reports (every event's payers) only with the permission for all events
  assert.equal(canAll(custom('all'), 'tools.paymentMatching'), true)
  assert.equal(canAll(custom('chosen'), 'tools.paymentMatching'), false)
  assert.equal(PRESETS.filter((p) => p.permissions.includes('tools.paymentMatching')).map((p) => p.name).sort().join(','), 'Finance,President,Treasurer')
})
