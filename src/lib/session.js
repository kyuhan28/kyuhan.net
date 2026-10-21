
export function readSession(key) {
  try { return window.sessionStorage.getItem(key) } catch { return null }
}
export function writeSession(key, value) {
  try { window.sessionStorage.setItem(key, value) } catch {  }
}
