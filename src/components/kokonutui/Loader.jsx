/**
 * Loader, from Kokonut UI (https://kokonutui.com), MIT License.
 * @author @dorianbaffier · https://github.com/kokonut-labs/kokonutui
 *
 * Four concentric rings (conic gradients cut into thin bands) spinning at different speeds, one in
 * reverse, with a title and subtitle announced to screen readers. The rings take the text color
 * (currentColor), so one `color` restyles the whole loader. With reduced motion, they pulse instead.
 *
 * Ported for this project: the same rings, gradients, masks, speeds and props, written in JavaScript
 * with plain CSS (loader.css) instead of Tailwind.
 *
 * Props: title, subtitle (an empty string shows the title alone), size ('sm' | 'md' | 'lg'),
 *        className, and any other <div> props.
 */
import './loader.css'

const ringMask = (stops) => `radial-gradient(circle at 50% 50%, ${stops})`

const RINGS = [
  {
    id: 'outer',
    style: {
      background: 'conic-gradient(from 0deg, transparent 0deg, currentColor 90deg, transparent 180deg)',
      mask: ringMask('transparent 35%, black 37%, black 39%, transparent 41%'),
      WebkitMask: ringMask('transparent 35%, black 37%, black 39%, transparent 41%'),
      opacity: 0.8,
      animationDuration: '3s',
    },
  },
  {
    id: 'primary',
    style: {
      background: 'conic-gradient(from 0deg, transparent 0deg, currentColor 120deg, color-mix(in srgb, currentColor 50%, transparent) 240deg, transparent 360deg)',
      mask: ringMask('transparent 42%, black 44%, black 48%, transparent 50%'),
      WebkitMask: ringMask('transparent 42%, black 44%, black 48%, transparent 50%'),
      opacity: 0.9,
      animationDuration: '1.2s',
    },
  },
  {
    id: 'counter',
    style: {
      background: 'conic-gradient(from 180deg, transparent 0deg, color-mix(in srgb, currentColor 60%, transparent) 45deg, transparent 90deg)',
      mask: ringMask('transparent 52%, black 54%, black 56%, transparent 58%'),
      WebkitMask: ringMask('transparent 52%, black 54%, black 56%, transparent 58%'),
      opacity: 0.35,
      animationDuration: '4s',
      animationDirection: 'reverse',
    },
  },
  {
    id: 'accent',
    style: {
      background: 'conic-gradient(from 270deg, transparent 0deg, color-mix(in srgb, currentColor 40%, transparent) 20deg, transparent 40deg)',
      mask: ringMask('transparent 61%, black 62%, black 63%, transparent 64%'),
      WebkitMask: ringMask('transparent 61%, black 62%, black 63%, transparent 64%'),
      opacity: 0.5,
      animationDuration: '3.5s',
    },
  },
]

export default function Loader({
  title = 'Configuring your account...',
  subtitle = 'Please wait while we prepare everything for you',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <div className={`kl kl--${size} ${className}`.trim()} {...props}>
      <div aria-hidden="true" className="kl__rings">
        {RINGS.map((ring) => <div className="kl__ring" key={ring.id} style={ring.style} />)}
      </div>
      <output aria-live="polite" className="kl__text">
        <span className="kl__title">{title}</span>
        {subtitle && <span className="kl__subtitle">{subtitle}</span>}
      </output>
    </div>
  )
}
