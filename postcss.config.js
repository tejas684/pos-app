/**
 * ============================================================================
 * POSTCSS CONFIGURATION (postcss.config.js)
 * ============================================================================
 * 
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * 
 * Configuration:
 * - tailwindcss: Processes Tailwind CSS directives (@tailwind, @apply, etc.)
 * - autoprefixer: Automatically adds vendor prefixes to CSS properties
 * 
 * How it works:
 * 1. Tailwind CSS scans your files for class names
 * 2. Generates CSS based on used classes
 * 3. Autoprefixer adds vendor prefixes (e.g., -webkit-, -moz-)
 * 4. Final CSS is optimized and minified
 * 
 * This configuration is required for Tailwind CSS to work with Next.js.
 */

module.exports = {
  plugins: {
    tailwindcss: {}, // Process Tailwind CSS directives
    autoprefixer: {}, // Add vendor prefixes automatically
  },
}
