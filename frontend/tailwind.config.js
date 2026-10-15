/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F5F6F8',
        surface: '#FFFFFF',
        ink: '#1C2230',
        muted: '#5B6475',
        line: '#DCE0E7',
        accent: {
          DEFAULT: '#2F4BD0',
          hover: '#243ca8',
          subtle: '#eef2ff',
        },
        status: {
          open: '#1F7A4D',
          filling: '#A15C07',
          full: '#B42318',
        }
      },
      fontFamily: {
        serif: ['"Newsreader Variable"', 'Newsreader', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        control: '6px',
        container: '10px',
      }
    },
  },
  plugins: [],
}
