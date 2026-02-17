/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F59E0B',
          50: '#FEF3C7',
          100: '#FDE68A',
          200: '#FCD34D',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03'
        },
        success: {
          DEFAULT: '#10B981',
          50: '#D1FAE5',
          100: '#A7F3D0',
          200: '#6EE7B7',
          300: '#34D399',
          400: '#10B981',
          500: '#059669',
          600: '#047857',
          700: '#065F46',
          800: '#064E3B',
          900: '#022C22'
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEE2E2',
          100: '#FECACA',
          200: '#FCA5A5',
          300: '#F87171',
          400: '#EF4444',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A'
        },
        neutral: {
          DEFAULT: '#6B7280',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        }
      },
      spacing: {
        touch: '44px', // Minimum touch target size (Apple HIG)
        'touch-lg': '56px' // Large button size
      },
      fontSize: {
        base: ['16px', '24px'], // Prevents iOS zoom on focus
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['28px', '36px'],
        '3xl': ['32px', '40px']
      },
      screens: {
        xs: '375px', // iPhone SE
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      },
      maxWidth: {
        mobile: '640px' // Max width for mobile-first layouts
      },
      boxShadow: {
        'touch': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
      }
    }
  },
  plugins: []
};
