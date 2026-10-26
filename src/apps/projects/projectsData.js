/*
 * Your projects, shown by the Projects app (and the classic portfolio page). To add one, copy an entry
 * and edit it; only `id`, `title` and `summary` are required, and any field you leave out is hidden.
 *
 *   id           a short unique name (letters, numbers, dashes)
 *   title        the project's name
 *   summary      one or two sentences, for its card
 *   description  optional: a longer description, for its detail view (the summary is used if absent)
 *   context      optional: where it was made (a hackathon, a course, a role)
 *   dates        optional: when (any text, e.g. 'Oct 2026' or 'Aug – Oct 2026')
 *   category     optional: for the filter at the top (e.g. 'Hackathon', 'Research')
 *   stack        optional: technologies used (logos come from src/content/tech-icons.json)
 *   github, demo, website   optional links (shown as buttons only when present)
 *   demoLabel    optional: the demo button's text (default 'Live demo')
 *   image        optional: a screenshot, e.g. '/work/codeviz.png' in public/work (a tidy placeholder if absent)
 *   status       optional: e.g. 'In progress' or 'Completed'
 *   featured     optional: true to show it first
 */
export const projects = [
  {
    id: 'code-viz',
    title: 'CodeViz: AI-assisted Visualizer, Debugger, and Writer',
    context: 'NebiusXNVIDIA Hackathon',
    dates: 'Aug 2026 - Oct 2026',
    category: 'Hackathon',
    summary: 'Developed a 3D code visualizer that turns Java, Python, C, and C++ programs into interactive, step-by-step animations across multiple data structure types and algorithms, by recording each program’s real execution and rendering it with Three.js.',
    stack: ['TypeScript', 'React', 'Next.js', 'Java', 'Python', 'C', 'C++', 'GCC/G++', 'Docker', 'Three.js', 'CodeMirror', 'Tailwind CSS', 'NVIDIA Nemotron API'],
    demo: 'https://www.youtube.com/watch?v=CKZsKpU3Ib4',
    github: 'https://github.com/kyuhan28/nebiusAIcode-V-D-W',
  },
  {
    id: 'study-planner',
    title: '"@me", Personal Study Planner',
    context: 'Rutgers Hackathon',
    dates: 'Oct 2026',
    category: 'Hackathon',
    summary: 'Built a chrome extension that can help with various tasks such as scheduling, reminders, and information retrieval.',
    stack: ['JavaScript', 'HTML', 'CSS', 'Chrome Extensions API', 'Gemini API', 'Google Calendar API', 'Canvas LMS API', 'OAuth 2.0'],
    website: 'https://atme.tech/',
    demo: 'https://youtu.be/6-lSCqXHf80',
    github: 'https://github.com/kyuhan28/atme',
  },
  {
    id: 'nemotron-gate',
    title: 'Nemotron Safety Gate',
    context: 'SteelHacks XIII',
    dates: 'Sep 2026',
    category: 'Hackathon',
    summary: 'A safety gate for medical chatbots: NVIDIA Nemotron triages each symptom and audits another model’s draft advice, then deterministic Python rules decide whether it is safe to show, naming the rule behind every withheld answer.',
    stack: ['Python', 'NVIDIA Nemotron API', 'OpenRouter', 'GPT-4o-mini', 'Gradio', 'pandas', 'Matplotlib', 'Jupyter'],
    github: 'https://github.com/kyuhan28/nemotrontriagemodel',
  },
  {
    id: 'research-LLM',
    title: 'Multi-Lingual LLM Medical Research',
    context: 'Student Researcher',
    dates: 'June 2026',
    category: 'Research',
    summary: 'Evaluated the performance of large language models in the medical domain, specifically for multi-lingual tasks.',
    stack: ['Python', 'NumPy', 'PyTorch', 'Hugging Face'],
    github: 'https://github.com/manuragkhullar/uqforindiclanguages',
  },
]
