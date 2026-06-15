/* Screenshot a route's hero at the user's real resolution (1920x1080) so wide-
   screen layout issues are visible. Usage: node scripts/shoot-wide.mjs <route> <name> */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://localhost:4318'
const route = process.argv[2] || '/services/automated-workflow'
const name = process.argv[3] || 'wide'
const OUT = 'shots/polish'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await ctx.newPage()
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))

await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 })
// dismiss consent banner so it doesn't cover the hero
await page.locator('.cc-banner').getByRole('button', { name: 'Accept all' }).click().catch(() => {})
await page.waitForTimeout(2200)
for (let i = 0; i < 14; i++) await page.mouse.move(360 + i * 40, 360 + Math.sin(i / 3) * 60, { steps: 1 })
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/${name}-hero.png` }) // viewport only
console.log(`saved ${name}-hero | console errors: ${errs.length}`)
errs.slice(0, 5).forEach((e) => console.log(' >', e.slice(0, 140)))
await browser.close()
