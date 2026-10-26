export const experience = [
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
    description: '3rd-year Computer Science student.',
  },

]

export const datesOf = (e) => [e.start, e.end].filter(Boolean).join(' – ')
