/**
 * Everything personal on the site lives in this file.
 *
 * Carried over from portfolio.zip, where every value was a PLACEHOLDER: a stand-in until you write
 * your own. Nothing here describes real work, employers, results or links until you replace it.
 * The one real detail so far is your role, from your own description.
 */

export const site = {
  // PLACEHOLDER: your name. `nameLines` controls the line break in the hero headline.
  name: 'Kyu Han',
  nameLines: ['Kyu Han'],

  // PLACEHOLDER: a square profile photo in /public (at least 128x128), e.g. '/avatar.jpg'.
  // Until then, your initials are shown in the header.
  avatar: '/work/pfp.jpeg', // files in public/ are served from the site root: no 'public/' in the path

  // From your own description of yourself.
  role: '3rd-year Computer Science student at the University of Pittsburgh',

  // PLACEHOLDER: one sentence about what you build and why.
  tagline: 'Welcome! Here is a showcase of my work and interests in the tech space.',

  about: {
    // PLACEHOLDER: this sentence lights up word by word as visitors scroll.
    statement:
      'I am very passionate about technology and its application in solving real-world problems. I am most intereted in software development, engineering, and machine learning.',
    // PLACEHOLDER: short biography paragraphs.
    bio: [
      'I am currently working on several personal projects focused on building tools that can help students manage their own lives and improve their productivity.',
      'I also enjoy creating these websites and web applications with fun and interactive user interfaces.',
    ],
    // PLACEHOLDER: quick facts. Delete any row you do not want.
    facts: [
      { term: 'Based in', detail: 'Pittsburgh, PA' },
      { term: 'Studying', detail: 'Computer science at University of Pittsburgh' },
      { term: 'Currently', detail: 'Working on student-focused projects related to productivity and time management' },
    ],
  },

  /**
   * PLACEHOLDER projects (the four from portfolio.zip).
   * - `image`: a screenshot in /public, e.g. '/work/project-one.webp' (16:10 works best).
   *   Until then, `art` picks a generated visual: 'contour', 'orbit', 'lattice' or 'signal'.
   * - `links`: add { label: 'Live demo', href: 'https://…' } and/or { label: 'Source', href: 'https://github.com/…' }.
   *   Links with an empty href are shown as clearly marked placeholders, never as broken links.
   */
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
      id: 'triaging-model',
      title: 'Nemotron Triaging Model',
      year: 'Sept 2026',
      summary: 'Audits, judges, and evaluates the response of another model.',
      stack: ['Python', 'Nemotron', 'OpenAI API'],
      links: [{ label: 'GitHub', href: 'https://github.com/kyuhan28/nemotrontriagemodel' }],
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

  // PLACEHOLDER: your experience: jobs, internships, research, teaching, leadership. Newest first.
  // (portfolio.zip had no experience section, so these are new, empty stand-ins.)
  experience: [
    { period: '2026 – Present', title: 'Data Analytics Intern', org: 'JFCS Food Pantry', summary: 'Lead a price-benchmarking project comparing pantry item values to local supermarket prices to keep the database accurate.' },
    { period: '2025 – Present', title: 'Undergraduate Teaching Assistant', org: 'University of Pittsburgh', summary: 'Assisted in teaching/mentoring/explaining multiple courses for students.' },
    { period: '2025', title: 'Undergraduate Student Researcher', org: 'University of Pittsburgh', summary: 'Collaborated with PhD Students and a team in the medical field regarding Large Language Models on datasets.' },
  ],

  // PLACEHOLDER: organize these around your real strengths (from portfolio.zip's capabilities).
  skills: [
    { area: 'Languages', detail: 'Java, Python, C, JavaScript, TypeScript, HTML, CSS' },
    { area: 'Frameworks & Platforms', detail: 'Pandas, AWS, Anaconda, HuggingFace, OpenRouter, REST APIs, PyTorch', tools: ['AngularJS', 'ViteJS', 'VueJS'] },
    { area: 'Developer Tools', detail: 'Git, GitHub, Visual Studio Code, Jupyter Notebook, Docker' },
    { area: 'Libraries', detail: 'Pandas, NumPy, React, JSON' },
  ],

  contact: {
    // PLACEHOLDER: your email. Leave empty to show a clearly marked placeholder instead of a link.
    email: 'hankyumin05@gmail.com',
    // PLACEHOLDER: what you are open to.
    availability: 'I am open to full-time roles such as internships, research opportunities, and other positions.',
    // PLACEHOLDER: add URLs. Entries with an empty href render as labeled placeholders, not links.
    links: [
      { label: 'GitHub', href: 'https://github.com/kyuhan28' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyu-han-pitt2028/' },
      { label: 'Resume', href: 'https://docs.google.com/document/d/1QGBGVvxtz7eCeJxr-Lt-9xzPbM-4F4kc/edit?usp=sharing&ouid=104312216113214708123&rtpof=true&sd=true' },
    ],
  },

  // Time zone for the footer clock. 'America/New_York' follows daylight saving automatically.
  timezone: 'America/New_York',
}
