// Assert wheel/keyboard stepping: each notch advances exactly one stop (one card
// or section), and reverses cleanly.  node scripts/check-wheel.mjs
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = 4331
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
  await page.mouse.move(800, 450)

  const settle = async () => {            // wait until scrollY is stable for 4×150ms
    let prev = -1, stable = 0
    for (let i = 0; i < 40; i++) {
      const y = await page.evaluate(() => window.scrollY)
      stable = y === prev ? stable + 1 : 0
      if (stable >= 4) return y
      prev = y
      await wait(150)
    }
    return prev
  }
  const expect = async (label, idx) => {
    const y = await settle()
    const want = Math.round(stopsVH[idx] * vh)
    const ok = Math.abs(y - want) <= 3
    if (!ok) failures++
    console.log(`${ok ? '✓' : '✗'} ${label}: scrollY=${y} (stop ${idx} = ${want})`)
  }

  // Eight notches down → should land on stops 1..8 in order (cards 0..6, then wave).
  for (let i = 1; i <= 8; i++) {
    await page.mouse.wheel(0, 120)
    await wait(250)
    await expect(`wheel down ${i}`, i)
  }
  // Three notches up → back through wave/card6/card5.
  for (let i = 7; i >= 5; i--) {
    await page.mouse.wheel(0, -120)
    await wait(250)
    await expect(`wheel up → ${i}`, i)
  }
} finally { if (browser) await browser.close(); server.kill('SIGTERM') }
process.exit(failures ? 1 : 0)
