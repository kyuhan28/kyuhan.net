import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { spring, ease } from '../../motion/tokens'
import './cursor.css'

const INTERACTIVE = 'a, button, [role="button"], summary, label, [data-cursor]'

export default function Cursor() {
  const fine = useFinePointer()
  if (!fine) return null
  return <CursorLens />
}

function CursorLens() {
  const reduce = usePrefersReducedMotion()
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, reduce ? { stiffness: 2000, damping: 100 } : spring.cursor)
  const sy = useSpring(y, reduce ? { stiffness: 2000, damping: 100 } : spring.cursor)
  const [mode, setMode] = useState({ kind: 'idle', label: '' })
  const [visible, setVisible] = useState(false)
  const current = useRef(mode)

  useEffect(() => {
    const update = (next) => {
      if (next.kind === current.current.kind && next.label === current.current.label) return
      current.current = next
      setMode(next)
    }
    const onMove = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
    }
    const onOver = (e) => {
      const target = e.target.closest?.(INTERACTIVE)
      if (!target) return update({ kind: 'idle', label: '' })
      const label = target.getAttribute('data-cursor') || ''
      update({ kind: label ? 'label' : 'link', label })
    }
    const onLeave = () => setVisible(false)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [x, y])

  return (
    <motion.div className="cursor" aria-hidden="true" style={{ x: sx, y: sy }}>
      <motion.div
        className="cursor__lens"
        animate={{
          scale: mode.kind === 'link' ? 2.2 : mode.kind === 'label' ? 0 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.35, ease: ease.soft }}
      />
      <AnimatePresence>
        {mode.kind === 'label' && (
          <motion.span
            key={mode.label}
            className="cursor__label"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.4, ease: ease.out }}
          >
            {mode.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
