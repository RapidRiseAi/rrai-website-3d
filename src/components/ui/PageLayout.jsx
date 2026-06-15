import Navbar from './Navbar'
import SiteFooter from './SiteFooter'
import PageAtmosphere from './PageAtmosphere'
import useReveal from '../../hooks/useReveal'

export default function PageLayout({ children }) {
  useReveal()
  return (
    <>
      <PageAtmosphere />
      <Navbar loaded={true} />
      <main className="page-root">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
