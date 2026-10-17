import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base: the built site works at any address, including
  // https://<username>.github.io/<any-repo-name>/ on GitHub Pages.
  // The site uses in-page #anchors only (no client-side routes), so this is safe.
  base: './',
})
