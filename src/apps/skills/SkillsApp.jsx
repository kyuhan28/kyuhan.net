import { useId, useMemo, useState } from 'react'
import { AppShell, AppHeader, TechTag, EmptyState } from '../shared/ui'
import { skillCategories, skillsOf } from './skillsData'
import DotField from '../../components/kokonutui/DotField'
import { backgrounds } from '../shared/backgrounds'

export default function SkillsApp({ visible = true }) {

  const dots = backgrounds.skills
  const backdrop = (content) => (
    <DotField className="skills-dots" spacing={dots.spacing} interactive={dots.interactive} seed={dots.seed} paused={!visible}>{content}</DotField>
  )
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('All')
  const searchId = useId()
  const q = query.trim().toLowerCase()
  const sections = useMemo(() => skillCategories
    .filter((c) => tab === 'All' || c.name === tab)
    .map((c) => ({ name: c.name, skills: skillsOf(c).filter((s) => !q || s.name.toLowerCase().includes(q) || (s.level || '').toLowerCase().includes(q)) }))
    .filter((c) => c.skills.length), [tab, q])
  const count = sections.reduce((n, c) => n + c.skills.length, 0)

  if (!skillCategories.length) {
    return <AppShell accent="#7fe0c8" bg="skills" backdrop={backdrop}><AppHeader eyebrow="Skills" title="Skills" /><EmptyState title="No skills yet">Add categories to src/apps/skills/skillsData.js.</EmptyState></AppShell>
  }
  return (
    <AppShell accent="#7fe0c8" bg="skills" backdrop={backdrop} className="skills">
      <AppHeader eyebrow="Skills" title="What I work with">{count} {count === 1 ? 'technology' : 'technologies'}</AppHeader>
      <div className="skills__tools">
        <label className="sr-only" htmlFor={searchId}>Search skills</label>
        <input id={searchId} className="app-input app-input--search" type="search" placeholder="Search skills" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="app-filters" role="group" aria-label="Category">
          {['All', ...skillCategories.map((c) => c.name)].map((c) => (
            <button key={c} type="button" className="app-filter" aria-pressed={tab === c} onClick={() => setTab(c)}>{c}</button>
          ))}
        </div>
      </div>
      {sections.length ? sections.map((c) => (
        <section key={c.name} className="skills__section" aria-label={c.name}>
          <h2 className="app-subhead">{c.name}</h2>
          <ul className="tag-list tag-list--roomy">
            {c.skills.map((s) => <TechTag key={s.name} name={s.name} detail={s.level} />)}
          </ul>
        </section>
      )) : <EmptyState title="No matches">Nothing matches “{query}”. Try another name, or clear the search.</EmptyState>}
    </AppShell>
  )
}
