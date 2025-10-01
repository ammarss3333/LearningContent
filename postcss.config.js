/**
 * PostCSS configuration for Vite.
 *
 * We configure PostCSS to use Tailwind CSS and Autoprefixer to ensure
 * compatibility across different browsers.  Vite will automatically
 * recognise this config when building the project.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};