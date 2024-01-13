import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import execute from 'rollup-plugin-execute'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    execute([
      'VERSION=`monova` envsubst < manifest.template.firefox > public/manifest.json'
    ], {
      hook: 'writeBundle'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
