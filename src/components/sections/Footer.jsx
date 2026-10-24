import { useEffect, useState } from 'react'
import { site } from '../../content/site'
import './footer.css'

function useLocalTime(timeZone) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  try {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone, timeZoneName: 'short' }).format(now)
  } catch {
    return null
  }
}

export default function Footer() {
  const time = useLocalTime(site.timezone)
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>© {new Date().getFullYear()} {site.name}</p>
        {time && <p className="footer__time">My local time is {time}</p>}
        <p className="footer__credit">Built with React, Three.js, Anime.js and Kokonutui</p>
        <a href="#top" className="footer__top" onClick={() => window.dispatchEvent(new Event('space-replay'))}>Back to the beginning</a>
      </div>
    </footer>
  )
}
