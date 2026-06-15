/* Screenshot one route: hero (viewport) + full (scrolled). Mouse-sweeps first so
   the cursor trail is present. Usage: node scripts/shoot-one.mjs <route> <name> */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = 'http://localhost:4318'
const route = process.argv[2] || '/process'
const name = process.argv[3] || 'process'
const OUT = 'shots/polish'
mkdirSync(OUT, { recursive: true })

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const step = () => {
        y += Math.max(280, window.innerHeight * 0.55)
        window.scrollTo(0, y)
        if (y < document.body.scrollHeight) setTimeout(step, 110)
        else { window.scrollTo(0, 0); setTimeout(resolve, 400) }
      }
      step()
    })
  })
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(700)
for (let i = 0; i < 18; i++) await page.mouse.move(400 + i * 30, 300 + Math.sin(i / 3) * 70, { steps: 1 })
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/${name}-hero.png` })
await autoScroll(page)
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true })
// a mid-page viewport to judge the storytelling section in detail
await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.32)))
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/${name}-mid.png` })
console.log(`saved ${name}-hero / -full / -mid`)
await browser.close()
