# Building Management System - Design System

## Overview

This design system ensures consistency, accessibility, and maintainability across the Building Management System application. All components follow these standards for a cohesive user experience.

---

## 🎨 Color System

### Primary Colors
- **Primary**: `#3B82F6` (blue-600)
- **Primary Light**: `#DBEAFE` (blue-100)
- **Primary Dark**: `#1D4ED8` (blue-700)

### Neutral Colors
- **Text Primary**: `#111827` (neutral-900)
- **Text Secondary**: `#6B7280` (neutral-600)
- **Text Muted**: `#9CA3AF` (neutral-500)
- **Border**: `#E5E7EB` (neutral-200)
- **Background**: `#FFFFFF` (white)
- **Background Muted**: `#F9FAFB` (neutral-50)

### Status Colors
- **Success**: `#10B981` (green-500)
- **Warning**: `#F59E0B` (amber-500)
- **Error**: `#EF4444` (red-500)
- **Info**: `#3B82F6` (blue-500)

---

## 📏 Spacing & Sizing

### Spacing Scale (Tailwind)
- **xs**: `0.25rem` (1px)
- **sm**: `0.5rem` (2px)
- **md**: `1rem` (4px)
- **lg**: `1.5rem` (6px)
- **xl**: `2rem` (8px)

### Component Sizes
- **Small**: `px-3 py-1.5 text-sm`
- **Medium**: `px-4 py-2 text-sm`
- **Large**: `px-6 py-3 text-base`

---

## 🖋️ Typography

### Font Families
- **Primary**: Inter, sans-serif
- **Monospace**: Menlo, Monaco, monospace

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Text Sizes
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)

---

## 📋 Dropdown Component Standard

### ✅ **Required Usage**
All selection elements MUST use the standardized `Dropdown` component. No native `<select>` elements allowed.

```tsx
import { Dropdown, DropdownOption } from '../UI';

<Dropdown
  options={options}
  value={value}
  onChange={setValue}
  placeholder="Select an option..."
  size="md"
  variant="default"
/>
```

### **Component Props**

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

### **Option Interface**

```tsx
interface DropdownOption {
  value: string;          // Unique identifier
  label: string;          // Display text
  icon?: ReactNode;       // Optional icon
  description?: string;   // Optional secondary text
  disabled?: boolean;     // Disable this option
}
```

### **Size Standards**

#### Small (`sm`)
- **Use for**: Headers, compact layouts, secondary actions
- **Padding**: `px-3 py-1.5`
- **Text**: `text-sm`
- **Example**: Building switcher, filter dropdowns

#### Medium (`md`)
- **Use for**: Forms, standard inputs, most common usage
- **Padding**: `px-4 py-2`
- **Text**: `text-sm`
- **Example**: Ticket forms, settings, general selections

#### Large (`lg`)
- **Use for**: Primary actions, emphasis, important selections
- **Padding**: `px-6 py-3`
- **Text**: `text-base`
- **Example**: Main configuration, critical selections

### **Variant Standards**

#### Default
- **Use for**: Standard form inputs, most common usage
- **Style**: White background, neutral border
- **Hover**: Light background tint

#### Ghost
- **Use for**: Subtle selections, inline editing
- **Style**: Transparent background, no border
- **Hover**: Light background appears

#### Outline
- **Use for**: Secondary selections, less prominent options
- **Style**: Transparent background, visible border
- **Hover**: Light background tint

### **Search Guidelines**

Enable search (`showSearch={true}`) when:
- ✅ More than 5 options
- ✅ Long option lists (suppliers, buildings, etc.)
- ✅ User needs to quickly find specific items

Disable search when:
- ❌ Fewer than 5 options
- ❌ Simple status/category selections
- ❌ Fixed, well-known option sets

### **Icon Guidelines**

#### When to Use Icons
- ✅ **Dropdown button**: For visual identity (Building, User, etc.)
- ✅ **Individual options**: When each option has distinct meaning
- ✅ **Status indicators**: Color dots, state icons

#### When NOT to Use Icons
- ❌ **Don't duplicate**: Avoid same icon on button AND options
- ❌ **Don't clutter**: Skip icons for simple text-only lists
- ❌ **Don't mix**: Be consistent - all options have icons or none do

### **Width Guidelines**

#### Standard Widths
- **Button width**: Determines dropdown width (`w-full` on dropdown)
- **Minimum**: `min-w-[200px]` for readability
- **Maximum**: `max-w-md` for long content
- **Responsive**: Use `w-full` in grid layouts

```tsx
// ✅ Good - dropdown matches button width
<Dropdown 
  className="w-64"
  dropdownClassName="w-full"
/>

// ❌ Bad - dropdown wider than button
<Dropdown 
  className="w-48"
  dropdownClassName="min-w-[300px]"
/>
```

### **Content Guidelines**

#### Labels
- **Concise**: Keep primary labels short and clear
- **Consistent**: Use similar formatting across options
- **Descriptive**: Labels should be self-explanatory

#### Descriptions
- **Optional**: Use for additional context when helpful
- **Brief**: Keep to one line, avoid wrapping
- **Informative**: Provide useful details (ratings, counts, locations)

```tsx
// ✅ Good descriptions
{
  value: 'sunset-towers',
  label: 'Sunset Towers',
  description: '120 units • Los Angeles, CA'
}

// ❌ Too verbose
{
  value: 'sunset-towers',
  label: 'Sunset Towers',
  description: 'A luxury residential building with 120 units located in the heart of Los Angeles, California'
}
```

---

## 🎯 Implementation Checklist

### Before Using Dropdown Component

- [ ] Import from UI component library: `import { Dropdown } from '../UI'`
- [ ] Define options array with proper `DropdownOption` interface
- [ ] Choose appropriate size (`sm`, `md`, `lg`) for context
- [ ] Decide if search is needed (>5 options)
- [ ] Set proper width constraints
- [ ] Add relevant icons if beneficial
- [ ] Test keyboard navigation
- [ ] Verify accessibility (ARIA attributes)

### Common Usage Patterns

#### Building/Location Selection
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

#### Supplier Selection
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

#### Status/Category Selection
```tsx
<Dropdown
  options={statusOptions}
  value={selectedStatus}
  onChange={setSelectedStatus}
  size="md"
  placeholder="Select status..."
/>
```

#### Time Selection
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

---

## 🚀 Migration Guide

### From Native Select Elements

```tsx
// ❌ Old - native select
<select value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

// ✅ New - Dropdown component
<Dropdown
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={value}
  onChange={setValue}
/>
```

### From Custom Dropdowns

1. **Replace custom state management** with Dropdown component
2. **Convert option arrays** to `DropdownOption` interface
3. **Remove custom styling** - use size/variant props instead
4. **Update event handlers** to use `onChange` prop
5. **Test accessibility** and keyboard navigation

---

## 📱 Responsive Guidelines

### Breakpoint Usage
- **Mobile**: Prefer full-width dropdowns
- **Tablet**: Use appropriate sizing, avoid overflow
- **Desktop**: Standard sizing, consider context

### Mobile Considerations
- Ensure touch targets are at least 44px
- Test dropdown positioning and scrolling
- Verify search functionality on mobile keyboards
- Check that descriptions don't cause overflow

---

## ♿ Accessibility Standards

### Required Features
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ ARIA attributes (`role="listbox"`, `aria-expanded`)
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ Color contrast compliance

### Testing Checklist
- [ ] Tab navigation works properly
- [ ] Arrow keys navigate options
- [ ] Enter/Space selects options
- [ ] Escape closes dropdown
- [ ] Screen reader announces changes
- [ ] Focus returns to trigger button after selection

---

## 🔄 Maintenance

### Regular Reviews
- **Monthly**: Check for new dropdown usage that needs standardization
- **Quarterly**: Review and update design tokens
- **Major releases**: Audit entire app for consistency

### Version Updates
- Document any breaking changes to Dropdown component
- Provide migration guides for major updates
- Maintain backward compatibility when possible

---

*This design system is a living document. Update it as the application evolves and new patterns emerge.*
