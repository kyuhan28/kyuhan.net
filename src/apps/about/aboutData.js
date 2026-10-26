import { site } from '../../content/site'

const linkTo = (label) => site.contact?.links?.find((l) => l.label.toLowerCase() === label)?.href || ''

export const about = {
  name: site.name,
  role: site.role,
  tagline: site.tagline,
  avatar: site.avatar,
  statement: site.about?.statement,
  bio: site.about?.bio ?? [],
  ps: site.about?.ps ?? [],
  facts: site.about?.facts ?? [],
  links: {
    github: linkTo('github'),
    linkedin: linkTo('linkedin'),
    resume: linkTo('resume'),
    website: '',
  },
}
