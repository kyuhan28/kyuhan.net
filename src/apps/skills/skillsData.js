export const skillCategories = [
  { name: 'Programming Languages', skills: ['Java', 'Python', 'TypeScript', 'JavaScript', 'C', 'C++', 'SQL', 'HTML', 'CSS'] },
  { name: 'Frameworks and Platforms', skills: ['Next.js', 'Node.js', 'Angular', 'Vue.js', 'Flask', 'AWS', 'Hugging Face', 'OpenRouter', 'NVIDIA Nemotron API', 'REST APIs'] },
  { name: 'Developer Tools', skills: ['Git', 'GitHub', 'Visual Studio Code', 'Docker', 'Docker Compose', 'npm', 'ESLint', 'Jupyter Notebook', 'Anaconda'] },
  { name: 'Libraries', skills: ['React', 'Three.js', 'CodeMirror', 'Tailwind CSS', 'shadcn/ui', 'Radix UI', 'PyTorch', 'pandas', 'NumPy'] },
]

export const skillsOf = (category) => category.skills.map((s) => (typeof s === 'string' ? { name: s } : s))
