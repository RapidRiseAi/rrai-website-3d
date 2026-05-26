import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import ProofPage from './pages/ProofPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:slug" element={<ServiceDetailPage />} />
      <Route path="/pricing" element={<Navigate to="/services" replace />} />
      <Route path="/proof" element={<ProofPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
