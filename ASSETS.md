# Assets

## Built in code

Everything in the 3D desk scene and the environment outside its window is built in code: there are no
imported models, textures or images (no third-party assets, no licenses to track).

| Part | How it's made | File |
| --- | --- | --- |
| Desk, drawers, legs | Extruded rounded-rectangle profiles with beveled edges | `src/three/desk/deskScene.js` |
| Walnut (color, normal, roughness maps) | Painted procedurally on a canvas; normal and roughness derived from it | `deskScene.js` (`walnutMaps`) |
| Monitor and stand | Extruded panels and a bent-plate profile; the screen is its own plane | `deskScene.js` (`monitor`) |
| Keyboard | Wedge profile chassis, instanced keycaps on a real layout | `deskScene.js` (`keyboard`) |
| Mouse | Parametric shell, tube seams, cylinder wheel | `deskScene.js` (`mouse`) |
| Lamp, mug, notebook, candle, cup, tray | Lathes, tubes, extrusions, boxes | `deskScene.js` |
| Page edges (notebook) | Painted procedurally on a canvas | `deskScene.js` |
| The desktop's wallpaper (ink, with WELCOME) | Kokonut UI Ink Background (MIT), ported; a WebGL2 fluid simulation | `src/components/kokonutui/InkBackground.jsx`, `src/components/desktop/DesktopWallpaper.jsx` |
| The portfolio's background (a flowing ribbon of lines) | Kokonut UI Background Paths (MIT), ported; drawn on a 2D canvas | `src/components/kokonutui/BackgroundPaths.jsx`, `src/components/background/` |
| The studio behind the desk (gradient backdrop, glow) and its fading floor | A shader dome; a floor with a painted fade | `src/three/desk/studioBackdrop.js`, `deskScene.js` |

## If you add models later

Good free sources with clear licenses: [Poly Haven](https://polyhaven.com/) (models and textures,
all CC0). Put files under `public/models/` (served from the site itself, never hot-linked), load
them with `GLTFLoader` (already part of three.js), and add a row here with the source URL and license.
The keyboard, mouse, lamp and mug are the easiest to swap: each is built by its own function in
`deskScene.js`, positioned in one place.

## The desk model

`public/desk/little-office-desk.glb` is Kyu Han's own Blender model (`little-office.blend`), exported as glTF with Draco
geometry compression and WebP textures (the walnut's color, roughness and normal maps are from that file). It's loaded
by `src/three/desk/deskScene.js`; `public/draco/` holds the Draco decoder from three.js (MIT), which unpacks it.
