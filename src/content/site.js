export const site = {
  name: 'Kyu Han',
  nameLines: ['Kyu Han'],

  avatar: '/work/pfp.jpeg',

  floatingSvg: null,

  role: '3rd-year Computer Science student at the University of Pittsburgh',

  tagline: 'Welcome! Here is a showcase of my work and interests in the tech space.',

  about: {
    statement:
      'I’m interested in the whole journey of building software, from understanding a problem to shipping a solution. Software engineering, development, and machine learning are where I spend most of my time and curiosity.',
    bio: [
      'I also enjoy creating these websites and web applications with fun and interactive user interfaces.',
    ],
    facts: [
      { term: 'Based in', detail: 'Pittsburgh, PA' },
      { term: 'Studying', detail: 'Computer Science and Business minor' },
      { term: 'Currently', detail: 'Learning and developing database-driven web applications focused on improving student life.' },
    ],
  },

  projects: [
    {
      id: 'code-viz',
      title: 'CodeViz: AI-assisted Visualizer, Debugger, and Writer',
      year: 'Aug 2026 - Oct 2026',
      role: 'NebiusXNVIDIA Hackathon',
      summary: 'Developed a 3D code visualizer that turns Java, Python, C, and C++ programs into interactive, step-by-step animations across multiple data structure types and algorithms, by recording each program’s real execution and rendering it with Three.js.',
      stack: ['TypeScript', 'React', 'Next.js', 'Java', 'Python', 'C', 'C++', 'GCC/G++', 'Docker', 'Three.js', 'CodeMirror', 'Tailwind CSS', 'NVIDIA Nemotron API'],
      links: [{ label: 'Live demo', href: 'https://www.youtube.com/watch?v=CKZsKpU3Ib4' }, { label: 'GitHub', href: 'https://github.com/kyuhan28/nebiusAIcode-V-D-W' }],
    },
    {
      id: 'study-planner',
      title: '"@me", Personal Study Planner',
      year: 'Oct 2026',
      role: 'Rutgers Hackathon',
      summary: 'Built a chrome extension that can help with various tasks such as scheduling, reminders, and information retrieval.',
      stack: ['JavaScript', 'HTML', 'CSS', 'Chrome Extensions API', 'Gemini API', 'Google Calendar API', 'Canvas LMS API', 'OAuth 2.0'],
      links: [{ label: 'Website', href: 'https://atme.tech/' },  { label: 'Live demo', href: 'https://youtu.be/6-lSCqXHf80' }, { label: 'GitHub', href: 'https://github.com/kyuhan28/atme' }],
    },
    {
      id: 'nemotron-gate',
      title: 'Nemotron Safety Gate',
      year: 'Sep 2026',
      role: 'SteelHacks XIII',
      summary: 'A safety gate for medical chatbots: NVIDIA Nemotron triages each symptom and audits another model’s draft advice, then deterministic Python rules decide whether it is safe to show, naming the rule behind every withheld answer.',
      stack: ['Python', 'NVIDIA Nemotron API', 'OpenRouter', 'GPT-4o-mini', 'Gradio', 'pandas', 'Matplotlib', 'Jupyter'],
      links: [{ label: 'GitHub', href: 'https://github.com/kyuhan28/nemotrontriagemodel' }],
    },
    {
      id: 'research-LLM',
      title: 'Multi-Lingual LLM Medical Research',
      year: 'June 2026',
      role: 'Student Researcher',
      summary: 'Evaluated the performance of large language models in the medical domain, specifically for multi-lingual tasks.',
      stack: ['Python', 'NumPy', 'PyTorch', 'Hugging Face'],
      links: [ { label: 'GitHub', href: 'https://github.com/manuragkhullar/uqforindiclanguages' }],
    },
  ],

  experience: [
    { period: '2025 – Present', title: 'Undergraduate Teaching Assistant', org: 'University of Pittsburgh', summary: 'Assisted in teaching/mentoring/explaining multiple courses for students.' },
    { period: '2025', title: 'Undergraduate Student Researcher', org: 'University of Pittsburgh', summary: 'Collaborated with PhD Students and a team in the medical field regarding Large Language Models on datasets.' },
  ],

  skills: [
    { area: 'Languages', detail: 'Java, Python, TypeScript, JavaScript, C, C++, SQL, HTML, CSS' },
    { area: 'Frameworks & Platforms', detail: 'Next.js, Node.js, Angular, Vue.js, Flask, AWS, Hugging Face, OpenRouter, NVIDIA API, REST APIs, Supabase, Firebase'},
    { area: 'Developer Tools', detail: 'Git, GitHub, Docker, Docker Compose, SQLite, PostgreSQL' },
    { area: 'Libraries', detail: 'React, Three.js, CodeMirror, Tailwind CSS, shadcn/ui, PyTorch, pandas, NumPy, Gradio, Matplotlib, SQLAlchemy' },
  ],

  contact: {
    email: 'hankyumin05@gmail.com',
    availability: 'I am open to full-time roles such as internships, research opportunities, and other positions.',
    links: [
      { label: 'GitHub', href: 'https://github.com/kyuhan28' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyu-han-pitt2028/' },
      { label: 'Resume', href: 'https://docs.google.com/document/d/1QGBGVvxtz7eCeJxr-Lt-9xzPbM-4F4kc/edit?usp=sharing&ouid=104312216113214708123&rtpof=true&sd=true' },
    ],
  },

  timezone: 'America/New_York',
}
