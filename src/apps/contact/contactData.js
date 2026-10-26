import { site } from '../../content/site'

/* The Contact app: your email, availability line and links, all from src/content/site.js (`contact`). */
export const contact = {
  email: site.contact?.email || '',
  availability: site.contact?.availability || '',
  links: site.contact?.links ?? [], // [{ label, href }]
}
