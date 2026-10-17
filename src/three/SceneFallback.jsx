import './scene.css'

/*
 * A still of the space, rendered from the real scene. It's what visitors see the
 * instant the page opens (the live scene fades in over the same frame), and what
 * devices without WebGL keep. Re-render it if you change the look (see README).
 */
export default function SceneFallback() {
  const base = import.meta.env.BASE_URL
  return (
    <picture className="scene-still" aria-hidden="true">
      <source media="(max-width: 899px)" srcSet={`${base}space/space-still-mobile.jpg`} />
      <img src={`${base}space/space-still-desktop.jpg`} alt="" decoding="async" fetchPriority="high" />
    </picture>
  )
}
