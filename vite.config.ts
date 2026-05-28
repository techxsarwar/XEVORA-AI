import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        // Marketing homepage — served at /
        homepage: path.resolve(__dirname, 'index.html'),
        // Xevora AI chat app — served at /studio/
        studio:   path.resolve(__dirname, 'studio/index.html'),
        // React code editor — served at /editor/
        editor:   path.resolve(__dirname, 'editor/index.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api/mulerouter': {
        target: 'https://api.mulerouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mulerouter/, '')
      }
    }
  }
});

