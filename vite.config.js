import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/web5/',   // ⬅️ GitHub Pages 하위 경로 설정!!!
})
