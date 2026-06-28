import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the static build works both on GitHub Pages (project page)
// and when served from any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
})
