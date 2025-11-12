import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  prefix: 'tw-',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#b91c1c',
          brown: '#7c4a2d',
          cream: '#f7f0e8',
          charcoal: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  }
}

export default config

