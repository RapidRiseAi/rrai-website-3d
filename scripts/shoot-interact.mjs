/* Verify service-hero object interaction: hover cursor, grab-to-tilt, ±60° clamp.
   Usage: node scripts/shoot-interact.mjs [route] */
import { chromium } from 'playwright'

const BASE = 'http://localhost:4318'
const route = process.argv[2] || '/services/automated-workflow'
const OUT = 'shots/polish'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await ctx.newPage()
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))

await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 })
await page.locator('.cc-banner').getByRole('button', { name: 'Accept all' }).click().catch(() => {})
await page.waitForTimeout(1600)

const canvas = page.locator('.svc-hero-object canvas')
const box = await canvas.boundingBox()
const cx = Math.round(box.x + box.width / 2)
const cy = Math.round(box.y + box.height / 2)

const cursorOf = () => canvas.evaluate((el) => el.style.cursor || getComputedStyle(el).cursor)

const before = await cursorOf()
// Hover the object centre
await page.mouse.move(cx, cy, { steps: 6 })
await page.waitForTimeout(500)
const onHover = await cursorOf()
await page.screenshot({ path: `${OUT}/interact-hover.png` })

// Grab + drag hard to the right & down (well past the clamp) to prove ±60° cap
await page.mouse.down()
const duringDown = await cursorOf()
for (let i = 1; i <= 12; i++) await page.mouse.move(cx + i * 60, cy + i * 30, { steps: 1 })
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/interact-drag-right.png` })

// Drag hard the other way
for (let i = 1; i <= 24; i++) await page.mouse.move(cx + 720 - i * 60, cy + 360 - i * 34, { steps: 1 })
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/interact-drag-left.png` })

await page.mouse.up()
await page.waitForTimeout(1400) // ease back
await page.screenshot({ path: `${OUT}/interact-released.png` })

console.log('cursor before hover :', JSON.stringify(before))
console.log('cursor on hover     :', JSON.stringify(onHover), onHover === 'grab' ? 'OK' : 'EXPECTED grab')
console.log('cursor on grab      :', JSON.stringify(duringDown), duringDown === 'grabbing' ? 'OK' : 'EXPECTED grabbing')
console.log('console errors      :', errs.length)
errs.slice(0, 5).forEach((e) => console.log(' >', e.slice(0, 140)))
await browser.close()
