import BackgroundPaths from '../../components/kokonutui/BackgroundPaths'
import { AppShell, LinkButton } from '../shared/ui'
import { withBase } from '../shared/techIcons'
import { about } from './aboutData'
import { backgrounds } from '../shared/backgrounds'

const LINKS = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['resume', 'Resume'], ['website', 'Website']]

export default function AboutApp({ visible = true }) {
  const { name, role, tagline, avatar, statement, bio, ps, facts, links } = about
  const shown = LINKS.filter(([key]) => links?.[key])

  const paths = backgrounds.about
  const backdrop = (content) => (
    <>
      <div className="about__backdrop" aria-hidden="true">
        <BackgroundPaths className="about__paths" count={paths.count} angle={paths.angle} speed={visible ? paths.speed : 0}>{null}</BackgroundPaths>
      </div>
      {content}
    </>
  )
  return (
    <AppShell accent="#9fb4ff" bg="about" backdrop={backdrop} className="about">
      <header className="about__hero">
        <div className="about__profile">
          {avatar && <img className="about__avatar" src={withBase(avatar)} alt="" width="76" height="76" />}
          <div>
            <h1 className="app-title about__name">{name}</h1>
            {role && <p className="about__role">{role}</p>}
            {tagline && <p className="about__tagline">{tagline}</p>}
          </div>
        </div>
      </header>
      <div className="about__body">
        <div className="about__main">
          {statement && <p className="about__statement">{statement}</p>}
          {bio?.map((p, i) => <p key={i} className="app-text">{p}</p>)}
          {ps?.length > 0 && (
            <aside className="about__ps" aria-label="P.S.">
              {ps.map((p, i) => <p key={i}>{p}</p>)}
            </aside>
          )}
        </div>
        <aside className="about__side">
          {facts?.length > 0 && (
            <dl className="about__facts">
              {facts.map((f) => (
                <div key={f.term}><dt>{f.term}</dt><dd>{f.detail}</dd></div>
              ))}
            </dl>
          )}
          {shown.length > 0 && (
            <div className="app-actions">
              {shown.map(([key, label], i) => <LinkButton key={key} href={links[key]} primary={i === 0}>{label}</LinkButton>)}
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  )
}
