/* Temporary verification: wheel-step the REAL snap journey to the Custom
   Solutions stop and check the CTA card is fully visible at the rest position.
   Usage: node scripts/audit-journey.mjs <width> <height> [baseUrl]            */
import { chromium } from 'playwright'

const W = parseInt(process.argv[2], 10)
const H = parseInt(process.argv[3], 10)
const BASE = process.argv[4] || 'http://localhost:5173'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: W, height: H } })
const page = await ctx.newPage()
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3500) // loading screen + scene settle

// 10 wheel steps: hero -> 7 card stops -> pricing -> our work -> custom section
await page.mouse.move(W / 2, H / 2)
for (let i = 0; i < 10; i++) {
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(1800) // step cooldown + snap animation
}
await page.waitForTimeout(1200)

const report = await page.evaluate(() => {
  const vh = innerHeight
  const sec = document.querySelector('.cp-section').getBoundingClientRect()
  const card = document.querySelector('.cp-cta').getBoundingClientRect()
  const trust = document.querySelector('.cp-cta-trust').getBoundingClientRect()
  return {
    scrollY: Math.round(scrollY),
    sectionTopDelta: Math.round(sec.top),       // 0 = snap rests exactly on the section
    cardTop: Math.round(card.top),
    cardBottomMargin: Math.round(vh - card.bottom),
    cardFullyVisible: card.top >= 0 && card.bottom <= vh,
    trustLineFullyVisible: trust.bottom <= vh,
  }
})
await page.screenshot({ path: `scripts/orbit-shots/journey-${W}x${H}.png` })
await browser.close()
console.log(JSON.stringify(report))
