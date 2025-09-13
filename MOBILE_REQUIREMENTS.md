# 📱 Mobile Responsive Requirements Document

**Project**: Building Management System  
**Scope**: Mobile responsive design implementation  
**Target**: Preserve desktop experience while creating mobile-optimized layouts  
**Date**: December 2024

---

## 📋 **Instructions**

Fill out this document offline with your mobile vision details. You can work through each section at your own pace, and we'll implement screen by screen based on your Figma wireframes + this detailed specification.

**How to use this document:**
1. 📷 Attach/reference your Figma wireframe screenshots
2. ✅ Check boxes for features you want
3. ✏️ Fill in specific details and preferences
4. 🎯 Set priorities for implementation order

---

## 🎯 **Overall Mobile Strategy**

### **Breakpoint Strategy**
Define when mobile layouts should activate:

- [ ] **Small Mobile (< 640px)**: iPhone SE, small phones
- [x] **Large Mobile (< 768px)**: Standard smartphones  
- [x] **Tablet (< 1024px)**: iPads, small tablets
- [ ] **Custom breakpoint**: ______px

**Your choice**: Mobile layouts should activate at **768px** and below *(Industry standard for mobile-first responsive design)*

### **General Approach**
- [ ] **Mobile-first**: Start with mobile, enhance for desktop
- [x] **Desktop-first**: Keep desktop, add mobile overrides (RECOMMENDED - preserves current)
- [ ] **Hybrid**: Mix of both approaches

### **Implementation Priority**
Rank these from 1-10 (1 = highest priority):

- [x] Bottom Navigation (**Priority: 1**) *- Most critical for mobile UX*
- [x] Data Tables/Lists (**Priority: 2**) *- Core functionality*
- [x] Forms (**Priority: 3**) *- Essential for user tasks*
- [x] Dashboard (**Priority: 4**) *- First screen users see*
- [x] Modals/Dialogs (**Priority: 5**) *- Important but secondary*
- [x] Settings Pages (**Priority: 6**) *- Less frequently used*
- [x] Authentication (**Priority: 7**) *- Usually works fine on mobile*
- [ ] Other: _____________ (**Priority: ___**)

---

## 🧭 **Navigation & Layout**

### **Header/Top Bar**
**📷 Figma Reference**: [Attach screenshot: mobile-header.png]

**Current desktop header includes**: Logo, Building switcher, Notifications, User menu

**Mobile header should have**:
- [x] Logo (smaller) *- Reduced size for mobile space efficiency*
- [x] Page title (dynamic) *- Shows current screen context*
- [x] Building switcher (simplified) *- Essential but condensed*
- [x] Notifications (icon only) *- Space-efficient, tap to expand*
- [x] User menu (avatar only) *- Profile picture with tap menu*
- [ ] Other: _____________

**Header height on mobile**: 
- [ ] Same as desktop
- [x] Smaller: **56px** *- iOS/Material Design standard mobile header*
- [ ] Responsive based on content

**Sticky behavior**:
- [x] Fixed at top (always visible) *- Best for navigation accessibility*
- [ ] Scrolls with content
- [ ] Hides on scroll down, shows on scroll up
- [ ] Other: _____________

### **Bottom Navigation**
**📷 Figma Reference**: https://www.figma.com/make/gM7FRfpHQHMufjtioJ5WSg/Multi-Page-App-with-Bottom-Navigation

**Current desktop**: Fixed sidebar with full navigation menu

**Mobile navigation should**:
- [ ] **Slide-out drawer** from left
- [ ] **Slide-out drawer** from right  
- [x] **Bottom tab bar** *- Modern mobile app pattern, always visible*
- [ ] **Collapsible accordion** in main content
- [ ] **Full-screen overlay** menu
- [ ] **Other**: _____________

**Bottom Navigation Structure** (5 main tabs):
- [x] **Home** (Dashboard) *- Primary landing, overview metrics*
- [x] **Tickets** *- Work orders, maintenance requests*
- [x] **Finances** *- Budget, invoices, service charges*
- [x] **Building** *- People, Flats, Suppliers, Assets data*
- [x] **More** *- Settings, Events, additional features*

**Navigation behavior**:
- [x] **Always visible** at bottom *- Persistent navigation*
- [x] **Single tap** to switch sections *- Direct navigation*
- [x] **Active state** highlighting *- Clear visual feedback*
- [x] **Icon + label** format *- Better usability than icon-only*

**Building switcher location**:
- [x] Stay in header *- Always accessible, context-aware*
- [ ] Move to navigation menu
- [ ] Move to dashboard
- [ ] Hide completely
- [ ] Other: _____________

### **Bottom Navigation Detailed Specifications**

#### **Navigation Structure**
```
[🏠 Home] [🎫 Tickets] [💰 Finances] [🏢 Building] [⋯ More]
```

#### **Tab Specifications**

**1. Home Tab** 🏠
- **Content**: Dashboard overview, key metrics, quick actions
- **Icon**: House/Home icon
- **Badge**: Urgent items count (optional)

**2. Tickets Tab** 🎫  
- **Content**: Work orders, maintenance requests, ticket management
- **Icon**: Ticket/clipboard icon
- **Badge**: Open tickets count

**3. Finances Tab** 💰
- **Content**: Budget, invoices, service charges, financial overview
- **Icon**: Dollar/pound sign or chart icon
- **Badge**: Pending approvals count (optional)

**4. Building Tab** 🏢
- **Content**: People, Flats, Suppliers, Assets (with horizontal sub-tabs)
- **Icon**: Building/office icon
- **Badge**: None typically

**5. More Tab** ⋯
- **Content**: Settings, Events, Reports, User Profile, Help
- **Icon**: Three dots or grid icon  
- **Badge**: Updates/notifications count (optional)

#### **Navigation Behavior**
- **Height**: 80px (includes safe area padding)
- **Background**: White with subtle shadow/border
- **Active state**: Icon + label color change, possible background highlight
- **Typography**: 12px labels, medium weight
- **Touch targets**: Minimum 44px height
- **Animation**: Smooth transitions between tabs

#### **Responsive Considerations**
- **Portrait**: Full bottom navigation visible
- **Landscape**: May auto-hide on scroll (optional)
- **Safe area**: Proper padding for devices with home indicator

---

## 📊 **Data Tables & Lists**

### **Table Display Strategy**
**📷 Figma Reference**: [Attach screenshots: mobile-tables-*.png]

Current app has tables for: People, Flats, Suppliers, Assets, Tickets, Budgets, etc.

**Mobile table approach**:
- [x] **Card layout**: Convert rows to cards *- Best mobile UX for complex data*
- [ ] **Horizontal scroll**: Keep table, allow scrolling
- [ ] **Accordion rows**: Expandable table rows
- [ ] **List view**: Simplified list format
- [ ] **Hide columns**: Show only essential columns
- [ ] **Tabs/Steps**: Break table into sections
- [ ] **Mixed approach**: Different strategy per table type

### **Card Layout Details** (if selected above)
**Card should display**:
- [x] **Title/Primary field** prominently *- Most important info first*
- [x] **2-3 key fields** below title *- Essential info visible*
- [x] **Status indicators** (badges, colors) *- Quick visual status*
- [x] **Action buttons** (edit, delete, view) *- Common actions accessible*
- [x] **Expand/collapse** for more details *- Progressive disclosure*
- [ ] **Custom layout per table type**

**Card spacing**:
- [x] Full width cards *- Maximizes mobile screen real estate*
- [ ] Cards with margins
- [ ] 2 cards per row (on larger mobile)
- [ ] Custom spacing: _____________

### **Table-Specific Requirements**

#### **People Data Table**
**📷 Reference**: [people-mobile.png]
- **Essential fields**: **Name, Role, Flat/Unit, Phone** *- Key contact info*
- **Secondary fields** (show on expand): **Email, Move-in date, Notes, Emergency contact**
- **Actions needed**: [x] Edit [x] Delete [x] View [x] Contact [ ] Other: ___

#### **Flats Data Table**  
**📷 Reference**: [flats-mobile.png]
- **Essential fields**: **Unit Number, Type, Area (sqft), Status, Monthly Rent** *- Key property info*
- **Secondary fields**: **Floor, Balcony, Parking, Tenant Details, Lease dates**
- **Actions needed**: [x] Edit [x] Delete [x] View [x] Assign [ ] Other: ___

#### **Suppliers Data Table**
**📷 Reference**: [suppliers-mobile.png]  
- **Essential fields**: **Company Name, Service Type, Rating, Phone** *- Key vendor info*
- **Secondary fields**: **Address, Email, Contract details, Last service date**
- **Actions needed**: [x] Edit [x] Delete [x] View [x] Contact [ ] Other: ___

#### **Assets Data Table**
**📷 Reference**: [assets-mobile.png]
- **Essential fields**: **Asset Name, Type, Location, Status, Next Maintenance** *- Key asset tracking*
- **Secondary fields**: **Serial Number, Purchase Date, Warranty, Cost, Supplier**  
- **Actions needed**: [x] Edit [x] Delete [x] View [x] Maintain [ ] Other: ___

#### **Tickets/Work Orders Table**
**📷 Reference**: [tickets-mobile.png]
- **Essential fields**: **Title, Status, Priority, Assigned To, Due Date** *- Key workflow info*
- **Secondary fields**: **Description, Location, Created Date, Estimated Cost, Notes**
- **Actions needed**: [x] View [x] Edit [x] Assign [x] Update Status [ ] Other: ___

### **Search & Filtering**
**Mobile search should**:
- [x] **Sticky search bar** at top *- Always accessible, follows iOS/Android patterns*
- [ ] **Floating search** button
- [ ] **Pull-down search** gesture
- [x] **Integrated with filter** *- Combined search + filter for space efficiency*
- [ ] **Separate search screen**

**Mobile filtering**:
- [x] **Bottom sheet** filter panel *- Standard mobile pattern, doesn't cover content*
- [ ] **Dropdown filters** in header
- [x] **Chip-based** active filters *- Shows applied filters, easy to remove*
- [ ] **Full-screen** filter interface
- [x] **Hide less important** filters *- Show most common, advanced behind "More filters"*

---

## 📝 **Forms & Input**

### **Form Layout**
**📷 Figma Reference**: [Attach screenshots: mobile-forms-*.png]

**Mobile form approach**:
- [x] **Single column** layout (stack all fields) *- Standard mobile form pattern*
- [x] **Grouped sections** with headers *- Logical organization, easier scanning*
- [ ] **Multi-step** forms (wizard approach)
- [ ] **Floating labels** for space efficiency
- [x] **Inline labels** above fields *- Clear, accessible, works with all field types*
- [ ] **Placeholder-only** labels

**Field spacing**:
- [ ] **Tight spacing** for more fields visible
- [x] **Comfortable spacing** for easier touch *- Better UX, follows touch target guidelines*
- [ ] **Responsive spacing** based on device

### **Specific Form Types**

#### **Create/Edit Ticket Form**
**📷 Reference**: [ticket-form-mobile.png]
- **Layout approach**: **Single column with grouped sections** *- Title/Description, Location, Priority, Assignment*
- **File upload behavior**: **Camera + gallery integration** *- Easy photo capture for mobile users*
- **Priority selection**: **Large touch-friendly radio buttons** *- Clear visual hierarchy*
- **Special mobile considerations**: **Auto-location detection, voice-to-text for descriptions**

#### **Building/Flat Forms**
**📷 Reference**: [building-form-mobile.png]
- **Layout approach**: **Single column with logical grouping** *- Basic Info, Address, Features, Financial*
- **Image upload**: **Multiple photo upload with camera integration** *- Essential for property documentation*
- **Address input**: **Map integration or address lookup** *- Reduce typing on mobile*
- **Special considerations**: **Number inputs with mobile-optimized keyboards**

#### **Financial Forms** (Budget, Invoice, etc.)
**📷 Reference**: [financial-form-mobile.png]
- **Layout approach**: **Single column with clear sections** *- Amounts, Categories, Dates, Notes*
- **Number input behavior**: **Mobile-optimized numeric keypad** *- Currency formatting, decimal handling*
- **Date selection**: **Native mobile date pickers** *- Better UX than custom calendars on mobile*
- **Special considerations**: **Clear currency display, easy copy/paste of amounts**

### **Input Components**

**Dropdowns/Selects**:
- [x] **Native mobile picker** (iOS/Android style) *- Better mobile UX, follows platform conventions*
- [ ] **Custom dropdown** (current style)
- [x] **Bottom sheet** selection *- For lists with 5+ items*
- [x] **Full-screen** selection for long lists *- Supplier lists, building lists, etc.*

**Date/Time Pickers**:
- [x] **Native mobile pickers** *- Best mobile experience, platform-consistent*
- [ ] **Custom calendar** widget
- [ ] **Text input** with validation

**File Uploads**:
- [x] **Camera integration** (take photo) *- Essential for ticket photos, property documentation*
- [x] **Photo gallery** access *- Allow selecting existing photos*
- [ ] **Drag and drop** (if supported)
- [x] **Simple file picker** *- Fallback for documents*

---

## 🎛️ **Modals & Overlays**

### **Modal Behavior**
**📷 Figma Reference**: [Attach screenshots: mobile-modals-*.png]

**Mobile modals should**:
- [x] **Full-screen** on mobile *- Maximizes space, prevents content being cut off*
- [ ] **Bottom sheet** style (slide up from bottom)
- [ ] **Centered** but larger than desktop
- [ ] **Drawer** style (slide from side)
- [ ] **Same as desktop** (no changes)

**Modal header**:
- [x] **Close button** (X) in top-right *- Universal mobile pattern*
- [ ] **Back arrow** in top-left
- [ ] **Both** close and back options
- [x] **Text-based** close ("Cancel", "Done") *- Clear action labels*

**Modal footer**:
- [x] **Sticky footer** with actions *- Always accessible, follows mobile patterns*
- [ ] **Inline actions** with content
- [x] **Full-width buttons** *- Touch-friendly, easy to tap*
- [ ] **Split buttons** (Cancel | Save)

### **Specific Modals**

#### **Ticket Detail Modal**
**📷 Reference**: [ticket-modal-mobile.png]
- **Layout**: _____________
- **Image gallery**: _____________
- **Comments section**: _____________
- **Action buttons**: _____________

#### **Settings Modals**
**📷 Reference**: [settings-modal-mobile.png]
- **Layout**: _____________
- **Form organization**: _____________
- **Save behavior**: _____________

---

## 📱 **Dashboard & Main Screens**

### **Dashboard Layout**
**📷 Figma Reference**: [Attach screenshot: mobile-dashboard.png]

**Current dashboard has**: Metrics cards, urgent items, quick actions, recent activity

**Mobile dashboard should**:
- [x] **Stack all elements** vertically *- Natural mobile layout pattern*
- [x] **Prioritize key metrics** at top *- Most important info first*
- [x] **Collapsible sections** *- Progressive disclosure, reduce clutter*
- [ ] **Swipeable cards** for metrics
- [x] **Simplified content** for mobile *- Remove less critical information*
- [ ] **Custom mobile layout**: _____________

**Metric cards**:
- [ ] **Single column** (1 card per row)
- [x] **Two column** (2 cards per row) *- Good balance of info density and readability*
- [ ] **Scrollable row** (horizontal scroll)
- [ ] **Accordion style** (expand to see details)

**Quick actions**:
- [ ] **Keep all actions** in smaller format
- [x] **Show only top 3-4** actions *- Reduce cognitive load, show most important*
- [x] **"More" button** for additional actions *- Progressive disclosure pattern*
- [ ] **Floating action button** (FAB)
- [ ] **Bottom action bar**

### **Building Data Management Page**
**📷 Reference**: [building-data-mobile.png]

**Current has**: Tab navigation (People, Flats, Suppliers, Assets)

**Mobile Building section approach** (accessed via bottom nav "Building" tab):
- [x] **Scrollable tabs** (horizontal scroll) *- Sub-tabs within Building section*
- [ ] **Dropdown tab selector**
- [ ] **Bottom tab bar** *- Used for main navigation only*
- [ ] **Accordion sections** (no tabs)
- [ ] **Separate pages** (no tabs)

**Building sub-sections** (horizontal scrollable tabs):
- **People** - Residents, owners, tenants
- **Flats** - Unit management and details  
- **Suppliers** - Vendor relationships
- **Assets** - Equipment and maintenance

---

## 🎨 **UI Components & Interactions**

### **Button Sizing**
**Touch targets** should be:
- [x] **44px minimum** (Apple guideline) *- iOS Human Interface Guidelines standard*
- [ ] **48px minimum** (Material Design)
- [ ] **Custom size**: ____px minimum

**Button styles on mobile**:
- [x] **Full-width buttons** in forms *- Easy to tap, follows mobile patterns*
- [x] **Grouped buttons** (side by side) *- For Cancel/Save pairs*
- [x] **Icon-only buttons** for actions *- Space-efficient for table actions*
- [ ] **Floating action button** for primary action

### **Touch Interactions**
**Gestures to support**:
- [x] **Swipe to delete** (in lists) *- Standard mobile pattern for list items*
- [x] **Pull to refresh** *- Expected behavior for data lists*
- [ ] **Swipe navigation** (between screens)
- [x] **Pinch to zoom** (for images) *- Essential for viewing photos*
- [x] **Long press** for context menus *- Alternative to right-click on mobile*
- [ ] **Double tap** actions

### **Loading & Feedback**
**Loading states**:
- [x] **Skeleton screens** while loading *- Better perceived performance*
- [x] **Spinner indicators** *- For quick operations*
- [x] **Progress bars** for uploads *- Show upload progress*
- [x] **Toast messages** for feedback *- Non-intrusive success/error messages*
- [x] **Pull-to-refresh** indicators *- Visual feedback for refresh gesture*

---

## 🎯 **Content Priority & Information Architecture**

### **Information Hierarchy**
**Most important content on mobile** (rank 1-10):
- [x] Bottom Navigation (**Rank: 1**) *- Essential for app navigation*
- [x] Search functionality (**Rank: 2**) *- Quick access to data*
- [x] Primary actions (Create ticket, etc.) (**Rank: 3**) *- Core user tasks*
- [x] Status/notifications (**Rank: 4**) *- Critical updates*
- [x] Recent items (**Rank: 5**) *- Contextual information*
- [x] Detailed data tables (**Rank: 6**) *- Important but space-constrained*
- [x] Analytics/reports (**Rank: 8**) *- Better suited for desktop*
- [x] Settings (**Rank: 7**) *- Less frequently accessed*

### **Content to Hide/Minimize on Mobile**
**Less important elements** that can be hidden or moved:
- [x] Detailed descriptions *- Move to expandable sections or separate screens*
- [x] Non-essential form fields *- Progressive form disclosure*
- [x] Advanced filters *- Behind "Advanced" or "More filters" toggle*
- [x] Bulk actions *- Less common on mobile, move to menu*
- [x] Detailed analytics *- Better suited for desktop viewing*
- [x] Help text *- Move to help icons or separate help section*
- [ ] Other: _____________

### **Progressive Disclosure**
**Information to show on demand**:
- [x] **"Show more"** buttons for details *- Expand descriptions, additional fields*
- [x] **Expandable sections** *- Card details, form sections*
- [x] **Secondary navigation** in drawers *- Sub-menus, less common actions*
- [x] **Advanced options** behind "Advanced" toggle *- Complex settings, filters*
- [x] **Detailed views** on separate screens *- Full item details, comprehensive forms*

---

## 🧪 **Testing & Device Targets**

### **Primary Test Devices**
**Most important devices to support**:
- [x] **iPhone SE** (375px) - Small mobile *- Minimum viable mobile experience*
- [x] **iPhone 12/13** (390px) - Standard mobile *- Most common iOS device*
- [x] **iPhone Pro Max** (414px) - Large mobile *- High-end mobile experience*
- [x] **Android** (360px-414px) - Various sizes *- Largest mobile user base*
- [x] **iPad** (768px) - Tablet *- Important for property managers*
- [ ] **iPad Pro** (1024px) - Large tablet

**Your primary target**: **iPhone 12/13 (390px)** *- Most common mobile device*

### **Performance Considerations**
**Mobile performance priorities**:
- [x] **Fast initial load** (<3 seconds) *- Critical for mobile user retention*
- [x] **Smooth scrolling** (60fps) *- Essential for good mobile UX*
- [x] **Quick navigation** transitions *- Snappy app-like feel*
- [x] **Efficient data loading** (pagination, lazy load) *- Important for mobile data usage*
- [x] **Offline capability** (basic functionality) *- View cached data when offline*

---

## 📝 **Implementation Notes**

### **Technical Constraints**
**Things to consider**:
- [x] Must preserve all **desktop functionality** *- No feature regression*
- [x] Should work with **existing authentication** *- Seamless login experience*
- [x] Need to maintain **real-time updates** *- Firebase real-time still works*
- [x] Should support **file uploads** on mobile *- Essential for tickets, photos*
- [x] Must work **offline** (basic features) *- View cached data, basic navigation*

### **Special Requirements**
**Unique mobile features needed**:
- [x] **Camera integration** for ticket photos *- Major mobile advantage over desktop*
- [ ] **Location services** for building check-ins
- [x] **Push notifications** *- Keep users engaged, alert for urgent tickets*
- [ ] **Touch/Face ID** authentication
- [x] **Share functionality** (reports, tickets) *- Native mobile sharing*
- [ ] **Print support** from mobile
- [ ] **Other**: _____________

### **Browser Support**
**Mobile browsers to support**:
- [x] **Safari** (iOS) *- Required for iOS users*
- [x] **Chrome** (Android/iOS) *- Most popular mobile browser*
- [x] **Firefox** (Android) *- Significant Android user base*
- [ ] **Samsung Internet**
- [ ] **Other**: _____________

---

## 🚀 **Implementation Plan**

### **Phase 1: Foundation** (Essential mobile structure)
**Your priorities for first implementation**:
1. **Bottom navigation bar (5 tabs: Home, Tickets, Finances, Building, More)** *- Critical for mobile UX*
2. **Responsive header (logo, page title, building switcher, notifications)** *- Context-aware header*
3. **Dashboard mobile layout (stacked cards, simplified)** *- Home tab content*
4. **Basic responsive layout structure with bottom nav space** *- Foundation for all other screens*

### **Phase 2: Content** (Data display and forms)
**Second priority features**:
1. **Data tables to cards conversion (People, Flats, Suppliers, Assets)** *- Core functionality*
2. **Mobile form layouts (single column, touch-friendly)** *- Essential for user tasks*
3. **Search and filtering (sticky search, bottom sheet filters)** *- Data discoverability*

### **Phase 3: Enhancement** (Polish and advanced features)
**Nice-to-have features**:
1. **Camera integration for file uploads** *- Mobile-specific enhancement*
2. **Touch gestures (swipe to delete, pull to refresh)** *- Native mobile feel*
3. **Push notifications and offline capability** *- Advanced mobile features*

---

## 💬 **Notes & Additional Requirements**

### **Inspiration**
**Apps with mobile patterns you like**:
- App name: **Instagram** (what you like: **Bottom navigation, clean tabs, icon + label design**)
- App name: **Twitter/X** (what you like: **Persistent bottom nav, badge notifications, smooth transitions**)
- Figma Reference: **Multi-Page App with Bottom Navigation** (what you like: **Clean bottom nav design, modern mobile layout patterns**)

### **Must-Have Features**
**Absolutely essential for your mobile experience**:
- **Bottom navigation with 5 main tabs (Home, Tickets, Finances, Building, More)** *- Core mobile navigation pattern*
- **Data tables converted to mobile cards** *- Essential for viewing property data*
- **Touch-friendly forms with proper spacing** *- Critical for mobile task completion*

### **Nice-to-Have Features**  
**Would be great but not critical**:
- **Camera integration for ticket photos** *- Convenience feature*
- **Swipe gestures (pull to refresh, swipe to delete)** *- Native mobile feel*
- **Push notifications for urgent tickets** *- User engagement*

### **Concerns & Questions**
**Things you're worried about or unsure of**:
- _____________
- _____________
- _____________

### **Additional Notes**
**Anything else important to consider**:
_____________
_____________
_____________

---

## 📋 **Completion Checklist**

Before sharing this document, ensure you've:
- [ ] **Attached Figma wireframe screenshots** for key screens
- [ ] **Set breakpoint strategy** and priorities
- [ ] **Defined navigation approach** (hamburger, tabs, etc.)
- [ ] **Specified table/data display** strategy  
- [ ] **Outlined form layouts** and input behaviors
- [ ] **Described modal behavior** preferences
- [ ] **Set content priorities** and information hierarchy
- [ ] **Listed must-have vs. nice-to-have** features
- [ ] **Added any special requirements** or constraints

---

**Ready to share?** Once you've completed this document, we can start implementing screen by screen, using your Figma wireframes as the visual guide and this document as the detailed specification! 🚀

**Questions while filling this out?** Feel free to ask for clarification on any section.
