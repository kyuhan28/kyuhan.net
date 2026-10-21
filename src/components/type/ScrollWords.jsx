import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import './type.css'

function Word({ progress, start, end, children }) {
  const opacity = useTransform(progress, [start, end], [0.16, 1])
  return <motion.span className="scroll-words__word" style={{ opacity }}>{children}</motion.span>
}






export default function ScrollWords({ as: Tag = 'p', text, className = '' }) {
  const ref = useRef(null)
  const reduce = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })
  const words = text.split(' ')

  if (reduce) return <Tag ref={ref} className={`scroll-words ${className}`}>{text}</Tag>

  return (
    <Tag ref={ref} className={`scroll-words ${className}`}>
      {words.map((word, i) => (
        <Word key={i} progress={scrollYProgress} start={i / words.length} end={(i + 1) / words.length}>
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </Word>
      ))}
    </Tag>
  )
}
