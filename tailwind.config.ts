import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#111318',
        bgSecondary: '#1A1D22',
        textPrimary: '#F4F6F8',
        textMuted: '#8A9099',
        focusBlue: '#3A7BFF',
        mintAccent: '#7FE3C3',
        sandAccent: '#D7C8A8',
        borderNeutral: '#2B2F36',
        error: '#FF6B6B',
        success: '#4FD1A5',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        accent: ['var(--font-accent)', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        button: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
