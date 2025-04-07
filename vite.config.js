import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",  // This now loads directly from the root URL
  plugins: [react()],
})
