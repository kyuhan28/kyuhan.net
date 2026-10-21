import './scene.css'






export default function SceneFallback() {
  const base = import.meta.env.BASE_URL
  return (
    <picture className="scene-still" aria-hidden="true">
      <source media="(max-width: 899px)" srcSet={`${base}space/space-still-mobile.jpg`} />
      <img src={`${base}space/space-still-desktop.jpg`} alt="" decoding="async" fetchPriority="high" />
    </picture>
  )
}
