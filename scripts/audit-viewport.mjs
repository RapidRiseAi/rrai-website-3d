/* Temporary verification: measure Custom Solutions section fit at a viewport.
   Usage: node scripts/audit-viewport.mjs <width> <height> [baseUrl]
   Prints a JSON report and saves scripts/orbit-shots/audit-<w>x<h>.png        */
import { chromium } from 'playwright'

const W = parseInt(process.argv[2], 10)
const H = parseInt(process.argv[3], 10)
const BASE = process.argv[4] || 'http://localhost:5173'

const browser = await chromium.launch()
const isMobile = W < 800
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  ...(isMobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
})
const page = await ctx.newPage()
// The snap controller re-snaps on idle via window.scrollTo; stub it so the
// measurement position (section top at viewport top — exactly where the snap
// rests the page) is stable.
await page.addInitScript(() => { window.scrollTo = () => {} })
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)
await page.evaluate(() => {
  document.querySelector('.cp-section')?.scrollIntoView({ block: 'start', behavior: 'instant' })
})
await page.waitForTimeout(1800)

const report = await page.evaluate(() => {
  const vh = innerHeight
  const r = (sel) => document.querySelector(sel)?.getBoundingClientRect() ?? null
  const sec = r('.cp-section')
  const card = r('.cp-cta')
  const trust = r('.cp-cta-trust')
  const badge = r('.cp-cta-badge')
  const primary = r('.cp-btn-primary')
  const ghost = r('.cp-btn-ghost')

  // Lowest visible chip that horizontally overlaps the card (collision check)
  let chipCardGap = null
  if (card) {
    const chips = [...document.querySelectorAll('.cp-chip')]
      .filter((el) => getComputedStyle(el).visibility !== 'hidden')
      .map((el) => el.getBoundingClientRect())
      .filter((c) => c.right > card.left && c.left < card.right)
    if (chips.length) chipCardGap = Math.round(card.top - Math.max(...chips.map((c) => c.bottom)))
  }

  const desktop = matchMedia('(min-width: 1101px)').matches
  // Expected snap stop for this section on the desktop journey:
  // hero(1) + carousel(1 + 6*0.7 = 5.2) + pricing(1) + our-work(1) = 8.2 vh
  const expectedStop = desktop ? Math.round(8.2 * vh) : null
  const sectionTopDoc = sec ? Math.round(sec.top + scrollY) : null

  return {
    viewport: { w: innerWidth, h: vh },
    desktopLayout: desktop,
    sectionHeight: sec ? Math.round(sec.height) : null,
    sectionFitsOneViewport: sec ? sec.height <= vh + 1 : null,
    cardBottomVsViewport: card ? Math.round(vh - card.bottom) : null,
    cardFullyVisible: card ? card.top >= 0 && card.bottom <= vh : null,
    trustLineFullyVisible: trust ? trust.bottom <= vh : null,
    badgeTopVisible: badge ? badge.top >= 0 : null,
    chipToCardGapPx: chipCardGap,
    buttonsStacked: primary && ghost ? Math.abs(primary.left - ghost.left) < 2 && ghost.top >= primary.bottom : null,
    stopAlignmentDeltaPx: expectedStop != null && sectionTopDoc != null ? sectionTopDoc - expectedStop : null,
    horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }
})

await page.screenshot({ path: `scripts/orbit-shots/audit-${W}x${H}.png` })
await browser.close()
console.log(JSON.stringify(report, null, 2))
