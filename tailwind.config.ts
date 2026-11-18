import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#15803d',
          'green-light': '#f0fdf4',
          'green-mid': '#dcfce7',
          orange: '#ea580c',
          'orange-light': '#fff7ed',
        },
      },
    },
  },
  plugins: [],
}
export default config
