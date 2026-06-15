import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ConsentProvider } from './context/ConsentContext'

// ── Self-hosted fonts (privacy) ──────────────────────────────────────────────
// Bundled locally via Fontsource instead of the Google Fonts CDN so no visitor
// IP address is ever transmitted to a third party (POPIA / GDPR data-transfer).
// Non-variable packages register the plain family names ('Inter', etc.) the
// stylesheet already uses, so index.css needs no font-family changes.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/plus-jakarta-sans/700-italic.css'
import '@fontsource/plus-jakarta-sans/800-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <App />
      </ConsentProvider>
    </BrowserRouter>
  </React.StrictMode>
)
