import AboutApp from '../../apps/about/AboutApp'
import ProjectsApp from '../../apps/projects/ProjectsApp'
import SkillsApp from '../../apps/skills/SkillsApp'
import ExperienceApp from '../../apps/experience/ExperienceApp'
import ContactApp from '../../apps/contact/ContactApp'

const cascade = (i) => (w) => (w < 720
  ? { x: 0.02, y: 0.03 + i * 0.01, w: 0.96, h: 0.92 - i * 0.01 }
  : { x: 0.14 + i * 0.045, y: 0.05 + i * 0.045, w: 0.6, h: 0.76 })

export const APPS = [
  { id: 'about', title: 'About Me', short: 'About Me', icon: 'about', accent: '#9fb4ff', component: AboutApp, minWidth: 340, minHeight: 260, defaultRect: cascade(0) },
  { id: 'projects', title: 'Projects', short: 'Projects', icon: 'projects', accent: '#c4a7ff', component: ProjectsApp, minWidth: 360, minHeight: 280, defaultRect: cascade(1) },
  { id: 'skills', title: 'Skills', short: 'Skills', icon: 'skills', accent: '#7fe0c8', component: SkillsApp, minWidth: 340, minHeight: 260, defaultRect: cascade(2) },
  { id: 'experience', title: 'Experience', short: 'Experience', icon: 'experience', accent: '#ffc98a', component: ExperienceApp, minWidth: 340, minHeight: 260, defaultRect: cascade(3) },
  { id: 'contact', title: 'Contact', short: 'Contact', icon: 'contact', accent: '#8fe39a', component: ContactApp, minWidth: 340, minHeight: 300, defaultRect: cascade(4) },
].map((a) => ({ openAtStart: false, ...a }))
export const appById = (id) => APPS.find((a) => a.id === id)
