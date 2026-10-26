/*
 * Your skills, shown by the Skills app (and the classic portfolio page), in categories. To add a skill, add
 * its name to a category; to add a category, copy one. Logos come from src/content/tech-icons.json (run
 * `npm run icons` after adding names; anything without a logo shows a neutral badge).
 *
 * A skill can be just its name ('Java'), or an object with a note you write yourself:
 *   { name: 'Java', level: 'Most comfortable' }
 * Nothing is rated automatically: with no `level`, a skill is shown on its own.
 */
export const skillCategories = [
  { name: 'Programming Languages', skills: ['Java', 'Python', 'TypeScript', 'JavaScript', 'C', 'C++', 'SQL', 'HTML', 'CSS'] },
  { name: 'Frameworks and Platforms', skills: ['Next.js', 'Node.js', 'Angular', 'Vue.js', 'Flask', 'AWS', 'Hugging Face', 'OpenRouter', 'NVIDIA Nemotron API', 'REST APIs'] },
  { name: 'Developer Tools', skills: ['Git', 'GitHub', 'Visual Studio Code', 'Docker', 'Docker Compose', 'npm', 'ESLint', 'Jupyter Notebook', 'Anaconda'] },
  { name: 'Libraries', skills: ['React', 'Three.js', 'CodeMirror', 'Tailwind CSS', 'shadcn/ui', 'Radix UI', 'PyTorch', 'pandas', 'NumPy'] },
]

/** Every skill as { name, level? }. */
export const skillsOf = (category) => category.skills.map((s) => (typeof s === 'string' ? { name: s } : s))
