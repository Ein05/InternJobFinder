import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Đổi thành '/' khi dùng custom domain (internjobfinder.me)
  // Đổi lại '/InternJobFinder/' nếu dùng github.io/InternJobFinder
  base: '/',
})
