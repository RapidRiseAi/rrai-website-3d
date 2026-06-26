import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import ConceptPreview from '../components/ui/ConceptPreview'
import Lightbox from '../components/ui/Lightbox'
import TiltCard from '../components/ui/TiltCard'
import Reveal from '../components/ui/Reveal'
import InfoTip from '../components/ui/InfoTip'
import Parallax from '../components/ui/Parallax'
import usePageMeta from '../hooks/usePageMeta'
import ObjectSlot from '../components/scene/ObjectSlot'
import SwipeHint from '../components/ui/SwipeHint'
import { WORK_ITEMS } from '../data/workItems'
import './ProofPage.css'

/* ── Icons (24×24, round caps) ─────────────────────────────────────────────── */
const Ico = {
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.3 3.7 5.4 3.7 8.5s-1.3 6.2-3.7 8.5c-2.4-2.3-3.7-5.4-3.7-8.5S9.6 5.8 12 3.5z" /></>,
  portal: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M3.5 9h17M8 4.5v15" /></>,
  dashboard: <><rect x="3.5" y="3.5" width="7" height="9" rx="1.4" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.4" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.4" /><rect x="3.5" y="15.5" width="7" height="5" rx="1.4" /></>,
  agent: <><rect x="4.5" y="7" width="15" height="11" rx="3" /><path d="M12 3.5V7M8.5 12h.01M15.5 12h.01M9.5 18l-1.6 2.5M14.5 18l1.6 2.5" /></>,
  automation: <><path d="M12 3.5v3M12 17.5v3M4.5 12h3M16.5 12h3" /><circle cx="12" cy="12" r="3.4" /><path d="m6.7 6.7 2.1 2.1M15.2 15.2l2.1 2.1M17.3 6.7l-2.1 2.1M8.8 15.2l-2.1 2.1" /></>,
  ecosystem: <><circle cx="12" cy="12" r="2.4" /><circle cx="5" cy="6" r="1.8" /><circle cx="19" cy="6" r="1.8" /><circle cx="5" cy="18" r="1.8" /><circle cx="19" cy="18" r="1.8" /><path d="m6.4 7.3 4 3.2M17.6 7.3l-4 3.2M6.4 16.7l4-3.2M17.6 16.7l-4-3.2" /></>,
  check: <><path d="M4.5 12.5l4.6 4.6L19.5 6.5" /></>,
  layers: <><path d="M12 3.5 21 8l-9 4.5L3 8z" /><path d="m3 12 9 4.5L21 12M3 16l9 4.5L21 16" /></>,
}
function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Ico[name] ?? Ico.layers}
    </svg>
  )
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CATEGORIES = [
  { icon: 'globe', title: 'Websites', text: 'Premium marketing sites and landing pages built to convert.' },
  { icon: 'portal', title: 'Portals', text: 'Private client areas for documents, status, and communication.' },
  { icon: 'dashboard', title: 'Dashboards', text: 'Live business data in one clear, decision ready view.' },
  { icon: 'agent', title: 'AI Agents', text: 'Chat and WhatsApp assistants that answer, capture, and route.' },
  { icon: 'automation', title: 'Automations', text: 'Workflows that move information without manual steps.' },
  { icon: 'ecosystem', title: 'Ecosystems', text: 'All of the above, connected into one scalable system.' },
]

const STANDARDS = [
  'Mobile first layouts tested on real devices',
  'Fast loading and clean technical structure',
  'Accessible headings, labels, contrast, and focus states',
  'Honest labels: concept work is marked as concept work',
  'Written scope, transparent ZAR pricing, and documented handover',
  'Built to connect: every build has an upgrade path',
]

const statusSlug = (s) => s.toLowerCase().replace(/\s+/g, '-')

export default function ProofPage() {
  usePageMeta(
    'Proof of What We Can Build | Rapid Rise AI',
    'Explore Rapid Rise AI concept previews, demo builds and example systems across websites, client portals, smart dashboards, AI agents and connected business ecosystems.',
  )

  const [gallery, setGallery] = useState(null) // { images, title } | null

  return (
    <PageLayout>
      <div className="pg-wrap prf-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <Parallax className="depth-orb prf-orb prf-orb-1" speed={-50} aria-hidden="true" />
          <Parallax className="depth-orb prf-orb prf-orb-2" speed={70} aria-hidden="true" />
          <ObjectSlot className="pg-hero-object" />
          <p className="pg-eyebrow">Proof &amp; Builds</p>
          <h1 className="pg-h1">Proof of what we can build.</h1>
          <p className="pg-sub">
            Live client websites and fully functional showcase systems:
            websites, portals, dashboards, AI assistants, automations, and
            connected ecosystems that show how Rapid Rise AI works in practice.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/services">See Services and Pricing</Link>
          </div>
        </header>

        {/* Featured concept previews */}
        <section className="prf-section" aria-label="Featured builds and concepts">
          <Reveal className="prf-head" variant="up">
            <span className="kicker">The Gallery</span>
            <h2 className="prf-h2">Featured work</h2>
            <p className="prf-lead">
              Live client sites and working showcases of the systems we build,
              from a first booking-ready website to a fully connected operations
              stack. Click any card to browse its screens.
            </p>
          </Reveal>

          <div className="prf-grid">
            {WORK_ITEMS.map((item, i) => (
              <Reveal key={item.id} variant="up" delay={(i % 3) * 0.08} amount={0.25} instantOnMobile>
                <TiltCard className="prf-card glass-card" max={7}>
                  <article id={item.id} className="prf-card-inner">
                    <div className="prf-media">
                      {item.mediaType === 'image' && item.mediaSrc ? (
                        <button
                          type="button"
                          className="media-shot-btn"
                          onClick={() => setGallery({ images: item.gallery ?? [item.mediaSrc], title: item.title })}
                          aria-label={`View the ${item.title} gallery`}
                        >
                          <img className="media-shot" src={item.mediaSrc} alt={item.mediaAlt} loading="lazy" />
                          <span className="media-shot-zoom" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                            View {item.gallery ? item.gallery.length : 1} screens
                          </span>
                        </button>
                      ) : (
                        <ConceptPreview kind={item.mockKind} label={item.mediaAlt} />
                      )}
                      <span className={`prf-status prf-status--${statusSlug(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="prf-body">
                      <h3 className="prf-title tilt-pop-sm">{item.title}</h3>
                      <p className="prf-desc">{item.shortDescription}</p>
                      <div className="prf-tags">
                        {item.tags.slice(0, 3).map((t) => (
                          <span className="prf-tag" key={t}>{t}</span>
                        ))}
                      </div>
                      {item.note && <InfoTip>{item.note}</InfoTip>}
                      {item.external ? (
                        <a className="prf-link" href={item.href} target="_blank" rel="noreferrer">
                          {item.ctaLabel ?? 'Visit live site'} <ArrowIcon />
                        </a>
                      ) : (
                        <Link className="prf-link" to={item.href}>
                          {item.ctaLabel ?? 'Explore this service'} <ArrowIcon />
                        </Link>
                      )}
                    </div>
                  </article>
                </TiltCard>
              </Reveal>
            ))}
          </div>
          <SwipeHint />
        </section>

        {/* Categories */}
        <section className="prf-section" aria-label="What we build">
          <Reveal className="prf-head" variant="up">
            <span className="kicker">What We Build</span>
            <h2 className="prf-h2">Work categories</h2>
            <p className="prf-lead">
              Six building blocks. We start with one and grow toward a single,
              connected system as your business expands.
            </p>
          </Reveal>

          <div className="prf-cat-grid">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.title} variant="up" delay={(i % 3) * 0.07} amount={0.4} instantOnMobile>
                <TiltCard className="prf-cat glass-card" max={9}>
                  <span className="prf-cat-ic tilt-pop-sm"><Icon name={c.icon} /></span>
                  <h3 className="prf-cat-title tilt-pop-sm">{c.title}</h3>
                  <p className="prf-cat-text">{c.text}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
          <SwipeHint />
        </section>

        {/* Quality standards */}
        <section className="prf-section" aria-label="Quality standards">
          <Reveal variant="scale">
            <div className="prf-standards glass-card glass-card--bright">
              <div className="prf-standards-head">
                <span className="kicker">Quality Bar</span>
                <h2 className="prf-h2">The standard every build meets</h2>
                <p className="prf-lead">
                  Concept or client work, the engineering bar never moves. Every
                  build clears the same checklist before it ships.
                </p>
              </div>
              <ul className="prf-checklist">
                {STANDARDS.map((s, i) => (
                  <Reveal as="li" key={s} variant="up" delay={i * 0.06} amount={0.6}>
                    <span className="prf-check" aria-hidden="true"><CheckIcon /></span>
                    <span className="prf-check-text">{s}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="prf-section" aria-label="Start your project">
          <Reveal variant="scale">
            <div className="prf-cta glass-card glass-card--bright">
              <h2 className="prf-cta-title">Want something like this for your business?</h2>
              <p className="prf-cta-sub">
                Every system here started as one conversation about a real
                business problem. Tell us yours.
              </p>
              <div className="prf-cta-actions">
                <Link className="pg-btn-primary" to="/contact">Start Your Project <ArrowIcon /></Link>
                <a className="pg-btn-ghost" href="https://wa.me/27649031234" target="_blank" rel="noreferrer">
                  Message Us on WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
      {gallery && (
        <Lightbox images={gallery.images} title={gallery.title} onClose={() => setGallery(null)} />
      )}
    </PageLayout>
  )
}
