import { useState } from 'react'
import { site } from '../../content/site'


const withBase = (src) => (src.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src)


const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')






export default function Avatar() {
  const [failed, setFailed] = useState(false)
  const src = site.avatar && !failed ? withBase(site.avatar) : null
  return (
    <span className="nav__avatar" aria-hidden="true">
      {src ? (
        <img src={src} alt="" width="34" height="34" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="nav__avatar-initials">{initials(site.name)}</span>
      )}
    </span>
  )
}
