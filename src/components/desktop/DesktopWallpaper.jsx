import InkBackground from '../kokonutui/InkBackground'

/*
 * The desktop's wallpaper: SUPER SECRET PORTFOLIO written in white ink.
 * Stir the letters and they gather again in white. Click or drag to add rainbow-colored ink.
 *
 * The component always sets its headline at 40% of its own height, so the wallpaper is made taller than the
 * desktop and reaches below it (clipped by the desktop): that puts the headline in the middle of the desktop,
 * while the ink still fills all of it.
 */
export default function DesktopWallpaper() {
  return (
    <div className="os-wallpaper" aria-hidden="true">
      <InkBackground text="SUPER SECRET" headlineColor="#ffffff" rainbow className="os-ink">{null}</InkBackground>
    </div>
  )
}
