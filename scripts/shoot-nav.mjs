/* Visual QA for navbar, mega-dropdown, cursor trail, and permanent-nav-on-scroll.
   Usage: node scripts/shoot-nav.mjs [baseUrl]                                  */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:4318'
const OUT = 'shots/polish'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// 1. Dropdown hovered (on an inner page, navbar is visible immediately)
await page.goto(BASE + '/about', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await page.hover('.navbar-link--drop')
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/nav-dropdown.png`, clip: { x: 0, y: 0, width: 1440, height: 620 } })
console.log('saved nav-dropdown.png')

// 2. Cursor trail — sweep the mouse and capture mid-motion
await page.mouse.move(300, 300)
for (let i = 0; i < 24; i++) await page.mouse.move(300 + i * 26, 300 + Math.sin(i / 3) * 80, { steps: 1 })
await page.screenshot({ path: `${OUT}/cursor-trail.png`, clip: { x: 0, y: 120, width: 1440, height: 620 } })
console.log('saved cursor-trail.png')

// 3. Home: navbar must remain after scrolling down
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2600) // loader + entrance
await page.evaluate(() => window.scrollTo(0, 1600))
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/home-scrolled-nav.png`, clip: { x: 0, y: 0, width: 1440, height: 220 } })
console.log('saved home-scrolled-nav.png')

await browser.close()
console.log('done')
