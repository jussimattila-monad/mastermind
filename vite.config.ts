import { defineConfig } from 'vite';
import aurelia from '@aurelia/vite-plugin';

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves the app from https://<user>.github.io/mastermind/;
  // PR previews set BASE_PATH to their own subdirectory. `vite preview` serves the build there too.
  base: command === 'build' || isPreview ? (process.env.BASE_PATH ?? '/mastermind/') : '/',
  // Fixed ports fail rather than move when taken, so e2e never tests another app on 9000
  server: {
    open: !process.env.CI,
    port: 9000,
    strictPort: true,
  },
  preview: {
    port: 9001,
    strictPort: true,
  },
  plugins: [
    aurelia({
      // Aurelia's dev build has better error messages; keep it out of production
      useDev: command === 'serve',
    }),
  ],
}));
