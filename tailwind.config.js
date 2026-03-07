/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			DEFAULT: '12px',
  			sm: '8px',
  			md: '12px',
  			lg: '16px',
  			xl: '20px',
  			'2xl': '24px',
  			'3xl': '32px',
  			full: '9999px'
  		},
  		colors: {
  			primary: {
  				'50': '#f0f9ff',
  				'100': '#e0f2fe',
  				'200': '#bae6fd',
  				'300': '#7dd3fc',
  				'400': '#38bdf8',
  				'500': '#0ea5e9',
  				'600': '#0284c7',
  				'700': '#0369a1',
  				'800': '#075985',
  				'900': '#0c4a6e',
  				DEFAULT: '#0284c7',
  				foreground: '#ffffff'
  			},
  			gray: {
  				'50': '#fafafa',
  				'100': '#f5f5f5',
  				'200': '#e5e5e5',
  				'300': '#d4d4d4',
  				'400': '#a3a3a3',
  				'500': '#737373',
  				'600': '#525252',
  				'700': '#404040',
  				'800': '#262626',
  				'900': '#171717'
  			},
  			success: '#22c55e',
  			warning: '#f59e0b',
  			danger: '#ef4444',
  			info: '#3b82f6',
  			background: '#f4f5f9',
  			foreground: '#1f2937',
  			card: {
  				DEFAULT: '#ffffff',
  				foreground: '#0f172a'
  			},
  			border: '#e2e8f0',
  			input: '#e2e8f0',
  			ring: '#14b8a6',
  			muted: {
  				DEFAULT: '#f5f5f5',
  				foreground: '#737373'
  			},
  			accent: {
  				DEFAULT: '#f5f5f5',
  				foreground: '#0f172a'
  			},
  			destructive: {
  				DEFAULT: '#ef4444',
  				foreground: '#ffffff'
  			},
  			popover: {
  				DEFAULT: '#ffffff',
  				foreground: '#0f172a'
  			},
  			secondary: {
  				DEFAULT: '#f5f5f5',
  				foreground: '#0f172a'
  			},
  			chart: {
  				'1': '#14b8a6',
  				'2': '#3b82f6',
  				'3': '#22c55e',
  				'4': '#f59e0b',
  				'5': '#ef4444'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		boxShadow: {
  			xs: '0 1px 2px rgba(0,0,0,0.03)',
  			sm: '0 2px 4px rgba(0,0,0,0.04)',
  			card: '0 2px 8px rgba(0,0,0,0.05)',
  			md: '0 4px 12px rgba(0,0,0,0.06)',
  			hover: '0 4px 16px rgba(0,0,0,0.08)',
  			lg: '0 8px 20px rgba(0,0,0,0.07)',
  			xl: '0 12px 28px rgba(0,0,0,0.08)',
  			modal: '0 16px 48px rgba(0,0,0,0.10)',
  			sidebar: '2px 0 8px rgba(0,0,0,0.04)'
  		},
  		keyframes: {
  			shimmer: {
  				'0%': {
  					backgroundPosition: '200% 0'
  				},
  				'100%': {
  					backgroundPosition: '-200% 0'
  				}
  			},
  			fadeIn: {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideRight: {
  				from: {
  					transform: 'translateX(100%)'
  				},
  				to: {
  					transform: 'translateX(0)'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			shimmer: 'shimmer 1.5s infinite',
  			'fade-in': 'fadeIn 200ms ease-out',
  			fadeIn: 'fadeIn 200ms ease-out',
  			'slide-up': 'slideUp 200ms ease-out',
  			'slide-right': 'slideRight 250ms ease-out',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};
