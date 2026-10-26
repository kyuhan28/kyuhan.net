import { site } from '../../content/site'

export const contact = {
  email: site.contact?.email || '',
  availability: site.contact?.availability || '',
  links: site.contact?.links ?? [],
}
