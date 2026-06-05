// Assert the idle-snap behaviour: a native scroll that lands OFF a stop (the
// "stuck halfway" scenario from scrollbar drag / middle-click) must auto-snap to
// the nearest stop.  node scripts/check-snap.mjs
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 4330
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitForServer(u, n = 80) { for (let i = 0; i < n; i++) { try { if ((await fetch(u)).ok) return } catch {} await wait(250) } throw new Error('down') }
function run(c, a) { return new Promise((res, rej) => spawn(c, a, { stdio: 'inherit' }).on('exit', (x) => x === 0 ? res() : rej(new Error(x)))) }

const CARD_VH = 0.7
const stopsVH = [0, 1, 1+CARD_VH, 1+2*CARD_VH, 1+3*CARD_VH, 1+4*CARD_VH, 1+5*CARD_VH, 1+6*CARD_VH, 2+6*CARD_VH, 3+6*CARD_VH, 4+6*CARD_VH]

if (!process.env.SKIP_BUILD) await run('npx', ['vite', 'build'])
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
let browser, failures = 0
try {
  await waitForServer(`http://localhost:${PORT}/`)
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await wait(4500)

  const vh = await page.evaluate(() => window.innerHeight)
  const stopsPx = stopsVH.map((v) => Math.round(v * vh))

  // Off-stop targets (fractions of a viewport) → expected nearest stop.
  const cases = [
    ['halfway card2/3', 2.45, 1 + 2 * CARD_VH],   // between card2 and card3
    ['just past card4', 3.9,  1 + 4 * CARD_VH],   // nearest is card4 stop (3.8)
    ['1% off card1',    1.71, 1 + 1 * CARD_VH],   // a hair off card1 (1.7)
    ['mid hero/card0',  0.40, 0],                 // drifting in the hero
    ['near wave',       6.05, 2 + 6 * CARD_VH],   // approaching fixed-pricing
  ]

  for (const [label, fromVH, expectVH] of cases) {
    // Simulate a native scroll (scrollbar/middle-click just change scrollY).
    await page.evaluate((y) => window.scrollTo(0, Math.round(y * window.innerHeight)), fromVH)
    await wait(1700)  // idle (150ms) + snap animation
    const y = await page.evaluate(() => window.scrollY)
    const expectPx = Math.round(expectVH * vh)
    const ok = Math.abs(y - expectPx) <= 3
    const onAnyStop = stopsPx.some((s) => Math.abs(s - y) <= 3)
    if (!ok || !onAnyStop) failures++
    console.log(`${ok && onAnyStop ? '✓' : '✗'} ${label}: from ${Math.round(fromVH*vh)} → ${y} (expected ${expectPx})`)
  }
} finally { if (browser) await browser.close(); server.kill('SIGTERM') }
process.exit(failures ? 1 : 0)
