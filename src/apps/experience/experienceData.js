/*
 * Your experience, shown by the Experience app (and the classic portfolio page), newest first. To add an
 * entry, copy one and edit it; only `title` and `org` are required, and any field you leave out is hidden.
 *
 *   type             'employment' | 'internship' | 'education' | 'leadership' | 'other'
 *   label            optional: what to call the type instead (e.g. 'Research')
 *   title            the position (or, for education, what you're studying)
 *   org              the organization
 *   location         optional
 *   start, end       optional: any text, e.g. '2025', 'May 2024'; end can be 'Present'
 *   description      optional: a sentence or two
 *   responsibilities optional: a list
 *   accomplishments  optional: a list
 *   logo             optional: an image, e.g. '/work/pitt.png' in public/work
 *   links            optional: [{ label: 'Website', href: 'https://...' }]
 */
export const experience = [
  {
    type: 'education',
    title: 'Computer Science and Business',
    org: 'University of Pittsburgh',
    end: 'Expected May 2028',
    location: 'Pittsburgh, PA',
    description: '3rd-year Computer Science student.',
  },
  {
    type: 'employment',
    title: 'Undergraduate Teaching Assistant',
    org: 'University of Pittsburgh',
    start: '2025',
    end: 'Present',
    description: 'Host two open class labs for students to learn Python programming, topics, and ideas.',
    responsibilities: [
      'Teaching 40+ students about topics in programming, data structures, and algorithms.',
      'Host two open class labs for students to learn Python programming.',
      'Hold 6 hours of weekly office hours',
    ],
  },
  {
    type: 'other',
    label: 'Research',
    title: 'Undergraduate Student Researcher',
    org: 'University of Pittsburgh',
    start: '2025',
    description: 'Collaborated with PhD Students and a team in the medical field regarding Large Language Models on datasets.',
    responsibilities: [
      'Analyzed 23,556 saved inference records across four temperature settings using ROUGE-L precision and recall to investigate how sampling temperature affects model responses.',    ],
  },

  // Templates for other kinds of entry: copy one above this line and fill it in. (These are examples
  // only, not shown on your site.)
  // { type: 'internship', title: 'Software Engineering Intern', org: 'Company name', location: 'City, ST',
  //   start: 'May 2027', end: 'Aug 2027', description: 'What the team does and what you worked on.',
  //   accomplishments: ['Something you shipped, and its effect'] },
  // { type: 'leadership', title: 'Role', org: 'Club or organization', start: '2026', end: 'Present',
  //   responsibilities: ['What you led or organized'] },
]

/** An entry's dates as one line ('2025 – Present'), or '' if it has none. */
export const datesOf = (e) => [e.start, e.end].filter(Boolean).join(' – ')
