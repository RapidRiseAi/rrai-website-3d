import { Link } from 'react-router-dom'
import { Fragment } from 'react'
import PageLayout from '../components/ui/PageLayout'
import Reveal from '../components/ui/Reveal'
import Parallax from '../components/ui/Parallax'
import usePageMeta from '../hooks/usePageMeta'
import { LEGAL_DOCS, LEGAL_EMAIL, LEGAL_LAST_UPDATED } from '../data/legalContent'
import './LegalPage.css'

/* Render a content string, turning occurrences of the contact email into
   mailto links so the data file can stay plain text. */
function LegalText({ text }) {
  const parts = text.split(LEGAL_EMAIL)
  if (parts.length === 1) return text
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>}
    </Fragment>
  ))
}

/* Inline line icons (24×24, round caps) */
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2.2" />
    <path d="m3.8 7 8.2 6 8.2-6" />
  </svg>
)
const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 6l-6 6 6 6M8 12h12" />
  </svg>
)

/* One legal document page. `slug` comes from the route definition in App.jsx;
   the content lives in src/data/legalContent.js. */
export default function LegalPage({ slug }) {
  const doc = LEGAL_DOCS[slug]
  usePageMeta(
    doc ? `${doc.title} | Rapid Rise AI` : 'Legal | Rapid Rise AI',
    doc?.intro,
  )
  if (!doc) return null

  return (
    <PageLayout>
      <div className="pg-wrap lgl-wrap">
        {/* Masthead — shared centered, glowing hero head */}
        <header className="pg-hero lgl-hero">
          <Parallax className="depth-orb lgl-orb lgl-orb-1" speed={-46} aria-hidden="true" />
          <Parallax className="depth-orb lgl-orb lgl-orb-2" speed={64} aria-hidden="true" />
          <p className="pg-eyebrow">Legal</p>
          <h1 className="pg-h1 lgl-title">{doc.title}</h1>
          <p className="lgl-updated">{LEGAL_LAST_UPDATED}</p>
          <p className="pg-sub lgl-intro"><LegalText text={doc.intro} /></p>
          {doc.note && (
            <p className="lgl-note"><LegalText text={doc.note} /></p>
          )}
        </header>

        {/* Document body — one calm, readable glass column */}
        <Reveal variant="up" amount={0.15}>
          <article className="lgl-doc glass-card">
            <div className="lgl-sections">
              {doc.sections.map((section, i) => (
                <Reveal
                  as="section"
                  className="lgl-section"
                  variant="up"
                  amount={0.25}
                  delay={Math.min(i, 2) * 0.05}
                  key={section.heading}
                >
                  <h2 className="lgl-section-head">
                    <span className="lgl-section-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="lgl-section-heading">{section.heading}</span>
                  </h2>
                  <div className="lgl-section-body">
                    {section.body.map((block, j) =>
                      Array.isArray(block) ? (
                        <ul key={j} className="lgl-list">
                          {block.map((item) => (
                            <li key={item}><LegalText text={item} /></li>
                          ))}
                        </ul>
                      ) : (
                        <p key={j}><LegalText text={block} /></p>
                      )
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </article>
        </Reveal>

        {/* Contact aside — glass card */}
        <Reveal variant="up" amount={0.4}>
          <aside className="lgl-cta glass-card glass-card--bright">
            <span className="lgl-cta-ic tilt-pop-sm"><MailIcon /></span>
            <div className="lgl-cta-text">
              <h2>Need help or have questions?</h2>
              <p>
                Contact Rapid Rise AI at{' '}
                <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
              </p>
            </div>
          </aside>
        </Reveal>

        {/* Back link — pill */}
        <Reveal variant="up" amount={0.6}>
          <div className="lgl-back-row">
            <Link className="lgl-back" to="/"><ArrowLeftIcon /> Back to home</Link>
          </div>
        </Reveal>
      </div>
    </PageLayout>
  )
}
