import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy para a API de Push do Expo — contorna CORS no browser
      '/api/push': {
        target: 'https://exp.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/push/, '/--/api/v2/push/send'),
        secure: true,
      },
    },
  },
})
