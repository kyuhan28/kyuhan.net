import { useCallback, useEffect, useRef, useState } from 'react'
import { createTimeline } from 'animejs'
import { site } from '../../content/site'
import { animeEase } from '../../motion/tokens'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { readSession, writeSession } from '../../lib/session'
import { getProgress, subscribe } from '../../lib/loading'
import GlitchText from '../kokonutui/GlitchText'
import './intro.css'

const SEEN_KEY = 'intro-seen'
const MAX_WAIT_MS = 9000
const DOT_MS = 650
const HOLD_MS = 1100

export default function Intro({ onReveal }) {
  const reduce = usePrefersReducedMotion()
  const [visible, setVisible] = useState(() => !readSession(SEEN_KEY))
  const [done, setDone] = useState(() => getProgress() >= 1)
  const [dots, setDots] = useState(0)
  const root = useRef(null)
  const exiting = useRef(false)
  const revealed = useRef(false)
  const animations = useRef([])

  const reveal = useCallback(() => {
    if (revealed.current) return
    revealed.current = true
    onReveal?.()
  }, [onReveal])

  const finish = useCallback(() => {
    animations.current.forEach((a) => a?.pause?.())
    reveal()
    writeSession(SEEN_KEY, '1')
    setVisible(false)
  }, [reveal])

  const exit = useCallback(() => {
    if (exiting.current) return
    exiting.current = true
    try {
      animations.current.push(
        createTimeline({ onComplete: finish })
          .add('.intro__center', { translateY: [0, -18], opacity: [1, 0], duration: 600, ease: 'inQuart' }, 0)
          .add('.intro__glow', { opacity: [1, 0], duration: 450, ease: 'inQuad' }, 0)
          .add('.intro__shutter--top', { translateY: ['0%', '-101%'], duration: 950, ease: animeEase.inOut, onBegin: reveal }, 450)
          .add('.intro__shutter--bottom', { translateY: ['0%', '101%'], duration: 950, ease: animeEase.inOut }, 450),
      )
    } catch (error) {
      console.warn('[loader] exit animation failed, continuing.', error)
      finish()
    }
  }, [finish, reveal])

  useEffect(() => {
    if (!visible || reduce) finish()
  }, [visible, reduce, finish])

  useEffect(() => {
    if (!visible || reduce) return
    const update = () => { if (getProgress() >= 1) setDone(true) }
    update()
    return subscribe(update)
  }, [visible, reduce])

  useEffect(() => {
    if (!visible || reduce || done) return
    const t = setInterval(() => setDots((d) => (d + 1) % 4), DOT_MS)
    return () => clearInterval(t)
  }, [visible, reduce, done])

  useEffect(() => {
    if (!visible || reduce || !done) return
    const t = setTimeout(exit, HOLD_MS)
    return () => clearTimeout(t)
  }, [visible, reduce, done, exit])

  useEffect(() => {
    if (!visible || reduce) return
    const t = setTimeout(() => setDone(true), MAX_WAIT_MS)
    return () => clearTimeout(t)
  }, [visible, reduce])

  useEffect(() => {
    if (!visible || reduce) return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    const hold = (e) => { if (e.cancelable) e.preventDefault() }
    const onKey = (e) => { if (e.key === 'Escape') exit() }
    window.addEventListener('wheel', hold, { passive: false })
    window.addEventListener('touchmove', hold, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = previous
      window.removeEventListener('wheel', hold)
      window.removeEventListener('touchmove', hold)
      window.removeEventListener('keydown', onKey)
    }
  }, [visible, reduce, exit])

  if (!visible || reduce) return null

  return (
    <div className="intro" ref={root}>
      <div className="intro__shutter intro__shutter--top" />
      <div className="intro__shutter intro__shutter--bottom" />

      <div className="intro__frame">
        <div className="intro__glow" aria-hidden="true" />

        <div className="intro__center">
          <div className={`intro__glitch ${done ? 'is-done' : ''}`} aria-hidden="true">
            <GlitchText text={done ? 'Complete' : 'Loading'} trigger="idle" intensity="strong" />
            <span className="intro__dots">{done ? '' : '.'.repeat(dots)}</span>
          </div>
          <p className="intro__name">{`${site.name}’s Portfolio`}</p>
          <p className="sr-only" role="status">{done ? 'Loading complete' : 'Loading'}</p>
        </div>
      </div>
    </div>
  )
}
