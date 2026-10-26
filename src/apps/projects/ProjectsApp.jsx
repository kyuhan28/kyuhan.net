import { AppShell, AppHeader, EmptyState } from '../shared/ui'
import { projects } from './projectsData'
import TopoBackground from '../../components/kokonutui/TopoBackground'
import { backgrounds } from '../shared/backgrounds'

const linksOf = (p) => [['Website', p.website], [p.demoLabel || 'Live demo', p.demo], ['GitHub', p.github]].filter(([, href]) => href)

export default function ProjectsApp({ visible = true }) {
  const topo = backgrounds.projects
  const backdrop = (content) => (
    <TopoBackground className="projects-topo" interval={topo.interval} speed={visible ? topo.speed : 0}
      interactive={topo.interactive} seed={topo.seed} labels={topo.labels}>{content}</TopoBackground>
  )
  return (
    <AppShell accent="#c4a7ff" bg="projects" backdrop={backdrop} className="projects">
      <AppHeader eyebrow="Highlighted projects" title="Projects" />
      {projects.length ? (
        <ol className="proj-list">
          {projects.map((p, i) => (
            <li key={p.id} className="proj-row">
              <article className="proj-row__grid" aria-labelledby={`proj-${p.id}`}>
                <span className="proj-row__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="proj-row__head">
                  <h2 id={`proj-${p.id}`} className="proj-row__title">{p.title}</h2>
                  <p className="proj-row__meta">{[p.dates, p.context].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="proj-row__body">
                  <p className="app-text">{p.summary}</p>
                  {p.stack?.length > 0 && <p className="proj-row__stack"><span className="sr-only">Built with: </span>{p.stack.join(' · ')}</p>}
                  {linksOf(p).length > 0 && (
                    <p className="proj-row__links">
                      {linksOf(p).map(([label, href]) => (
                        <a key={label} className="app-link" href={href} target="_blank" rel="noopener noreferrer">
                          {label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ))}
                    </p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ol>
      ) : <EmptyState title="No projects yet">Add your projects to src/apps/projects/projectsData.js and they'll appear here.</EmptyState>}
    </AppShell>
  )
}
