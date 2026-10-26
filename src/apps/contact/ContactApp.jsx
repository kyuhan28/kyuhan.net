import { useState } from 'react'
import { AppShell, AppHeader } from '../shared/ui'
import { contact } from './contactData'

/* Contact, in the portfolio's original format: your availability, an Email button (and Copy), and your
   other links. Content: src/content/site.js (contact). */
function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { setCopied(false) }
  }
  return (
    <>
      <button type="button" className="app-button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      <span className="sr-only" role="status">{copied ? 'Email address copied' : ''}</span>
    </>
  )
}

export default function ContactApp() {
  const { email, availability, links } = contact
  return (
    <AppShell accent="#8fe39a" bg="contact" className="contact">
      <AppHeader eyebrow="Contact" title="Let’s build something">{availability}</AppHeader>
      {email && (
        <div className="app-actions">
          <a className="app-button app-button--primary" href={`mailto:${email}`}>Email {email}</a>
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
    </AppShell>
  )
}
