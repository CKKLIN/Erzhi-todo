import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  root: 'src/editor',
  base: './',
  build: {
    outDir: '../../dist-editor',
    emptyOutDir: true,
  },
})
