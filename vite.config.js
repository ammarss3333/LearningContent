import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
//
// The base option must be set to the repository name when deploying
// to GitHub Pages.  Replace 'LearningContent' with your actual repo
// name if it differs.  This ensures that assets are resolved
// relative to the correct base path.
export default defineConfig({
  plugins: [react()],
  base: '/LearningContent/',
});