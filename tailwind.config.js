/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Make Sora the default sans-serif across the app
    fontFamily: {
      sans: ['Sora', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7CB92C', // primary green
          dark: '#5a8b20',    // darker hover shade from your spec
        },
      },
    },
  },
  plugins: [],
};
