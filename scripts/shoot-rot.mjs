// Capture the sparkle (card 4) face-on AND rotated, to confirm it's one smooth
// surface (not stacked layers) from any angle.  node scripts/shoot-rot.mjs
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
const PORT = 4327
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync('shots', { recursive: true })
async function waitForServer(u, n = 80) { for (let i = 0; i < n; i++) { try { if ((await fetch(u)).ok) return } catch {} await wait(250) } throw new Error('down') }
function run(c, a) { return new Promise((res, rej) => spawn(c, a, { stdio: 'inherit' }).on('exit', (x) => x === 0 ? res() : rej(new Error(x)))) }
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
  await page.evaluate(() => {
    const sec = document.querySelector('section[data-carousel]')
    window.scrollTo(0, sec ? sec.offsetTop : window.innerHeight)
    window.dispatchEvent(new Event('scroll'))
    window.__wfSetProgress && window.__wfSetProgress(0.99)
    window.__wfSetCard && window.__wfSetCard(4)
    const el = document.getElementById('scroll-content'); if (el) el.style.visibility = 'hidden'
  })
  await wait(3200)
  await (await page.$('canvas')).screenshot({ path: 'shots/sparkle_face.png' })
  console.log('✓ sparkle_face')
  for (const [y, name] of [[0.8, 'rot1'], [1.4, 'rot2']]) {
    await page.evaluate((v) => window.__wfSetRotY && window.__wfSetRotY(v), y)
    await wait(1500)
    await (await page.$('canvas')).screenshot({ path: `shots/sparkle_${name}.png` })
    console.log(`✓ sparkle_${name} (rotY ${y})`)
  }
} finally { if (browser) await browser.close(); server.kill('SIGTERM') }
