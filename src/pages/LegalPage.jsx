import { Link } from 'react-router-dom'
import { Fragment } from 'react'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'
import { LEGAL_DOCS, LEGAL_EMAIL, LEGAL_LAST_UPDATED } from '../data/legalContent'

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
      <article className="legal-page">
        <header className="legal-head">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">{doc.title}</h1>
          <p className="legal-updated">{LEGAL_LAST_UPDATED}</p>
          <p className="legal-intro"><LegalText text={doc.intro} /></p>
          {doc.note && <p className="legal-note"><LegalText text={doc.note} /></p>}
        </header>

        <div className="legal-sections">
          {doc.sections.map((section, i) => (
            <section className="legal-section" key={section.heading}>
              <h2>
                <span className="legal-section-num">{i + 1}.</span>
                {section.heading}
              </h2>
              {section.body.map((block, j) =>
                Array.isArray(block) ? (
                  <ul key={j}>
                    {block.map((item) => <li key={item}><LegalText text={item} /></li>)}
                  </ul>
                ) : (
                  <p key={j}><LegalText text={block} /></p>
                )
              )}
            </section>
          ))}
        </div>

        <aside className="legal-cta">
          <h2>Need help or have questions?</h2>
          <p>
            Contact Rapid Rise AI at{' '}
            <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
          </p>
        </aside>

        <Link className="legal-back" to="/">← Back to home</Link>
      </article>
    </PageLayout>
  )
}
