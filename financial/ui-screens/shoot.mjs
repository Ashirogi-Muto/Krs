// Screenshots of the finance portal (desktop + phone) for design review. CI only, against a throwaway ledger.
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.env.WEB || 'http://127.0.0.1:3000'
const PASS = process.env.SHOT_PASSWORD
const OUT = process.env.OUT || '/work/out'
fs.mkdirSync(OUT, { recursive: true })
const PAGES = ['/dashboard', '/income', '/expenses', '/projects', '/budgets', '/documents', '/reports', '/team', '/admin/users', '/admin/settings']
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } }

const browser = await chromium.launch()
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE + '/login')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/${name}-login.png`, fullPage: true })
  await page.fill('input[type="text"], input[name="email"], input[autocomplete="username"]', 'audit')
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => errors.push('no redirect to /dashboard after login'))
  for (const p of PAGES) {
    await page.goto(BASE + p)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${OUT}/${name}${p.replace(/\//g, '-')}.png`, fullPage: true })
  }
  if (name === 'phone') {
    await page.goto(BASE + '/dashboard')
    await page.waitForTimeout(700)
    const toggle = page.locator('[data-testid="nav-toggle"], button[aria-label*="menu" i]').first()
    if (await toggle.count()) {
      await toggle.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${OUT}/phone-nav-open.png` })
    } else errors.push('no mobile menu button found')
  }
  fs.writeFileSync(`${OUT}/${name}-errors.txt`, errors.join('\n') || 'none')
  await ctx.close()
}
await browser.close()
console.log('screenshots done')
