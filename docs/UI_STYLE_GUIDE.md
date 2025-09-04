# Building Management System - UI Style Guide

A comprehensive guide to the standardized UI components and design system for consistent, accessible, and maintainable interfaces.

## Table of Contents

- [Overview](#overview)
- [Design Tokens](#design-tokens)
- [Components](#components)
- [Usage Guidelines](#usage-guidelines)
- [Accessibility](#accessibility)
- [Migration Guide](#migration-guide)

## Overview

This style guide documents the standardized UI components and design system implemented to ensure consistency across the Building Management System. The system includes:

- **Design Tokens**: Centralized color, typography, spacing, and component specifications
- **UI Components**: Reusable, accessible components with consistent styling
- **Theme System**: User-customizable appearance settings
- **Accessibility Features**: WCAG 2.1 AA compliant implementations

## Design Tokens

### Colors

Our color system uses semantic naming with multiple shades:

```typescript
// Primary Colors (Blue)
primary: {
  50: '#f0f9ff',   // Lightest
  500: '#0ea5e9',  // Default
  600: '#0284c7',  // Hover
  900: '#0c4a6e'   // Darkest
}

// Success Colors (Green)
success: {
  50: '#f0fdf4',
  500: '#22c55e',
  600: '#16a34a'
}

// Danger Colors (Red)
danger: {
  50: '#fef2f2',
  500: '#ef4444',
  600: '#dc2626'
}

// Neutral Colors (Gray)
neutral: {
  0: '#ffffff',    // Pure white
  50: '#f9fafb',   // Background
  200: '#e5e7eb',  // Borders
  500: '#6b7280',  // Text secondary
  900: '#111827'   // Text primary
}
```

### Typography

```typescript
// Font Sizes
fontSize: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px (default)
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem'   // 24px
}

// Font Weights
fontWeight: {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
}
```

### Spacing

```typescript
// Consistent spacing scale
spacing: {
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  4: '1rem',       // 16px
  6: '1.5rem',     // 24px
  8: '2rem'        // 32px
}
```

## Components

### Button

The standardized Button component with consistent styling and behavior.

#### Variants
- `primary` - Main action buttons (blue)
- `secondary` - Secondary actions (gray)
- `success` - Positive actions (green)
- `warning` - Caution actions (amber)
- `danger` - Destructive actions (red)
- `outline` - Outlined buttons
- `ghost` - Minimal styling

#### Sizes
- `sm` - Small buttons (compact)
- `md` - Default size
- `lg` - Large buttons (prominent)

#### Usage Examples

```tsx
import { Button } from '../UI'

// Basic usage
<Button variant="primary">Save Changes</Button>

// With icon
<Button variant="danger" leftIcon={<Trash2 />}>Delete</Button>

// Loading state
<Button loading variant="primary">Processing...</Button>

// Full width
<Button fullWidth variant="secondary">Cancel</Button>
```

### Input

Standardized input component with consistent styling and validation states.

#### Features
- Label integration
- Error state handling
- Helper text
- Icon support (left/right)
- Accessibility attributes

#### Usage Examples

```tsx
import { Input } from '../UI'

// Basic input
<Input label="Building Name" placeholder="Enter building name" />

// With validation
<Input 
  label="Email" 
  type="email" 
  error="Please enter a valid email"
  required 
/>

// With icon
<Input 
  label="Search" 
  leftIcon={<Search />}
  placeholder="Search buildings..."
/>
```

### Modal

Accessible modal component with backdrop, keyboard navigation, and proper focus management.

#### Features
- Backdrop click to close
- Escape key handling
- Focus trap
- Scroll lock
- Multiple sizes

#### Usage Examples

```tsx
import { Modal, ModalFooter, Button } from '../UI'

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Edit Building"
  size="lg"
>
  <div>Modal content here</div>
  
  <ModalFooter>
    <Button variant="outline" onClick={() => setShowModal(false)}>
      Cancel
    </Button>
    <Button variant="primary">Save</Button>
  </ModalFooter>
</Modal>
```

### DataTable

Comprehensive table component with sorting, filtering, pagination, and actions.

#### Features
- Column sorting
- Search functionality
- Pagination
- Row actions
- Custom cell rendering
- Loading states
- Empty states

#### Usage Examples

```tsx
import { DataTable } from '../UI'
import type { Column, TableAction } from '../UI'

const columns: Column<Building>[] = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    render: (status) => (
      <Badge variant={status === 'active' ? 'success' : 'neutral'}>
        {status}
      </Badge>
    )
  }
]

const actions: TableAction<Building>[] = [
  {
    key: 'edit',
    label: 'Edit',
    icon: <Edit />,
    onClick: (record) => handleEdit(record)
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 />,
    onClick: (record) => handleDelete(record),
    variant: 'danger'
  }
]

<DataTable
  data={buildings}
  columns={columns}
  actions={actions}
  title="Buildings"
  searchable
  searchKeys={['name', 'address']}
/>
```

### Card

Container component for grouping related content.

#### Usage Examples

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '../UI'

<Card>
  <CardHeader>
    <CardTitle>Building Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content goes here...</p>
  </CardContent>
</Card>
```

## Usage Guidelines

### Do's ✅

- Use semantic color variants (`primary`, `success`, `danger`)
- Provide clear labels and descriptions
- Include proper ARIA attributes
- Use consistent spacing from the design tokens
- Test with keyboard navigation
- Provide loading and error states

### Don'ts ❌

- Don't use hardcoded colors (`bg-blue-600`, `text-red-500`)
- Don't skip accessibility attributes
- Don't use custom spacing values
- Don't forget to handle loading/error states
- Don't bypass the component system for one-off styles

### Color Usage

```tsx
// ✅ Good - Using semantic variants
<Button variant="danger">Delete</Button>
<div className="bg-success-50 text-success-800">Success message</div>

// ❌ Avoid - Hardcoded colors
<button className="bg-red-600 text-white">Delete</button>
<div className="bg-green-100 text-green-700">Success message</div>
```

### Spacing Usage

```tsx
// ✅ Good - Using design tokens
<div className="space-y-4 p-6">
  <div className="mb-2">Content</div>
</div>

// ❌ Avoid - Custom spacing
<div style={{ padding: '23px', marginBottom: '17px' }}>
  Content
</div>
```

## Accessibility

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 AA standards:

- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators and logical tab order

### Accessibility Features

#### High Contrast Mode
```css
.high-contrast {
  --color-primary-500: #0066cc;
  --color-neutral-900: #000000;
}
```

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Screen Reader Support
```tsx
// Screen reader only text
<span className="sr-only">Additional context for screen readers</span>

// Enhanced focus indicators
<button className="focus:outline-2 focus:outline-primary-500">
  Action Button
</button>
```

### Testing Checklist

- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible and clear
- [ ] Touch targets are at least 44px on mobile
- [ ] Content works with 200% text scaling

## Theme System

### User Customization

Users can customize the interface through the Appearance Settings:

- **Color Scheme**: Primary color selection
- **Typography**: Font size and weight adjustment
- **Layout Density**: Compact, comfortable, or spacious
- **Accessibility**: High contrast, reduced motion, enhanced focus

### Implementation

```tsx
import { useTheme } from '../../contexts/ThemeContext'

const { preferences, updatePreferences } = useTheme()

// Update user preferences
updatePreferences({ 
  primaryColor: 'success',
  fontSize: 'lg',
  density: 'compact'
})
```

## Migration Guide

### From Old Patterns to New Components

#### Buttons
```tsx
// Before
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  Save
</button>

// After
<Button variant="primary">Save</Button>
```

#### Forms
```tsx
// Before
<div>
  <label className="block text-sm font-medium text-gray-700">Name</label>
  <input className="mt-1 block w-full border-gray-300 rounded-md" />
</div>

// After
<Input label="Name" />
```

#### Tables
```tsx
// Before - Custom table implementation with hardcoded styles
<table className="w-full border border-gray-200">
  <thead className="bg-gray-50">
    {/* Complex table markup */}
  </thead>
  <tbody>
    {/* More complex markup */}
  </tbody>
</table>

// After - Standardized DataTable component
<DataTable
  data={data}
  columns={columns}
  actions={actions}
  searchable
/>
```

### Migration Steps

1. **Import the new components**
   ```tsx
   import { Button, Input, Modal, DataTable } from '../UI'
   ```

2. **Replace hardcoded styles with semantic variants**
   ```tsx
   // Replace bg-blue-600 with variant="primary"
   // Replace bg-red-600 with variant="danger"
   ```

3. **Add accessibility attributes**
   ```tsx
   // Ensure labels, ARIA attributes, and keyboard navigation
   ```

4. **Test thoroughly**
   - Keyboard navigation
   - Screen reader compatibility
   - Visual consistency
   - Responsive behavior

## Best Practices

### Component Architecture

1. **Composition over Configuration**
   ```tsx
   // Good - Composable
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
     </CardHeader>
     <CardContent>Content</CardContent>
   </Card>

   // Avoid - Over-configured
   <Card title="Title" content="Content" showHeader={true} />
   ```

2. **Consistent APIs**
   - Use similar prop names across components
   - Maintain consistent behavior patterns
   - Follow React conventions

3. **Accessibility First**
   - Build accessibility into components from the start
   - Test with real assistive technologies
   - Provide multiple ways to interact with content

### Performance

1. **Lazy Loading**
   - Use React.lazy() for large components
   - Implement virtual scrolling for large tables

2. **Memoization**
   - Use React.memo() for components that re-render frequently
   - Optimize expensive calculations with useMemo()

3. **Bundle Size**
   - Tree-shake unused components
   - Use dynamic imports for optional features

## Support

For questions about the design system or component usage:

1. Check this style guide first
2. Review component source code in `/src/components/UI/`
3. Test accessibility with screen readers and keyboard navigation
4. Follow the established patterns and conventions

---

**Last Updated**: December 2024
**Version**: 1.0.0
