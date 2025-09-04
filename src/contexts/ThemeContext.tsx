import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { tokens, ThemePreset, themePresets, themeManager } from '../styles/tokens'

export interface ThemePreferences {
  // Theme preset
  themePresetId: string
  
  // Color scheme
  primaryColor: keyof typeof tokens.colors
  colorMode: 'light' | 'dark' | 'auto'
  
  // Typography
  fontSize: 'sm' | 'base' | 'lg' | 'xl'
  fontWeight: 'normal' | 'medium' | 'semibold'
  
  // Layout
  density: 'compact' | 'comfortable' | 'spacious'
  sidebarCollapsed: boolean
  
  // Accessibility
  highContrast: boolean
  reducedMotion: boolean
  focusVisible: boolean
}

export interface ThemeContextValue {
  preferences: ThemePreferences
  currentTheme: ThemePreset
  availablePresets: ThemePreset[]
  updatePreferences: (updates: Partial<ThemePreferences>) => void
  resetPreferences: () => void
  applyPreferences: () => void
  switchToPreset: (presetId: string) => void
  createCustomTheme: (name: string, colors: any) => void
}

const defaultPreferences: ThemePreferences = {
  themePresetId: 'default',
  primaryColor: 'primary',
  colorMode: 'light',
  fontSize: 'base',
  fontWeight: 'normal',
  density: 'comfortable',
  sidebarCollapsed: false,
  highContrast: false,
  reducedMotion: false,
  focusVisible: true,
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'building-management-theme-preferences'

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<ThemePreferences>(() => {
    // Load preferences immediately during initialization
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...defaultPreferences, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load theme preferences during init:', error)
    }
    return defaultPreferences
  })
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(themeManager.getCurrentTheme())

  // Apply theme immediately on mount
  useEffect(() => {
    // Preferences are already loaded in useState initializer
    // Just need to apply them
    applyPreferences(preferences)
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save theme preferences:', error)
    }
  }, [preferences])

  // Apply CSS custom properties when preferences change
  useEffect(() => {
    applyPreferences()
  }, [preferences])
  
  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (preferences.colorMode !== 'auto') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyPreferences()
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preferences.colorMode])

  const updatePreferences = (updates: Partial<ThemePreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
  }

  const switchToPreset = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId)
    if (preset) {
      themeManager.saveTheme(preset)
      setCurrentTheme(preset)
      updatePreferences({ themePresetId: presetId })
    }
  }

  const createCustomTheme = (name: string, colors: any) => {
    themeManager.createCustomTheme(name, colors)
    const newTheme = themeManager.getCurrentTheme()
    setCurrentTheme(newTheme)
    updatePreferences({ themePresetId: newTheme.id })
  }

  const applyPreferences = (prefs = preferences) => {
    const root = document.documentElement

    // First apply the current theme colors
    themeManager.applyThemeToDOM()

    // Apply font size
    const fontSizeMap = {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    }
    root.style.setProperty('--app-font-size', fontSizeMap[prefs.fontSize])

    // Apply font weight
    const fontWeightMap = {
      normal: '400',
      medium: '500',
      semibold: '600',
    }
    root.style.setProperty('--app-font-weight', fontWeightMap[prefs.fontWeight])

    // Apply density (spacing multiplier)
    const densityMap = {
      compact: '0.875',
      comfortable: '1',
      spacious: '1.25',
    }
    root.style.setProperty('--app-density', densityMap[prefs.density])

    // If primary color override is different from theme, apply it
    if (prefs.primaryColor !== 'primary') {
      const colorMapping = {
        'primary': currentTheme.colors.primary,
        'success': currentTheme.colors.success,
        'warning': currentTheme.colors.warning,
        'danger': currentTheme.colors.danger,
        'info': currentTheme.colors.info
      }
      
      const selectedColorTokens = colorMapping[prefs.primaryColor as keyof typeof colorMapping] || currentTheme.colors.primary
      if (typeof selectedColorTokens === 'object') {
        Object.entries(selectedColorTokens).forEach(([shade, color]) => {
          root.style.setProperty(`--color-primary-${shade}`, color)
        })
      }
    }

    // Apply accessibility preferences
    if (prefs.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (prefs.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    if (prefs.focusVisible) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }

    // Apply color mode
    if (prefs.colorMode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (prefs.colorMode === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      // Auto mode - use system preference
      root.classList.remove('dark', 'light')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.add('light')
      }
    }

    // Apply sidebar state
    if (prefs.sidebarCollapsed) {
      root.classList.add('sidebar-collapsed')
    } else {
      root.classList.remove('sidebar-collapsed')
    }
    
    // Force comprehensive theming via JavaScript
    const isDarkMode = prefs.colorMode === 'dark' || 
      (prefs.colorMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    // Apply body colors
    const body = document.body
    if (isDarkMode) {
      body.style.backgroundColor = '#111827' // dark neutral-50
      body.style.color = '#f9fafb' // dark neutral-900
    } else {
      body.style.backgroundColor = '#f9fafb' // light neutral-50  
      body.style.color = '#111827' // light neutral-900
    }
    
    // Temporarily disable aggressive styling to debug blank screen
    console.log('Theme applied, mode:', isDarkMode ? 'dark' : 'light')
  }

  const value: ThemeContextValue = {
    preferences,
    currentTheme,
    availablePresets: themePresets,
    updatePreferences,
    resetPreferences,
    applyPreferences,
    switchToPreset,
    createCustomTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Helper function to get CSS variable values
export const getCSSVariable = (variable: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(variable)
}

// Helper function to set CSS variables
export const setCSSVariable = (variable: string, value: string): void => {
  document.documentElement.style.setProperty(variable, value)
}

export default ThemeProvider
