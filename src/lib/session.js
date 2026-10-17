// sessionStorage can throw (privacy modes, sandboxed frames), so every access is guarded.
export function readSession(key) {
  try { return window.sessionStorage.getItem(key) } catch { return null }
}
export function writeSession(key, value) {
  try { window.sessionStorage.setItem(key, value) } catch { /* ignore */ }
}
