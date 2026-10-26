import { AppShell, AppHeader, LinkButton, EmptyState } from '../shared/ui'
import { withBase } from '../shared/techIcons'
import { experience, datesOf } from './experienceData'

/* Experience: a compact timeline, newest first, its entry types marked subtly. Fields that aren't set are
   left out. Content: experienceData.js. */
const TYPES = {
  employment: { label: 'Employment', color: '#9fb4ff' },
  internship: { label: 'Internship', color: '#c4a7ff' },
  education: { label: 'Education', color: '#7fe0c8' },
  leadership: { label: 'Leadership', color: '#ffc98a' },
  other: { label: 'Experience', color: '#b8bcc8' },
}

function Entry({ e }) {
  const t = TYPES[e.type] || TYPES.other
  const dates = datesOf(e)
  return (
    <li className="xp-entry" style={{ '--xp': t.color }}>
      <span className="xp-dot" aria-hidden="true" />
      <div className="xp-entry__head">
        {e.logo && <img className="xp-logo" src={withBase(e.logo)} alt="" width="28" height="28" />}
        <div>
          <p className="xp-type">{e.label || t.label}</p>
          <h2 className="xp-title">{e.title}</h2>
          <p className="xp-org">{[e.org, e.location].filter(Boolean).join(' · ')}</p>
        </div>
        {dates && <p className="xp-dates">{dates}</p>}
      </div>
      {e.description && <p className="app-text">{e.description}</p>}
      {e.responsibilities?.length > 0 && (<><h3 className="xp-list-title">Responsibilities</h3><ul className="xp-list">{e.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></>)}
      {e.accomplishments?.length > 0 && (<><h3 className="xp-list-title">Accomplishments</h3><ul className="xp-list">{e.accomplishments.map((r) => <li key={r}>{r}</li>)}</ul></>)}
      {e.links?.length > 0 && <div className="app-actions">{e.links.map((l) => <LinkButton key={l.href} href={l.href}>{l.label}</LinkButton>)}</div>}
    </li>
  )
}

export default function ExperienceApp() {
  return (
    <AppShell accent="#ffc98a" bg="experience" className="experience">
      <AppHeader eyebrow="Experience" title="Where I've been" />
      {experience.length ? <ol className="xp-timeline">{experience.map((e, i) => <Entry key={`${e.org}-${e.title}-${i}`} e={e} />)}</ol>
        : <EmptyState title="No experience yet">Add entries to src/apps/experience/experienceData.js.</EmptyState>}
    </AppShell>
  )
}
