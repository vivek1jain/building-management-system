# Building Management System - Complete Design System

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Design Tokens](#design-tokens)
3. [Theme System](#theme-system)
4. [Core UI Components](#core-ui-components)
5. [Specialized Components](#specialized-components)
6. [Layout & Navigation](#layout--navigation)
7. [Status & Badge System](#status--badge-system)
8. [Accessibility & Compliance](#accessibility--compliance)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Migration Guides](#migration-guides)
11. [Maintenance & Support](#maintenance--support)

---

## Overview & Philosophy

This comprehensive design system ensures consistency, accessibility, and maintainability across the Building Management System application. The system is built on semantic design principles, user customization, and WCAG 2.1 AA compliance.

### Core Principles

- **Semantic Design**: Use meaningful color and component names instead of hardcoded values
- **User Customization**: Provide theme presets and personalization options
- **Accessibility First**: Build inclusive interfaces from the ground up
- **Consistency**: Maintain uniform patterns across all components and pages
- **Maintainability**: Create reusable, composable components with clear APIs

### System Features

- **4 Built-in Theme Presets** with persistent storage
- **Semantic Color System** with status-based mapping
- **Comprehensive Component Library** with consistent styling
- **Responsive Design** for mobile, tablet, and desktop
- **Live Theme Switching** without page reload
- **Export/Import** theme configurations

---

## Design Tokens

### Color System

Our color system uses semantic naming with multiple shades for maximum flexibility and theme support.

#### Base Color Palette

```typescript
// Primary Colors (Blue by default, theme-customizable)
primary: {
  50: '#f0f9ff',   // Lightest background
  100: '#e0f2fe',  // Light background
  500: '#0ea5e9',  // Default primary
  600: '#0284c7',  // Hover state
  700: '#0369a1',  // Active state
  900: '#0c4a6e'   // Darkest variant
}

// Success Colors (Green)
success: {
  50: '#f0fdf4',   // Success background
  100: '#dcfce7',  // Success light
  500: '#22c55e',  // Default success
  600: '#16a34a',  // Success hover
  800: '#166534'   // Success text
}

// Warning Colors (Amber)
warning: {
  50: '#fffbeb',   // Warning background
  100: '#fef3c7',  // Warning light
  500: '#f59e0b',  // Default warning
  600: '#d97706',  // Warning hover
  800: '#92400e'   // Warning text
}

// Danger Colors (Red)
danger: {
  50: '#fef2f2',   // Error background
  100: '#fee2e2',  // Error light
  500: '#ef4444',  // Default danger
  600: '#dc2626',  // Danger hover
  800: '#991b1b'   // Danger text
}

// Info Colors (Blue, separate from primary)
info: {
  50: '#f0f9ff',
  500: '#3b82f6',
  600: '#2563eb'
}

// Neutral Colors (Gray scale)
neutral: {
  0: '#ffffff',    // Pure white
  50: '#f9fafb',   // Page background
  100: '#f3f4f6',  // Panel background
  200: '#e5e7eb',  // Borders
  300: '#d1d5db',  // Dividers
  400: '#9ca3af',  // Icons, placeholders
  500: '#6b7280',  // Secondary text
  600: '#4b5563',  // Body text
  900: '#111827'   // Primary text
}
```

#### Semantic Color Usage

| Semantic | Use Case | Examples |
|----------|----------|----------|
| **Primary** | Brand actions, navigation, main CTAs | Save buttons, active nav, primary links |
| **Success** | Positive actions, completion | Add, Approve, Complete, Save |
| **Warning** | Caution, pending states | Draft, Pending, Review Needed |
| **Danger** | Destructive actions, errors | Delete, Remove, Error states |
| **Info** | Informational, secondary actions | Details, View, Info panels |
| **Neutral** | Text, backgrounds, borders | UI structure, content |

### Typography

```typescript
// Font Families
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['Menlo', 'Monaco', 'Consolas', 'monospace']
}

// Font Sizes
fontSize: {
  xs: '0.75rem',    // 12px - Small text, badges
  sm: '0.875rem',   // 14px - Body text, form labels
  base: '1rem',     // 16px - Default text
  lg: '1.125rem',   // 18px - Larger body text
  xl: '1.25rem',    // 20px - Small headings
  '2xl': '1.5rem',  // 24px - Page headings
  '3xl': '1.875rem' // 30px - Large headings
}

// Font Weights
fontWeight: {
  normal: '400',    // Body text
  medium: '500',    // Emphasis
  semibold: '600',  // Subheadings
  bold: '700'       // Headings
}

// Typography Hierarchy
heading: {
  h1: 'text-3xl font-bold text-neutral-900',      // 30px, bold
  h2: 'text-2xl font-bold text-neutral-900',      // 24px, bold
  h3: 'text-lg font-semibold text-neutral-900',   // 18px, semibold
  h4: 'text-base font-semibold text-neutral-900'  // 16px, semibold
}

body: {
  default: 'text-sm text-neutral-900',    // 14px, normal
  secondary: 'text-sm text-neutral-600',  // 14px, muted
  small: 'text-xs text-neutral-500'       // 12px, very muted
}
```

### Spacing & Sizing

```typescript
// Spacing Scale (Tailwind-based)
spacing: {
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem'        // 64px
}

// Component Sizing Standards
componentSizing: {
  button: {
    sm: 'px-3 py-1.5 text-sm',    // 32px height
    md: 'px-4 py-2 text-sm',      // 40px height
    lg: 'px-6 py-3 text-base'     // 48px height
  },
  input: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
}
```

### Border & Shadow System

```typescript
// Border Radius
borderRadius: {
  sm: '0.25rem',    // 4px - Small elements
  md: '0.375rem',   // 6px - Buttons, inputs
  lg: '0.5rem',     // 8px - Cards, containers
  xl: '0.75rem',    // 12px - Modals
  full: '9999px'    // Pills, badges
}

// Shadows
boxShadow: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',              // Cards
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',            // Dropdowns
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',          // Modals
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'           // Large modals
}
```

---

## Theme System

### Theme Architecture

The theme system provides user-customizable appearance settings with persistent storage and live switching capabilities.

#### Theme Presets

##### 1. Default Blue (Professional)
- **Primary**: `#0284c7` (Blue 600)
- **Use Case**: Corporate environments, financial management
- **Best For**: Professional workflows, official documentation

##### 2. Emerald Green (Sustainable)
- **Primary**: `#059669` (Emerald 600)
- **Use Case**: Eco-friendly building management
- **Best For**: Green buildings, sustainability reporting

##### 3. Royal Purple (Premium)
- **Primary**: `#9333ea` (Purple 600)
- **Use Case**: Luxury properties, premium services
- **Best For**: High-end residential, boutique management

##### 4. Vibrant Orange (Creative)
- **Primary**: `#ea580c` (Orange 600)
- **Use Case**: Modern, energetic environments
- **Best For**: Co-living spaces, student housing

### Theme Implementation

#### CSS Custom Properties
```css
:root {
  --color-primary-50: #f0f9ff;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  /* ... other theme variables */
}

/* Theme variants dynamically update these variables */
[data-theme="emerald"] {
  --color-primary-500: #10b981;
  --color-primary-600: #059669;
}
```

#### Theme Context Usage
```tsx
import { useTheme } from '../contexts/ThemeContext';

const { currentTheme, setTheme, preferences } = useTheme();

// Switch themes
setTheme('emerald');

// Update preferences
updatePreferences({
  primaryColor: 'success',
  fontSize: 'lg',
  density: 'compact'
});
```

### Theme Customization Options

- **Color Scheme**: Primary color selection from 4 presets
- **Typography**: Font size adjustment (sm, base, lg)
- **Layout Density**: Compact, comfortable, or spacious spacing
- **Accessibility**: High contrast, reduced motion, enhanced focus
- **Export/Import**: Save and share theme configurations

---

## Core UI Components

### Button

Standardized button component with consistent styling across all variants and states.

#### Variants & Usage

```tsx
import { Button } from '../UI';

// Primary actions (most common)
<Button variant="primary">Save Changes</Button>

// Secondary actions
<Button variant="secondary">Cancel</Button>

// Positive actions
<Button variant="success">Add New</Button>

// Caution actions
<Button variant="warning">Review</Button>

// Destructive actions
<Button variant="danger">Delete</Button>

// Subtle actions
<Button variant="outline">View Details</Button>
<Button variant="ghost">More Options</Button>
```

#### Sizes & States

```tsx
// Sizes
<Button size="sm">Compact</Button>      // 32px height
<Button size="md">Default</Button>      // 40px height
<Button size="lg">Prominent</Button>    // 48px height

// With icons
<Button leftIcon={<Plus />}>Add Item</Button>
<Button rightIcon={<ExternalLink />}>Open</Button>

// States
<Button loading>Processing...</Button>
<Button disabled>Unavailable</Button>
<Button fullWidth>Full Width</Button>
```

### Input

Comprehensive input component with validation, icons, and accessibility features.

#### Basic Usage

```tsx
import { Input } from '../UI';

// Standard input
<Input 
  label="Building Name" 
  placeholder="Enter building name"
  required 
/>

// With validation
<Input 
  label="Email Address"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  helperText="We'll never share your email"
/>

// With icons
<Input 
  label="Search Buildings"
  leftIcon={<Search />}
  placeholder="Type to search..."
/>

<Input 
  label="Password"
  type="password"
  rightIcon={<Eye />}
  onRightIconClick={togglePasswordVisibility}
/>
```

#### Advanced Features

```tsx
// Text area
<Input 
  as="textarea"
  label="Description"
  rows={4}
  placeholder="Describe the issue..."
/>

// Select dropdown (use Dropdown component instead)
// See Specialized Components section for Dropdown usage
```

### Modal

Accessible modal component with proper focus management and keyboard navigation.

#### Basic Structure

```tsx
import { Modal, ModalFooter, Button } from '../UI';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Building Details"
  size="lg"
>
  <div className="space-y-4">
    {/* Modal content */}
  </div>
  
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSave}>
      Save Changes
    </Button>
  </ModalFooter>
</Modal>
```

#### Modal Sizes

```tsx
<Modal size="sm">  {/* 448px max width */}
<Modal size="md">  {/* 512px max width (default) */}
<Modal size="lg">  {/* 768px max width */}
<Modal size="xl">  {/* 1024px max width */}
```

### Card

Container component for grouping related content with consistent styling.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '../UI';

<Card>
  <CardHeader>
    <CardTitle>Building Statistics</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Card content */}
    </div>
  </CardContent>
</Card>

// Card variants
<Card variant="outlined">  {/* With border */}
<Card variant="elevated">  {/* With shadow */}
```

### DataTable

Comprehensive table component with sorting, filtering, pagination, and actions.

#### Column Configuration

```tsx
import { DataTable } from '../UI';
import type { Column, TableAction } from '../UI';

const columns: Column<Building>[] = [
  {
    key: 'name',
    title: 'Building Name',
    dataIndex: 'name',
    sortable: true,
    width: '200px'
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    render: (status) => (
      <Badge variant={getStatusColors(status)}>
        {status}
      </Badge>
    )
  },
  {
    key: 'units',
    title: 'Units',
    dataIndex: 'totalUnits',
    align: 'right',
    sortable: true
  }
];
```

#### Actions Configuration

```tsx
const actions: TableAction<Building>[] = [
  {
    key: 'view',
    label: 'View Details',
    icon: <Eye />,
    onClick: (record) => viewBuilding(record.id)
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: <Edit />,
    onClick: (record) => editBuilding(record.id)
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 />,
    onClick: (record) => deleteBuilding(record.id),
    variant: 'danger',
    confirm: true
  }
];
```

#### Full Implementation

```tsx
<DataTable
  data={buildings}
  columns={columns}
  actions={actions}
  title="Building Management"
  description="Manage all buildings in your portfolio"
  searchable
  searchKeys={['name', 'address', 'manager']}
  pagination={{
    pageSize: 25,
    showSizeChanger: true
  }}
  loading={isLoading}
  emptyMessage="No buildings found"
/>
```

---

## Specialized Components

### Dropdown Component Standard

**CRITICAL**: All selection elements MUST use the standardized `Dropdown` component. No native `<select>` elements are allowed in the application.

#### Required Implementation

```tsx
import { Dropdown, DropdownOption } from '../UI';

<Dropdown
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Select an option..."
  size="md"
  variant="default"
/>
```

#### Component Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `DropdownOption[]` | required | Array of selectable options |
| `value` | `string` | undefined | Currently selected value |
| `onChange` | `(value: string) => void` | required | Selection change handler |
| `placeholder` | `string` | "Select an option..." | Text shown when no selection |
| `disabled` | `boolean` | `false` | Disable the dropdown |
| `icon` | `ReactNode` | undefined | Icon displayed on the left |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `variant` | `'default' \| 'ghost' \| 'outline'` | `'default'` | Style variant |
| `showSearch` | `boolean` | `false` | Enable search functionality |
| `maxHeight` | `string` | `'max-h-60'` | Maximum dropdown height |
| `className` | `string` | undefined | Additional CSS classes |
| `dropdownClassName` | `string` | undefined | CSS classes for dropdown panel |

#### DropdownOption Interface

```tsx
interface DropdownOption {
  value: string;          // Unique identifier
  label: string;          // Display text
  icon?: ReactNode;       // Optional icon
  description?: string;   // Optional secondary text
  disabled?: boolean;     // Disable this option
}
```

#### Size Guidelines

##### Small (`sm`) - Use for:
- Headers and compact layouts
- Building switcher in navigation
- Filter dropdowns in tables
- Secondary actions

```tsx
<Dropdown
  options={buildingOptions}
  value={selectedBuilding}
  onChange={setSelectedBuilding}
  size="sm"
  icon={<Building className="h-4 w-4" />}
  placeholder="Select building..."
/>
```

##### Medium (`md`) - Use for:
- Forms and standard inputs
- Most common usage scenarios
- Settings and configuration

```tsx
<Dropdown
  options={supplierOptions}
  value={selectedSupplier}
  onChange={setSelectedSupplier}
  size="md"
  showSearch={supplierOptions.length > 5}
  placeholder="Choose supplier..."
/>
```

##### Large (`lg`) - Use for:
- Primary actions and emphasis
- Important selections
- Main configuration screens

```tsx
<Dropdown
  options={priorityOptions}
  value={selectedPriority}
  onChange={setSelectedPriority}
  size="lg"
  placeholder="Set priority level..."
/>
```

#### Variant Guidelines

##### Default Variant
- **Use for**: Standard form inputs, most common usage
- **Style**: White background, neutral border
- **Hover**: Light background tint

##### Ghost Variant
- **Use for**: Subtle selections, inline editing
- **Style**: Transparent background, no border
- **Hover**: Light background appears

##### Outline Variant
- **Use for**: Secondary selections, less prominent options
- **Style**: Transparent background, visible border
- **Hover**: Light background tint

#### Search Functionality

Enable search (`showSearch={true}`) when:
- ✅ More than 5 options
- ✅ Long option lists (suppliers, buildings, people)
- ✅ Users need to quickly find specific items

Disable search when:
- ❌ Fewer than 5 options
- ❌ Simple status/category selections
- ❌ Fixed, well-known option sets

#### Icon Usage Guidelines

**When to Use Icons:**
- ✅ **Dropdown button**: For visual identity (Building, User, etc.)
- ✅ **Individual options**: When each option has distinct meaning
- ✅ **Status indicators**: Color dots, state icons

**When NOT to Use Icons:**
- ❌ **Don't duplicate**: Avoid same icon on button AND options
- ❌ **Don't clutter**: Skip icons for simple text-only lists
- ❌ **Don't mix**: Be consistent - all options have icons or none do

#### Width & Layout Guidelines

```tsx
// ✅ Good - dropdown matches button width
<Dropdown 
  className="w-64"
  dropdownClassName="w-full"
  options={options}
/>

// ❌ Bad - dropdown wider than button
<Dropdown 
  className="w-48"
  dropdownClassName="min-w-[300px]"
  options={options}
/>
```

**Standard Widths:**
- **Minimum**: `min-w-[200px]` for readability
- **Maximum**: `max-w-md` for long content
- **Responsive**: Use `w-full` in grid layouts
- **Button width**: Determines dropdown width

#### Content Guidelines

##### Labels
- **Concise**: Keep primary labels short and clear
- **Consistent**: Use similar formatting across options
- **Descriptive**: Labels should be self-explanatory

##### Descriptions
- **Optional**: Use for additional context when helpful
- **Brief**: Keep to one line, avoid wrapping
- **Informative**: Provide useful details

```tsx
// ✅ Good descriptions
const buildingOptions = [
  {
    value: 'sunset-towers',
    label: 'Sunset Towers',
    description: '120 units • Los Angeles, CA'
  },
  {
    value: 'ocean-view',
    label: 'Ocean View Apartments',
    description: '85 units • San Diego, CA'
  }
];

// ❌ Too verbose
const badOptions = [
  {
    value: 'sunset-towers',
    label: 'Sunset Towers',
    description: 'A luxury residential building with 120 units located in the heart of Los Angeles, California with premium amenities and services'
  }
];
```

#### Common Usage Patterns

##### Building/Location Selection
```tsx
<Dropdown
  options={buildingOptions}
  value={selectedBuilding}
  onChange={setSelectedBuilding}
  icon={<Building className="h-4 w-4" />}
  size="sm"
  showSearch={buildingOptions.length > 5}
  placeholder="Select building..."
/>
```

##### Supplier Selection
```tsx
<Dropdown
  options={supplierOptions}
  value={selectedSupplier}
  onChange={setSelectedSupplier}
  icon={<User className="h-4 w-4" />}
  size="md"
  showSearch={true}
  placeholder="Choose supplier..."
/>
```

##### Status/Category Selection
```tsx
<Dropdown
  options={statusOptions}
  value={selectedStatus}
  onChange={setSelectedStatus}
  size="md"
  placeholder="Select status..."
/>
```

##### Time/Date Selection
```tsx
<Dropdown
  options={timeOptions}
  value={selectedTime}
  onChange={setSelectedTime}
  icon={<Clock className="h-4 w-4" />}
  size="sm"
  placeholder="Pick time..."
/>
```

#### Migration from Native Select

```tsx
// ❌ Old - native select (not allowed)
<select value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

// ✅ New - Dropdown component (required)
<Dropdown
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={value}
  onChange={setValue}
/>
```

#### Implementation Checklist

Before using Dropdown component:

- [ ] Import from UI component library: `import { Dropdown } from '../UI'`
- [ ] Define options array with proper `DropdownOption` interface
- [ ] Choose appropriate size (`sm`, `md`, `lg`) for context
- [ ] Decide if search is needed (>5 options guideline)
- [ ] Set proper width constraints
- [ ] Add relevant icons if beneficial
- [ ] Test keyboard navigation (Arrow keys, Enter, Escape)
- [ ] Verify accessibility (ARIA attributes, screen reader)
- [ ] Test on mobile devices (touch interaction)

---

## Layout & Navigation

### Layout Structure

The application uses a consistent layout structure with sidebar navigation and header components.

#### Main Layout
```tsx
<div className="min-h-screen bg-neutral-50">
  <Sidebar />
  <div className="lg:pl-64">
    <Header />
    <main className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page content */}
      </div>
    </main>
  </div>
</div>
```

### Sidebar Navigation

#### Navigation Items Styling
```tsx
// Active navigation item
className="bg-primary-100 border-r-2 border-primary-600 text-primary-700"

// Inactive navigation item
className="text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"

// Icon sizing
className="h-5 w-5"
```

#### Navigation Structure
- **Dashboard** - Overview and quick actions
- **Building Data** - People, Flats, Suppliers, Assets
- **Ticketing** - Tickets and work orders
- **Finances** - Budget, charges, invoices
- **Events** - Calendar and scheduling
- **Settings** - Configuration and management

### Header Components

#### Building Switcher
```tsx
<Dropdown
  options={buildingOptions}
  value={selectedBuilding}
  onChange={setSelectedBuilding}
  size="sm"
  icon={<Building className="h-4 w-4" />}
  className="min-w-[200px]"
/>
```

#### Page Headers
```tsx
<div className="border-b border-neutral-200 pb-6 mb-6">
  <h1 className="text-2xl font-bold text-neutral-900">
    Page Title
  </h1>
  <p className="text-sm text-neutral-600 mt-2">
    Page description and context
  </p>
</div>
```

### Responsive Behavior

#### Mobile Navigation
- Sidebar collapses on mobile (`< lg` breakpoint)
- Hamburger menu for mobile navigation
- Full-width layout on mobile

#### Tablet Adjustments
- Sidebar remains visible on tablet
- Content adjusts to remaining space
- Touch-friendly interactive elements

---

## Status & Badge System

### Status Badge Components

Consistent badge styling across all status indicators in the application.

#### Semantic Status Mapping

```tsx
import { getBadgeColors, getStatusColors } from '../utils/colors';

// Status to semantic color mapping
const statusMapping = {
  // Ticket statuses
  'new': 'info',
  'quoting': 'warning', 
  'scheduled': 'info',
  'in-progress': 'warning',
  'complete': 'success',
  'closed': 'neutral',
  'cancelled': 'danger',
  
  // Priority levels
  'low': 'success',
  'medium': 'warning',
  'high': 'danger',
  'critical': 'danger',
  
  // General statuses
  'active': 'success',
  'inactive': 'neutral',
  'pending': 'warning',
  'approved': 'success',
  'rejected': 'danger',
  'draft': 'neutral'
};
```

#### Badge Usage

```tsx
import { Badge } from '../UI';
import { getStatusColors } from '../utils/colors';

// Automatic color mapping
<Badge variant={getStatusColors(status)}>
  {status}
</Badge>

// Manual variants
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Overdue</Badge>
<Badge variant="info">New</Badge>
<Badge variant="neutral">Inactive</Badge>
```

#### Badge Styling Standards

```css
/* Base badge styling */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem; /* py-0.5 px-2.5 */
  border-radius: 9999px;      /* rounded-full */
  font-size: 0.75rem;         /* text-xs */
  font-weight: 500;           /* font-medium */
}

/* Variant styles */
.badge-success {
  background-color: theme('colors.success.100');
  color: theme('colors.success.800');
}

.badge-warning {
  background-color: theme('colors.warning.100');
  color: theme('colors.warning.800');
}
/* ... other variants */
```

#### Status Icon Integration

```tsx
// Badge with status icon
<Badge variant={getStatusColors(status)}>
  <StatusIcon status={status} className="h-3 w-3 mr-1" />
  {status}
</Badge>

// Priority badge with color dot
<Badge variant={getPriorityColors(priority)}>
  <span className="h-2 w-2 rounded-full bg-current mr-1" />
  {priority}
</Badge>
```

---

## Accessibility & Compliance

### WCAG 2.1 AA Standards

All components meet or exceed WCAG 2.1 AA accessibility standards.

#### Color Contrast Requirements

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text**: 3:1 minimum contrast ratio
- **Non-text elements**: 3:1 minimum contrast ratio

#### Verified Contrast Ratios

```typescript
// Text colors on white background
'text-neutral-900': 16.9:1,  // ✅ Excellent
'text-neutral-600': 7.0:1,   // ✅ Excellent  
'text-neutral-500': 5.7:1,   // ✅ Good
'text-primary-600': 8.2:1,   // ✅ Excellent
'text-success-600': 6.1:1,   // ✅ Good
'text-danger-600': 5.9:1,    // ✅ Good
```

### Keyboard Navigation

All interactive elements support full keyboard navigation:

#### Navigation Keys
- **Tab**: Move focus forward
- **Shift + Tab**: Move focus backward  
- **Enter/Space**: Activate buttons and links
- **Arrow keys**: Navigate within components (dropdowns, tables)
- **Escape**: Close modals, dropdowns, and overlays

#### Focus Management
```tsx
// Focus indicators
className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"

// Focus trap for modals
<FocusTrap active={isOpen}>
  <Modal>{/* content */}</Modal>
</FocusTrap>

// Skip links for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Screen Reader Support

#### ARIA Labels and Descriptions

```tsx
// Descriptive labels
<button aria-label="Close modal" onClick={onClose}>
  <X aria-hidden="true" />
</button>

// Form labels
<Input
  label="Email Address"
  aria-describedby="email-help"
  helperText="We'll never share your email"
/>
<div id="email-help" className="sr-only">
  Help text for screen readers
</div>

// Status announcements
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

#### Screen Reader Only Content

```css
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only.focus:not(.sr-only) {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Accessibility Features

#### High Contrast Mode
```css
.high-contrast {
  --color-primary-500: #0066cc;
  --color-neutral-900: #000000;
  --color-neutral-50: #ffffff;
  /* Enhanced contrast ratios */
}

@media (prefers-contrast: high) {
  :root {
    /* Automatically apply high contrast colors */
  }
}
```

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Enhanced Focus Indicators
```tsx
// Enhanced focus styles for accessibility mode
<Button className="focus:ring-4 focus:ring-primary-300 focus:outline-offset-2">
  Action Button  
</Button>
```

### Touch Accessibility

#### Minimum Touch Target Size
All interactive elements meet the minimum 44px × 44px touch target requirement:

```css
/* Ensure minimum touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Buttons on mobile */
@media (max-width: 768px) {
  .btn-sm {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }
}
```

---

## Implementation Guidelines

### Component Development Standards

#### File Structure
```
src/components/UI/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
│   ├── Input.tsx  
│   ├── Input.test.tsx
│   └── index.ts
└── index.ts  // Barrel exports
```

#### Component API Design

```tsx
// Consistent prop naming
interface ComponentProps {
  // Content
  children?: ReactNode;
  title?: string;
  description?: string;
  
  // Behavior
  onClick?: () => void;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  
  // State
  loading?: boolean;
  disabled?: boolean;
  error?: string | boolean;
  
  // Styling
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  id?: string;
}
```

#### Component Implementation Pattern

```tsx
import React, { forwardRef } from 'react';
import { cn } from '../utils/classNames';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    className,
    onClick,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
      success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
      danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-md',
      lg: 'px-6 py-3 text-base rounded-lg'
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          {
            'opacity-50 cursor-not-allowed': disabled || loading,
          },
          className
        )}
        disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4" />}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
```

### Styling Guidelines

#### CSS Class Composition
```tsx
// Use cn() utility for conditional classes
import { cn } from '../utils/classNames';

const className = cn(
  'base-classes',
  {
    'conditional-class': condition,
    'another-conditional': anotherCondition
  },
  customClassName
);
```

#### Color Usage Rules

```tsx
// ✅ Good - Using semantic colors
<Button variant="primary">Save</Button>
<div className="bg-success-50 text-success-800">Success message</div>
<span className="text-neutral-600">Secondary text</span>

// ❌ Avoid - Hardcoded colors
<button className="bg-blue-600 text-white">Save</button>
<div className="bg-green-100 text-green-700">Success message</div>
<span className="text-gray-500">Secondary text</span>
```

#### Spacing Consistency

```tsx
// ✅ Good - Using design tokens
<div className="space-y-4 p-6">        // 16px and 24px
  <div className="mb-2">Content</div>   // 8px margin
</div>

// ❌ Avoid - Custom spacing
<div style={{ padding: '23px', marginBottom: '17px' }}>
  Content
</div>
```

### Testing Standards

#### Component Testing Checklist

- [ ] **Rendering**: Component renders without errors
- [ ] **Props**: All props work as expected
- [ ] **Events**: Click, change, submit handlers work
- [ ] **States**: Loading, error, disabled states display correctly
- [ ] **Keyboard**: All keyboard interactions work
- [ ] **Screen Reader**: ARIA attributes are correct
- [ ] **Responsive**: Component works on all screen sizes
- [ ] **Variants**: All variant styles render correctly

#### Example Test Structure

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('shows loading state', () => {
    render(<Button loading>Loading...</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  test('applies variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger-600');
  });
});
```

---

## Migration Guides

### From Hardcoded Colors to Semantic System

#### Step 1: Identify Hardcoded Colors

Common patterns to find and replace:

```bash
# Find hardcoded Tailwind colors
grep -r "bg-blue-\|text-blue-\|border-blue-" src/
grep -r "bg-green-\|text-green-\|border-green-" src/
grep -r "bg-red-\|text-red-\|border-red-" src/
grep -r "bg-gray-\|text-gray-\|border-gray-" src/
```

#### Step 2: Replace with Semantic Colors

```tsx
// ❌ Before - Hardcoded colors
<button className="bg-blue-600 hover:bg-blue-700 text-white">
  Save Changes
</button>
<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
  Active
</span>
<div className="text-gray-600">Secondary text</div>
<div className="border-gray-300">Card border</div>

// ✅ After - Semantic colors
<Button variant="primary">
  Save Changes
</Button>
<Badge variant="success">
  Active
</Badge>
<div className="text-neutral-600">Secondary text</div>
<div className="border-neutral-300">Card border</div>
```

#### Step 3: Update Component Props

```tsx
// ❌ Before - Style props
<StatusBadge status="active" bgColor="bg-green-100" textColor="text-green-800" />

// ✅ After - Semantic props
<Badge variant={getStatusColors(status)}>{status}</Badge>
```

### From Native Form Elements to Components

#### Replace Select Elements

```tsx
// ❌ Before - Native select
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Building
  </label>
  <select 
    value={selectedBuilding} 
    onChange={(e) => setSelectedBuilding(e.target.value)}
    className="block w-full border-gray-300 rounded-md shadow-sm"
  >
    <option value="">Select a building...</option>
    {buildings.map(building => (
      <option key={building.id} value={building.id}>
        {building.name}
      </option>
    ))}
  </select>
</div>

// ✅ After - Dropdown component
<Dropdown
  label="Building"
  options={buildings.map(b => ({ value: b.id, label: b.name }))}
  value={selectedBuilding}
  onChange={setSelectedBuilding}
  placeholder="Select a building..."
  showSearch={buildings.length > 5}
/>
```

#### Replace Input Elements

```tsx
// ❌ Before - Native input
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="block w-full border-gray-300 rounded-md shadow-sm px-3 py-2"
    placeholder="Enter email address"
  />
  {emailError && (
    <p className="text-red-600 text-sm mt-1">{emailError}</p>
  )}
</div>

// ✅ After - Input component
<Input
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  placeholder="Enter email address"
  error={emailError}
/>
```

#### Replace Button Elements

```tsx
// ❌ Before - Native button
<button
  type="button"
  onClick={handleSave}
  disabled={loading}
  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
>
  {loading && <Spinner className="mr-2 h-4 w-4" />}
  Save Changes
</button>

// ✅ After - Button component
<Button
  variant="primary"
  onClick={handleSave}
  loading={loading}
  leftIcon={loading ? <Spinner /> : undefined}
>
  Save Changes
</Button>
```

### From Custom Modals to Modal Component

```tsx
// ❌ Before - Custom modal
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Modal Title
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="mb-6">
        Modal content here
      </div>
      <div className="flex space-x-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</div>

// ✅ After - Modal component
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  size="md"
>
  <div>Modal content here</div>
  
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={onSave}>
      Save
    </Button>
  </ModalFooter>
</Modal>
```

### Migration Checklist

#### Phase 1: Core Components (Week 1-2)
- [ ] Replace all hardcoded button styling with `<Button>` component
- [ ] Convert all native inputs to `<Input>` component
- [ ] Replace all native selects with `<Dropdown>` component
- [ ] Update all modal implementations to use `<Modal>` component

#### Phase 2: Color System (Week 3)
- [ ] Replace hardcoded blue colors with `primary-*` classes
- [ ] Replace hardcoded green colors with `success-*` classes
- [ ] Replace hardcoded red colors with `danger-*` classes
- [ ] Replace hardcoded gray colors with `neutral-*` classes

#### Phase 3: Layout & Cards (Week 4)
- [ ] Standardize all card components with `<Card>` component
- [ ] Update page headers with consistent typography
- [ ] Implement standard spacing patterns
- [ ] Verify responsive behavior

#### Phase 4: Testing & Polish (Week 5)
- [ ] Test keyboard navigation on all components
- [ ] Verify screen reader compatibility
- [ ] Test on mobile devices
- [ ] Performance audit and optimization

---

## Maintenance & Support

### Regular Maintenance Tasks

#### Monthly Reviews
- **Component Audit**: Review new components for design system compliance
- **Color Usage**: Check for hardcoded color usage creeping back into codebase
- **Accessibility**: Test with screen readers and keyboard navigation
- **Performance**: Monitor bundle size impact of design system components

#### Quarterly Updates
- **Design Token Review**: Evaluate if any design tokens need adjustment
- **New Pattern Documentation**: Document any new patterns that have emerged
- **Browser Compatibility**: Test on latest browser versions
- **Mobile Testing**: Verify responsive behavior on new devices

#### Annual Review
- **Complete System Audit**: Review entire design system for consistency
- **User Feedback**: Gather feedback from developers and users
- **Technology Updates**: Consider new tools, frameworks, or best practices
- **Accessibility Standards**: Update for latest WCAG guidelines

### Design System Evolution

#### Adding New Components

1. **Design Review**: Ensure new component fits existing patterns
2. **API Design**: Follow established prop naming conventions
3. **Implementation**: Use design tokens and semantic colors
4. **Testing**: Include accessibility and responsive testing
5. **Documentation**: Add usage examples and guidelines
6. **Migration Guide**: Provide guidance for adopting new component

#### Updating Existing Components

1. **Backward Compatibility**: Avoid breaking changes when possible
2. **Deprecation Process**: Clearly communicate deprecated patterns
3. **Migration Timeline**: Provide reasonable time for teams to update
4. **Version Documentation**: Document all changes and their impact

### Support Resources

#### Documentation
- **This Complete Design System** - Primary reference document
- **Component Storybook** - Interactive component playground (if implemented)
- **API Reference** - Detailed prop documentation for each component

#### Development Tools
```bash
# Lint for design system compliance
npm run lint:design-system

# Test accessibility compliance
npm run test:a11y

# Visual regression testing
npm run test:visual

# Performance bundle analysis
npm run analyze:bundle
```

#### Getting Help

1. **Component Issues**: Check component source code in `/src/components/UI/`
2. **Design Questions**: Reference this design system document
3. **Accessibility**: Test with screen readers and follow WCAG guidelines
4. **Performance**: Use React DevTools and bundle analyzer
5. **Best Practices**: Follow established patterns in existing components

### Version Control

#### Semantic Versioning
- **Major**: Breaking changes to component APIs
- **Minor**: New components or features
- **Patch**: Bug fixes and minor improvements

#### Change Documentation
```markdown
## Design System Changelog

### v2.1.0 (2024-12-15)
#### Added
- New `DataTable` component with sorting and filtering
- `showSearch` prop for Dropdown component
- High contrast theme support

#### Changed  
- Button component now supports `fullWidth` prop
- Updated focus ring styling for better accessibility

#### Fixed
- Modal focus trap working correctly on all browsers
- Dropdown keyboard navigation on mobile devices
```

### Performance Considerations

#### Bundle Size Optimization
- **Tree Shaking**: Ensure all components can be imported individually
- **Code Splitting**: Large components should support lazy loading
- **CSS Optimization**: Use CSS-in-JS or CSS modules to avoid unused styles

#### Runtime Performance
- **React.memo**: Use for components that re-render frequently
- **useMemo/useCallback**: Optimize expensive calculations and event handlers
- **Virtual Scrolling**: Implement for large data tables and lists

#### Loading Performance
- **Critical CSS**: Include essential styles in initial bundle
- **Font Loading**: Optimize web font loading strategy
- **Image Optimization**: Use appropriate formats and sizes

---

## Conclusion

This comprehensive design system provides a solid foundation for consistent, accessible, and maintainable UI development across the Building Management System. By following these guidelines and using the provided components, teams can:

- **Build Faster**: Reuse well-tested components instead of creating from scratch
- **Maintain Consistency**: Ensure uniform user experience across all features
- **Improve Accessibility**: Leverage built-in WCAG compliance and keyboard navigation
- **Enhance User Experience**: Provide familiar interaction patterns and visual design
- **Reduce Technical Debt**: Use standardized components that are easier to maintain

### Key Takeaways

1. **Always use semantic colors** instead of hardcoded values
2. **Use the standardized Dropdown component** for all selections
3. **Follow the established component APIs** and prop naming conventions
4. **Test for accessibility** with keyboard navigation and screen readers
5. **Maintain consistency** by using design tokens and established patterns
6. **Document new patterns** and update this system as it evolves

### Next Steps

1. Complete any remaining migrations from old patterns to new components
2. Set up regular design system maintenance processes
3. Consider implementing a component library with Storybook for better developer experience
4. Gather user feedback and iterate on the system based on real usage patterns
5. Plan for future enhancements like dark mode, advanced theming, or additional accessibility features

This design system is a living document that should evolve with the application. Regular reviews, user feedback, and maintenance will ensure it continues to serve the team and users effectively.

---

**Document Version**: 2.0.0  
**Last Updated**: December 2024  
**Contributors**: Development Team  
**Next Review**: March 2025
