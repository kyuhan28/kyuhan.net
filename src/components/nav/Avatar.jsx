import { useState } from 'react'
import { site } from '../../content/site'

// '/avatar.jpg' in site.js means public/avatar.jpg; prefix the deploy base (e.g. a GitHub Pages subpath).
const withBase = (src) => (src.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src)

// "Your Name" -> "YN"
const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

/**
 * The round profile picture beside your name in the header. Shows the photo set in
 * site.js (`avatar`), or your initials until there is one, or if the photo can't load.
 * Decorative: the link around it already says your name.
 */
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
