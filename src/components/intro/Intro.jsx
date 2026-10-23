import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, createTimeline } from 'animejs'
import { site } from '../../content/site'
import { animeEase } from '../../motion/tokens'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { readSession, writeSession } from '../../lib/session'
import { getPending, getProgress, subscribe } from '../../lib/loading'
import './intro.css'

const SEEN_KEY = 'intro-seen'
const MAX_WAIT_MS = 9000

export default function Intro({ onReveal }) {
  const reduce = usePrefersReducedMotion()
  const [visible, setVisible] = useState(() => !readSession(SEEN_KEY))
  const [pending, setPending] = useState(() => getPending())
  const [progress, setProgress] = useState(() => getProgress())
  const root = useRef(null)
  const number = useRef(null)
  const meter = useRef(null)
  const bar = useRef(null)
  const shown = useRef({ value: 0 })
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

  const render = useCallback(() => {
    const v = Math.min(100, Math.floor(shown.current.value))
    if (number.current) number.current.textContent = String(v)
    if (bar.current) bar.current.style.transform = `scaleX(${v / 100})`
    meter.current?.setAttribute('aria-valuenow', String(v))
  }, [])

  const exit = useCallback(() => {
    if (exiting.current) return
    exiting.current = true
    try {
      animations.current.push(
        createTimeline({ onComplete: finish })
          .add('.intro__center', { translateY: [0, -18], opacity: [1, 0], duration: 600, ease: 'inQuart' }, 0)
          .add('.intro__name, .intro__skip, .intro__glow', { opacity: [1, 0], duration: 450, ease: 'inQuad' }, 0)
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
    const update = () => { setProgress(getProgress()); setPending(getPending()) }
    update()
    return subscribe(update)
  }, [visible, reduce])


  useEffect(() => {
    if (!visible || reduce) return
    const target = progress * 100
    let anim
    try {
      anim = animate(shown.current, {
        value: target,
        duration: 650,
        ease: 'outQuart',
        onUpdate: render,
        onComplete: () => { render(); if (target >= 100) exit() },
      })
      animations.current.push(anim)
    } catch {
      shown.current.value = target
      render()
      if (target >= 100) exit()
    }
    return () => anim?.pause?.()
  }, [progress, visible, reduce, render, exit])


  useEffect(() => {
    if (!visible || reduce) return
    const t = setTimeout(exit, MAX_WAIT_MS)
    return () => clearTimeout(t)
  }, [visible, reduce, exit])


  useEffect(() => {
    if (!visible || reduce) return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    const skip = () => finish()
    const onKey = (e) => { if (e.key === 'Escape') finish() }
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchmove', skip, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = previous
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
      window.removeEventListener('keydown', onKey)
    }
  }, [visible, reduce, finish])

  if (!visible || reduce) return null

  const status = pending.length ? `Loading ${pending.join(', ')}` : 'Ready'

  return (
    <div className="intro" ref={root}>
      <div className="intro__shutter intro__shutter--top" />
      <div className="intro__shutter intro__shutter--bottom" />

      <div className="intro__frame">
        <div className="intro__glow" aria-hidden="true" />
        <p className="intro__name">{site.name}</p>

        <div className="intro__center">
          <div
            ref={meter}
            className="intro__count"
            role="progressbar"
            aria-label="Loading the site"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <span className="intro__num" ref={number} aria-hidden="true">0</span>
            <span className="intro__pct" aria-hidden="true">%</span>
          </div>
          <div className="intro__bar-track" aria-hidden="true"><span className="intro__bar" ref={bar} /></div>
          <p className="intro__status" aria-live="polite">{status}</p>
        </div>

        <button type="button" className="intro__skip" onClick={finish}>Enter now</button>
      </div>
    </div>
  )
}
