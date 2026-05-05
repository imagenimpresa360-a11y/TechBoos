import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'gym-platform'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
})
