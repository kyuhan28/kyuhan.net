import { site } from '../../content/site'

/*
 * The About Me app. Your general information (name, role, tagline, avatar, statement, bio and facts) lives
 * in src/content/site.js, so it's the same everywhere; this file adds what's only for this app.
 *
 *   website     optional: a personal website, shown with your other links (GitHub, LinkedIn and Resume
 *               come from site.js `contact.links`). Links that aren't set are hidden.
 */
const linkTo = (label) => site.contact?.links?.find((l) => l.label.toLowerCase() === label)?.href || ''

export const about = {
  name: site.name,
  role: site.role,
  tagline: site.tagline,
  avatar: site.avatar,
  statement: site.about?.statement,
  bio: site.about?.bio ?? [],
  facts: site.about?.facts ?? [],
  links: {
    github: linkTo('github'),
    linkedin: linkTo('linkedin'),
    resume: linkTo('resume'),
    website: '', // e.g. 'https://kyuhan.net'
  },
}
