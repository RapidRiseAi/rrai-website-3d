// Single source of truth for the scroll journey.
//
// The page is a sequence of "stops": the hero, then one stop per carousel card,
// then the fixed-pricing (wave) section, then the two scroll sections. Scroll
// position drives EVERYTHING — the active carousel card and the scene's wave
// morph are pure functions of window.scrollY — so the wheel, the scrollbar, the
// middle-click autoscroll and touch all behave identically and always resolve
// to a stop (see useScrollSnap).
//
// To give the carousel real scroll distance (so the scrollbar can scrub through
// the cards) its section is made tall and pinned; CARD_VH is the scroll budget
// per card in viewport-height units.

export const CARD_VH = 0.7          // viewport-heights of scroll per carousel card
export const N_CARDS = 7

// The pinned carousel only makes sense on the desktop (row) layout. On narrow
// screens the carousel collapses to a single tapped card in normal flow, so we
// keep the original 1-viewport section + integer section stops there.
export const isDesktopLayout = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1101px)').matches

// Where the card-cycling plateau ends (card 6 / funnel), in viewport units.
const cycleEndVH = () => 1 + (N_CARDS - 1) * CARD_VH

// Total carousel-section height in viewport units (pin = 1vh + cycle budget).
export function carouselSectionVH() {
  return isDesktopLayout() ? cycleEndVH() : 1
}

// Snap targets in viewport units (multiply by innerHeight for px).
export function getStops() {
  if (!isDesktopLayout()) return [0, 1, 2, 3, 4]
  const cycleEnd = cycleEndVH()
  const stops = [0]                                   // hero
  for (let k = 0; k < N_CARDS; k++) stops.push(1 + k * CARD_VH) // cards 0..6
  stops.push(cycleEnd + 1)                            // fixed-pricing (wave)
  stops.push(cycleEnd + 2)                            // scroll section 1
  stops.push(cycleEnd + 3)                            // scroll section 2
  return stops
}

export function getStopsPx() {
  const vh = window.innerHeight
  return getStops().map((v) => Math.round(v * vh))
}

// Derive the scroll-driven state (active card + Section-3 wave progress) from a
// raw scrollY. `card` is null on the mobile layout (cards switch by tap there).
export function deriveScroll(scrollY) {
  const vh = window.innerHeight
  const y = scrollY / vh
  if (!isDesktopLayout()) {
    return { card: null, sec3: Math.min(1, Math.max(0, y - 1)) }
  }
  const cycleEnd = cycleEndVH()
  let card
  if (y <= 1) card = 0
  else if (y >= cycleEnd) card = N_CARDS - 1
  else card = Math.round((y - 1) / CARD_VH)
  card = Math.max(0, Math.min(N_CARDS - 1, card))
  // Wave climbs across the unpin / scroll-out viewport [cycleEnd, cycleEnd+1].
  const sec3 = Math.min(1, Math.max(0, y - cycleEnd))
  return { card, sec3 }
}
