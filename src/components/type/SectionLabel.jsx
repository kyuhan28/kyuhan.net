import { motion } from 'motion/react'
import { ease } from '../../motion/tokens'

/** "01 / The playground": a small uppercase label with a fine leading rule. */
export default function SectionLabel({ children }) {
  return (
    <motion.p
      className="section-label"
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.9, ease: ease.out }}
    >
      <span className="section-label__rule" aria-hidden="true" />
      {children}
    </motion.p>
  )
}
