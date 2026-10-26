import InkBackground from '../kokonutui/InkBackground'

export default function DesktopWallpaper() {
  return (
    <div className="os-wallpaper" aria-hidden="true">
      <InkBackground text="WELCOME" accent="#9fb4ff" rainbow className="os-ink">{null}</InkBackground>
    </div>
  )
}
