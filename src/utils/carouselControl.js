let _onAdvance = null
let _activeRef = null
let _total = 0

export function registerCarousel({ onAdvance, activeRef, total }) {
  _onAdvance = onAdvance
  _activeRef = activeRef
  _total = total
}

export function tryCarouselAdvance(direction) {
  if (!_onAdvance || !_activeRef) return false
  const cur = _activeRef.current
  const step = direction > 0 ? 1 : -1
  if (direction > 0 && cur < _total - 1) {
    _onAdvance(step)
    return true
  }
  if (direction < 0 && cur > 0) {
    _onAdvance(step)
    return true
  }
  return false
}
