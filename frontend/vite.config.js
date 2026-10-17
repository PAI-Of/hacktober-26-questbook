import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/groups': 'http://localhost:3000',
      '/quests': 'http://localhost:3000',
      '/adopted': 'http://localhost:3000',
      '/completions': 'http://localhost:3000',
      '/leaderboard': 'http://localhost:3000'
    }
  }
})
