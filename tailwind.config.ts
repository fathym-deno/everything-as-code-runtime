import { type Config } from 'tailwindcss';
import * as colors from 'tailwindcss/colors.js';
import unimportant from 'tailwindcss/unimportant';

export default {
  content: [],
  plugins: [unimportant],
  theme: {
    extend: {
      animation: {
        progress: 'progress 1s infinite linear',
      },
      backgroundImage: {
        'hero-pattern':
          "linear-gradient(rgba(0, 0, 40, 0.90),rgba(0, 0, 40, 0.90)), url('/assets/backgrounds/abstract.jpg')",
      },
      dropShadow: {
        md: ['0 20px 13px rgb(0 0 0 / 0.15)', '0 8px 5px rgb(0 0 0 / 0.4)'],
        lg: ['0 20px 13px rgb(0 0 0 / 0.3)', '0 8px 5px rgb(0 0 0 / 0.8)'],
      },
      boxShadow: {
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.5)',
      },
      color: {
        primary: '#4a918e',
        secondary: '#4a918e',
        tertiary: '#4a918e',
        info: colors.blue,
        error: colors.red,
        warning: colors.yellow,
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
        mont: ['Montserrat', 'sans-serif'],
        nun: ['Nunito', 'sans-serif'],
      },
      keyframes: {
        progress: {
          '0%': { transform: ' translateX(0) scaleX(0)' },
          '40%': { transform: 'translateX(0) scaleX(0.4)' },
          '100%': { transform: 'translateX(100%) scaleX(0.5)' },
        },
      },
      transformOrigin: {
        'left-right': '0% 50%',
      },
    },
  },
} satisfies Config;
