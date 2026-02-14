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
        allow: {
          DEFAULT: '#16a34a',
          light: '#dcfce7',
        },
        warn: {
          DEFAULT: '#d97706',
          light: '#fef3c7',
        },
        block: {
          DEFAULT: '#dc2626',
          light: '#fee2e2',
        },
      },
    },
  },
  plugins: [],
}
export default config
