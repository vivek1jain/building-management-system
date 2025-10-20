import React, { useState } from 'react'
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Minus,
  Plus,
  Square,
  Circle,
  Sparkles,
  Download
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { tokens } from '../../styles/tokens'
import { Button, Card, CardHeader, CardTitle, CardContent } from '../UI'

interface AppearanceSettingsProps {
  addNotification: (notification: any) => void
  currentUser: any
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  addNotification,
  currentUser
}) => {
  const { 
    preferences, 
    currentTheme, 
    availablePresets, 
    updatePreferences, 
    resetPreferences,
    switchToPreset,
    createCustomTheme 
  } = useTheme()
  const [previewColor, setPreviewColor] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const colorOptions = [
    { key: 'primary', name: 'Default Blue', color: '#0ea5e9' },
    { key: 'success', name: 'Green', color: '#22c55e' },
    { key: 'warning', name: 'Amber', color: '#f59e0b' },
    { key: 'danger', name: 'Red', color: '#ef4444' },
    { key: 'info', name: 'Blue', color: '#3b82f6' },
  ]

  const fontSizeOptions = [
    { key: 'sm', name: 'Small', size: '14px', description: 'Compact text' },
    { key: 'base', name: 'Default', size: '16px', description: 'Standard size' },
    { key: 'lg', name: 'Large', size: '18px', description: 'Easier to read' },
    { key: 'xl', name: 'Extra Large', size: '20px', description: 'Maximum readability' },
  ]

  const densityOptions = [
    { key: 'compact', name: 'Compact', description: 'More content, less spacing' },
    { key: 'comfortable', name: 'Comfortable', description: 'Balanced spacing' },
    { key: 'spacious', name: 'Spacious', description: 'More breathing room' },
  ]

  const colorModeOptions = [
    { key: 'light', name: 'Light', icon: Sun, description: 'Light theme' },
    { key: 'dark', name: 'Dark', icon: Moon, description: 'Dark theme' },
    { key: 'auto', name: 'System', icon: Monitor, description: 'Follow system preference' },
  ]

  const handleColorPreview = (colorKey: string) => {
    setPreviewColor(colorKey)
  }

  const handleColorApply = (colorKey: string) => {
    updatePreferences({ primaryColor: colorKey as any })
    setPreviewColor(null)
  }

  const handlePresetSwitch = (presetId: string) => {
    switchToPreset(presetId)
  }

  const handleReset = () => {
    resetPreferences()
    setPreviewColor(null)
    
    if (currentUser) {
      addNotification({
        title: 'Settings Reset',
        message: 'All appearance settings have been reset to defaults',
        type: 'info',
        userId: currentUser.id
      })
    }
  }

  const handleExportTheme = () => {
    const themeConfig = {
      theme: currentTheme,
      preferences
    }
    
    const dataStr = JSON.stringify(themeConfig, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    if (currentUser) {
      addNotification({
        title: 'Theme Exported',
        message: 'Theme configuration has been downloaded',
        type: 'success',
        userId: currentUser.id
      })
    }
  }

  const currentColorOption = colorOptions.find(c => c.key === preferences.primaryColor) || colorOptions[0]

  const handleSave = () => {
    if (currentUser) {
      addNotification({
        title: 'Settings Saved',
        message: 'Your appearance preferences have been saved successfully',
        type: 'success',
        userId: currentUser.id
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary-600" />
            Appearance & Accessibility
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Customize the look and feel of your interface
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Theme Presets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Theme Presets
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Choose from predefined themes or customize your own
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {availablePresets.map((preset) => {
              const isActive = currentTheme.id === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSwitch(preset.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: preset.colors.primary[600] }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: preset.colors.success[600] }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: preset.colors.warning[600] }}
                      />
                    </div>
                    {isActive && (
                      <div className="text-primary-600 font-medium text-xs">
                        ACTIVE
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {preset.id === 'default' && 'Classic blue theme'}
                    {preset.id === 'emerald' && 'Nature-inspired green'}
                    {preset.id === 'purple' && 'Royal and elegant'}
                    {preset.id === 'orange' && 'Energetic and warm'}
                    {preset.id.startsWith('custom') && 'Custom theme'}
                  </div>
                </button>
              )
            })}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTheme}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Mode */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Appearance Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorModeOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.key}
                      onClick={() => updatePreferences({ colorMode: option.key as any })}
                      className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                        preferences.colorMode === option.key
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{option.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Theme Info */}
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Current Theme</div>
                  <div className="text-xs text-neutral-600">{currentTheme.name}</div>
                </div>
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentTheme.colors.primary[600] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentTheme.colors.success[600] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentTheme.colors.warning[600] }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentTheme.colors.danger[600] }}
                  />
                </div>
              </div>
            </div>
            
            {/* Primary Color Override */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Primary Color Override
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                Override the theme's primary color while keeping other colors intact
              </p>
              <div className="space-y-2">
                {/* Current Selection */}
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: currentColorOption.color }}
                  />
                  <span className="font-medium">{currentColorOption.name}</span>
                </div>
                
                {/* Color Options */}
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.key}
                      onMouseEnter={() => handleColorPreview(option.key)}
                      onMouseLeave={() => setPreviewColor(null)}
                      onClick={() => handleColorApply(option.key)}
                      className={`relative w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${
                        preferences.primaryColor === option.key
                          ? 'border-neutral-900 scale-110'
                          : 'border-white shadow-sm hover:border-neutral-300'
                      }`}
                      style={{ backgroundColor: option.color }}
                      title={option.name}
                    >
                      {preferences.primaryColor === option.key && (
                        <div className="absolute inset-0 rounded-full border-2 border-neutral-900" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Font Size
              </label>
              <div className="space-y-2">
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => updatePreferences({ fontSize: option.key as any })}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      preferences.fontSize === option.key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium" style={{ fontSize: option.size }}>
                        {option.name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {option.description}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400">
                      {option.size}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Font Weight
              </label>
              <select
                value={preferences.fontWeight}
                onChange={(e) => updatePreferences({ fontWeight: e.target.value as any })}
                className="w-full p-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="normal">Normal (400)</option>
                <option value="medium">Medium (500)</option>
                <option value="semibold">Semi Bold (600)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout & Spacing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Density */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Interface Density
              </label>
              <div className="space-y-2">
                {densityOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => updatePreferences({ density: option.key as any })}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      preferences.density === option.key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {option.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {option.key === 'compact' && <Minus className="h-4 w-4" />}
                      {option.key === 'comfortable' && <Square className="h-4 w-4" />}
                      {option.key === 'spacious' && <Plus className="h-4 w-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">High Contrast</div>
                <div className="text-xs text-neutral-500">
                  Increase contrast for better visibility
                </div>
              </div>
              <button
                onClick={() => updatePreferences({ highContrast: !preferences.highContrast })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.highContrast ? 'bg-primary-600' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Reduced Motion</div>
                <div className="text-xs text-neutral-500">
                  Minimize animations and transitions
                </div>
              </div>
              <button
                onClick={() => updatePreferences({ reducedMotion: !preferences.reducedMotion })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.reducedMotion ? 'bg-primary-600' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Focus Visible */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Enhanced Focus Indicators</div>
                <div className="text-xs text-neutral-500">
                  Show prominent focus outlines for keyboard navigation
                </div>
              </div>
              <button
                onClick={() => updatePreferences({ focusVisible: !preferences.focusVisible })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.focusVisible ? 'bg-primary-600' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.focusVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Notice */}
      {previewColor && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-700">
            <strong>Preview:</strong> Hover over colors to preview them. Click to apply permanently.
          </p>
        </div>
      )}
    </div>
  )
}

export default AppearanceSettings
