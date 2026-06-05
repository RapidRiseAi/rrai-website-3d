// Verify the scroll-driven journey end-to-end (NO ?shot — exercises the real
// scroll path): scroll to each stop and confirm the cards cycle and the wave
// forms from actual scroll position.  node scripts/shoot-scroll.mjs
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 4329
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('shots', { recursive: true })
async function waitForServer(u, n = 80) { for (let i = 0; i < n; i++) { try { if ((await fetch(u)).ok) return } catch {} await wait(250) } throw new Error('down') }
function run(c, a) { return new Promise((res, rej) => spawn(c, a, { stdio: 'inherit' }).on('exit', (x) => x === 0 ? res() : rej(new Error(x)))) }

const CARD_VH = 0.7
// [label, scroll position in viewport-heights]
const SHOTS = [
  ['hero',      0],
  ['card0',     1],
  ['card3',     1 + 3 * CARD_VH],
  ['card6',     1 + 6 * CARD_VH],
  ['wave',      1 + 6 * CARD_VH + 1],   // fixed-pricing stop → sec3 = 1
]

if (!process.env.SKIP_BUILD) await run('npx', ['vite', 'build'])
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  await waitForServer(`http://localhost:${PORT}/`)
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text()) })
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message))
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await wait(4500)  // let the loading screen finish + scene warm up

  for (const [name, vh] of SHOTS) {
    await page.evaluate((v) => { window.scrollTo(0, Math.round(v * window.innerHeight)) }, vh)
    await wait(2200)  // settle the card-swap + wave morph
    const y = await page.evaluate(() => window.scrollY)
    await page.screenshot({ path: `shots/scroll_${name}.png` })
    console.log(`✓ ${name} @ scrollY=${y}`)
  }

  // Wave stop again, but with the page content hidden, to confirm the funnel's
  // actual orbs morphed into the wave (it normally sits low + behind the cards).
  await page.evaluate(() => {
    const el = document.getElementById('scroll-content'); if (el) el.style.visibility = 'hidden'
  })
  await wait(1200)
  await page.screenshot({ path: 'shots/scroll_wave_only.png' })
  console.log('✓ wave_only (content hidden)')
} finally { if (browser) await browser.close(); server.kill('SIGTERM') }
