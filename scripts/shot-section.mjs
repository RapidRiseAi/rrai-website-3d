/* Temporary helper: screenshot the Custom Solutions section + footer.
   Usage: node scripts/shot-section.mjs <outPrefix> [baseUrl]            */
import { chromium } from 'playwright'

const PREFIX = process.argv[2] || 'current'
const BASE = process.argv[3] || 'http://localhost:5173'
const DIR = 'scripts/orbit-shots'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1672, height: 941 } })
const page = await ctx.newPage()
await page.addInitScript(() => { window.scrollTo = () => {} })
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)

// Section view: scroll so the cp-section heading is near the top
await page.evaluate(() => {
  document.querySelector('.cp-section')?.scrollIntoView({ block: 'start', behavior: 'instant' })
})
await page.waitForTimeout(1800)
await page.screenshot({ path: `${DIR}/${PREFIX}-section.png` })

// CTA + footer view
await page.evaluate(() => {
  document.querySelector('.ftr')?.scrollIntoView({ block: 'end', behavior: 'instant' })
})
await page.waitForTimeout(1200)
await page.screenshot({ path: `${DIR}/${PREFIX}-footer.png` })

// Mobile
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
})
const mp = await mctx.newPage()
await mp.addInitScript(() => { window.scrollTo = () => {} })
await mp.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
await mp.waitForTimeout(2500)
await mp.evaluate(() => {
  document.querySelector('.cp-section')?.scrollIntoView({ block: 'start', behavior: 'instant' })
})
await mp.waitForTimeout(1500)
await mp.screenshot({ path: `${DIR}/${PREFIX}-mobile.png` })
await mp.evaluate(() => {
  document.querySelector('.ftr')?.scrollIntoView({ block: 'end', behavior: 'instant' })
})
await mp.waitForTimeout(1000)
await mp.screenshot({ path: `${DIR}/${PREFIX}-mobile-footer.png` })

await browser.close()
console.log('done')
