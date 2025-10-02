/**
 * PostCSS configuration for Vite (CommonJS).
 *
 * We configure PostCSS to use Tailwind CSS and Autoprefixer to ensure
 * compatibility across different browsers.  Vite will automatically
 * recognise this config when building the project.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};