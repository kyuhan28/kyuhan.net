import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { spring } from '../../motion/tokens'

const clamp = (v, max) => Math.max(-max, Math.min(max, v))

/** Pulls its child a few pixels toward the pointer. Bounded so click targets never drift away. */
export default function Magnetic({ children, strength = 0.3, max = 10, className = '' }) {
  const fine = useFinePointer()
  const reduce = usePrefersReducedMotion()
  const enabled = fine && !reduce
  const ref = useRef(null)
  const rect = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, spring.magnetic)
  const sy = useSpring(y, spring.magnetic)

  const handlers = enabled
    ? {
        onPointerEnter: () => { rect.current = ref.current.getBoundingClientRect() },
        onPointerMove: (e) => {
          const r = rect.current ?? (rect.current = ref.current.getBoundingClientRect())
          x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength, max))
          y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength, max))
        },
        onPointerLeave: () => { rect.current = null; x.set(0); y.set(0) },
      }
    : {}

  return (
    <motion.span ref={ref} className={`magnetic ${className}`} style={enabled ? { x: sx, y: sy } : undefined} {...handlers}>
      {children}
    </motion.span>
  )
}
