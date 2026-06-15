/* Verify the consent system + that the CSP doesn't break the 3D site.
   Captures console errors (incl. CSP violations), the first-visit banner,
   and the preferences modal. Usage: node scripts/shoot-consent.mjs */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://localhost:4318'
const OUT = 'shots/polish'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
// Fresh context = no stored consent → banner must appear.
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

// 1) Home page — checks fonts render + CSP doesn't kill the 3D + banner shows.
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1400)
await page.screenshot({ path: `${OUT}/consent-home.png` })

// 2) Banner present?
const bannerVisible = await page.locator('.cc-banner').isVisible().catch(() => false)

// 3) Open preferences modal via the banner's "Manage" button.
let modalVisible = false
if (bannerVisible) {
  await page.locator('.cc-banner').getByRole('button', { name: 'Manage' }).click()
  await page.waitForTimeout(500)
  modalVisible = await page.locator('.cc-modal').isVisible().catch(() => false)
  await page.screenshot({ path: `${OUT}/consent-modal.png` })
}

// 4) Accept all, reload, confirm the banner stays gone (persistence works).
if (modalVisible) {
  await page.locator('.cc-modal').getByRole('button', { name: 'Accept all' }).click()
  await page.waitForTimeout(400)
}
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const bannerAfter = await page.locator('.cc-banner').isVisible().catch(() => false)

// CSP violations surface as console errors mentioning the policy.
const cspErrors = errors.filter((e) => /content security policy|csp|refused to/i.test(e))

console.log('banner shown on first visit :', bannerVisible)
console.log('modal opens                :', modalVisible)
console.log('banner gone after consent  :', !bannerAfter)
console.log('CSP violations             :', cspErrors.length)
if (cspErrors.length) cspErrors.forEach((e) => console.log('  CSP> ' + e))
console.log('other console errors       :', errors.length - cspErrors.length)
errors.filter((e) => !/content security policy|csp|refused to/i.test(e)).slice(0, 8).forEach((e) => console.log('  ERR> ' + e))

await browser.close()
