import { Fragment, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { ease, stagger as staggerTokens } from '../../motion/tokens'
import './type.css'

const unitVariants = {
  hidden: { y: '115%' },
  visible: (delay) => ({
    y: '0%',
    transition: { duration: 1.05, ease: ease.out, delay },
  }),
}

/**
 * Masked typographic reveal. Screen readers get the plain sentence; the split
 * spans are aria-hidden so the reading order stays intact.
 *
 * lines:    string (use \n for breaks) or array of lines
 * mode:     'chars' for display headlines, 'words' for longer headings
 * trigger:  'inView' (default) or 'mount' (then pass `play`)
 */
export default function SplitText({
  as = 'h2',
  text,
  mode = 'words',
  trigger = 'inView',
  play = true,
  delay = 0,
  stagger,
  className = '',
  style,
  id,
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const active = trigger === 'mount' ? play : inView
  const lines = Array.isArray(text) ? text : String(text).split('\n')
  const step = stagger ?? (mode === 'chars' ? staggerTokens.chars : staggerTokens.words)
  const Tag = motion[as] ?? motion.div

  let index = 0
  return (
    <Tag
      ref={ref}
      id={id}
      className={`split split--${mode} ${className}`}
      style={style}
      initial="hidden"
      animate={active ? 'visible' : 'hidden'}
    >
      <span className="sr-only">{lines.join(' ')}</span>
      <span className="split__inner" aria-hidden="true">
        {lines.map((line, li) => (
          <span className="split__line" key={li}>
            {line.split(' ').map((word, wi, words) => (
              <Fragment key={wi}>
              <span className="split__word">
                <span className="split__mask">
                  {mode === 'chars' ? (
                    Array.from(word).map((char, ci) => (
                      <motion.span
                        className="split__unit"
                        key={ci}
                        variants={unitVariants}
                        custom={delay + index++ * step}
                      >
                        {char}
                      </motion.span>
                    ))
                  ) : (
                    <motion.span className="split__unit" variants={unitVariants} custom={delay + index++ * step}>
                      {word}
                    </motion.span>
                  )}
                </span>
              </span>
              {wi < words.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  )
}
