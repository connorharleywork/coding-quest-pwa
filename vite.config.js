import { defineConfig } from 'vite';

// GitHub Pages serves this repository as a project page at
// /coding-quest-pwa/. Keep Vite dev on / so local development stays simple,
// then use the project base path only for production builds.
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/coding-quest-pwa/',
  esbuild: {
    jsx: 'automatic',
  },
}));
