import { readFileSync, writeFileSync } from 'node:fs'
import * as simpleIcons from 'simple-icons'
import { skillCategories } from '../src/apps/skills/skillsData.js'
import { projects } from '../src/apps/projects/projectsData.js'

const ALIASES = {
  Java: ['openjdk'],
  HTML: ['html5'],
  CSS: ['css', 'css3'],
  'C++': ['cplusplus'],
  AWS: ['amazonwebservices', 'amazonaws', 'aws'],
  'NVIDIA Nemotron API': ['nvidia'],
  'NVIDIA API': ['nvidia'],
  'Docker Compose': ['docker'],
  'Jupyter Notebook': ['jupyter'],
  'Visual Studio Code': ['visualstudiocode', 'vscode'],
}

const slugify = (name) =>
  name.toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')

const bySlug = new Map(Object.values(simpleIcons).filter((i) => i && i.slug && i.path).map((i) => [i.slug, i]))

const skillNames = skillCategories.flatMap((c) => c.skills.map((s) => (typeof s === 'string' ? s : s.name)))
const names = [...new Set([...skillNames, ...projects.flatMap((p) => p.stack || [])])]
const OUT = new URL('../src/content/tech-icons.json', import.meta.url)

let previous = {}
try { previous = JSON.parse(readFileSync(OUT, 'utf8')) } catch {}
const found = {}
const missing = []
const kept = []
for (const name of names) {
  const icon = [...(ALIASES[name] || []), slugify(name)].map((slug) => bySlug.get(slug)).find(Boolean)
  if (icon) found[name] = { title: icon.title, hex: icon.hex, path: icon.path }
  else if (previous[name]) { found[name] = previous[name]; kept.push(name) }
  else missing.push(name)
}
writeFileSync(OUT, JSON.stringify(found, null, 2) + '\n')
console.log(`Tech icons: ${Object.keys(found).length} of ${names.length} found, saved to src/content/tech-icons.json`)
if (kept.length) console.log(`Kept from before (not in this Simple Icons version): ${kept.join(', ')}`)
if (missing.length) console.log(`No logo for: ${missing.join(', ')} (those badges show without one)`)
