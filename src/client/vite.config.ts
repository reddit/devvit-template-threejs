import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        splash: 'splash/splash.html',
        game: 'game/game.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        sourcemapFileNames: '[name].js.map',
      },
    },
  },
});
