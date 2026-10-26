/**
 * Morphic Navbar (Split Nav), from Kokonut UI (https://kokonutui.com), MIT License.
 * @author @dorianbaffier · https://github.com/kokonut-labs/kokonutui
 *
 * A bar of joined links where the active one splits away from its neighbours. Hover opens a hairline
 * gap; drag across the bar to scrub the split (a flick carries past links); arrow keys, Home and End
 * move between links; `compact` folds the bar to the active link after scrolling.
 *
 * Ported for this project: JavaScript with plain CSS (morphic-navbar.css) instead of Tailwind, plain
 * in-page links instead of Next.js routing, and an `active` prop so the split can follow the section
 * being scrolled through (null: nothing selected, the bar sits joined).
 */
import { animate, motion, motionValue, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './morphic-navbar.css'

const DEFAULT_NAV_ITEMS = { '#home': { name: 'Home' }, '#work': { name: 'Work' }, '#notes': { name: 'Notes' }, '#blog': { name: 'Blog' }, '#about': { name: 'About' } }

const SPLIT = 8 // gap opened on each side of the active link, px
const HOVER_SPLIT = 2 // gap a hovered link opens around itself, px
const DRAG_SLOP = 4 // movement before a press turns into a scrub, px
const PROJECTION = 0.16 // seconds of release velocity added to where a flick lands
const VELOCITY_WINDOW = 90 // pointer samples older than this (ms) don't count toward release velocity
const COMPACT_AFTER = 80 // page scroll past which `compact` folds the bar, px
const CHEVRON_SIZE = 36
const CHEVRON_GAP = 4
const SPRING = { type: 'spring', bounce: 0.15, visualDuration: 0.32 }

const round2 = (v) => Math.round(v * 100) / 100
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const matchesPath = (path, current) => path === current || (path !== '/' && current.startsWith(`${path}/`))

/** The longest item path that matches, so "/docs/a" beats "/docs". */
const findItemPath = (paths, current) => {
  let match
  for (const path of paths) if (current && matchesPath(path, current) && (!match || path.length > match.length)) match = path
  return match
}

/** How much link `k` is "the split one" when the split sits at `focus`. */
const bump = (focus, k) => Math.max(0, 1 - Math.abs(focus - k))

/** x offset of every link for a split centred on `focus` (fractional while scrubbing), centred so the bar grows evenly. */
const splitOffsets = (count, focus, hover) => {
  const cumulative = [0]
  let total = 0
  for (let joint = 0; joint < count - 1; joint++) {
    let gap = SPLIT * Math.max(bump(focus, joint), bump(focus, joint + 1))
    const hoverJoint = hover !== null && hover !== Math.round(focus) && (joint === hover - 1 || joint === hover)
    if (hoverJoint) gap = Math.max(gap, HOVER_SPLIT)
    total += gap
    cumulative.push(total)
  }
  return cumulative.map((x) => round2(x - total / 2))
}

/** Folded: the active link slides to the middle with the chevron beside it; the rest tuck in behind it. */
const foldedOffsets = (layout, active) => {
  const { centers, widths, rowWidth } = layout
  const activeWidth = widths[active] ?? 0
  const groupWidth = activeWidth + CHEVRON_GAP + CHEVRON_SIZE
  const activeCenter = rowWidth / 2 - groupWidth / 2 + activeWidth / 2
  return { xs: centers.map((center) => round2(activeCenter - center)), chevron: round2(activeCenter + activeWidth / 2 + CHEVRON_GAP + CHEVRON_SIZE / 2) }
}

/** Fractional link index under a row-local x, from the links' centres. */
const indexAt = (centers, x) => {
  const last = centers.length - 1
  if (last <= 0 || x <= (centers[0] ?? 0)) return 0
  for (let k = 0; k < last; k++) {
    const a = centers[k] ?? 0
    const b = centers[k + 1] ?? a
    if (x < b) return k + (x - a) / Math.max(1, b - a)
  }
  return last
}

const releaseVelocity = (samples, now) => {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW)
  const first = recent[0]
  const last = recent.at(-1)
  if (!(first && last) || last.t === first.t) return 0
  return ((last.x - first.x) / (last.t - first.t)) * 1000
}

/** A square patch that hides a rounded corner while the neighbour touches. */
const capScale = (gap, fold) => `scaleX(${round2(clamp(1 - gap / 1.5, 0, 1) * (1 - clamp(fold * 4, 0, 1)))})`

const KEY_MOVES = { ArrowLeft: (i) => i - 1, ArrowRight: (i) => i + 1, Home: () => 0, End: (_, n) => n - 1 }

/** In-page anchors scroll to their target and record the hash with pushState. */
const followHash = (event, href) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const target = document.getElementById(decodeURIComponent(href.slice(1)))
  if (!target) return
  target.scrollIntoView()
  if (window.location.hash !== href) window.history.pushState(null, '', href)
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="mn__chevron-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Segment({ href, name, x, prevX, nextX, fold, pinned, hidden, highlighted, current, linkRef, onSelect, onFocus, onHover }) {
  const transform = useTransform(() => `translate3d(${x.get()}px,0,0)`)
  const opacity = useTransform(() => (pinned ? 1 : round2(clamp(1 - fold.get() * 1.8, 0, 1))))
  const leftCap = useTransform(() => (prevX ? capScale(x.get() - prevX.get(), fold.get()) : 'scaleX(0)'))
  const rightCap = useTransform(() => (nextX ? capScale(nextX.get() - x.get(), fold.get()) : 'scaleX(0)'))
  return (
    <motion.div
      className={`mn__seg ${pinned ? 'is-pinned' : ''} ${hidden ? 'is-hidden' : ''}`}
      onPointerEnter={(e) => onHover(e, true)}
      onPointerLeave={(e) => onHover(e, false)}
      style={{ transform, opacity }}
    >
      <a
        aria-current={current ? 'location' : undefined}
        className={`mn__link ${highlighted ? 'is-highlighted' : ''}`}
        draggable={false}
        href={href}
        inert={hidden || undefined}
        onClick={(e) => { onSelect(); if (href.startsWith('#')) followHash(e, href) }}
        onDragStart={(e) => e.preventDefault()}
        onFocus={onFocus}
        ref={linkRef}
      >
        {prevX ? <motion.span aria-hidden="true" className="mn__cap mn__cap--left" style={{ transform: leftCap }} /> : null}
        {nextX ? <motion.span aria-hidden="true" className="mn__cap mn__cap--right" style={{ transform: rightCap }} /> : null}
        <span className="mn__label">{name}</span>
        <span aria-hidden="true" className="mn__dot" />
      </a>
    </motion.div>
  )
}

/** True once the page has scrolled past COMPACT_AFTER, when enabled. */
function useScrolledPast(enabled) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    if (!enabled) { setPast(false); return }
    let frame = 0
    const update = () => { frame = 0; setPast(window.scrollY > COMPACT_AFTER) }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [enabled])
  return past
}

/** Opened by the chevron; folds again after another COMPACT_AFTER of scroll. */
function useUserOpen(scrolledPast) {
  const [openedAt, setOpenedAt] = useState(null)
  useEffect(() => {
    if (openedAt === null) return
    const onScroll = () => { if (Math.abs(window.scrollY - openedAt) > COMPACT_AFTER) setOpenedAt(null) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [openedAt])
  if (!scrolledPast && openedAt !== null) setOpenedAt(null)
  return [openedAt !== null, () => setOpenedAt(window.scrollY)]
}

export function MorphicNavbar({ items = DEFAULT_NAV_ITEMS, defaultPath, active, compact = false, className = '', ariaLabel = 'Main' }) {
  const entries = Object.entries(items)
  const paths = entries.map(([path]) => path)
  const count = entries.length
  const controlled = active !== undefined
  const [activePath, setActivePath] = useState(() => (controlled ? findItemPath(paths, active) ?? null : defaultPath ?? paths[0] ?? '/'))

  // Follow the `active` prop (e.g. the section being scrolled through); clicks still update right away.
  const [syncedActive, setSyncedActive] = useState(active)
  if (controlled && active !== syncedActive) {
    setSyncedActive(active)
    setActivePath(findItemPath(paths, active) ?? null)
  }

  const activeIndex = paths.indexOf(findItemPath(paths, activePath) ?? '')
  const [previewIndex, setPreviewIndex] = useState(null) // where a scrub or keyboard focus has moved the split
  const [hoverIndex, setHoverIndex] = useState(null)
  const [keyboardInside, setKeyboardInside] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)

  const scrolledPast = useScrolledPast(compact)
  const [userOpen, openBar] = useUserOpen(scrolledPast)
  const folded = compact && scrolledPast && !userOpen && !keyboardInside && !scrubbing && activeIndex >= 0
  const highlightIndex = previewIndex ?? activeIndex

  // One spring-driven offset per link, rebuilt only when the count changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const xs = useMemo(() => splitOffsets(count, activeIndex, null).map((x) => motionValue(x)), [count])
  const fold = useMotionValue(0)
  const chevronX = useMotionValue(0)
  const chevronTransform = useTransform(() => `translate3d(${chevronX.get()}px,0,0)`)

  const rowRef = useRef(null)
  const linkRefs = useRef([])
  const layoutRef = useRef(null)
  const dragRef = useRef(null)
  const instantRef = useRef(false)
  const suppressClickRef = useRef(false)
  const reduceMotion = useReducedMotion()
  const reduceRef = useRef(false)
  reduceRef.current = reduceMotion === true

  const liveRef = useRef(null)
  liveRef.current = { activeIndex, highlightIndex, hoverIndex, folded, count }

  // Measures the links' natural (untransformed) positions.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const measure = () => {
      const boxes = linkRefs.current.slice(0, count).map((el) => el?.parentElement)
      layoutRef.current = {
        centers: boxes.map((box) => (box ? box.offsetLeft + box.offsetWidth / 2 : 0)),
        widths: boxes.map((box) => box?.offsetWidth ?? 0),
        rowWidth: row.offsetWidth,
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [count])

  /** Sends every offset towards where the current state says it belongs. */
  const retargetRef = useRef(() => undefined)
  retargetRef.current = (instant) => {
    const state = liveRef.current
    const drag = dragRef.current
    const jump = instant || reduceRef.current
    const to = (value, target) => (jump ? (value.jump ? value.jump(target) : value.set(target)) : animate(value, target, SPRING)) // set() as a fallback
    const layout = layoutRef.current
    let targets
    let chevron
    if (state.folded && layout) {
      const result = foldedOffsets(layout, state.activeIndex)
      targets = result.xs
      chevron = result.chevron
    } else {
      const focus = drag?.scrubbing ? drag.focus : state.highlightIndex
      targets = splitOffsets(state.count, focus, drag?.scrubbing ? null : state.hoverIndex)
      const anchor = Math.max(0, state.activeIndex) // unfolded, the chevron waits tucked behind the active link
      chevron = (layout?.centers[anchor] ?? 0) + (targets[anchor] ?? 0)
    }
    for (const [i, value] of xs.entries()) to(value, targets[i] ?? 0)
    to(chevronX, round2(chevron - CHEVRON_SIZE / 2))
    to(fold, state.folded ? 1 : 0)
  }

  useEffect(() => {
    retargetRef.current(instantRef.current)
    instantRef.current = false
  }, [activeIndex, highlightIndex, hoverIndex, folded, count])

  const selectIndex = (index) => { const path = paths[index]; if (path !== undefined) setActivePath(path) }
  const toFocus = (clientX, drag) => clamp(indexAt(layoutRef.current?.centers ?? [], clientX - drag.rowLeft), 0, count - 1)

  const onPointerDown = (event) => {
    if (event.button !== 0 || folded || event.target.closest('[data-chevron]')) return
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, rowLeft: event.currentTarget.getBoundingClientRect().left, scrubbing: false, focus: highlightIndex, samples: [{ x: event.clientX, t: event.timeStamp }] }
  }

  const onPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.scrubbing) {
      if (Math.abs(event.clientX - drag.startX) < DRAG_SLOP) return
      drag.scrubbing = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setScrubbing(true)
      setHoverIndex(null)
    }
    drag.samples.push({ x: event.clientX, t: event.timeStamp })
    if (drag.samples.length > 12) drag.samples.shift()
    drag.focus = toFocus(event.clientX, drag)
    setPreviewIndex(Math.round(drag.focus))
    retargetRef.current(false)
  }

  const endDrag = (event, commit) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (!drag.scrubbing) return
    setScrubbing(false)
    setPreviewIndex(null)
    if (!commit) { retargetRef.current(false); return }
    // A flick lands where its velocity would carry it, so it can skip links.
    const velocity = releaseVelocity(drag.samples, event.timeStamp)
    const index = Math.round(toFocus(event.clientX + velocity * PROJECTION, drag))
    // The browser still sends a click for this press: swallow it and click the chosen link instead.
    suppressClickRef.current = true
    setTimeout(() => { suppressClickRef.current = false }, 0)
    selectIndex(index)
    linkRefs.current[index]?.click()
  }

  const onClickCapture = (event) => {
    if (suppressClickRef.current && event.isTrusted) {
      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const onKeyDown = (event) => {
    const move = KEY_MOVES[event.key]
    const from = linkRefs.current.indexOf(document.activeElement)
    if (!move || from < 0) return
    event.preventDefault()
    const next = clamp(move(from, count), 0, count - 1)
    instantRef.current = true
    setPreviewIndex(next)
    linkRefs.current[next]?.focus()
  }

  const onLinkFocus = (index, event) => {
    if (event.currentTarget.matches(':focus-visible')) {
      instantRef.current = true // keyboard moves are instant
      setKeyboardInside(true)
      setPreviewIndex(index)
    }
  }

  const onRowBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      instantRef.current = true
      setKeyboardInside(false)
      setPreviewIndex(null)
    }
  }

  const onHover = (index, event, entering) => {
    if (event.pointerType !== 'mouse' || dragRef.current?.scrubbing) return
    setHoverIndex((current) => (entering ? index : current === index ? null : current))
  }

  const openFolded = () => {
    openBar()
    linkRefs.current[activeIndex]?.focus({ preventScroll: true })
  }

  return (
    <nav aria-label={ariaLabel} className={`mn ${className}`.trim()}>
      <div
        className="mn__row"
        onBlur={onRowBlur}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        onPointerCancel={(e) => endDrag(e, false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        ref={rowRef}
      >
        {entries.map(([path, { name }], index) => (
          <Segment
            current={index === activeIndex}
            fold={fold}
            hidden={folded && index !== activeIndex}
            highlighted={index === highlightIndex}
            href={path}
            key={`${count}-${path}`}
            linkRef={(el) => { linkRefs.current[index] = el }}
            name={name}
            nextX={xs[index + 1]}
            onFocus={(e) => onLinkFocus(index, e)}
            onHover={(e, entering) => onHover(index, e, entering)}
            onSelect={() => selectIndex(index)}
            pinned={index === activeIndex}
            prevX={xs[index - 1]}
            x={xs[index] ?? fold}
          />
        ))}
        {compact ? (
          <motion.button
            aria-expanded={!folded}
            aria-hidden={!folded}
            aria-label="Show all links"
            className={`mn__chevron ${folded ? 'is-on' : ''}`}
            data-chevron=""
            onClick={openFolded}
            style={{ transform: chevronTransform, opacity: fold }}
            tabIndex={folded ? 0 : -1}
            type="button"
          >
            <ChevronIcon />
          </motion.button>
        ) : null}
      </div>
    </nav>
  )
}

export default MorphicNavbar
