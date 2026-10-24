import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { site } from '../../content/site'
import { ease } from '../../motion/tokens'
import { useFinePointer, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import SplitText from '../type/SplitText'
import ScrollWords from '../type/ScrollWords'
import SectionLabel from '../type/SectionLabel'
import Magnetic from '../cursor/Magnetic'
import TechStack from './TechStack'
import './portfolio.css'

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.5 },
  transition: { duration: 0.9, ease: ease.out, delay },
})

function ExternalIcon() {
  return (
    <svg className="pf-icon" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M4 10 10 4M5 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


function OutLink({ label, href, className = '' }) {
  if (!href) return <span className={`${className} is-empty`}>{label} link not added</span>
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {label}
      <ExternalIcon />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}


export function HeroSection({ ready }) {
  const shown = (delay) => ({ initial: { opacity: 0, y: 16 }, animate: ready ? { opacity: 1, y: 0 } : undefined, transition: { duration: 1.1, ease: ease.out, delay } })
  return (
    <section id="top" className="pf pf--hero" aria-labelledby="hero-title">
      <div className="pf__inner container">
        <motion.p className="pf-eyebrow" {...shown(0.7)}><span className="pf-eyebrow__rule" aria-hidden="true" />{site.role}</motion.p>
        <SplitText as="h1" id="hero-title" className="pf-headline pf-headline--xl" text={site.nameLines} mode="chars" trigger="mount" play={ready} delay={0.9} stagger={0.045} />
        <motion.p className="pf-text pf-text--lead" {...shown(1.6)}>{site.tagline}</motion.p>
        <motion.div className="pf-actions" {...shown(1.85)}>
          <Magnetic><a className="pf-btn pf-btn--primary" href="#projects">View projects</a></Magnetic>
          <Magnetic><a className="pf-btn pf-btn--ghost" href="#contact">Get in touch</a></Magnetic>
        </motion.div>
      </div>
      <motion.a href="#about" className="pf-scroll" {...shown(2.3)} aria-label="Scroll to About">
        <span aria-hidden="true" />
      </motion.a>
    </section>
  )
}


export function AboutSection() {
  const { statement, bio, facts } = site.about
  return (
    <section id="about" className="pf pf--about pf--dim" aria-labelledby="about-title">
      <div className="pf__inner container">
        <SectionLabel>01 / About</SectionLabel>
        <h2 id="about-title" className="sr-only">About</h2>
        <ScrollWords className="pf-statement" text={statement} />
        <div className="pf-about">
          <div className="pf-about__bio">
            {bio.map((p, i) => <motion.p key={i} className="pf-text" {...rise(0.1 + i * 0.12)}>{p}</motion.p>)}
          </div>
          {facts?.length > 0 && (
            <motion.dl className="pf-facts" {...rise(0.25)}>
              {facts.map((f) => (
                <div key={f.term} className="pf-facts__row"><dt>{f.term}</dt><dd>{f.detail}</dd></div>
              ))}
            </motion.dl>
          )}
        </div>
      </div>
    </section>
  )
}


// Hovering a project (desktop) keeps its row bright and dims the others.
export function ProjectsSection() {
  const fine = useFinePointer()
  const reduce = usePrefersReducedMotion()
  const [active, setActive] = useState(null)
  const follow = fine && !reduce

  return (
    <section id="projects" className="pf pf--projects pf--dim" aria-labelledby="projects-title">
      <div className="pf__inner container">
        <SectionLabel>02 / Highlighted projects</SectionLabel>
        <SplitText as="h2" id="projects-title" className="pf-headline" text={['Projects']} mode="chars" />
        <ol className="pf-projects" onPointerLeave={() => setActive(null)}>
          {site.projects.map((p, i) => (
            <motion.li key={p.id} className={`pf-project ${active?.id === p.id ? 'is-active' : ''}`} {...rise(0.05)}
              onPointerEnter={() => follow && setActive(p)}>
              <article className="pf-project__row" aria-labelledby={`project-${p.id}`}>
                <span className="pf-project__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="pf-project__head">
                  <h3 id={`project-${p.id}`} className="pf-project__title">{p.title}</h3>
                  <p className="pf-project__meta">{[p.year, p.role].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="pf-project__body">
                  <p className="pf-text">{p.summary}</p>
                  {p.stack?.length > 0 && <p className="pf-project__stack"><span className="sr-only">Built with: </span>{p.stack.join(' · ')}</p>}
                  {p.links?.length > 0 && (
                    <p className="pf-project__links">
                      {p.links.map((l) => <OutLink key={l.label} {...l} className="pf-link" />)}
                    </p>
                  )}
                </div>
              </article>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}


export function SkillsSection() {
  return (
    <section id="skills" className="pf pf--skills pf--dim" aria-labelledby="skills-title">
      <div className="pf__inner container">
        <SectionLabel>03 / Experience & skills</SectionLabel>
        <SplitText as="h2" id="skills-title" className="pf-headline" text={['Experience', '& skills']} mode="chars" />
        <div className="pf-skills">
          <div className="pf-skills__col">
            <h3 className="pf-subhead">Experience</h3>
            <ol className="pf-timeline">
              {site.experience.map((e, i) => (
                <motion.li key={i} className="pf-timeline__item" {...rise(0.05 + i * 0.08)}>
                  <p className="pf-timeline__period">{e.period}</p>
                  <div>
                    <p className="pf-timeline__title">{e.title}<span> · {e.org}</span></p>
                    <p className="pf-text pf-text--small">{e.summary}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
          <div className="pf-skills__col">
            <h3 className="pf-subhead">Technical Skills</h3>
            <TechStack areas={site.skills} />
          </div>
        </div>
      </div>
    </section>
  )
}

function CopyEmail({ email }) {
  const [status, setStatus] = useState('idle')
  useEffect(() => {
    if (status === 'idle') return
    const t = setTimeout(() => setStatus('idle'), 2400)
    return () => clearTimeout(t)
  }, [status])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }
  const label = status === 'copied' ? 'Email copied' : status === 'failed' ? 'Copy failed, select the address instead' : 'Copy email'
  return (
    <button type="button" className="pf-btn pf-btn--ghost" onClick={copy}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={status} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.25, ease: ease.soft }}>
          {label}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">{status === 'copied' ? 'Email address copied to clipboard' : ''}</span>
    </button>
  )
}


export function ContactSection() {
  const { email, availability, links } = site.contact
  return (
    <section id="contact" className="pf pf--contact" aria-labelledby="contact-title">
      <div className="pf__inner container">
        <SectionLabel>04 / Contact</SectionLabel>
        <SplitText as="h2" id="contact-title" className="pf-headline pf-headline--xl" text={['Let’s keep', 'in touch']} mode="chars" />
        <motion.p className="pf-text pf-text--lead" {...rise(0.2)}>{availability}</motion.p>
        <motion.div className="pf-actions" {...rise(0.3)}>
          {email ? (
            <>
              <Magnetic><a className="pf-btn pf-btn--primary" href={`mailto:${email}`}>Email {email}</a></Magnetic>
              <CopyEmail email={email} />
            </>
          ) : (
            <span className="pf-btn pf-btn--placeholder">Your email goes here</span>
          )}
        </motion.div>
        <motion.ul className="pf-elsewhere" aria-label="Elsewhere" {...rise(0.4)}>
          {links.map((l) => <li key={l.label}><OutLink {...l} className="pf-link pf-link--large" /></li>)}
        </motion.ul>
      </div>
    </section>
  )
}
