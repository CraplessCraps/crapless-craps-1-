import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  // If building for production, check if we are in GitHub Actions or default to relative path for APK
  const isBuild = command === 'build';
  
  return {
    // Relative base path './' works universally across Web, GitHub Pages (any repo name), and Capacitor APK/AAB
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : undefined,
    },
  };
});
