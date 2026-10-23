import { writeFileSync } from 'node:fs'
import * as simpleIcons from 'simple-icons'
import { site } from '../src/content/site.js'

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

// Simple Icons' own naming: "Next.js" -> "nextdotjs", "C++" -> "cplusplus", "Radix UI" -> "radixui".
const slugify = (name) =>
  name.toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/&/g, 'and').replace(/[^a-z0-9]/g, '')

const bySlug = new Map(Object.values(simpleIcons).filter((i) => i && i.slug && i.path).map((i) => [i.slug, i]))
// Each skill group can be a list (tech: ['Java', 'Python']) or one line of text
// (detail: 'Java, Python'): a line is split at its commas.
const listOf = (area) => (area.tech?.length ? area.tech : String(area.detail || '').split(',')).map((t) => t.trim()).filter(Boolean)
const names = [...new Set(site.skills.flatMap(listOf))]
const found = {}
const missing = []
for (const name of names) {
  const icon = [...(ALIASES[name] || []), slugify(name)].map((slug) => bySlug.get(slug)).find(Boolean)
  if (icon) found[name] = { title: icon.title, hex: icon.hex, path: icon.path }
  else missing.push(name)
}
writeFileSync(new URL('../src/content/tech-icons.json', import.meta.url), JSON.stringify(found, null, 2) + '\n')
console.log(`Tech icons: ${Object.keys(found).length} of ${names.length} found, saved to src/content/tech-icons.json`)
if (missing.length) console.log(`No logo for: ${missing.join(', ')} (those badges show without one)`)
