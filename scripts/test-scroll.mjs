import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1400, height: 820 }, deviceScaleFactor: 1 })
const p = await ctx.newPage()
const errs = []; p.on('pageerror', e => errs.push(e.message))
await p.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 })
await p.addStyleTag({ content: '.cc-banner,.grw{display:none!important}' })
await p.waitForTimeout(900)
await p.mouse.move(700, 410)

const vh = await p.evaluate(() => window.innerHeight)
const CARD_VH = 0.55
const cardOf = async () => Math.round(((await p.evaluate(() => window.scrollY)) / vh - 1) / CARD_VH)
const setY = async (y) => { await p.evaluate((yy) => window.scrollTo(0, yy), Math.round(y)); await p.waitForTimeout(1150) }
// dispatch a continuous burst of wheel events for ~ms, spaced 28ms in real page
// time (a trackpad swipe = steady high-frequency events, NOT one slow CDP round
// trip per event). All inside one gesture window.
async function gesture(ms, dir = 1) {
  await p.evaluate(({ ms, dir }) => new Promise((res) => {
    const t0 = performance.now()
    const tick = () => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: dir * 16, cancelable: true, bubbles: true }))
      if (performance.now() - t0 < ms) setTimeout(tick, 28); else res()
    }
    tick()
  }), { ms, dir })
}
const settle = () => p.waitForTimeout(1150)

let pass = 0, fail = 0
const check = (n, ok, ex = '') => { console.log((ok ? 'PASS  ' : 'FAIL  ') + n + (ex ? '  — ' + ex : '')); ok ? pass++ : fail++ }

// A) short gesture from the hero advances exactly ONE stop (to card 0)
await setY(0)
await gesture(120); await settle()
let a = await cardOf(); check('short gesture from hero → 1 stop (card 0)', a === 0, 'card=' + a)

// B) a SHORT gesture must NOT blow through multiple cards (the core fix)
await gesture(120); await settle()
let bcard = await cardOf(); check('short gesture advances exactly 1 card (not many)', bcard === 1, 'card=' + bcard)

// C) a long (>0.7s) gesture advances ~2 cards (2 or 3 with timing jitter)
await gesture(820); await settle()
let c = await cardOf(); check('long (>0.7s) gesture advances 2 cards', c - bcard >= 2 && c - bcard <= 3, 'from ' + bcard + ' to ' + c)

// D) never skip a section: a long gesture starting on the LAST card lands on the
//    next section (wave) and does NOT jump past it
await setY((1 + 6 * CARD_VH) * vh)   // last card (card 6)
await gesture(1300); await settle()
const yEnd = await p.evaluate(() => window.scrollY)
const waveY = (1 + 6 * CARD_VH + 1) * vh
check('long gesture at last card does not skip the wave section', yEnd <= waveY + vh * 0.55, 'y=' + Math.round(yEnd) + ' waveTop≈' + Math.round(waveY))

// E) release & reengage: two quick gestures only 200ms apart each advance a card
await setY((1 + 1 * CARD_VH) * vh)   // card 1
await gesture(110); await p.waitForTimeout(200); await gesture(110); await settle()
let e = await cardOf(); check('quick re-engage (200ms apart) advances 2 cards', e === 3, 'card=' + e)

check('no console errors', errs.length === 0, errs.slice(0, 2).join(' | '))
console.log(`\n${pass}/${pass + fail} checks passed`)
await ctx.close(); await b.close()
process.exit(fail ? 1 : 0)
