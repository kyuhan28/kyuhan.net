/*
 * Where each window was last left (position and size, as fractions of the desktop), remembered in this
 * browser so windows reopen where they were. Only these numbers are stored, nothing personal; anything
 * invalid or from an older version is ignored (the app's default placement is used instead).
 */
const KEY = 'kh.desktop.windows.v1'
const valid = (r) => r && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(r[k])) &&
  r.w >= 0.1 && r.h >= 0.1 && r.w <= 1 && r.h <= 1 && r.x >= 0 && r.y >= 0 && r.x + r.w <= 1.001 && r.y + r.h <= 1.001

export function loadRects() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
    return Object.fromEntries(Object.entries(saved).filter(([, r]) => valid(r)))
  } catch { return {} }
}
export function saveRects(rects) {
  try { localStorage.setItem(KEY, JSON.stringify(rects)) } catch { /* storage unavailable: nothing to remember */ }
}
