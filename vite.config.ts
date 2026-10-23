import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import aurelia from '@aurelia/vite-plugin';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from https://<user>.github.io/mastermind/
  base: command === 'build' ? '/mastermind/' : '/',
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
    nodePolyfills(),
  ],
}));
