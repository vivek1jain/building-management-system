# 🎨 UI Component Design System Compliance Checklist

This document provides a comprehensive checklist of all user-facing components, pages, screens, and modals that need to be audited and updated according to our design system rules defined in `DESIGN_SYSTEM_RULES.md`.

---

## 📋 Pages & Main Screens

### 1. **Dashboard** (`/src/pages/Dashboard.tsx`)
- [ ] **Header Section**
  - [ ] Page title typography (`text-2xl font-bold text-neutral-900`)
  - [ ] Subtitle text styling (`text-gray-600`)
  - [ ] Building selector display

- [ ] **Metric Cards** (4 cards)
  - [ ] Card container styling (`bg-white rounded-lg shadow p-6`)
  - [ ] Icon placement and sizing (`h-8 w-8`)
  - [ ] Metric value typography
  - [ ] Card padding consistency (`p-6`)

- [ ] **Urgent Items Triage Section**
  - [ ] Card container styling
  - [ ] Badge for item count (`bg-red-100 text-red-800`)
  - [ ] Priority badges color mapping
  - [ ] Empty state styling

- [ ] **Quick Actions Section**
  - [ ] Navigation links styling
  - [ ] Hover states
  - [ ] Icon consistency (`h-5 w-5`)

- [ ] **Recent Activity Section**
  - [ ] Activity item styling
  - [ ] Status badges color consistency
  - [ ] Time formatting

### 2. **Building Data Management** (`/src/pages/BuildingDataManagement.tsx`)
- [ ] **Tab Navigation**
  - [ ] Tab button styling (underline style)
  - [ ] Active state (`border-primary-600 text-primary-600`)
  - [ ] Inactive state hover effects
  - [ ] Icon sizing (`h-4 w-4`)

- [ ] **Tab Content Areas**
  - [ ] People Data Table
  - [ ] Flats Data Table  
  - [ ] Suppliers Data Table
  - [ ] Assets Data Table

### 3. **Ticketing** (`/src/pages/TicketsWorkOrders.tsx`)
- [ ] **Header Section**
  - [ ] Page title and subtitle
  - [ ] "New Ticket" button styling

- [ ] **Tab Navigation** (4 tabs)
  - [ ] My Tickets tab
  - [ ] Workflow View tab
  - [ ] All Tickets tab
  - [ ] Work Orders tab
  - [ ] Tab count badges
  - [ ] Active/inactive states

- [ ] **Workflow View**
  - [ ] 6 workflow stage cards
  - [ ] Stage card styling (`rounded-lg p-4`)
  - [ ] Count badges (`bg-white px-2 py-1`)
  - [ ] Stage descriptions
  - [ ] Arrow flow indicators

- [ ] **Search & Filters**
  - [ ] Search bar with left icon
  - [ ] Status filter dropdown
  - [ ] Filter clear button

- [ ] **Ticket Cards**
  - [ ] Card container styling
  - [ ] Title typography
  - [ ] Status badges
  - [ ] Priority badges
  - [ ] Metadata icons and text

- [ ] **Info Banners**
  - [ ] Manager view banner
  - [ ] Active tickets banner

### 4. **Finances** (`/src/pages/Finances.tsx`)
- [ ] **Header Section**
  - [ ] Page title and description

- [ ] **Financial Summary Cards** (4 cards)
  - [ ] Total Income card
  - [ ] Total Expenditure card
  - [ ] Net Position card
  - [ ] Outstanding card
  - [ ] Currency formatting
  - [ ] Icon styling

- [ ] **Tab Navigation** (4 tabs)
  - [ ] Budget tab
  - [ ] Service Charges tab
  - [ ] Invoices tab
  - [ ] Reports tab
  - [ ] Icon sizes (`h-5 w-5`)

- [ ] **Budget Management**
  - [ ] Lock/Unlock button
  - [ ] Create/Edit Budget button
  - [ ] Budget summary cards
  - [ ] Empty state

- [ ] **Service Charges**
  - [ ] Quarter selector dropdown
  - [ ] Generate Demands button
  - [ ] Clear Data button
  - [ ] Summary cards (4 metrics)
  - [ ] Service charges table
  - [ ] Action buttons (View, Record Payment, Send Reminder)

- [ ] **Budget Setup Modal**
  - [ ] Modal container and sizing
  - [ ] Form sections
  - [ ] Input field styling
  - [ ] Warning banners
  - [ ] Submit/Cancel buttons

### 5. **Events** (`/src/pages/Events.tsx`)
- [ ] **Header Section**
  - [ ] Page title and description
  - [ ] "Schedule Event" button

- [ ] **Search & Filters Section**
  - [ ] Search bar with icon
  - [ ] Status filter dropdown
  - [ ] Clear filters button

- [ ] **Event Cards**
  - [ ] Card container styling
  - [ ] Event title typography
  - [ ] Status badges with icons
  - [ ] Event metadata (location, time, assignees)
  - [ ] Action buttons (Edit, workflow actions)

- [ ] **Create Event Modal**
  - [ ] Modal container and sizing
  - [ ] Form fields styling
  - [ ] Date/time inputs
  - [ ] Error display section
  - [ ] Timezone info banner
  - [ ] Submit/Cancel buttons

- [ ] **Edit Event Modal**
  - [ ] Same styling as create modal
  - [ ] Pre-populated form fields

- [ ] **Empty State**
  - [ ] Calendar icon
  - [ ] No events message

### 6. **Settings** (`/src/pages/Settings.tsx`)
- [ ] **Header Section**
  - [ ] Settings icon and title
  - [ ] Description text

- [ ] **Tab Navigation** (6 tabs)
  - [ ] Building Management tab
  - [ ] User Management tab
  - [ ] Financial Setup tab
  - [ ] Security & Access tab
  - [ ] Appearance tab
  - [ ] Testing tab
  - [ ] Custom tab button styling
  - [ ] Active state with background

- [ ] **Tab Content Components**
  - [ ] BuildingManagement component
  - [ ] UserManagement component
  - [ ] FinancialSetup component
  - [ ] SecuritySettings component
  - [ ] AppearanceSettings component
  - [ ] TestingSettings component

### 7. **Login** (`/src/pages/Login.tsx`)
- [ ] **Login Form**
  - [ ] Form container styling
  - [ ] Input field styling
  - [ ] Submit button
  - [ ] Error message display

---

## 🧩 Layout Components

### 1. **Layout** (`/src/components/Layout/Layout.tsx`)
- [ ] **Overall Layout Structure**
  - [ ] Sidebar integration
  - [ ] Header integration
  - [ ] Main content area

### 2. **Sidebar** (`/src/components/Layout/Sidebar.tsx`)
- [ ] **Navigation Items**
  - [ ] NavLink styling
  - [ ] Active state (`bg-primary-100 text-primary-700`)
  - [ ] Inactive hover state
  - [ ] Icon consistency (`h-5 w-5`)

- [ ] **Quick Actions Section**
  - [ ] "New Ticket" button
  - [ ] Button styling

- [ ] **User Profile Section**
  - [ ] Avatar circle
  - [ ] User name typography
  - [ ] Role text styling

### 3. **Header** (`/src/components/Layout/Header.tsx`)
- [ ] **Building Switcher**
  - [ ] Dropdown button styling
  - [ ] Building options
  - [ ] Selected building display

- [ ] **Notification Dropdown**
  - [ ] Bell icon
  - [ ] Notification badge
  - [ ] Dropdown panel styling

---

## 📦 Data Tables & Lists

### 1. **Building Data Tables**
- [ ] **PeopleDataTable** (`/src/components/BuildingData/PeopleDataTable.tsx`)
  - [ ] Table container styling
  - [ ] Header row styling
  - [ ] Cell padding and typography
  - [ ] Action buttons
  - [ ] Search bar
  - [ ] Filter controls

- [ ] **FlatsDataTable** (`/src/components/BuildingData/FlatsDataTableFixed.tsx`)
  - [ ] Same table styling standards
  - [ ] Status badges
  - [ ] Rent amounts formatting

- [ ] **SuppliersDataTable** (`/src/components/BuildingData/SuppliersDataTable.tsx`)
  - [ ] Table styling consistency
  - [ ] Contact information display
  - [ ] Status indicators

- [ ] **AssetsDataTable** (`/src/components/BuildingData/AssetsDataTable.tsx`)
  - [ ] Asset type badges
  - [ ] Maintenance status indicators
  - [ ] Value formatting

### 2. **Generic DataTable** (`/src/components/UI/DataTable.tsx`)
- [ ] **Base Table Styling**
  - [ ] Container (`bg-white rounded-lg shadow-sm border`)
  - [ ] Header styling (`bg-neutral-50`)
  - [ ] Cell padding (`px-6 py-4`)
  - [ ] Hover states (`hover:bg-neutral-50`)
  - [ ] Border colors (`border-neutral-200`)

---

## 🎛️ UI Components

### 1. **Button** (`/src/components/UI/Button.tsx`)
- [ ] **Variant Consistency**
  - [ ] Primary variant (`bg-primary-600`)
  - [ ] Secondary/outline variant
  - [ ] Danger variant (`bg-danger-600`)
  - [ ] Success variant (`bg-success-600`)
  - [ ] Ghost variant

- [ ] **Size Standards**
  - [ ] Small (`sm`) - 32px height
  - [ ] Medium (`md`) - 40px height  
  - [ ] Large (`lg`) - 48px height

- [ ] **Icon Integration**
  - [ ] Left icon spacing (`mr-2`)
  - [ ] Right icon spacing (`ml-2`)
  - [ ] Icon sizes (`h-4 w-4` for md buttons)

### 2. **Input** (`/src/components/UI/Input.tsx`)
- [ ] **Input Field Styling**
  - [ ] Border radius (`rounded-lg`)
  - [ ] Padding (`py-2 px-3`)
  - [ ] Focus states (`focus:ring-2 focus:ring-primary-500`)
  - [ ] Error states (red border)
  - [ ] Disabled states (gray background)

- [ ] **Label Styling**
  - [ ] Typography (`text-sm font-medium text-neutral-900`)
  - [ ] Required indicators (red asterisk)

- [ ] **Help Text & Errors**
  - [ ] Help text styling (`text-sm text-neutral-600`)
  - [ ] Error message styling (`text-sm text-danger-600`)

### 3. **Card** (`/src/components/UI/Card.tsx`)
- [ ] **Card Container**
  - [ ] Background (`bg-white`)
  - [ ] Border radius (`rounded-lg`)
  - [ ] Shadow (`shadow-sm`)
  - [ ] Border (`border border-neutral-200`)

- [ ] **CardHeader**
  - [ ] Header background (`bg-neutral-50`)
  - [ ] Border bottom (`border-b border-neutral-200`)
  - [ ] Padding (`px-6 py-4`)

- [ ] **CardContent**
  - [ ] Content padding (`p-6`)

### 4. **Modal** (`/src/components/UI/Modal.tsx`)
- [ ] **Modal Overlay**
  - [ ] Background (`bg-black bg-opacity-50`)
  - [ ] z-index (`z-modal`)

- [ ] **Modal Container**
  - [ ] Background (`bg-white`)
  - [ ] Border radius (`rounded-xl`)
  - [ ] Shadow (`shadow-xl`)
  - [ ] Max width constraints

- [ ] **Modal Sizes**
  - [ ] Small (`sm`) - 448px
  - [ ] Medium (`md`) - 512px
  - [ ] Large (`lg`) - 768px
  - [ ] Extra Large (`xl`) - 1024px

- [ ] **Modal Header**
  - [ ] Title typography
  - [ ] Close button positioning
  - [ ] Border bottom

- [ ] **Modal Footer**
  - [ ] Button alignment (right)
  - [ ] Button spacing
  - [ ] Border top

---

## 🎫 Ticket-Related Modals

### 1. **CreateTicketModal** (`/src/components/Tickets/CreateTicketModal.tsx`)
- [ ] **Form Layout**
  - [ ] Input field styling
  - [ ] Label positioning
  - [ ] Required indicators
  - [ ] Form spacing (`space-y-4`)

- [ ] **Priority Selection**
  - [ ] Radio button styling
  - [ ] Priority color coding

- [ ] **File Upload**
  - [ ] Upload area styling
  - [ ] File list display

### 2. **TicketDetailModal** (`/src/components/TicketDetailModal.tsx`)
- [ ] **Ticket Information Display**
  - [ ] Title typography
  - [ ] Status badge
  - [ ] Priority badge
  - [ ] Metadata layout

- [ ] **Comments Section**
  - [ ] Comment cards
  - [ ] Comment form
  - [ ] User avatars
  - [ ] Timestamp display

- [ ] **Action Buttons**
  - [ ] Status change buttons
  - [ ] Priority update buttons
  - [ ] Assignment controls

### 3. **Quote Management Modals**
- [ ] **QuoteManagementModal** (`/src/components/Tickets/QuoteManagementModal.tsx`)
  - [ ] Quote comparison table
  - [ ] Supplier selection
  - [ ] Price formatting

- [ ] **SimpleQuoteManagementModal** (`/src/components/Tickets/SimpleQuoteManagementModal.tsx`)
  - [ ] Simplified quote interface
  - [ ] Quick selection buttons

- [ ] **QuoteComparisonModal** (`/src/components/Tickets/QuoteComparisonModal.tsx`)
  - [ ] Side-by-side comparison
  - [ ] Selection indicators
  - [ ] Recommendation badges

### 4. **SupplierSelectionModal** (`/src/components/Suppliers/SupplierSelectionModal.tsx`)
- [ ] **Supplier Cards**
  - [ ] Card layout
  - [ ] Contact information
  - [ ] Rating display
  - [ ] Selection state

---

## 🔔 Notification Components

### 1. **NotificationList** (`/src/components/Notifications/NotificationList.tsx`)
- [ ] **Notification Items**
  - [ ] Card styling
  - [ ] Icon colors
  - [ ] Typography hierarchy
  - [ ] Timestamp formatting

- [ ] **Notification Types**
  - [ ] Success notifications (green)
  - [ ] Error notifications (red)
  - [ ] Warning notifications (yellow)
  - [ ] Info notifications (blue)

### 2. **NotificationDropdown** (`/src/components/Notifications/NotificationDropdown.tsx`)
- [ ] **Dropdown Panel**
  - [ ] Panel styling
  - [ ] Shadow and borders
  - [ ] Animation states

- [ ] **Notification Badge**
  - [ ] Count display
  - [ ] Badge positioning
  - [ ] Color coding

---

## ⚙️ Settings Components

### 1. **BuildingManagement** (`/src/components/Settings/BuildingManagement.tsx`)
- [ ] **Building Cards/List**
  - [ ] Building information display
  - [ ] Status indicators
  - [ ] Action buttons

- [ ] **Add/Edit Building Forms**
  - [ ] Form field styling
  - [ ] Validation messages
  - [ ] Submit/cancel buttons

### 2. **UserManagement** (`/src/components/Settings/UserManagement.tsx`)
- [ ] **User List/Table**
  - [ ] User information display
  - [ ] Role badges
  - [ ] Status indicators
  - [ ] Action controls

- [ ] **User Forms**
  - [ ] Role selection
  - [ ] Permission checkboxes
  - [ ] Building assignments

### 3. **FinancialSetup** (`/src/components/Settings/FinancialSetup.tsx`)
- [ ] **Financial Year Configuration**
  - [ ] Date pickers
  - [ ] Frequency selections
  - [ ] Rate inputs

### 4. **SecuritySettings** (`/src/components/Settings/SecuritySettings.tsx`)
- [ ] **Security Controls**
  - [ ] Toggle switches
  - [ ] Input fields
  - [ ] Warning messages

### 5. **AppearanceSettings** (`/src/components/Settings/AppearanceSettings.tsx`)
- [ ] **Theme Controls**
  - [ ] Color pickers
  - [ ] Preview panels
  - [ ] Reset buttons

---

## 🔍 Search & Filter Components

### 1. **Search Bars** (Multiple locations)
- [ ] **Search Input Structure**
  - [ ] Container with relative positioning
  - [ ] Left-positioned search icon
  - [ ] Proper padding (`pl-9` for icon space)
  - [ ] Placeholder text descriptiveness

- [ ] **Search Bar Styling**
  - [ ] Border radius (`rounded-md`)
  - [ ] Focus states
  - [ ] Icon color (`text-neutral-500`)
  - [ ] Icon size (`h-4 w-4`)

### 2. **Filter Dropdowns** (Multiple locations)
- [ ] **Dropdown Styling**
  - [ ] Consistent height with inputs
  - [ ] Custom chevron icons
  - [ ] Label positioning
  - [ ] Option styling

### 3. **Filter Bars** (Multiple locations)
- [ ] **Layout Structure**
  - [ ] Flex container (`flex items-center space-x-4`)
  - [ ] Search bar flex-1
  - [ ] Filter controls on right
  - [ ] Clear filters button

---

## 📊 Status & Badge Components

### 1. **Status Badges** (Used throughout app)
- [ ] **Ticket Status Badges**
  - [ ] New (`bg-blue-100 text-blue-800`)
  - [ ] Quoting (`bg-yellow-100 text-yellow-800`)
  - [ ] Scheduled (`bg-cyan-100 text-cyan-800`)
  - [ ] Complete (`bg-green-100 text-green-800`)
  - [ ] Closed (`bg-gray-100 text-gray-800`)
  - [ ] Cancelled (`bg-red-100 text-red-800`)

- [ ] **Priority Badges**
  - [ ] Low (`bg-success-100 text-success-800`)
  - [ ] Medium (`bg-warning-100 text-warning-800`)
  - [ ] High/Critical (`bg-danger-100 text-danger-800`)

- [ ] **Badge Styling Consistency**
  - [ ] Shape (`rounded-full`)
  - [ ] Padding (`px-2.5 py-0.5`)
  - [ ] Font size (`text-xs`)
  - [ ] Font weight (`font-medium`)

---

## 🎨 Empty States

### 1. **No Data States** (Multiple locations)
- [ ] **Empty State Structure**
  - [ ] Center alignment
  - [ ] Icon display (`h-12 w-12`)
  - [ ] Title text
  - [ ] Description text
  - [ ] Optional action button

- [ ] **Icon Colors**
  - [ ] Neutral gray (`text-neutral-400`)
  - [ ] Contextual colors where appropriate

---

## 📱 Mobile Responsiveness

### 1. **Mobile Breakpoints**
- [ ] **Small screens** (`< 640px`)
  - [ ] Navigation collapse
  - [ ] Card stacking
  - [ ] Button full-width
  - [ ] Typography scaling

### 2. **Touch Targets**
- [ ] **Minimum sizes** (`44px x 44px`)
  - [ ] All buttons
  - [ ] All links
  - [ ] All form inputs
  - [ ] All interactive elements

### 3. **Mobile-Specific Components**
- [ ] **Bottom navigation** (if implemented)
- [ ] **Hamburger menu** (if implemented)
- [ ] **Mobile modal** sizing

---

## ✅ Quality Assurance Checklist

### 1. **Typography Consistency**
- [ ] **Heading Hierarchy**
  - [ ] H1: `text-3xl font-bold` (30px)
  - [ ] H2: `text-2xl font-bold` (24px)
  - [ ] H3: `text-lg font-semibold` (18px)
  - [ ] H4: `text-base font-semibold` (16px)

- [ ] **Body Text**
  - [ ] Default: `text-sm` (14px)
  - [ ] Small: `text-xs` (12px)

- [ ] **Font Families**
  - [ ] Inter font application
  - [ ] Monospace for system data

### 2. **Color Consistency**
- [ ] **Text Colors**
  - [ ] Primary text: `text-neutral-900`
  - [ ] Secondary text: `text-neutral-600`
  - [ ] Tertiary text: `text-neutral-500`
  - [ ] System data: `text-neutral-500` or monospace

- [ ] **Background Colors**
  - [ ] Page background: `bg-neutral-50`
  - [ ] Card background: `bg-white`
  - [ ] Panel background: `bg-neutral-50`

### 3. **Spacing Consistency**
- [ ] **Padding Standards**
  - [ ] Cards: `p-4` (16px)
  - [ ] Modals: `p-5` (20px)
  - [ ] Table cells: `px-3 py-3` (12px)
  - [ ] Buttons: `py-1.5 px-3` (6px/12px)
  - [ ] Inputs: `py-2 px-3` (8px/12px)

- [ ] **Margin Standards**
  - [ ] Section spacing: 20px
  - [ ] Component spacing: 16px
  - [ ] Element spacing: 8px

### 4. **Border & Shadow Consistency**
- [ ] **Border Radius**
  - [ ] Cards: `rounded-lg` (8px)
  - [ ] Buttons: `rounded-md` (6px)
  - [ ] Inputs: `rounded-lg` (8px)
  - [ ] Modals: `rounded-xl` (12px)
  - [ ] Badges: `rounded-full`

- [ ] **Shadows**
  - [ ] Cards: `shadow-sm`
  - [ ] Modals: `shadow-xl`
  - [ ] Dropdowns: `shadow-md`

### 5. **Interactive States**
- [ ] **Hover States**
  - [ ] Button hover colors
  - [ ] Link hover colors
  - [ ] Card hover effects
  - [ ] Row hover effects

- [ ] **Focus States**
  - [ ] Input focus rings
  - [ ] Button focus rings
  - [ ] Link focus indicators

- [ ] **Active States**
  - [ ] Tab active styles
  - [ ] Navigation active styles
  - [ ] Button active styles

---

## 🔄 Migration Priority

### Phase 1: Core Components (High Priority)
1. [ ] UI/Button.tsx
2. [ ] UI/Input.tsx
3. [ ] UI/Modal.tsx
4. [ ] UI/Card.tsx
5. [ ] Layout/Sidebar.tsx
6. [ ] Layout/Header.tsx

### Phase 2: Main Pages (High Priority)
1. [ ] Dashboard.tsx
2. [ ] TicketsWorkOrders.tsx
3. [ ] BuildingDataManagement.tsx
4. [ ] Finances.tsx

### Phase 3: Secondary Pages (Medium Priority)
1. [ ] Events.tsx
2. [ ] Settings.tsx
3. [ ] Login.tsx

### Phase 4: Modals & Specialized Components (Medium Priority)
1. [ ] CreateTicketModal.tsx
2. [ ] TicketDetailModal.tsx
3. [ ] Quote Management Modals
4. [ ] Settings Components

### Phase 5: Data Tables & Lists (Low Priority)
1. [ ] DataTable.tsx
2. [ ] Building Data Tables
3. [ ] Notification Components

---

## 📝 Testing Checklist

### 1. **Cross-Browser Testing**
- [ ] Chrome 100+
- [ ] Firefox 100+
- [ ] Safari 15+
- [ ] Edge 100+

### 2. **Device Testing**
- [ ] Desktop (1920×1080, 1366×768)
- [ ] Tablet (768×1024, 1024×768)
- [ ] Mobile (375×667, 390×844, 360×640)

### 3. **Accessibility Testing**
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast ratios (4.5:1 minimum)
- [ ] Focus indicators
- [ ] ARIA labels

### 4. **Performance Testing**
- [ ] Page load times
- [ ] Animation performance
- [ ] Bundle size impact

---

**Total Items to Review: ~200+**

**Last Updated:** December 2024  
**Estimated Effort:** 40-60 hours for complete implementation  
**Priority:** High (consistency and user experience)
