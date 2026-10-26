// Your general portfolio information: used by the desktop's apps (About Me, Contact), the intro, and the
// sticky notes. Projects, experience and skills have their own files (see below).
export const site = {
  name: 'Kyu Han',
  nameLines: ['Kyu Han'],

  avatar: '/work/pfp.jpeg',


  role: '3rd-year Computer Science student at the University of Pittsburgh',

  tagline: 'Hi! I’m Kyu Han, and welcome to my Portfolio.',

  about: {
    statement:
      'I’m interested in the whole journey of building software, from understanding a problem to shipping a solution. Software engineering, development, and machine learning are where I spend most of my time and curiosity. I enjoy learning new tech and frameworks and applying them to my upcoming projects. So far, this portfolio website is my most recent project that I have built with NEW frameworks, such as Three.js and KokonutUI! The 3D models are built with Blender.',
    bio: [
      'I also enjoy creating these websites and web applications with fun and interactive user interfaces.',
      'P.S, the background is a reactive Ink effect that responds to your mouse or touch movements. Click and drag around to see the ink!',
      'The sticky notes on the monitor too? They are also interactive and react to your mouse or touch movements, but not as cool.',
      'Credits given to KokonutUI for the ink effect, sticky notes, and immersive wallpapers!',
    ],
    facts: [
      { term: 'Based in', detail: 'Pittsburgh, PA' },
      { term: 'Studying', detail: 'Computer Science and Business minor' },
      { term: 'Currently', detail: 'Learning and developing database-driven web applications focused on improving student life.' },
    ],
  },

  // Projects, experience and skills each have their own file now (the desktop's apps, and the classic page,
  // read them): src/apps/projects/projectsData.js, src/apps/experience/experienceData.js,
  // src/apps/skills/skillsData.js.

  contact: {
    email: 'hankyumin05@gmail.com',
    availability: 'I am open to any opportunities, collaborations, or small coffee chats!',
    links: [
      { label: 'GitHub', href: 'https://github.com/kyuhan28' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyu-han-pitt2028/' },
      { label: 'Resume', href: 'https://docs.google.com/document/d/1QGBGVvxtz7eCeJxr-Lt-9xzPbM-4F4kc/edit?usp=sharing&ouid=104312216113214708123&rtpof=true&sd=true' },
    ],
  },

  timezone: 'America/New_York',

  // The sticky notes on the 3D monitor, left to right: yellow, blue, pink, green. Keep them short (a few
  // words); each wraps and shrinks to fit its note. '\n' starts a new line; '' leaves a note blank.
  stickyNotes: ['don’t break anything', 'stay cool', 'git push and commit', 'be confident'],
}
