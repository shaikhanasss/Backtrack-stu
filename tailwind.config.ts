import type { Config } from 'tailwindcss';
// ESM import, not require(): package.json sets "type": "module", so a
// require() call here throws "require is not defined" when Tailwind reloads
// its config and takes down the dev server.
import tailwindcssAnimate from 'tailwindcss-animate';

/**
 * BackTrack design system.
 *
 * The palette is lifted directly from the original prototype's App.css so the
 * product keeps its visual identity:
 *   - navy  #0f172a  ->  gradient start
 *   - blue  #2563eb  ->  gradient end
 *   - gold  #ffd700  ->  logo, buttons, links, progress fill
 *   - error #ff6b6b  ->  form errors
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Raw brand tokens (kept as literal hex for fidelity with the prototype)
        brand: {
          navy: '#0f172a',
          blue: '#2563eb',
          gold: '#ffd700',
          goldDark: '#e6c200',
          error: '#ff6b6b',
        },
        // shadcn/ui semantic tokens, driven by CSS variables in globals.css
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // The prototype used 20px cards and 30px pills
        card: '20px',
        pill: '30px',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0f172a, #2563eb)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 255, 255, 0.75)',
        'glow-gold': '0 0 24px rgba(255, 215, 0, 0.35)',
      },
      keyframes: {
        // Ported from the original `@keyframes fade`
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        // Deliberately short: entrance motion should be felt, not waited on.
        'fade-up': 'fade-up 0.4s ease-out',
        'fade-up-slow': 'fade-up 0.6s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
