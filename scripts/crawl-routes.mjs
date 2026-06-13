/* Temporary QA: crawl every route, verify it renders real content, and check
   every internal link resolves to a known route.
   Usage: node scripts/crawl-routes.mjs [baseUrl]                              */
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:5173'

const SERVICE_SLUGS = [
  'website-development', 'client-portal', 'smart-dashboards',
  'ai-communication-agent', 'software-development', 'web-app-development',
  'automated-workflow', 'ecosystems', 'ai-implementation', 'iot-development',
  'marketing-seo',
]
const LEGAL_SLUGS = [
  'privacy-policy', 'terms-of-service', 'popia-notice', 'paia-manual',
  'cookie-notice', 'refund-cancellation-policy',
]
const ROUTES = [
  '/', '/services', '/proof', '/about', '/process', '/industries', '/contact',
  ...SERVICE_SLUGS.map((s) => `/services/${s}`),
  ...LEGAL_SLUGS.map((s) => `/${s}`),
]
const KNOWN = new Set([...ROUTES, '/pricing'])

const FORBIDDEN = ['coming soon', '[add', 'lorem ipsum', 'undefined', '[object object]']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
let failures = 0
const allLinks = new Set()

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(route === '/' ? 3500 : 800)
  const r = await page.evaluate((forbidden) => {
    const text = document.body.innerText.toLowerCase()
    const found = forbidden.filter((f) => text.includes(f))
    const h = document.querySelector('h1, h2')
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    return {
      title: document.title,
      heading: h ? h.textContent.trim().slice(0, 60) : null,
      textLen: text.length,
      forbiddenFound: found,
      links,
    }
  }, FORBIDDEN)

  const ok = r.heading && r.textLen > 200 && r.forbiddenFound.length === 0 && r.title.includes('Rapid Rise')
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${route}  [${r.title.slice(0, 48)}] h:"${r.heading}" len:${r.textLen}${r.forbiddenFound.length ? ' FORBIDDEN:' + r.forbiddenFound : ''}`)
  r.links.forEach((l) => allLinks.add(l))
}

// 404 check
await page.goto(BASE + '/this-page-does-not-exist', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const nf = await page.evaluate(() => document.body.innerText.includes('Page not found'))
console.log(`${nf ? 'PASS' : 'FAIL'}  /this-page-does-not-exist renders 404 page`)
if (!nf) failures++

// Internal link audit
const internal = [...allLinks].filter((l) => l.startsWith('/'))
const bad = internal.filter((l) => {
  const path = l.split('#')[0].split('?')[0]
  return path && !KNOWN.has(path)
})
if (bad.length) {
  failures++
  console.log('FAIL  unknown internal link targets:', [...new Set(bad)].join(', '))
} else {
  console.log(`PASS  all ${internal.length} internal links resolve to known routes`)
}
const external = [...allLinks].filter((l) => !l.startsWith('/'))
console.log('external/mailto links found:', [...new Set(external)].join(' | '))

await browser.close()
console.log(failures ? `${failures} FAILURES` : 'ALL ROUTES PASS')
process.exit(failures ? 1 : 0)
