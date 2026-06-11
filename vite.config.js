import { defineConfig } from 'vite';

// Vite transforms JSX with esbuild. Setting the automatic runtime means JSX
// compiles to react/jsx-runtime imports instead of React.createElement calls,
// so components do not need a global `React` variable to render.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
});
