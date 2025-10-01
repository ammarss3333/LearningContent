/**
 * Tailwind CSS configuration file.
 *
 * We instruct Tailwind to scan our HTML and all JS files under src/
 * so that unused classes are removed from the production build.  We also
 * extend the default colour palette with custom primary and secondary
 * colours used throughout the exam platform.
 */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',
        secondary: '#f59e0b',
      },
    },
  },
  plugins: [],
};