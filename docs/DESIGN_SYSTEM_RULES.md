# 🎨 Building Management System - Design System Rules & Guidelines

## Table of Contents
- [Core Principles](#core-principles)
- [Desktop Design Rules](#desktop-design-rules)
- [Mobile Design Rules](#mobile-design-rules)
- [Component Standards](#component-standards)
- [Implementation Guidelines](#implementation-guidelines)
- [Migration Checklist](#migration-checklist)

---

## Core Principles

### 1. **Consistency Over Creativity**
- Use established patterns before creating new ones
- Maintain visual hierarchy across all interfaces
- Ensure predictable user interactions

### 2. **Accessibility First** 
- Design for screen readers, keyboard navigation, and assistive technologies
- Maintain WCAG 2.1 AA compliance minimum
- Support high contrast and reduced motion preferences

### 3. **Mobile-First Responsive**
- Design for touch interfaces with minimum 44px touch targets
- Ensure content adapts gracefully across viewport sizes
- Prioritize essential actions in limited screen space

### 4. **Semantic Design**
- Use semantic color meanings consistently
- Apply visual hierarchy through typography, spacing, and color
- Maintain logical content structure and flow

### 5. **Efficiency and Density**
- Prioritize information density to display more data on screen.
- Minimize unnecessary white space while maintaining readability.
- Design components to be compact by default, with consistent, reduced spacing.

---

## Desktop Design Rules

### Layout & Spacing

#### **Grid System**
```css
/* Page layouts use consistent 24px base grid */
.page-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Card/component spacing */
.space-y-6 {
  gap: 24px; /* Standard component spacing */
}

.space-y-4 {
  gap: 16px; /* Related content spacing */
}

.space-y-2 {
  gap: 8px; /* Tight content spacing */
}
```

#### **Padding Standards**
- **Cards**: `16px` (p-4)
- **Modal content**: `20px` (p-5)
- **Table cells**: `12px horizontal, 12px vertical` (px-3 py-3)
- **Buttons**: `6px vertical, 12px horizontal` (py-1.5 px-3)
- **Form inputs**: `8px vertical, 12px horizontal` (py-2 px-3)

#### **Margins & Spacing**
- **Section spacing**: `20px` between major sections
- **Component spacing**: `16px` between related components
- **Element spacing**: `8px` between related elements (e.g., label and input)

### Typography

#### **Font Hierarchy**
```css
/* Page Titles */
h1 {
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-neutral-900);
}

/* Section Titles */
h2 {
  font-size: 1.5rem; /* 24px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-neutral-900);
}

/* Card/Component Titles */
h3 {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-neutral-900);
}

/* Sub-section Headings */
h4 {
  font-size: 1rem; /* 16px */
  font-weight: 600;
  line-height: 1.5;
  color: var(--color-neutral-900);
}

/* Body Text */
p, span, div {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-neutral-700);
}

/* Small Text */
.text-sm {
  font-size: 0.75rem; /* 12px */
  line-height: 1.5;
  color: var(--color-neutral-600);
}
```

#### **Text Alignment Rules**
- **Page/section titles**: Left-aligned
- **Modal titles**: Left-aligned
- **Button text**: Center-aligned
- **Form labels**: Left-aligned above inputs
- **Table headers**: Left-aligned
- **Table data**: Left-aligned (numbers right-aligned)
- **Status badges**: Center-aligned within container

### Colors & Visual Hierarchy

#### **Color Usage Rules**

**Primary Actions** (bg-primary-600)
- Main CTA buttons (Save, Submit, Create)
- Primary navigation active states
- Key status indicators

**Secondary Actions** (bg-neutral-600, outline variant)  
- Cancel buttons
- Secondary navigation
- Less important actions

**Success Actions** (bg-success-600)
- Approve, Accept, Complete buttons
- Positive status indicators
- Save confirmations

**Warning Actions** (bg-warning-600)
- Review, Pending, Draft buttons
- Caution states
- Confirmation dialogs

**Danger Actions** (bg-danger-600)
- Delete, Remove, Cancel operations
- Error states
- Destructive confirmations

#### **Status Color Mapping**
```typescript
// Ticket/Work Order Status Colors
const statusColors = {
  'New': 'bg-blue-100 text-blue-800',
  'Quoting': 'bg-yellow-100 text-yellow-800', 
  'Scheduled': 'bg-cyan-100 text-cyan-800',
  'Complete': 'bg-green-100 text-green-800',
  'Closed': 'bg-gray-100 text-gray-800',
  'Cancelled': 'bg-red-100 text-red-800'
}

// Priority Colors  
const priorityColors = {
  'low': 'bg-success-100 text-success-800',
  'medium': 'bg-warning-100 text-warning-800',
  'high': 'bg-danger-100 text-danger-800',
  'critical': 'bg-red-100 text-red-800'
}
```

### Buttons

#### **Button Variants & Usage**
```tsx
// Primary Actions (max 1 per page/modal)
<Button variant="primary" size="md">
  Save Changes
</Button>

// Secondary Actions  
<Button variant="outline" size="md">
  Cancel
</Button>

// Destructive Actions
<Button variant="danger" size="md">
  Delete Building
</Button>

// Success Actions
<Button variant="success" size="md">
  Approve Request
</Button>
```

#### **Button Icon Rules**
- **Left icons**: Action-related (Save → CheckIcon, Add → PlusIcon)
- **Right icons**: Navigation (Next → ChevronRightIcon)
- **Icon size**: 16px (h-4 w-4) for md buttons, 14px (h-3.5 w-3.5) for sm
- **Icon spacing**: 8px gap between icon and text (mr-2, ml-2)

#### **Button Sizing**
- **Small (`sm`)**: `32px height` - Table actions, compact areas
- **Medium (`md`)**: `40px height` - Standard forms, modals
- **Large (`lg`)**: `48px height` - Primary CTAs, important actions

#### **Button Widths**
- **Auto width**: Content-based (default)
- **Full width**: `w-full` for mobile forms, modal footers
- **Fixed width**: Use min-width for consistency in button groups
- **Min-width**: `88px` for single-word buttons

### Form Elements

#### **Input Field Standards**
```tsx
// Standard input with label
<div className="space-y-2">
  <label className="block text-sm font-medium text-neutral-900">
    Building Name
  </label>
  <input 
    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    placeholder="Enter building name"
  />
</div>
```

#### **Form Layout Rules**
- **Labels**: Always above inputs, never beside (except checkboxes/radios)
- **Required indicators**: Red asterisk (`*`) after label text
- **Help text**: Below input in `text-neutral-600 text-sm`
- **Error messages**: Below input in `text-danger-600 text-sm`
- **Field spacing**: `16px` vertical between form fields

### Search Bars & Filtering

#### **Search Bar Structure**
```tsx
<div class="relative">
  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
    <Search class="h-4 w-4 text-neutral-500" />
  </div>
  <input
    type="search"
    placeholder="Search for tickets..."
    class="block w-full rounded-md border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-primary-500"
  />
</div>
```

#### **Search Bar Rules**
1.  **Icon**: A search icon (`<Search />`) MUST be placed on the left, inside the input.
2.  **Padding**: Left padding (`pl-9`) must accommodate the icon.
3.  **Placeholder**: Should be descriptive (e.g., "Search tickets by title or ID...").
4.  **No Label**: Search bars typically do not need a `<label>`. A descriptive `placeholder` is sufficient.

#### **Dropdowns (Select Menus)**
```tsx
<div>
  <label class="block text-sm font-medium text-neutral-900">Status Filter</label>
  <select class="mt-1 block w-full appearance-none rounded-md border border-neutral-300 bg-white bg-no-repeat py-2 px-3 pr-8 text-sm focus:border-primary-500 focus:ring-primary-500">
    <option>All Statuses</option>
    <option>New</option>
  </select>
</div>
```

#### **Dropdown Rules**
1.  **Appearance**: Style to match text inputs for consistency (height, border, radius).
2.  **Chevron Icon**: A custom chevron icon MUST be used on the right.
3.  **Sizing**: Height and padding should match standard text inputs.

#### **Filter Bar Layout**
- **Structure**: Use a `flex` container with `items-center` and a `space-x-4` gap.
- **Components**: A search bar (`flex-1`) on the left, with dropdown filters and a "Clear" button on the right.
```tsx
<div class="flex items-center space-x-4 mb-4">
  <div class="flex-1">{/* Search Bar */}</div>
  <div>{/* Dropdown Filter */}</div>
  <Button variant="ghost">Clear Filters</Button>
</div>
```

### Tables

#### **Table Structure Standards**
```tsx
// Consistent table styling
<div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
  <table className="min-w-full">
    <thead className="bg-neutral-50">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
          Column Header
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-neutral-200">
      <tr className="hover:bg-neutral-50">
        <td className="px-6 py-4 text-sm text-neutral-700">
          Cell Content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

#### **Table Rules**
- **Cell padding**: `24px horizontal, 16px vertical` (px-6 py-4)
- **Header styling**: Semi-bold, neutral-900, bg-neutral-50
- **Row hover**: `hover:bg-neutral-50`
- **Borders**: `border-neutral-200` for dividers
- **Corner radius**: `rounded-lg` for table container

### Modals & Overlays

#### **Modal Standards**
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  size="lg"
  footer={
    <div className="flex justify-end space-x-3">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  }
>
  <div className="space-y-6">
    {/* Modal content with consistent spacing */}
  </div>
</Modal>
```

#### **Modal Rules**
- **Sizes**: `sm` (448px), `md` (512px), `lg` (768px), `xl` (1024px)
- **Max height**: 90vh with scroll for overflow
- **Backdrop**: 50% black opacity with blur
- **Close button**: Top-right corner, ghost variant
- **Footer**: Sticky bottom, right-aligned button group
- **Padding**: 24px for content area

---

## Mobile Design Rules

### Touch Targets

#### **Minimum Touch Target Sizes**
```css
/* All interactive elements */
button, a, input, select, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Touch-friendly spacing */
.touch-spacing {
  gap: 8px; /* Minimum 8px between touch targets */
}
```

#### **Button Adaptations**
- **Mobile buttons**: Minimum 44px height, full-width for primary actions
- **Touch spacing**: 8px minimum between interactive elements
- **Icon buttons**: 48px × 48px minimum for single-icon buttons

### Mobile Layout

#### **Responsive Container Rules**
```css
/* Mobile-first container */
.mobile-container {
  padding: 16px; /* Reduced from 24px desktop */
  margin: 0;
}

/* Mobile card spacing */
.mobile-card {
  padding: 16px; /* Reduced from 24px */
  margin-bottom: 16px;
  border-radius: 12px; /* Slightly larger radius */
}
```

#### **Mobile Navigation**
- **Bottom navigation**: Primary navigation at bottom for thumb access
- **Hamburger menu**: Secondary/admin functions
- **Breadcrumbs**: Hide on small screens (< 640px)
- **Search**: Prominent, full-width when focused

### Mobile Typography

#### **Font Size Adjustments**
```css
/* Mobile font scaling */
@media (max-width: 640px) {
  h1 { font-size: 1.5rem; } /* 24px, down from 30px */
  h2 { font-size: 1.25rem; } /* 20px, down from 24px */
  h3 { font-size: 1.125rem; } /* 18px, same */
  p { font-size: 1rem; } /* 16px, up from 14px for readability */
}
```

#### **Mobile Text Rules**
- **Minimum text size**: 16px to prevent zoom on iOS
- **Line height**: 1.6 minimum for readability
- **Text contrast**: Maintain 4.5:1 ratio minimum

### Mobile Forms

#### **Mobile Form Layout**
```tsx
// Stack all form elements vertically
<div className="space-y-4">
  <Input 
    label="Building Name"
    className="text-base" // 16px to prevent zoom
    inputMode="text"
  />
  <Button 
    variant="primary" 
    fullWidth 
    size="lg"
  >
    Save Building
  </Button>
</div>
```

#### **Mobile Form Rules**
- **Input fields**: Full-width, 44px minimum height
- **Labels**: Always above inputs, never beside
- **Primary buttons**: Full-width, 48px height
- **Secondary buttons**: Full-width or grouped horizontally
- **Field spacing**: 16px vertical between fields

### Mobile Tables

#### **Responsive Table Strategy**
```tsx
// Mobile: Convert to card layout
<div className="md:hidden">
  {data.map(item => (
    <div className="bg-white rounded-lg p-4 mb-3 border border-neutral-200">
      <h4 className="font-semibold">{item.title}</h4>
      <p className="text-sm text-neutral-600">{item.subtitle}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="badge">{item.status}</span>
        <Button variant="outline" size="sm">View</Button>
      </div>
    </div>
  ))}
</div>

// Desktop: Standard table
<div className="hidden md:block">
  <DataTable columns={columns} data={data} />
</div>
```

#### **Mobile Table Rules**
- **Breakpoint**: Hide tables below 768px (md breakpoint)
- **Card replacement**: Convert rows to cards with key information
- **Horizontal scroll**: As fallback for complex tables
- **Action buttons**: Single primary action visible, others in overflow menu

---

## Component Standards

### Button Components

#### **Required Button Properties**
```tsx
interface StandardButtonProps {
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode    // Optional leading icon
  rightIcon?: ReactNode   // Optional trailing icon
  loading?: boolean       // Loading state with spinner
  disabled?: boolean      // Disabled state
  fullWidth?: boolean     // Mobile full-width option
}
```

#### **Button Usage Rules**
1. **One primary button** per page/modal maximum
2. **Icons are mandatory** for these actions:
   - Add/Create: `<Plus className="h-4 w-4" />`
   - Edit: `<Pencil className="h-4 w-4" />`
   - Delete: `<Trash2 className="h-4 w-4" />`
   - Save: `<Check className="h-4 w-4" />`
   - Cancel: `<X className="h-4 w-4" />`
   - Search: `<Search className="h-4 w-4" />`
   - Download: `<Download className="h-4 w-4" />`
   - Upload: `<Upload className="h-4 w-4" />`

3. **Button text rules**:
   - Use action verbs: "Save Changes", "Delete Building", "Add Tenant"
   - Avoid generic "OK", "Submit" - be specific
   - Keep under 20 characters for readability

4. **Button grouping**:
   - Primary action on the right
   - Destructive actions separated by space
   - Max 3 buttons in a horizontal group

### Form Components

#### **Input Field Standards**
```tsx
// Standard input structure
<div className="space-y-2">
  <label className="block text-sm font-medium text-neutral-900">
    Field Label {required && <span className="text-danger-600">*</span>}
  </label>
  <input 
    className="w-full px-3.5 py-2.5 text-base border border-neutral-300 rounded-lg placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500"
    placeholder="Descriptive placeholder text"
  />
  {helpText && (
    <p className="text-sm text-neutral-600">{helpText}</p>
  )}
  {error && (
    <p className="text-sm text-danger-600">{error}</p>
  )}
</div>
```

#### **Form Layout Rules**
1. **Label placement**: Always above input fields
2. **Required indicators**: Red asterisk (*) after label text
3. **Error states**: Red border, red error text below input
4. **Success states**: Green border when validated
5. **Disabled states**: Gray background, gray text
6. **Placeholder text**: Descriptive, not instructional

### Card Components

#### **Card Structure Standards**
```tsx
<div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
  {/* Optional header */}
  <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
    <h3 className="text-lg font-semibold text-neutral-900">Card Title</h3>
    <p className="text-sm text-neutral-600">Optional description</p>
  </div>
  
  {/* Card content */}
  <div className="p-6">
    {/* Content with consistent spacing */}
    <div className="space-y-4">
      {/* Card content */}
    </div>
  </div>
  
  {/* Optional footer */}
  <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
    <div className="flex justify-end space-x-3">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Save</Button>
    </div>
  </div>
</div>
```

#### **Card Rules**
1. **Border radius**: `rounded-lg` (8px) for all cards
2. **Shadow**: `shadow-sm` for subtle elevation
3. **Border**: `border-neutral-200` for definition
4. **Header background**: `bg-neutral-50` when used
5. **Content padding**: `p-6` (24px) for main content area
6. **Max width**: 100% with appropriate container constraints

### Modal Components

#### **Modal Size Guidelines**
- **Small (`sm`)**: Simple confirmations, single input forms
- **Medium (`md`)**: Standard forms, basic content
- **Large (`lg`)**: Complex forms, detailed views (default for tickets)
- **Extra Large (`xl`)**: Data-heavy interfaces, dashboards

#### **Modal Footer Rules**
```tsx
// Standard modal footer pattern
<div className="flex justify-end space-x-3">
  <Button variant="outline">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>

// Destructive action pattern
<div className="flex justify-between">
  <Button variant="danger">Delete</Button>
  <div className="space-x-3">
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </div>
</div>
```

### Tab Navigation Components

#### **Tab Structure Standards**
```tsx
// Standard horizontal tab navigation
<div className="border-b border-neutral-200">
  <nav className="flex space-x-8 px-6" aria-label="Tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
          activeTab === tab.id
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
        }`}
      >
        <Icon className="h-4 w-4" />
        {tab.label}
        {tab.count && (
          <span className="ml-2 bg-neutral-100 text-neutral-600 py-0.5 px-2 rounded-full text-xs">
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </nav>
</div>
```

#### **Tab Variants**

**1. Underline Tabs (Primary)**
```tsx
// Used for: Main navigation, page sections
<button className={`py-4 px-1 border-b-2 font-medium text-sm ${
  isActive 
    ? 'border-primary-600 text-primary-600' 
    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
}`}>
  Tab Label
</button>
```

**2. Pill Tabs (Secondary)**
```tsx
// Used for: Sub-navigation, filters
<button className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
  isActive
    ? 'bg-primary-100 text-primary-700 border border-primary-200'
    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
}`}>
  Tab Label
</button>
```

**3. Segmented Control**
```tsx
// Used for: Toggle between 2-3 related views
<div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-1">
  {options.map((option) => (
    <button
      key={option.id}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active === option.id
          ? 'bg-white text-neutral-900 shadow-sm'
          : 'text-neutral-600 hover:text-neutral-900'
      }`}
    >
      {option.label}
    </button>
  ))}
</div>
```

#### **Tab Rules**
1. **Active state**: `border-primary-600 text-primary-600` for underline tabs
2. **Inactive state**: `text-neutral-500` with hover to `text-neutral-700`
3. **Icon size**: `h-4 w-4` (16px) for tab icons
4. **Font weight**: `font-medium` for all tab labels
5. **Font size**: `text-sm` (14px) for readability
6. **Spacing**: `space-x-8` (32px) between tabs
7. **Padding**: `py-4 px-1` for underline tabs, `px-4 py-2` for pill tabs
8. **Count badges**: Small, rounded, neutral colors
9. **Transitions**: `transition-colors` for smooth state changes
10. **Accessibility**: Include `aria-label="Tabs"` on nav element

#### **Tab Content Standards**
```tsx
// Tab panel with proper ARIA attributes
<div 
  role="tabpanel" 
  aria-labelledby={`tab-${activeTab}`}
  className="p-6"
>
  <div className="space-y-6">
    {/* Tab content with consistent spacing */}
  </div>
</div>
```

#### **Mobile Tab Adaptations**
```tsx
// Mobile: Horizontal scroll tabs
<div className="border-b border-neutral-200 overflow-x-auto">
  <nav className="flex space-x-6 px-4 min-w-max" aria-label="Tabs">
    {tabs.map((tab) => (
      <button className="flex-shrink-0 py-3 px-2 border-b-2 font-medium text-sm">
        <Icon className="h-4 w-4 mx-auto mb-1" />
        <span className="block">{tab.label}</span>
      </button>
    ))}
  </nav>
</div>

// Mobile: Bottom tab bar (for main navigation)
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 safe-area-pb">
  <nav className="flex" aria-label="Main navigation">
    {tabs.map((tab) => (
      <button className="flex-1 flex flex-col items-center py-2 px-1">
        <Icon className="h-5 w-5 mb-1" />
        <span className="text-xs">{tab.label}</span>
      </button>
    ))}
  </nav>
</div>
```

### Status & Badge Components

#### **Badge & Status Descriptor Standards**
Status descriptors (or "badges"/"pills") are used to indicate the state of an item (e.g., Ticket Status, Priority).

```tsx
// Status badges with consistent styling
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
  {status}
</span>
```

#### **Badge Rules**
1. **Size**: `text-xs` (12px) font size
2. **Padding**: `px-2.5 py-0.5` for balanced appearance
3. **Shape**: `rounded-full` for pill appearance
4. **Font weight**: `font-medium` for readability
5. **Colors**: Use semantic color system only

---

## Implementation Guidelines

### CSS Class Naming

#### **Utility-First with Semantic Fallbacks**
```tsx
// ✅ Good: Semantic component classes
<Button variant="primary">Save</Button>
<Card className="ticket-card">Content</Card>

// ✅ Good: Tailwind utilities for layout
<div className="flex items-center justify-between">

// ❌ Avoid: Mixed approaches
<div className="bg-blue-600 p-4 custom-shadow">
```

#### **Component Class Patterns**
- **BEM methodology**: `.component-name__element--modifier`
- **Semantic naming**: `.ticket-card`, `.user-badge`, `.status-indicator`
- **State classes**: `.is-loading`, `.is-active`, `.is-disabled`

### Data Display Conventions
- **User-Generated Data**: Use standard typography (e.g., Inter, regular weight, `text-neutral-900` or `700`). This applies to names, titles, descriptions, and comments.
- **System-Generated Data**: Use a distinct, subtle style to differentiate it from user content.
  - **Style**: `text-neutral-500`, and/or a slightly smaller font size.
  - **Monospace Font**: Use for data where character distinction is important (e.g., unique IDs, codes).
  - **Examples**: Timestamps ("Created 2 hours ago"), unique IDs (`#TICK-aB1cDe2`), activity log entries ("User updated status").

```tsx
<div>
  <p class="text-neutral-900 font-medium">User-Entered Title</p>
  <span class="text-xs text-neutral-500 font-mono">ID: #a1b2c3d4</span>
  <span class="text-sm text-neutral-600">Timestamp: 2025-08-21 13:36</span>
</div>
```

### Border Radius Standards

#### **Consistent Corner Rounding**
```css
/* Component border radius scale */
.rounded-sm    /* 2px - Small elements, badges */
.rounded       /* 4px - Default for most elements */
.rounded-md    /* 6px - Input fields, small cards */
.rounded-lg    /* 8px - Cards, larger components */
.rounded-xl    /* 12px - Modals, major containers */
.rounded-2xl   /* 16px - Special emphasis elements */
.rounded-full  /* Pills, avatars, badges */
```

#### **Border Radius Rules**
1. **Cards**: `rounded-lg` (8px)
2. **Buttons**: `rounded-md` (6px)  
3. **Inputs**: `rounded-lg` (8px)
4. **Modals**: `rounded-xl` (12px)
5. **Badges**: `rounded-full`
6. **Tables**: `rounded-lg` for container, no rounding for cells

### Shadow & Elevation

#### **Shadow Scale**
```css
/* Elevation system */
.shadow-sm     /* Subtle - Cards, inputs */
.shadow        /* Default - Dropdowns, tooltips */
.shadow-md     /* Medium - Modals, important cards */
.shadow-lg     /* Large - Overlays, floating elements */
.shadow-xl     /* Extra large - Main modals */
.shadow-2xl    /* Maximum - Critical overlays */
```

#### **Shadow Usage Rules**
1. **Cards**: `shadow-sm` for subtle elevation
2. **Modals**: `shadow-xl` for prominence
3. **Dropdowns**: `shadow-md` for floating appearance
4. **Buttons**: `shadow-sm` on hover for feedback
5. **No shadows**: For flat design elements, badges

### Responsive Breakpoints

#### **Tailwind Breakpoint Usage**
```css
/* Mobile first approach */
.class           /* Mobile: 0px - 639px */
.sm:class        /* Small: 640px+ */  
.md:class        /* Medium: 768px+ */
.lg:class        /* Large: 1024px+ */
.xl:class        /* Extra Large: 1280px+ */
.2xl:class       /* 2X Large: 1536px+ */
```

#### **Responsive Design Rules**
1. **Mobile-first**: Design for mobile, enhance for desktop
2. **Breakpoint strategy**: 
   - Mobile: `< 640px` - Single column, stacked elements
   - Tablet: `640px - 1023px` - 2-column layouts, reduced spacing
   - Desktop: `1024px+` - Multi-column, full feature set
3. **Content priority**: Most important content first on mobile
4. **Navigation**: Bottom tabs on mobile, sidebar on desktop

---

## Migration Checklist

### Phase 1: Component Standardization

#### **Button Migration**
- [ ] Replace all hardcoded button styles with `<Button>` component
- [ ] Ensure consistent variant usage (primary, secondary, danger, etc.)
- [ ] Add appropriate icons to action buttons
- [ ] Verify button sizing consistency (sm, md, lg)
- [ ] Check button width consistency in groups

#### **Form Migration**
- [ ] Standardize all input field styling with `<Input>` component
- [ ] Ensure labels are above inputs consistently
- [ ] Add required indicators (*) where needed
- [ ] Implement consistent error state styling
- [ ] Check form spacing and alignment

#### **Layout Migration**
- [ ] Apply consistent card padding (p-6)
- [ ] Standardize section spacing (space-y-6)
- [ ] Ensure consistent border radius usage
- [ ] Update modal sizing and footer layouts
- [ ] Check table styling consistency

#### **Tab Navigation Migration**
- [ ] Standardize all tab implementations to use consistent structure
- [ ] Ensure tab active states use `border-primary-600 text-primary-600`
- [ ] Add icons to tab labels where appropriate (h-4 w-4 size)
- [ ] Implement count badges with neutral styling
- [ ] Add proper ARIA labels and accessibility attributes
- [ ] Test tab keyboard navigation (arrow keys, tab/shift-tab)

### Phase 2: Color Standardization

#### **Color System Migration**
- [ ] Replace hardcoded colors with semantic variants
- [ ] Update status badges to use consistent color mapping
- [ ] Ensure icon colors follow semantic system
- [ ] Check hover and focus state colors
- [ ] Verify high contrast accessibility

#### **Status Color Mapping**
- [ ] Standardize ticket status colors
- [ ] Update priority indicator colors
- [ ] Ensure user role badge colors are consistent
- [ ] Check building/asset status colors

### Phase 3: Responsive Design

#### **Mobile Optimization**
- [ ] Add mobile breakpoint overrides
- [ ] Implement touch-friendly button sizing
- [ ] Create mobile card layouts for tables
- [ ] Add bottom navigation for mobile
- [ ] Test mobile form usability

#### **Desktop Enhancements**
- [ ] Optimize desktop spacing and layout
- [ ] Add hover states for desktop interactions
- [ ] Implement keyboard navigation enhancements
- [ ] Check multi-column layouts

### Phase 4: Accessibility Audit

#### **WCAG 2.1 AA Compliance**
- [ ] Verify color contrast ratios (4.5:1 minimum)
- [ ] Test keyboard navigation throughout app
- [ ] Add proper ARIA labels and descriptions
- [ ] Implement focus management in modals
- [ ] Test with screen readers

#### **User Preference Support**
- [ ] Implement reduced motion preferences
- [ ] Add high contrast mode support
- [ ] Test with browser zoom up to 200%
- [ ] Verify print stylesheet functionality

---

## Quality Assurance

### Visual Consistency Checklist

#### **Component Consistency**
- [ ] All buttons use the same height within size categories
- [ ] Card components have consistent padding and radius
- [ ] Modal sizes and spacing are standardized
- [ ] Form layouts follow the same pattern
- [ ] Table styling is uniform across pages

#### **Color Consistency**
- [ ] Status colors are semantically correct
- [ ] Interactive states (hover, focus, active) are consistent
- [ ] Text hierarchy uses appropriate color weights
- [ ] Brand colors are used appropriately

#### **Typography Consistency**
- [ ] Heading hierarchy is maintained
- [ ] Font weights are used consistently
- [ ] Line heights provide good readability
- [ ] Text alignment follows established patterns

### Cross-Browser Testing

#### **Browser Support**
- Chrome 100+ ✅
- Firefox 100+ ✅
- Safari 15+ ✅
- Edge 100+ ✅

#### **Device Testing**
- Desktop (1920×1080, 1366×768)
- Tablet (768×1024, 1024×768)
- Mobile (375×667, 390×844, 360×640)

---

## Maintenance & Updates

### Design Token Updates
1. **Color changes**: Update in `src/styles/tokens.ts` only
2. **Spacing changes**: Update CSS custom properties in `src/index.css`
3. **Component updates**: Modify base components in `src/components/UI/`

### Documentation
1. **Document changes**: Update this file when patterns change
2. **Component docs**: Maintain Storybook documentation for components
3. **Migration notes**: Document breaking changes and migration paths

### Review Process
1. **Design review**: All new patterns reviewed for consistency
2. **Accessibility testing**: New components tested with assistive technologies
3. **Mobile testing**: All changes verified on mobile devices
4. **Cross-browser**: Testing on supported browsers before deployment

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Next Review**: Q1 2025
