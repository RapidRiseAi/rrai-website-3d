/* One-off visual QA for inner pages. Assumes a server is already running.
   Auto-scrolls each page so IntersectionObserver reveals fire before capture.
   Usage: node scripts/shoot-pages.mjs [baseUrl]                              */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:4318'
const OUT = 'shots/polish'
mkdirSync(OUT, { recursive: true })

const SHOTS = [
  { route: '/about', name: 'about-hero', w: 1440, h: 900 },
  { route: '/about', name: 'about-full', w: 1440, h: 900, full: true },
  { route: '/process', name: 'process-full', w: 1440, h: 900, full: true },
  { route: '/industries', name: 'industries-full', w: 1440, h: 900, full: true },
  { route: '/proof', name: 'proof-full', w: 1440, h: 900, full: true },
  { route: '/contact', name: 'contact-hero', w: 1440, h: 900 },
  { route: '/services', name: 'services-full', w: 1440, h: 900, full: true },
  { route: '/services/website-development', name: 'detail-full', w: 1440, h: 900, full: true },
  { route: '/privacy-policy', name: 'legal-full', w: 1440, h: 900, full: true },
  { route: '/about', name: 'about-mobile', w: 390, h: 844, full: true },
  { route: '/services', name: 'services-mobile', w: 390, h: 844, full: true },
]

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const step = () => {
        const max = document.body.scrollHeight
        y += Math.max(300, window.innerHeight * 0.6)
        window.scrollTo(0, y)
        if (y < max) setTimeout(step, 90)
        else { window.scrollTo(0, 0); setTimeout(resolve, 350) }
      }
      step()
    })
  })
}

const browser = await chromium.launch()
for (const s of SHOTS) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } })
  await page.goto(BASE + s.route, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(500)
  if (s.full) await autoScroll(page)   // trigger reveals across the page
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: !!s.full })
  console.log(`saved ${OUT}/${s.name}.png  (${s.route} @ ${s.w}x${s.h}${s.full ? ' full' : ''})`)
  await page.close()
}
await browser.close()
console.log('done')
