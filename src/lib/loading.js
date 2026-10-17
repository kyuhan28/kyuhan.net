// Tracks real loading work so the loader can show honest progress.
// Each task is something we can actually observe finishing; progress is the
// share of tasks complete, never a guess about bytes or time.

export const TASK_LABELS = {
  fonts: 'typography',
  scene: '3D scene',
  page: 'images and assets',
}

const tasks = new Map(Object.keys(TASK_LABELS).map((name) => [name, false]))
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export function complete(name) {
  if (!tasks.has(name) || tasks.get(name)) return
  tasks.set(name, true)
  emit()
}

export function getProgress() {
  const values = [...tasks.values()]
  return values.filter(Boolean).length / values.length
}

export function getPending() {
  return [...tasks].filter(([, done]) => !done).map(([name]) => TASK_LABELS[name])
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Tasks this module can observe on its own. The 3D scene reports itself from the hero.
if (typeof window !== 'undefined') {
  ;(document.fonts?.ready ?? Promise.resolve()).then(() => complete('fonts'), () => complete('fonts'))
  if (document.readyState === 'complete') complete('page')
  else window.addEventListener('load', () => complete('page'), { once: true })
}
