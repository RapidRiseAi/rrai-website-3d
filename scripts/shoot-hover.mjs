// Hover verification: drive to the funnel card (Section 2), move the real mouse
// over the object, and capture — the orbs near the cursor should glow brighter.
//   node scripts/shoot-hover.mjs [clientX] [clientY] [out]

import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const X = Number(process.argv[2] ?? 470)
const Y = Number(process.argv[3] ?? 470)
const OUT = process.argv[4] ?? 'shots/hover.png'
const PORT = 4320
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('shots', { recursive: true })

async function waitForServer(url, n = 80) {
  for (let i = 0; i < n; i++) { try { if ((await fetch(url)).ok) return } catch {} await wait(250) }
  throw new Error('server down')
}
function run(cmd, a) { return new Promise((res, rej) => spawn(cmd, a, { stdio: 'inherit' }).on('exit', (c) => c === 0 ? res() : rej(new Error(c)))) }

if (!process.env.SKIP_BUILD) await run('npx', ['vite', 'build'])
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  await waitForServer(`http://localhost:${PORT}/`)
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}/?shot=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await wait(3500)
  // Funnel in Section-2 card mode: progress≈1, card 6, sec3 stays 0.
  await page.evaluate(() => {
    window.__wfSetProgress && window.__wfSetProgress(0.99)
    window.__wfSetCard && window.__wfSetCard(6)
  })
  await wait(3500)
  // Sweep the mouse onto the object so the trail builds a glow right at the cursor.
  for (let i = 0; i < 8; i++) { await page.mouse.move(X - 40 + i * 5, Y - 20 + i * 3); await wait(60) }
  await page.mouse.move(X, Y)
  await wait(600)
  const canvas = await page.$('canvas')
  await canvas.screenshot({ path: OUT })
  console.log(`✓ saved ${OUT} (cursor ${X},${Y})`)
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
