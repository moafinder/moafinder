// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Make the React plugin run on both .js and .jsx files
      include: [/\.jsx?$/],
    }),
  ],

  // Ensure JSX transform uses the automatic runtime (no need to import React)
  esbuild: {
    jsx: 'automatic',
  },

  // During dependency optimization and any esbuild passes,
  // force .js files to be parsed as JSX.
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
