import { APPS } from './apps'
import { loadRects } from './windowMemory'

/*
 * The desktop's state, in one place.
 *
 *   windows[id]  state   exactly one of normal / maximized / minimized / closed (never two at once)
 *                before  what a minimized window returns to (normal or maximized)
 *                rect    its last normal position and size, as fractions of the desktop ({ x, y, w, h }),
 *                        or null for its app's default placement (until it's first moved or resized)
 *   order        stacking order, back to front: the last is drawn on top
 *   focused      the active window (or null), startOpen, and the selected desktop icon
 * More apps, snapping or saved layouts can build on this without changing its shape.
 */
export const WINDOW = { NORMAL: 'normal', MAXIMIZED: 'maximized', MINIMIZED: 'minimized', CLOSED: 'closed' }
export const isShown = (w) => w.state === WINDOW.NORMAL || w.state === WINDOW.MAXIMIZED

export const initialDesktop = () => {
  const saved = loadRects() // where each window was last left, if this browser remembers
  return {
  windows: Object.fromEntries(APPS.map((a) => [a.id, { state: a.openAtStart ? WINDOW.NORMAL : WINDOW.CLOSED, before: WINDOW.NORMAL, rect: saved[a.id] ?? null }])),
  order: APPS.map((a) => a.id),
  focused: APPS.find((a) => a.openAtStart)?.id ?? null,
  startOpen: false,
  selectedIcon: null,
  }
}

const raise = (order, id) => [...order.filter((x) => x !== id), id]
const topShown = (state, except) => [...state.order].reverse().find((id) => id !== except && isShown(state.windows[id])) ?? null
const put = (state, id, patch) => ({ ...state, windows: { ...state.windows, [id]: { ...state.windows[id], ...patch } } })

export function desktopReducer(state, action) {
  const { id } = action
  const w = id ? state.windows[id] : null
  switch (action.type) {
    case 'open': { // from closed (as it was last laid out), or from minimized (back to what it was); then on top
      const next = w.state === WINDOW.CLOSED ? WINDOW.NORMAL : w.state === WINDOW.MINIMIZED ? w.before : w.state
      return { ...put(state, id, { state: next }), order: raise(state.order, id), focused: id, startOpen: false }
    }
    case 'minimize':
      if (!isShown(w)) return state
      return { ...put(state, id, { state: WINDOW.MINIMIZED, before: w.state }), focused: state.focused === id ? topShown(state, id) : state.focused }
    case 'close':
      return { ...put(state, id, { state: WINDOW.CLOSED, before: WINDOW.NORMAL }), focused: state.focused === id ? topShown(state, id) : state.focused }
    case 'maximize':
      return w.state === WINDOW.NORMAL ? { ...put(state, id, { state: WINDOW.MAXIMIZED }), order: raise(state.order, id), focused: id } : state
    case 'restore':   // from maximized, back to its last normal position and size
      return w.state === WINDOW.MAXIMIZED ? { ...put(state, id, { state: WINDOW.NORMAL }), order: raise(state.order, id), focused: id } : state
    case 'toggleMaximize':
      return desktopReducer(state, { type: w.state === WINDOW.MAXIMIZED ? 'restore' : 'maximize', id })
    case 'setRect':   // after a move or resize (fractions of the desktop)
      return put(state, id, { rect: action.rect })
    case 'focus':
      if (!isShown(w) || (state.focused === id && state.order.at(-1) === id)) return state
      return { ...state, order: raise(state.order, id), focused: id }
    case 'taskbar': // as on a real taskbar: reopen, restore, bring forward, or (if it's already in front) minimize
      if (!isShown(w)) return desktopReducer(state, { type: 'open', id })
      if (state.focused !== id) return { ...state, order: raise(state.order, id), focused: id, startOpen: false }
      return desktopReducer({ ...state, startOpen: false }, { type: 'minimize', id })
    case 'selectIcon':
      return state.selectedIcon === action.icon ? state : { ...state, selectedIcon: action.icon }
    case 'toggleStart':
      return { ...state, startOpen: !state.startOpen }
    case 'closeStart':
      return state.startOpen ? { ...state, startOpen: false } : state
    default:
      return state
  }
}
