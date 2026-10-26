import BackgroundPaths from '../kokonutui/BackgroundPaths'
import './portfolio-background.css'

/*
 * The portfolio's background: Kokonut UI's Background Paths, a ribbon of fine lines flowing slowly
 * across a near-black field, fixed behind all the content (it never takes the pointer).
 *
 *   count  how many lines (shared across three depth layers)
 *   angle  the ribbon's tilt, in degrees
 *   speed  how fast it flows (0 holds it still); calmer than the default
 *   interactive  on: the lines part around the cursor and close behind it. The component hears the
 *          cursor across the whole page (over the content too, and on the 3D monitor), and the
 *          background itself never takes clicks or scrolling
 * Colors are in portfolio-background.css: the field's color and the lines' (they take the text color).
 */
export default function PortfolioBackground() {
  return (
    <div className="pf-bg" aria-hidden="true">
      <BackgroundPaths className="pf-bg__paths" count={42} angle={-8} speed={0.7} interactive>
        {null}
      </BackgroundPaths>
    </div>
  )
}
