/* Temporary verification script for the Custom Solutions orbit animation.
   Usage: node scripts/verify-orbit.mjs [baseUrl]                          */
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:5173'
const SHOT_DIR = 'scripts/orbit-shots'
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch()

async function openSection(ctx) {
  const page = await ctx.newPage()
  // The site's snap controller re-snaps to section stops whenever scroll goes
  // idle — and the mobile stop list has a dead zone over this section, so it
  // yanks the viewport away. Its animation scrolls via window.scrollTo while
  // scrollIntoView doesn't, so stubbing scrollTo disables only the yank.
  await page.addInitScript(() => { window.scrollTo = () => {} })
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2500) // loading screen / scene settle
  await page.evaluate(() => {
    document.querySelector('.cp-stage')?.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await page.waitForTimeout(1600)
  const inView = await page.evaluate(() => {
    const r = document.querySelector('.cp-stage')?.getBoundingClientRect()
    return !!r && r.top < innerHeight && r.bottom > 0
  })
  if (!inView) console.log('WARN: .cp-stage did not reach the viewport')
  return page
}

function sampleChips(page) {
  return page.evaluate(() => {
    const lanes = [...document.querySelectorAll('.cp-lane')]
    const els = [...document.querySelectorAll('.cp-chip--orbit')]
    return els.map((el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        label: el.textContent.trim(),
        lane: lanes.indexOf(el.closest('.cp-lane')),
        x: Math.round(r.x * 10) / 10,
        y: Math.round(r.y * 10) / 10,
        w: r.width,
        opacity: parseFloat(cs.opacity),
        visibility: cs.visibility,
      }
    })
  })
}

// ── Desktop: movement, curve, fades, no overlap ─────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await openSection(ctx)

  const hasLanes = await page.locator('.cp-lanes').count()
  check('desktop: orbit lanes rendered', hasLanes === 1)

  const a = await sampleChips(page)
  await page.screenshot({ path: `${SHOT_DIR}/desktop-t0.png`, fullPage: false })
  await page.waitForTimeout(3000)
  const b = await sampleChips(page)
  await page.screenshot({ path: `${SHOT_DIR}/desktop-t3.png`, fullPage: false })

  const visA = a.filter((c) => c.visibility === 'visible' && c.opacity > 0.05)
  check('desktop: multiple chips visible', visA.length >= 6, `${visA.length} visible`)

  const moved = a.filter((c, i) => Math.abs(b[i].x - c.x) > 20)
  check('desktop: chips are moving', moved.length >= visA.length / 2,
    `${moved.length} chips moved >20px in 3s`)

  // Only chips visible in BOTH samples count — hidden chips keep a stale
  // frozen transform and "teleport" when they re-enter (invisible to users).
  const speeds = a
    .map((c, i) => ({ c, d: Math.abs(b[i].x - c.x) / 3, vis: c.visibility === 'visible' && b[i].visibility === 'visible' }))
    .filter((s) => s.vis && s.d > 1 && s.d < 150)
    .map((s) => s.d)
  const maxSpeed = Math.max(...speeds, 0)
  check('desktop: movement is slow/premium', maxSpeed > 4 && maxSpeed < 45,
    `max ~${maxSpeed.toFixed(0)}px/s among chips visible in both samples`)

  // Counter-directional lanes — only chips visible in both samples count, so
  // a loop-seam wrap (hidden ~loop-length teleport) cannot flip the sign.
  const sampleLaneXs = () => page.evaluate(() => {
    const lanes = [...document.querySelectorAll('.cp-lane')]
    return lanes.map((l) => [...l.querySelectorAll('.cp-chip--orbit')].map((el) => ({
      x: el.getBoundingClientRect().x,
      vis: getComputedStyle(el).visibility === 'visible',
    })))
  })
  const laneDir = await sampleLaneXs()
  await page.waitForTimeout(2000)
  const laneDir2 = await sampleLaneXs()
  const dirOf = (c1, c2) => Math.sign(c1.reduce((s, c, i) => {
    const d = c2[i].x - c.x
    return c.vis && c2[i].vis && Math.abs(d) < 150 ? s + d : s
  }, 0))
  check('desktop: lanes counter-directional',
    dirOf(laneDir[0], laneDir2[0]) === -1 && dirOf(laneDir[1], laneDir2[1]) === 1)

  // Curve: edge chips should sit lower (greater y of element top) than center
  // ones — compare within lane A only, since lane B's baseline is lower by design.
  const stage = await page.evaluate(() => {
    const r = document.querySelector('.cp-lanes').getBoundingClientRect()
    return { cx: r.x + r.width / 2, half: r.width / 2 }
  })
  let arcChecked = false
  for (let attempt = 0; attempt < 5 && !arcChecked; attempt++) {
    const vis = (await sampleChips(page)).filter(
      (c) => c.lane === 0 && c.visibility === 'visible' && c.opacity > 0.2,
    )
    const centerY = vis.filter((c) => Math.abs(c.x + c.w / 2 - stage.cx) < stage.half * 0.3)
    const edgeY = vis.filter((c) => Math.abs(c.x + c.w / 2 - stage.cx) > stage.half * 0.65)
    if (centerY.length && edgeY.length) {
      const avg = (arr) => arr.reduce((s, c) => s + c.y, 0) / arr.length
      check('desktop: edge chips sit lower than center (arc)', avg(edgeY) > avg(centerY) + 3,
        `center avg y ${avg(centerY).toFixed(1)}, edge avg y ${avg(edgeY).toFixed(1)} (lane A)`)
      arcChecked = true
    } else {
      await page.waitForTimeout(1000) // wait for chips to drift into both zones
    }
  }
  if (!arcChecked) check('desktop: edge chips sit lower than center (arc)', false, 'no sample had chips in both zones')

  // Edge fade: chips at the very edge should be fading (the fade zone is
  // intentionally narrow — chips stay readable until ~93% of the half-stage)
  const nearEdge = (await sampleChips(page)).filter((c) => {
    const cx = c.x + c.w / 2
    return c.visibility === 'visible' && Math.abs(cx - stage.cx) > stage.half * 0.93
  })
  check('desktop: chips fade near edges',
    nearEdge.every((c) => c.opacity < 0.85),
    nearEdge.map((c) => `${c.label}:${c.opacity}`).join(', ') || 'none near edge right now')

  // No overlap among same-lane visible chips
  const overlap = await page.evaluate(() => {
    const lanes = [...document.querySelectorAll('.cp-lane')]
    const bad = []
    for (const lane of lanes) {
      const rects = [...lane.querySelectorAll('.cp-chip--orbit')]
        .filter((el) => getComputedStyle(el).visibility === 'visible')
        .map((el) => el.getBoundingClientRect())
        .sort((p, q) => p.x - q.x)
      for (let i = 1; i < rects.length; i++) {
        if (rects[i].x < rects[i - 1].x + rects[i - 1].width - 2) bad.push(i)
      }
    }
    return bad.length
  })
  check('desktop: no chip overlap', overlap === 0)

  // Hover slowdown (band keeps moving, slower)
  const beforeHover = await sampleChips(page)
  await page.hover('.cp-lanes', { position: { x: 720, y: 30 } })
  await page.waitForTimeout(1500) // let multiplier lerp down
  const h1 = await sampleChips(page)
  await page.waitForTimeout(2000)
  const h2 = await sampleChips(page)
  // Same exclusion as the speed check: ignore loop-seam wraps (hidden teleports)
  const hoverSpeeds = h1
    .map((c, i) => ({ d: Math.abs(h2[i].x - c.x) / 2, vis: c.visibility === 'visible' && h2[i].visibility === 'visible' }))
    .filter((s) => s.vis && s.d > 0.5 && s.d < 150)
    .map((s) => s.d)
  const hoverMax = Math.max(...hoverSpeeds, 0)
  check('desktop: hover slows but does not stop', hoverMax > 2 && hoverMax < maxSpeed * 0.7,
    `hover max ~${hoverMax.toFixed(1)}px/s vs normal ~${maxSpeed.toFixed(0)}px/s`)
  void beforeHover

  await ctx.close()
}

// ── Reduced motion: static curved layout ────────────────────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  const page = await openSection(ctx)
  const lanes = await page.locator('.cp-lanes').count()
  const rows = await page.locator('.cp-row').count()
  check('reduced motion: static rows shown, no orbit', lanes === 0 && rows === 2,
    `lanes=${lanes} rows=${rows}`)
  const chipCount = await page.locator('.cp-row .cp-chip').count()
  check('reduced motion: static chips rendered', chipCount === 12, `${chipCount} chips`)
  await page.screenshot({ path: `${SHOT_DIR}/reduced-motion.png` })
  await ctx.close()
}

// ── Mobile: band alive, readable, no horizontal scroll ──────────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await openSection(ctx)
  const a = await sampleChips(page)
  await page.waitForTimeout(3000)
  const b = await sampleChips(page)
  const visM = a.filter((c) => c.visibility === 'visible' && c.opacity > 0.05)
  check('mobile: chips visible on band', visM.length >= 3, `${visM.length} visible`)
  const movedM = a.filter((c, i) => Math.abs(b[i].x - c.x) > 10)
  check('mobile: chips moving', movedM.length >= 2, `${movedM.length} moved`)
  const hScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  check('mobile: no horizontal scrollbar', !hScroll)
  await page.screenshot({ path: `${SHOT_DIR}/mobile.png` })
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
