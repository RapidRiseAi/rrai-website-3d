// Hover diagnosis: place the real mouse over a Section-2 object and over the
// Section-3 wave, then capture the canvas. A working hover shows a brighter glow
// cluster right under the cursor.
//   node scripts/shoot-hover.mjs

import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 4321
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('shots', { recursive: true })
async function waitForServer(url, n = 80) { for (let i = 0; i < n; i++) { try { if ((await fetch(url)).ok) return } catch {} await wait(250) } throw new Error('server down') }
function run(cmd, a) { return new Promise((res, rej) => spawn(cmd, a, { stdio: 'inherit' }).on('exit', (c) => c === 0 ? res() : rej(new Error(c)))) }

if (!process.env.SKIP_BUILD) await run('npx', ['vite', 'build'])
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
let browser
try {
  await waitForServer(`http://localhost:${PORT}/`)
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
  page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()) })
  await page.goto(`http://localhost:${PORT}/?shot=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await wait(3500)

  const sweep = async (cx, cy) => { for (let i = 0; i < 10; i++) { await page.mouse.move(cx - 50 + i * 10, cy - 16 + i * 3); await wait(50) } await page.mouse.move(cx, cy); await wait(700) }

  // ---- Section 2: scroll into the carousel, select a card, hover the object ----
  await page.evaluate(() => {
    const sec = document.querySelector('section[data-carousel]')
    window.scrollTo(0, sec ? sec.offsetTop : window.innerHeight)
    window.dispatchEvent(new Event('scroll'))
    window.__wfSetProgress && window.__wfSetProgress(0.99)
    window.__wfSetCard && window.__wfSetCard(2)
  })
  await wait(3500)
  // Report the object's bright centroid so I know where to aim (and after hover).
  const aimS2 = { x: 300, y: 235 }
  await sweep(aimS2.x, aimS2.y)
  await page.screenshot({ path: 'shots/hover_s2.png', timeout: 22000 })
  console.log(`✓ saved shots/hover_s2.png (cursor ${aimS2.x},${aimS2.y})`)

  // ---- Section 3: scroll to the wave, hover over the bottom band ----
  await page.evaluate(() => {
    const sec = document.querySelector('.fp-section')
    window.scrollTo(0, sec ? sec.offsetTop : window.innerHeight * 2)
    window.dispatchEvent(new Event('scroll'))
  })
  await wait(4000)
  await sweep(320, 855)
  await page.screenshot({ path: 'shots/hover_s3.png', timeout: 22000 })
  console.log('✓ saved shots/hover_s3.png (cursor 320,855)')
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
