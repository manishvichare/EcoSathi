/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ====== COLORS ====== */
      colors: {
        /* Forest Green - Primary */
        forest: {
          50: '#f0f9f5',
          100: '#e1f2ea',
          200: '#c3e5d4',
          300: '#a4d8bf',
          400: '#86cba9',
          500: '#68be93',
          600: '#4a9b72',
          700: '#2d8657',
          800: '#1f6145',
          900: '#0f4c23',
        },

        /* Eco Green - Secondary */
        eco: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },

        /* Teal - Accent */
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#7dd3c0',
          400: '#14b8a6',
          500: '#0d9488',
          600: '#0d7377',
          700: '#0a5d5d',
          800: '#084747',
          900: '#093E3E',
        },

        /* Aliases for legacy & modern compatibility */
        primary: {
          50: '#f0f9f5',
          100: '#e1f2ea',
          200: '#c3e5d4',
          300: '#a4d8bf',
          400: '#86cba9',
          500: '#2d9659',
          600: '#1b6b3a',
          700: '#0f4c23',
          800: '#1f6145',
          900: '#0f4c23',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#7dd3c0',
          400: '#14b8a6',
          500: '#0d9488',
          600: '#0d7377',
          700: '#0a5d5d',
          800: '#084747',
          900: '#093E3E',
        },

        /* Off-White Background */
        'off-white': '#fafaf8',

        /* Grays */
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },

      /* ====== TYPOGRAPHY ====== */
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
      },

      fontWeight: {
        thin: 100,
        extralight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      },

      lineHeight: {
        tight: '1.2',
        normal: '1.5',
        relaxed: '1.75',
      },

      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      /* ====== SPACING ====== */
      spacing: {
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
      },

      /* ====== BORDER RADIUS ====== */
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        full: '9999px',
      },

      /* ====== BOX SHADOWS ====== */
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'none': 'none',
        'soft': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'premium': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },

      /* ====== TRANSITIONS & ANIMATIONS ====== */
      transitionDuration: {
        150: '150ms',
        300: '300ms',
        500: '500ms',
      },

      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      animation: {
        fadeIn: 'fadeIn 600ms ease-out',
        slideUp: 'slideUp 600ms ease-out',
        slideInLeft: 'slideInLeft 600ms ease-out',
        slideInRight: 'slideInRight 600ms ease-out',
        scaleIn: 'scaleIn 400ms ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
      },

      /* ====== GRADIENTS ====== */
      backgroundImage: {
        'gradient-forest': 'linear-gradient(135deg, #1b6b3a 0%, #2d9659 100%)',
        'gradient-eco': 'linear-gradient(135deg, #2d9659 0%, #22c55e 100%)',
        'gradient-teal': 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      },

      /* ====== OPACITY ====== */
      opacity: {
        0: '0',
        5: '0.05',
        10: '0.1',
        20: '0.2',
        30: '0.3',
        40: '0.4',
        50: '0.5',
        60: '0.6',
        70: '0.7',
        75: '0.75',
        80: '0.8',
        90: '0.9',
        95: '0.95',
        100: '1',
      },

      /* ====== Z-INDEX ====== */
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        auto: 'auto',
      },

      /* ====== GAP ====== */
      gap: {
        'premium': '2rem',
        'premium-sm': '1.5rem',
      },

      /* ====== MAX WIDTH ====== */
      maxWidth: {
        'prose': '65ch',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
      },
    },
  },

  plugins: [],
};