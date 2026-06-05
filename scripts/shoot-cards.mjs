// Capture all 7 Section-2 card objects (to check sizes match + the sparkle shape).
//   node scripts/shoot-cards.mjs
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 4326
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}/?shot=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await wait(3500)
  await page.evaluate(() => {
    const sec = document.querySelector('section[data-carousel]')
    window.scrollTo(0, sec ? sec.offsetTop : window.innerHeight)
    window.dispatchEvent(new Event('scroll'))
    window.__wfSetProgress && window.__wfSetProgress(0.99)
    const el = document.getElementById('scroll-content'); if (el) el.style.visibility = 'hidden'
  })
  const names = ['globe', 'gear', 'codeblock', 'workflow', 'sparkle', 'cubes', 'funnel']
  for (let c = 0; c < 7; c++) {
    await page.evaluate((i) => window.__wfSetCard && window.__wfSetCard(i), c)
    await wait(3200)
    await (await page.$('canvas')).screenshot({ path: `shots/card${c}_${names[c]}.png` })
    console.log(`✓ card ${c} ${names[c]}`)
  }
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
