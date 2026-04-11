import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',

  // 👇 关键：禁用 Rolldown，换回稳定的 Esbuild
  build: {
    outDir: 'dist',
    rollupOptions: {},
  },
  experimental: {
    // 关闭不稳定的新打包器
    buildWithRolldown: false
  }
})