import { defineConfig } from 'vite';

export default defineConfig({
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
