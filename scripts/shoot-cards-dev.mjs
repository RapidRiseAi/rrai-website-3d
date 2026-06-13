// Variant of shoot-cards.mjs that targets the running dev server instead of
// spawning a preview build (npx spawn is unavailable in this environment).
//   node scripts/shoot-cards-dev.mjs <suffix> [baseUrl]
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const SUFFIX = process.argv[2] || 'now'
const BASE = process.argv[3] || 'http://localhost:5173'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('shots', { recursive: true })

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 })
await page.goto(`${BASE}/?shot=1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas', { timeout: 15000 })
await wait(3500)
await page.evaluate(() => {
  const sec = document.querySelector('section[data-carousel]')
  window.scrollTo(0, sec ? sec.offsetTop : window.innerHeight)
  window.dispatchEvent(new Event('scroll'))
  window.__wfSetProgress && window.__wfSetProgress(0.99)
})
const names = ['globe', 'gear', 'codeblock', 'workflow', 'sparkle', 'cubes', 'funnel']
for (let c = 0; c < 7; c++) {
  await page.evaluate((i) => window.__wfSetCard && window.__wfSetCard(i), c)
  await wait(3200)
  await page.screenshot({ path: `shots/card${c}_${names[c]}_${SUFFIX}.png` })
  console.log(`done card ${c} ${names[c]}`)
}
await browser.close()
