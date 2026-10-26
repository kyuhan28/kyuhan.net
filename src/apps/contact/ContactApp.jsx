import { useState } from 'react'
import { AppShell } from '../shared/ui'
import FlowField from '../../components/kokonutui/FlowField'
import { backgrounds } from '../shared/backgrounds'
import { contact } from './contactData'

function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) }
  }
  return (
    <>
      <button type="button" className="contact__pill contact__pill--ghost" onClick={copy}>{copied ? 'Copied' : 'Copy email'}</button>
      <span className="sr-only" role="status">{copied ? 'Email address copied' : ''}</span>
    </>
  )
}

export default function ContactApp({ visible = true }) {
  const { email, availability, links } = contact
  const wind = backgrounds.contact
  const backdrop = (content) => (
    <>
      <FlowField className="contact-flow" density={wind.density} speed={visible ? wind.speed : 0} interactive={wind.interactive} />
      {content}
    </>
  )
  return (
    <AppShell accent="#8fe39a" bg="contact" backdrop={backdrop} className="contact">
      <div className="contact__center">
        <p className="contact__eyebrow"><span className="contact__rule" aria-hidden="true" />04 / Contact</p>
        <h1 className="contact__title">Let’s keep<br />in touch</h1>
        {availability && <p className="contact__lede">{availability}</p>}
        {email && (
          <div className="contact__actions">
            <a className="contact__pill contact__pill--solid" href={`mailto:${email}`}>Email {email}</a>
            <CopyEmail email={email} />
          </div>
        )}
        {links?.length > 0 && (
          <ul className="contact__elsewhere" aria-label="Elsewhere">
            {links.map((l) => (
              <li key={l.label}>
                <a className="contact__link" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
