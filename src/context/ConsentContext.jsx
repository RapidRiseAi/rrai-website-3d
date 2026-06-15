import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  readConsent,
  writeConsent,
  DEFAULT_PREFS,
  ACCEPT_ALL_PREFS,
} from '../utils/consent'

/* Shares one consent state across the app: the banner shows it on first visit,
   and the footer's "Cookie preferences" link reopens the panel any time after. */
const ConsentContext = createContext(null)

export function ConsentProvider({ children }) {
  const [decided, setDecided] = useState(false)
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)

  // Read any stored choice once. No stored choice → show the first-visit banner.
  useEffect(() => {
    const stored = readConsent()
    if (stored) {
      setPrefs(stored.prefs)
      setDecided(true)
    } else {
      setBannerOpen(true)
    }
  }, [])

  const commit = useCallback((next) => {
    const rec = writeConsent(next)
    setPrefs(rec.prefs)
    setDecided(true)
    setBannerOpen(false)
    setPrefsOpen(false)
  }, [])

  const acceptAll = useCallback(() => commit(ACCEPT_ALL_PREFS), [commit])
  const rejectAll = useCallback(() => commit(DEFAULT_PREFS), [commit])
  const savePreferences = useCallback((p) => commit(p), [commit])
  const openPreferences = useCallback(() => setPrefsOpen(true), [])
  const closePreferences = useCallback(() => setPrefsOpen(false), [])

  const value = {
    decided,
    prefs,
    bannerOpen,
    prefsOpen,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  }
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within a ConsentProvider')
  return ctx
}
