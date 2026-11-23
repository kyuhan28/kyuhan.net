export const experience = [
    {
    type: 'leadership',
    label: 'Creator/Developer',
    title: '@me',
    start: 'Oct 2026',
    end: 'Present',
    description: 'Built a chrome extension that can help with various tasks such as scheduling, reminders, and information retrieval. Currently being used by 6 users, including the Student Success Coordinator in School of Computing and Information at University of Pittsburgh.',
  },
  {
    type: 'employment',
    title: 'Undergraduate Teaching Assistant',
    org: 'University of Pittsburgh',
    start: '2025',
    end: 'Present',
    description: 'Assisted in teaching/mentoring/explaining multiple courses for students.',
  },
  {
    type: 'other',
    label: 'Research',
    title: 'Undergraduate Student Researcher',
    org: 'University of Pittsburgh',
    start: '2025',
    description: 'Collaborated with PhD Students and a team in the medical field regarding Large Language Models on datasets.',
  },
  {
    type: 'education',
    title: 'Computer Science, with a Business minor',
    org: 'University of Pittsburgh',
    location: 'Pittsburgh, PA',
    description: 'Attended for 2 years.',
  },
  {
    type: 'education',
    title: 'Computer Science',
    org: 'New York University',
    location: 'Manhattan, NY',
    description: '3rd-year Computer Science student at New York University.',
  },

]

export const datesOf = (e) => [e.start, e.end].filter(Boolean).join(' – ')
