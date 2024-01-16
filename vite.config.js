import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import execute from 'rollup-plugin-execute'
import copy from 'rollup-plugin-copy-watch'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    execute([
      'VERSION=`monova` envsubst < manifest.template.firefox > dist/manifest.json'
    ], {
      hook: 'writeBundle'
    }),
    copy({
      watch: process.argv.includes('--watch') ? 'public' : undefined,
      targets: [
        { src: 'public/*', dest: 'dist' }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
