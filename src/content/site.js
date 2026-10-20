export const site = {
  name: 'Kyu Han',
  nameLines: ['Kyu Han'],

  avatar: '/work/pfp.jpeg',

  role: '3rd-year Computer Science student at the University of Pittsburgh',

  tagline: 'Welcome! Here is a showcase of my work and interests in the tech space.',

  about: {
    statement:
      'I am very passionate about technology and its application in solving real-world problems. I am most intereted in software development, engineering, and machine learning.',
    bio: [
      'I’m passionate about frontend development, with a focus on building engaging, interactive, and visually polished web experiences. I enjoy experimenting with modern web technologies, animations, and UI design to create interfaces that are intuitive, functional, and enjoyable to use.',
      'I also enjoy creating these websites and web applications with fun and interactive user interfaces.',
    ],
    facts: [
      { term: 'Based in', detail: 'Pittsburgh, PA' },
      { term: 'Studying', detail: 'Computer science at University of Pittsburgh' },
      { term: 'Currently', detail: 'Working on student-focused projects related to productivity and time management' },
    ],
  },

  projects: [
    {
      id: 'study-planner',
      title: '"@me", Personal Study Planner',
      year: 'Oct 2026 - Present',
      summary: 'Built a chrome extension that can help with various tasks such as scheduling, reminders, and information retrieval.',
      stack: ['JavaScript', 'HTML', 'CSS'],
      links: [{ label: 'Website', href: 'https://atme.tech/' },  { label: 'Live demo', href: 'https://youtu.be/6-lSCqXHf80' }, { label: 'GitHub', href: 'https://github.com/kyuhan28/atme' }],
    },
    {
      id: 'code-viz',
      title: 'CodeViz, AI-assisted Visualizer, Debugger, and Writer',
      year: 'Sept 2026 - Present',
      summary: 'Developed a 3D code visualizer that turns Java and Python programs into interactive, step-by-step animations across multiple data structure types and algorithms, by recording each program’s real execution and rendering it with Three.js.',
      stack: ['Docker', 'React', 'TypeScript','Java', 'Python', 'TailWind CSS', 'Three.js', 'Next.js'],
      links: [{ label: 'GitHub', href: '' }],
    },
    {
      id: 'research-LLM',
      title: 'Multi-Lingual LLM Medical Research',
      year: 'June 2026',
      role: 'Student Researcher',
      summary: 'Evaluated the performance of large language models in the medical domain, specifically for multi-lingual tasks.',
      stack: ['Python', 'Hugging Face', 'PyTorch'],
      links: [ { label: 'GitHub', href: 'https://github.com/manuragkhullar/uqforindiclanguages' }],
    },
  ],

  experience: [
    { period: '2025 – Present', title: 'Undergraduate Teaching Assistant', org: 'University of Pittsburgh', summary: 'Assisted in teaching/mentoring/explaining multiple courses for students.' },
    { period: '2025', title: 'Undergraduate Student Researcher', org: 'University of Pittsburgh', summary: 'Collaborated with PhD Students and a team in the medical field regarding Large Language Models on datasets.' },
  ],

  skills: [
    { area: 'Languages', detail: 'Java, Python, C, C++, JavaScript, TypeScript, HTML, CSS, SQL' },
    { area: 'Frameworks & Platforms', detail: 'AWS, Anaconda, HuggingFace, OpenRouter, REST APIs, PyTorch, Next.js, TailWind', tools: ['AngularJS', 'ViteJS', 'VueJS'] },
    { area: 'Developer Tools', detail: 'Git, GitHub, Visual Studio Code, Jupyter Notebook, Docker' },
    { area: 'Libraries', detail: 'Pandas, NumPy, React, Three.js' },
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
