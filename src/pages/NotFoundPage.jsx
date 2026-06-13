import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta(
    'Page Not Found | Rapid Rise AI',
    'The page you are looking for may have moved, or the link may be incorrect.',
  )

  return (
    <PageLayout>
      <div className="placeholder-page">
        <p className="services-hero-eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you are looking for may have moved, or the link may be incorrect.</p>
        <div className="pg-cta-actions" style={{ marginTop: 10 }}>
          <Link className="pg-btn-primary" to="/">Back to Home</Link>
          <Link className="pg-btn-ghost" to="/services">View Services</Link>
          <Link className="pg-btn-ghost" to="/contact">Contact Us</Link>
        </div>
      </div>
    </PageLayout>
  )
}
