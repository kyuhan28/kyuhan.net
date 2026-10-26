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
  try { localStorage.setItem(KEY, JSON.stringify(rects)) } catch {  }
}
