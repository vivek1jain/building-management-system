/**
 * Design Token System
 * 
 * Centralized design tokens for consistent UI across the Building Management System
 * These tokens define colors, typography, spacing, and other design values.
 * Supports theme customization and persistence.
 */

// Theme preset definitions
export interface ThemePreset {
  id: string
  name: string
  colors: typeof baseColors
}

// Base color definitions
const baseColors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  
  // Success Colors (Green)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // Warning Colors (Amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Danger/Error Colors (Red)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  
  // Neutral Colors (Gray)
  neutral: {
    0: '#ffffff',
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
    950: '#030712',
  },
  
  // Info Colors (Blue)
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
} as const

// Predefined theme presets
export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default Blue',
    colors: baseColors,
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    colors: {
      ...baseColors,
      primary: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        950: '#022c22',
      },
    },
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    colors: {
      ...baseColors,
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764',
      },
    },
  },
  {
    id: 'orange',
    name: 'Vibrant Orange',
    colors: {
      ...baseColors,
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
        950: '#431407',
      },
    },
  },
]

export const tokens = {
  // Color Palette
  colors: baseColors,

  // Typography System
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
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
      '5xl': ['3rem', { lineHeight: '1' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
    },
  },

  // Spacing System
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadow System
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // Component-specific tokens
  components: {
    button: {
      borderRadius: '0.375rem',
      fontWeight: '500',
      fontSize: '0.875rem',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      
      sizes: {
        sm: {
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          iconSize: '0.875rem',
        },
        md: {
          padding: '0.625rem 1rem',
          fontSize: '0.875rem',
          iconSize: '1rem',
        },
        lg: {
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          iconSize: '1.125rem',
        },
      },
    },
    
    input: {
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      padding: '0.625rem 0.875rem',
      border: '1px solid',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    
    modal: {
      borderRadius: '0.75rem',
      padding: '1.5rem',
      backdropBlur: '8px',
    },
    
    table: {
      borderRadius: '0.5rem',
      cellPadding: '0.75rem',
      headerPadding: '1rem 0.75rem',
    },

    card: {
      borderRadius: '0.5rem',
      padding: '1.5rem',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },
  },

  // Animation & Transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const

// Helper functions for easy token access
export const getColor = (path: string) => {
  const keys = path.split('.')
  let value: any = tokens.colors
  for (const key of keys) {
    value = value?.[key]
  }
  return value
}

export const getSpacing = (value: keyof typeof tokens.spacing) => {
  return tokens.spacing[value]
}

export const getFontSize = (size: keyof typeof tokens.typography.fontSize) => {
  return tokens.typography.fontSize[size]
}

// Theme Management
export class ThemeManager {
  private static readonly STORAGE_KEY = 'building-mgmt-theme'
  private currentTheme: ThemePreset
  
  constructor() {
    this.currentTheme = this.loadThemeFromStorage()
  }
  
  // Load theme from localStorage or default
  private loadThemeFromStorage(): ThemePreset {
    try {
      const stored = localStorage.getItem(ThemeManager.STORAGE_KEY)
      if (stored) {
        const themeData = JSON.parse(stored)
        // Validate if it's a preset or custom theme
        const preset = themePresets.find(p => p.id === themeData.id)
        if (preset) {
          return preset
        }
        // Return custom theme if valid
        if (themeData.colors && themeData.name) {
          return themeData as ThemePreset
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error)
    }
    return themePresets[0] // Default theme
  }
  
  // Save current theme to localStorage
  saveTheme(theme: ThemePreset): void {
    try {
      localStorage.setItem(ThemeManager.STORAGE_KEY, JSON.stringify(theme))
      this.currentTheme = theme
      this.applyThemeToDOM()
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }
  
  // Get current theme
  getCurrentTheme(): ThemePreset {
    return this.currentTheme
  }
  
  // Apply theme colors to DOM as CSS variables
  applyThemeToDOM(): void {
    const root = document.documentElement
    const cssProps = this.generateCSSCustomProperties(this.currentTheme.colors)
    
    Object.entries(cssProps).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }
  
  // Generate CSS custom properties from theme colors
  private generateCSSCustomProperties(colors: typeof baseColors): Record<string, string> {
    const cssProps: Record<string, string> = {}
    
    Object.entries(colors).forEach(([colorName, colorValues]) => {
      if (typeof colorValues === 'object') {
        Object.entries(colorValues).forEach(([shade, value]) => {
          cssProps[`--color-${colorName}-${shade}`] = value
        })
      }
    })
    
    return cssProps
  }
  
  // Switch to a preset theme
  switchToPreset(presetId: string): void {
    const preset = themePresets.find(p => p.id === presetId)
    if (preset) {
      this.saveTheme(preset)
    } else {
      console.warn(`Theme preset '${presetId}' not found`)
    }
  }
  
  // Create and save a custom theme
  createCustomTheme(name: string, colors: Partial<typeof baseColors>): void {
    const customTheme: ThemePreset = {
      id: `custom-${Date.now()}`,
      name,
      colors: { ...baseColors, ...colors }
    }
    this.saveTheme(customTheme)
  }
}

// Singleton instance
export const themeManager = new ThemeManager()

// CSS Custom Properties Generator (legacy, for backwards compatibility)
export const generateCSSCustomProperties = (colors = tokens.colors) => {
  const cssProps: Record<string, string> = {}
  
  // Generate color properties
  Object.entries(colors).forEach(([colorName, colorValues]) => {
    if (typeof colorValues === 'object') {
      Object.entries(colorValues).forEach(([shade, value]) => {
        cssProps[`--color-${colorName}-${shade}`] = value
      })
    }
  })
  
  // Generate spacing properties
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssProps[`--spacing-${key}`] = value
  })
  
  // Generate typography properties
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    const [size] = Array.isArray(value) ? value : [value]
    cssProps[`--font-size-${key}`] = size
  })
  
  return cssProps
}

export default tokens
