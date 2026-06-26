import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { WORK_ITEMS, WORK_SECTION_COPY } from '../../data/workItems'
import { isDesktopLayout } from '../../utils/scrollLayout'
import SwipeHint from './SwipeHint'
import ConceptPreview from './ConceptPreview'
import InfoTip from './InfoTip'
import Lightbox from './Lightbox'

/* ── Icons (line style matches the rest of the site: thin, round caps) ─────── */
const ArrowUpRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 17.5 17.5 6.5M8.5 6.5h9v9" />
  </svg>
)
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" opacity="0.55" />
    <path d="M8 12.2l2.6 2.6L16 9.5" />
  </svg>
)
const PenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19.5h8.5" /><path d="M16.7 4.3a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4z" />
  </svg>
)
const CodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5" />
  </svg>
)
const CubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 2.5 8 4.5v10l-8 4.5-8-4.5V7z" /><path d="m4.2 7.3 7.8 4.4 7.8-4.4M12 12v9" />
  </svg>
)
const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 21 12l-9 9-9-9z" />
  </svg>
)
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.8" /><path d="M5.4 20a6.6 6.6 0 0 1 13.2 0" />
  </svg>
)
const BarsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 20.5v-6M12 20.5v-11M19 20.5V7" />
  </svg>
)
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" /><path d="M14 2.5V7.5h5" />
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13.5a2.4 2.4 0 0 1-2.4 2.4H9l-4.5 3.4.02-3.4A2.4 2.4 0 0 1 4 13.5v-6A2.4 2.4 0 0 1 6.4 5.1h11.2A2.4 2.4 0 0 1 20 7.5z" />
  </svg>
)
const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5 13.6 10 19 11.5 13.6 13 12 18.5 10.4 13 5 11.5 10.4 10z" />
  </svg>
)
const BoltIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />
  </svg>
)
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M11 18.5h2" />
  </svg>
)
const QrIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h3v3h-3zM20.5 14v.01M17 20.5h3.5M14 20.5v.01" />
  </svg>
)
const MenuBoardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
)
const ChecklistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 6.5 1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5" /><path d="M11.5 7h9M11.5 13h9M11.5 19h9" />
  </svg>
)

/* Keyword → icon for the small tag pills. First match wins; the order handles
   overlaps (e.g. "Support Automation" reads as chat/support, not automation). */
const TAG_ICONS = [
  [/design/i, PenIcon],
  [/3d/i, CubeIcon],
  [/brand/i, DiamondIcon],
  [/portal|client/i, UserIcon],
  [/dashboard|analytic|report/i, BarsIcon],
  [/document/i, FileIcon],
  [/whatsapp|chat|support/i, ChatIcon],
  [/\bai\b|agent/i, SparkIcon],
  [/automation|workflow/i, BoltIcon],
  [/inspection/i, ChecklistIcon],
  [/mobile|\bapp\b/i, PhoneIcon],
  [/\bqr\b/i, QrIcon],
  [/menu|hospitality/i, MenuBoardIcon],
  [/development|software|web/i, CodeIcon],
]
const tagIcon = (tag) => {
  const hit = TAG_ICONS.find(([re]) => re.test(tag))
  return hit ? hit[1] : DiamondIcon
}

const statusSlug = (status) => status.toLowerCase().replace(/\s+/g, '-')

const EASE = [0.16, 1, 0.3, 1]
const inView = { once: true, amount: 0.25, margin: '-60px' }

function StatusBadge({ status, className = '' }) {
  return (
    <span className={`ow-status ow-status--${statusSlug(status)} ${className}`}>
      <i className="ow-status-dot" aria-hidden="true" />
      {status}
    </span>
  )
}

/* Premium placeholder shown whenever an item has no media yet (or its media
   fails to load) — the section never breaks on a missing screenshot. */
function MediaFallback({ item, num }) {
  const Icon = tagIcon(item.tags[0] ?? '')
  return (
    <div className="ow-media-fallback" role="img" aria-label={item.mediaAlt}>
      <span className="ow-media-fallback-num" aria-hidden="true">{num}</span>
      <span className="ow-media-fallback-icon" aria-hidden="true"><Icon /></span>
      <span className="ow-media-fallback-title" aria-hidden="true">{item.title}</span>
    </div>
  )
}

function WorkPreview({ item, num, onOpenGallery }) {
  const [mediaFailed, setMediaFailed] = useState(false)
  const showMedia = item.mediaType !== 'mock' && item.mediaSrc && !mediaFailed
  return (
    <motion.article
      className="ow-preview"
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.34, ease: EASE }}
    >
      <div className="ow-media">
        {showMedia && item.mediaType === 'video' ? (
          <video
            src={item.mediaSrc}
            autoPlay
            muted
            loop
            playsInline
            aria-label={item.mediaAlt}
            onError={() => setMediaFailed(true)}
          />
        ) : showMedia ? (
          <button
            type="button"
            className="media-shot-btn"
            onClick={() => onOpenGallery?.(item)}
            aria-label={`View the ${item.title} gallery`}
          >
            <img className="media-shot" src={item.mediaSrc} alt={item.mediaAlt} onError={() => setMediaFailed(true)} loading="lazy" />
            <span className="media-shot-zoom" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
              View {item.gallery ? item.gallery.length : 1} screens
            </span>
          </button>
        ) : item.mediaType === 'mock' ? (
          <ConceptPreview kind={item.mockKind} label={item.mediaAlt} />
        ) : (
          <MediaFallback item={item} num={num} />
        )}
        <StatusBadge status={item.status} className="ow-media-badge" />
      </div>

      <div className="ow-preview-body">
        <h3 className="ow-preview-title">{item.title}</h3>
        <p className="ow-preview-desc">{item.previewDescription}</p>

        <div className="ow-tags ow-preview-tags">
          {item.tags.map((tag) => {
            const Icon = tagIcon(tag)
            return (
              <span className="ow-tag" key={tag}>
                <Icon />
                {tag}
              </span>
            )
          })}
        </div>

        <ul className="ow-highlights">
          {item.highlights.map((h) => (
            <li key={h}><CheckIcon />{h}</li>
          ))}
        </ul>

        {item.note && <InfoTip>{item.note}</InfoTip>}

        {item.external ? (
          <a className="ow-preview-btn" href={item.href} target="_blank" rel="noreferrer" aria-label={`${item.ctaLabel}: ${item.title}`}>
            {item.ctaLabel}
            <ArrowRight />
          </a>
        ) : (
          <Link className="ow-preview-btn" to={item.href} aria-label={`${item.ctaLabel}: ${item.title}`}>
            {item.ctaLabel}
            <ArrowRight />
          </Link>
        )}
      </div>
    </motion.article>
  )
}

export default function OurWorkSection() {
  // Lead with the first item that has a real screenshot (a live client site),
  // not the placeholder mock, so the default preview is a real piece of proof.
  const firstReal = WORK_ITEMS.find((w) => w.mediaType === 'image') ?? WORK_ITEMS[0]
  const [activeId, setActiveId] = useState(firstReal?.id ?? null)
  const [gallery, setGallery] = useState(null) // { images, title } | null
  const [isMobile, setIsMobile] = useState(() => !isDesktopLayout())
  const activeIndex = Math.max(0, WORK_ITEMS.findIndex((w) => w.id === activeId))
  const active = WORK_ITEMS[activeIndex]
  const displayNum = (item, i) => item.number ?? String(i + 1).padStart(2, '0')
  const openGallery = (it) => setGallery({ images: it.gallery ?? [it.mediaSrc], title: it.title })

  useEffect(() => {
    const onR = () => setIsMobile(!isDesktopLayout())
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])

  if (!active) return null

  /* ── Mobile: side-swipe row of compact work cards (each is a full preview) ── */
  if (isMobile) {
    return (
      <section className="ow-section ow-section--mobile" aria-label="Our work: selected builds and demos">
        <div className="ow-container">
          <header className="ow-head">
            <h2 className="ow-title">{WORK_SECTION_COPY.title}<span className="ow-dot">.</span></h2>
          </header>
          <div className="ow-scroller" role="region" aria-label="Selected work — swipe to browse">
            {WORK_ITEMS.map((item, i) => (
              <div className="ow-mcard" key={item.id}>
                <WorkPreview item={item} num={displayNum(item, i)} onOpenGallery={openGallery} />
              </div>
            ))}
          </div>
          <SwipeHint />
        </div>
        {gallery && (
          <Lightbox images={gallery.images} title={gallery.title} onClose={() => setGallery(null)} />
        )}
      </section>
    )
  }

  return (
    <section className="ow-section" aria-label="Our work: selected builds and demos">
      <div className="ow-container">
        <motion.header
          className="ow-head"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="ow-head-left">
            <h2 className="ow-title">
              {WORK_SECTION_COPY.title}<span className="ow-dot">.</span>
            </h2>
          </div>
        </motion.header>

        <div className="ow-body">
          {/* Left — work item list */}
          <ul className="ow-list" role="list">
            {WORK_ITEMS.map((item, i) => {
              const isActive = item.id === activeId
              return (
                <motion.li
                  key={item.id}
                  className="ow-li"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={inView}
                  transition={{ duration: 0.5, delay: 0.05 + i * 0.06, ease: EASE }}
                >
                  <div
                    className={`ow-row${isActive ? ' ow-row--active' : ''}`}
                    onMouseEnter={() => setActiveId(item.id)}
                    onClick={() => setActiveId(item.id)}
                    aria-current={isActive || undefined}
                  >
                    <span className="ow-num">{displayNum(item, i)}</span>
                    <div className="ow-row-main">
                      <div className="ow-row-titleline">
                        <h3 className="ow-row-title">{item.title}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="ow-tags">
                        {item.tags.map((tag) => {
                          const Icon = tagIcon(tag)
                          return (
                            <span className="ow-tag" key={tag}>
                              <Icon />
                              {tag}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    {item.external ? (
                      <a
                        className="ow-row-arrow"
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${item.title} (live site)`}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => setActiveId(item.id)}
                      >
                        <ArrowUpRight />
                      </a>
                    ) : (
                      <Link
                        className="ow-row-arrow"
                        to={item.href}
                        aria-label={`Open ${item.title}`}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => setActiveId(item.id)}
                      >
                        <ArrowUpRight />
                      </Link>
                    )}
                  </div>

                  {/* Mobile/tablet accordion: preview renders under the active row
                      (hidden on desktop, where the right column shows it). */}
                  <div className="ow-inline-preview">
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <WorkPreview key={item.id} item={item} num={displayNum(item, i)} onOpenGallery={openGallery} />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              )
            })}
          </ul>

          {/* Right — large preview panel (desktop) */}
          <motion.div
            className="ow-preview-col"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <AnimatePresence mode="wait">
              <WorkPreview key={active.id} item={active} num={displayNum(active, activeIndex)} onOpenGallery={openGallery} />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      {gallery && (
        <Lightbox images={gallery.images} title={gallery.title} onClose={() => setGallery(null)} />
      )}
    </section>
  )
}
