import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { site } from '../../content/site'
import { pageTop } from '../../lib/dom'
import Avatar from './Avatar'
import { ease } from '../../motion/tokens'
import './nav.css'

export const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]










function useScrollState() {
  const [active, setActive] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const ids = ['top', ...SECTIONS.map((s) => s.id)]
    let marks = []
    let frame = 0
    const measure = () => {
      marks = ids
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((el) => ({ id: el.id, top: pageTop(el) }))
    }
    const update = () => {
      frame = 0
      const y = window.scrollY
      const line = y + window.innerHeight * 0.35
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 4
      let current = null
      for (const mark of marks) if (mark.top <= line) current = mark.id
      if (atBottom && marks.length) current = marks[marks.length - 1].id
      setActive(current === 'top' ? null : current)
      setScrolled(y > 40)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const onResize = () => { measure(); update() }

    measure()
    update()
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return { active, scrolled }
}

export default function Nav({ ready }) {
  const { active, scrolled } = useScrollState()
  const [open, setOpen] = useState(false)
  const menuButton = useRef(null)
  const firstLink = useRef(null)
  const activeLabel = SECTIONS.find((s) => s.id === active)?.label


  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    firstLink.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const button = menuButton.current
    return () => {
      html.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      button?.focus()
    }
  }, [open])

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'is-scrolled' : ''}`}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: ready ? 1 : 0, y: 0 }}
        transition={{ duration: 0.6, ease: ease.out }}
      >
        <div className="nav__inner container">
          <a href="#top" className="nav__brand" aria-label={`${site.name}, back to top`}>
            <Avatar />
            <span className="nav__brand-name">{site.name}</span>
          </a>

          <nav aria-label="Primary" className="nav__primary">
            <ul className="nav__list">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="nav__link" aria-current={active === s.id ? 'location' : undefined}>
                    {active === s.id && (
                      <motion.span
                        className="nav__indicator"
                        layoutId="nav-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span className="nav__label">{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {}
          <span className="nav__current" aria-hidden="true">
            <AnimatePresence mode="wait" initial={false}>
              {activeLabel && (
                <motion.span
                  key={activeLabel}
                  className="nav__current-label"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.35, ease: ease.out }}
                >
                  {activeLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <button
            ref={menuButton}
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="nav__toggle-lines" data-open={open} aria-hidden="true">
              <span /><span />
            </span>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: ease.inOut }}
          >
            <nav aria-label="Mobile" className="menu__nav container">
              <ul>
                {SECTIONS.map((s, i) => (
                  <li key={s.id} className="menu__item">
                    <motion.a
                      ref={i === 0 ? firstLink : undefined}
                      href={`#${s.id}`}
                      className="menu__link"
                      onClick={() => setOpen(false)}
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '-40%', opacity: 0, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.8, ease: ease.out, delay: 0.18 + i * 0.05 }}
                      aria-current={active === s.id ? 'location' : undefined}
                    >
                      {s.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>
            <button type="button" className="menu__close" onClick={() => setOpen(false)}>
              Close menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
