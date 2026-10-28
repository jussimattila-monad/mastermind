import { defineConfig } from 'vite';
import aurelia from '@aurelia/vite-plugin';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from https://<user>.github.io/mastermind/;
  // PR previews set BASE_PATH to their own subdirectory
  base: command === 'build' ? (process.env.BASE_PATH ?? '/mastermind/') : '/',
  server: {
    open: !process.env.CI,
    port: 9000,
  },
  esbuild: {
    target: 'es2022'
  },
  plugins: [
    aurelia({
      // Aurelia's dev build has better error messages; keep it out of production
      useDev: command === 'serve',
    }),
  ],
}));
