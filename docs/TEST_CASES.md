# Building Management System - Comprehensive Test Cases

## Test Environment Setup
- **URL**: http://localhost:3012/
- **Browser**: Chrome/Firefox/Safari
- **Test Data**: Mock data automatically loaded in development mode
- **Authentication**: Development mode bypass enabled (auto-login as admin)
- **Buildings**: Riverside Gardens, Victoria Heights, Canary Wharf Towers

---

## 1. Authentication Tests

### 1.1 User Registration
**Test Case**: TC-AUTH-001  
**Description**: Register a new user account  
**Steps**:
1. Navigate to Login page
2. Click "Create Account" link
3. Fill in registration form:
   - Email: test@example.com
   - Password: Test123!
   - Name: Test User
   - Role: Select "Tenant"
4. Click "Create Account" button
**Expected Result**: User account created, redirected to Dashboard
**Status**: ⏳ Pending

### 1.2 User Login
**Test Case**: TC-AUTH-002  
**Description**: Login with existing credentials  
**Steps**:
1. Navigate to Login page
2. Enter email: demo@example.com
3. Enter password: demo123
4. Click "Sign In" button
**Expected Result**: User logged in, redirected to Dashboard
**Status**: ⏳ Pending

### 1.3 Demo User Login
**Test Case**: TC-AUTH-003  
**Description**: Login with demo user credentials  
**Steps**:
1. Navigate to Login page
2. Click "Login as Demo User" button
**Expected Result**: Demo user logged in, redirected to Dashboard
**Status**: ⏳ Pending

### 1.4 User Logout
**Test Case**: TC-AUTH-004  
**Description**: Logout from the application  
**Steps**:
1. Login to the application
2. Click user avatar in header
3. Click "Logout" option
**Expected Result**: User logged out, redirected to Login page
**Status**: ⏳ Pending

---

## 2. Dashboard Tests

### 2.1 Dashboard Load
**Test Case**: TC-DASH-001  
**Description**: Verify dashboard loads with correct data  
**Steps**:
1. Login to the application
2. Navigate to Dashboard
**Expected Result**: 
- Dashboard displays ticket statistics
- Recent tickets shown
- Quick actions available
- Firebase test component shows connection status
**Status**: ⏳ Pending

### 2.2 Dashboard Navigation
**Test Case**: TC-DASH-002  
**Description**: Verify all navigation links work  
**Steps**:
1. On Dashboard, click each navigation link:
   - Dashboard
   - Tickets
   - Create Ticket
   - Suppliers
   - Events
2. Verify each page loads correctly
**Expected Result**: All pages load without errors
**Status**: ⏳ Pending

---

## 3. Ticket Management Tests

### 3.1 Create New Ticket
**Test Case**: TC-TICKET-001  
**Description**: Create a new maintenance ticket  
**Steps**:
1. Navigate to "Create Ticket" page
2. Fill in ticket form:
   - Title: "Test Maintenance Request"
   - Description: "This is a test maintenance request"
   - Priority: Medium
   - Category: Plumbing
   - Location: Apartment 101
3. Upload a test image file
4. Click "Submit Ticket" button
**Expected Result**: Ticket created successfully, redirected to Tickets page
**Status**: ⏳ Pending

### 3.2 View Ticket List
**Test Case**: TC-TICKET-002  
**Description**: View all tickets with filters  
**Steps**:
1. Navigate to "Tickets" page
2. Verify tickets are displayed in list
3. Test filters:
   - Status filter (Open, In Progress, Completed)
   - Priority filter (Low, Medium, High)
   - Category filter
4. Test search functionality
**Expected Result**: Tickets display correctly, filters work
**Status**: ⏳ Pending

### 3.3 View Ticket Details
**Test Case**: TC-TICKET-003  
**Description**: View detailed information of a ticket  
**Steps**:
1. Navigate to "Tickets" page
2. Click on any ticket in the list
3. Verify ticket details page loads
4. Check all information is displayed:
   - Title, description, priority, status
   - Created date, location, category
   - Attached images
   - Status history
**Expected Result**: All ticket details displayed correctly
**Status**: ⏳ Pending

### 3.4 Update Ticket Status
**Test Case**: TC-TICKET-004  
**Description**: Update ticket status  
**Steps**:
1. Open a ticket detail page
2. Click "Update Status" button
3. Select new status (e.g., "In Progress")
4. Add a comment: "Work started"
5. Click "Update" button
**Expected Result**: Status updated, comment added to history
**Status**: ⏳ Pending

### 3.5 Request Quote from Suppliers
**Test Case**: TC-TICKET-005  
**Description**: Request quotes for a ticket  
**Steps**:
1. Open a ticket detail page
2. Click "Request Quote" button
3. Select suppliers from the modal
4. Add quote request details
5. Click "Send Request" button
**Expected Result**: Quote request sent to selected suppliers
**Status**: ⏳ Pending

---

## 4. Supplier Management Tests

### 4.1 View Suppliers List
**Test Case**: TC-SUPPLIER-001  
**Description**: View all suppliers  
**Steps**:
1. Navigate to "Suppliers" page
2. Verify suppliers list displays
3. Check supplier information:
   - Name, contact, specialties
   - Rating, availability
**Expected Result**: Suppliers list displays correctly
**Status**: ⏳ Pending

### 4.2 Add Sample Suppliers
**Test Case**: TC-SUPPLIER-002  
**Description**: Add sample supplier data  
**Steps**:
1. Navigate to "Suppliers" page
2. Click "Add Sample Data" button
3. Verify sample suppliers are added
**Expected Result**: Sample suppliers appear in the list
**Status**: ⏳ Pending

### 4.3 Create New Supplier
**Test Case**: TC-SUPPLIER-003  
**Description**: Create a new supplier manually  
**Steps**:
1. Navigate to "Suppliers" page
2. Click "Add Supplier" button
3. Fill in supplier form:
   - Name: "Test Supplier"
   - Contact: "test@supplier.com"
   - Phone: "555-0123"
   - Specialties: "Plumbing, Electrical"
   - Rating: 4.5
4. Click "Create Supplier" button
**Expected Result**: New supplier created and appears in list
**Status**: ⏳ Pending

---

## 5. Quote Management Tests

### 5.1 Submit Quote
**Test Case**: TC-QUOTE-001  
**Description**: Submit a quote for a ticket  
**Steps**:
1. Navigate to "Suppliers" page
2. Find a supplier with pending quote requests
3. Click "Submit Quote" button
4. Fill in quote form:
   - Amount: $500
   - Description: "Complete repair service"
   - Timeline: "3-5 business days"
5. Click "Submit Quote" button
**Expected Result**: Quote submitted successfully
**Status**: ⏳ Pending

### 5.2 View Quote Requests
**Test Case**: TC-QUOTE-002  
**Description**: View quote requests for suppliers  
**Steps**:
1. Navigate to "Suppliers" page
2. Check suppliers with quote requests
3. Verify quote request details are displayed
**Expected Result**: Quote requests visible for relevant suppliers
**Status**: ⏳ Pending

### 5.3 Compare Quotes
**Test Case**: TC-QUOTE-003  
**Description**: Compare multiple quotes for a ticket  
**Steps**:
1. Open a ticket with multiple quotes
2. Click "Compare Quotes" button
3. Verify quote comparison view
4. Check all quote details are displayed
**Expected Result**: Quote comparison works correctly
**Status**: ⏳ Pending

---

## 6. Building Data Management Tests

### 6.1 Building Selection
**Test Case**: TC-BUILDING-001  
**Description**: Test building selection across all tabs  
**Steps**:
1. Navigate to "Building Data" page
2. Select "Riverside Gardens" from building dropdown
3. Switch between tabs: People, Flats, Suppliers, Assets
4. Verify selected building persists across tabs
5. Change to "Victoria Heights"
6. Verify all data filters to new building
**Expected Result**: Building selection works consistently, data filters correctly
**Status**: ⏳ Pending

### 6.2 People Management
**Test Case**: TC-BUILDING-002  
**Description**: Test people/residents management  
**Steps**:
1. Navigate to "Building Data" → "People" tab
2. Select a building from dropdown
3. Verify residents display for selected building
4. Test search functionality
5. Click on a resident to view details
6. Test status filters (Owner, Tenant, Resident)
**Expected Result**: People data displays correctly, filters work
**Status**: ⏳ Pending

### 6.3 Flats Management
**Test Case**: TC-BUILDING-003  
**Description**: Test flats management functionality  
**Steps**:
1. Navigate to "Building Data" → "Flats" tab
2. Select a building from dropdown
3. Verify flats display for selected building
4. Check flat information: number, floor, bedrooms, area
5. Test search and filter functionality
6. Verify ground rent and maintenance charge data
**Expected Result**: Flats data displays correctly with UK-specific information
**Status**: ⏳ Pending

### 6.4 Suppliers Management
**Test Case**: TC-BUILDING-004  
**Description**: Test suppliers management per building  
**Steps**:
1. Navigate to "Building Data" → "Suppliers" tab
2. Select a building from dropdown
3. Verify suppliers display for selected building
4. Test supplier categories and specialties
5. Check contact information and ratings
6. Test search functionality
**Expected Result**: Suppliers data displays correctly per building
**Status**: ⏳ Pending

### 6.5 Assets Management
**Test Case**: TC-BUILDING-005  
**Description**: Test assets management functionality  
**Steps**:
1. Navigate to "Building Data" → "Assets" tab
2. Select a building from dropdown
3. Verify assets display for selected building
4. Check asset categories: HVAC, Electrical, Plumbing, etc.
5. Test asset status and maintenance information
6. Test search and filter functionality
**Expected Result**: Assets data displays correctly with categories
**Status**: ⏳ Pending

---

## 7. Financial Management Tests

### 7.1 Budget Management
**Test Case**: TC-FINANCE-001  
**Description**: Test budget creation and management  
**Steps**:
1. Navigate to "Finances" page
2. Select a building from dropdown
3. Click "Create Budget" button
4. Fill in budget form:
   - Financial Year: 2024-2025
   - Service Charge Rate: £2.50 per sq ft
   - Ground Rent Rate: £0.50 per sq ft
5. Add income categories with amounts
6. Add expenditure categories with amounts
7. Click "Save Budget" button
**Expected Result**: Budget created successfully, summary cards update
**Status**: ⏳ Pending

### 7.2 Service Charge Management
**Test Case**: TC-FINANCE-002  
**Description**: Test service charge demand generation  
**Steps**:
1. Navigate to "Finances" → "Service Charges" tab
2. Select a building from dropdown
3. Select quarter (Q1-2024)
4. Click "Generate Demands" button
5. Verify service charge demands are created
6. Check demand details: flat number, resident, amount due
7. Verify status indicators and due dates
**Expected Result**: Service charge demands generated correctly
**Status**: ⏳ Pending

### 7.3 Payment Recording
**Test Case**: TC-FINANCE-003  
**Description**: Test payment recording functionality  
**Steps**:
1. Navigate to "Finances" → "Service Charges" tab
2. Find a demand with outstanding amount
3. Click the "Record Payment" button (credit card icon)
4. Fill in payment modal:
   - Payment Amount: £500.00
   - Payment Date: Today's date
5. Click "Record Payment" button
6. Verify payment is recorded and outstanding amount updates
**Expected Result**: Payment recorded successfully, amounts update correctly
**Status**: ⏳ Pending

### 7.4 View Demand Details
**Test Case**: TC-FINANCE-004  
**Description**: Test viewing detailed demand information  
**Steps**:
1. Navigate to "Finances" → "Service Charges" tab
2. Click the "View" button (eye icon) on any demand
3. Verify demand details modal opens
4. Check all information displays:
   - Flat and resident information
   - Financial breakdown (Total Due, Paid, Outstanding)
   - Payment history if available
   - Important dates (Issue Date, Due Date)
5. Test "Record Payment" button from details modal
**Expected Result**: All demand details display correctly
**Status**: ⏳ Pending

### 7.5 Send Reminder
**Test Case**: TC-FINANCE-005  
**Description**: Test sending payment reminders  
**Steps**:
1. Navigate to "Finances" → "Service Charges" tab
2. Find an overdue demand
3. Click the "Send Reminder" button (send icon)
4. Verify notification appears confirming reminder sent
5. Check that reminder action is logged
**Expected Result**: Reminder sent successfully with confirmation
**Status**: ⏳ Pending

---

## 8. Tickets & Work Orders Tests

### 8.1 Unified Workflow View
**Test Case**: TC-WORKFLOW-001  
**Description**: Test unified tickets and work orders workflow  
**Steps**:
1. Navigate to "Tickets & Work Orders" page
2. Verify workflow view displays with 5 stages:
   - New Tickets
   - Manager Review
   - Quote Management
   - Work Orders
   - Completed
3. Check stage counts and progress indicators
4. Test building selection and filtering
**Expected Result**: Workflow view displays correctly with accurate counts
**Status**: ⏳ Pending

### 8.2 Ticket Comments
**Test Case**: TC-WORKFLOW-002  
**Description**: Test ticket commenting functionality  
**Steps**:
1. Navigate to "Tickets & Work Orders" → "Tickets" tab
2. Click on any ticket to open detail modal
3. Scroll to comments section
4. Add a new comment: "Test comment from admin"
5. Click "Add Comment" button
6. Verify comment appears with timestamp and user info
7. Test role-based access (admin can comment on all tickets)
**Expected Result**: Comments work correctly with role-based access
**Status**: ⏳ Pending

### 8.3 Multi-Building Filtering
**Test Case**: TC-WORKFLOW-003  
**Description**: Test multi-building filtering for tickets and work orders  
**Steps**:
1. Navigate to "Tickets & Work Orders" page
2. Select "Riverside Gardens" from building dropdown
3. Verify only tickets for that building display
4. Switch to "Victoria Heights"
5. Verify tickets filter to new building
6. Test across all tabs: Workflow, Tickets, Work Orders
**Expected Result**: Multi-building filtering works consistently
**Status**: ⏳ Pending

---

## 9. Settings Management Tests

### 9.1 Building Management Settings
**Test Case**: TC-SETTINGS-001  
**Description**: Test building management in settings  
**Steps**:
1. Navigate to "Settings" page
2. Verify "Building Management" tab is active by default
3. View existing buildings list
4. Click "Add Building" button
5. Fill in building form:
   - Name: "Test Building"
   - Address: "123 Test Street, London"
   - Units: 25
   - Status: Active
6. Click "Save" button
7. Verify building appears in list
8. Test edit and delete functionality
**Expected Result**: Building management works correctly with CRUD operations
**Status**: ⏳ Pending

### 9.2 User Management Settings
**Test Case**: TC-SETTINGS-002  
**Description**: Test user management functionality  
**Steps**:
1. Navigate to "Settings" → "User Management" tab
2. View existing users list
3. Click "Create User" button
4. Fill in user form:
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Role: Manager
   - Buildings: Select building associations
5. Click "Create User" button
6. Verify user appears in list
7. Test password generation and notifications
**Expected Result**: User management works with role assignments and building associations
**Status**: ⏳ Pending

### 9.3 Financial Setup Settings
**Test Case**: TC-SETTINGS-003  
**Description**: Test financial year and payment setup  
**Steps**:
1. Navigate to "Settings" → "Financial Setup" tab
2. Configure financial year settings:
   - Start Month: April (UK financial year)
   - Budget Lock Date: March 31st
   - Service Charge Frequency: Quarterly
   - Ground Rent Frequency: Annually
3. Click "Save Changes" button
4. Verify settings are saved and notification appears
**Expected Result**: Financial settings save correctly with UK-specific defaults
**Status**: ⏳ Pending

### 9.4 Security Settings
**Test Case**: TC-SETTINGS-004  
**Description**: Test security and access control settings  
**Steps**:
1. Navigate to "Settings" → "Security & Access Control" tab
2. Test domain whitelist functionality:
   - Add domain: "company.com"
   - Verify domain appears in list
   - Remove domain and verify removal
3. Configure authentication settings:
   - Enable email verification
   - Set session timeout: 120 minutes
   - Set max login attempts: 3
4. Test password policy checkboxes
5. Click "Save Changes" button
**Expected Result**: Security settings work correctly with validation
**Status**: ⏳ Pending

---

## 10. Event Management Tests

### 6.1 View Events
**Test Case**: TC-EVENT-001  
**Description**: View building events  
**Steps**:
1. Navigate to "Events" page
2. Verify events are displayed
3. Check event information:
   - Title, description, date
   - Location, organizer
**Expected Result**: Events list displays correctly
**Status**: ⏳ Pending

### 6.2 Create Event
**Test Case**: TC-EVENT-002  
**Description**: Create a new building event  
**Steps**:
1. Navigate to "Events" page
2. Click "Create Event" button
3. Fill in event form:
   - Title: "Test Event"
   - Description: "This is a test event"
   - Date: Tomorrow's date
   - Location: "Community Room"
   - Organizer: "Building Management"
4. Click "Create Event" button
**Expected Result**: New event created and appears in list
**Status**: ⏳ Pending

---

## 7. Notification Tests

### 7.1 View Notifications
**Test Case**: TC-NOTIF-001  
**Description**: View user notifications  
**Steps**:
1. Login to the application
2. Click notification bell icon in header
3. Verify notifications dropdown opens
4. Check notification list
**Expected Result**: Notifications display correctly
**Status**: ⏳ Pending

### 7.2 Mark Notification as Read
**Test Case**: TC-NOTIF-002  
**Description**: Mark notification as read  
**Steps**:
1. Open notifications dropdown
2. Click on an unread notification
3. Verify notification is marked as read
**Expected Result**: Notification status changes to read
**Status**: ⏳ Pending

---

## 8. Responsive Design Tests

### 8.1 Mobile Responsiveness
**Test Case**: TC-RESP-001  
**Description**: Test mobile responsiveness  
**Steps**:
1. Open application in browser
2. Open Developer Tools (F12)
3. Toggle device toolbar
4. Test on different screen sizes:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)
**Expected Result**: UI adapts properly to all screen sizes
**Status**: ⏳ Pending

### 8.2 Sidebar Collapse
**Test Case**: TC-RESP-002  
**Description**: Test sidebar collapse on mobile  
**Steps**:
1. Open application on mobile view
2. Verify sidebar is collapsed by default
3. Click hamburger menu to expand
4. Click outside to collapse
**Expected Result**: Sidebar collapses/expands correctly
**Status**: ⏳ Pending

---

## 9. Error Handling Tests

### 9.1 Network Error Handling
**Test Case**: TC-ERROR-001  
**Description**: Test behavior when offline  
**Steps**:
1. Open application
2. Disconnect internet connection
3. Try to perform actions (create ticket, etc.)
4. Reconnect internet
5. Verify data syncs
**Expected Result**: Graceful error handling, data syncs when reconnected
**Status**: ⏳ Pending

### 9.2 Form Validation
**Test Case**: TC-ERROR-002  
**Description**: Test form validation errors  
**Steps**:
1. Try to submit forms with invalid data:
   - Empty required fields
   - Invalid email format
   - Invalid file types
2. Verify error messages display
**Expected Result**: Appropriate error messages shown
**Status**: ⏳ Pending

---

## 10. Performance Tests

### 10.1 Page Load Performance
**Test Case**: TC-PERF-001  
**Description**: Test page load times  
**Steps**:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Navigate to each page:
   - Dashboard
   - Tickets
   - Suppliers
   - Events
4. Record load times
**Expected Result**: All pages load within 3 seconds
**Status**: ⏳ Pending

### 10.2 Large Data Handling
**Test Case**: TC-PERF-002  
**Description**: Test with large datasets  
**Steps**:
1. Add many sample tickets/suppliers
2. Test pagination and filtering
3. Verify performance doesn't degrade
**Expected Result**: Application remains responsive
**Status**: ⏳ Pending

---

## Test Execution Log
### Test Run #1751347 - [Date: 7/1/2025]
**Tester**: Automated Test Runner  
**Environment**: Local Development  
**Results**:
- Total Tests: 23
- Passed: 23
- Failed: 0
- Skipped: 0

**Notes**: Automated test run - All tests passed

## Test Execution Log
### Test Run #1751344 - [Date: 7/1/2025]
**Tester**: Automated Test Runner  
**Environment**: Local Development  
**Results**:
- Total Tests: 23
- Passed: 22
- Failed: 1
- Skipped: 0

**Notes**: Automated test run - Some tests failed

## Test Execution Log

### Test Run #1 - [Date: ___________]
**Tester**: ___________  
**Environment**: Local Development  
**Results**:
- Total Tests: 25
- Passed: ___
- Failed: ___
- Skipped: ___

**Notes**: ___________


### Test Run #2 - [Date: ___________]
**Tester**: ___________  
**Environment**: Local Development  
**Results**:
- Total Tests: 25
- Passed: ___
- Failed: ___
- Skipped: ___

**Notes**: ___________


---

## Bug Report Template

**Bug ID**: BUG-XXX  
**Title**: [Brief description]  
**Severity**: [Critical/High/Medium/Low]  
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]  
**Actual Result**: [What actually happened]  
**Environment**: [Browser, OS, etc.]  
**Screenshots**: [If applicable]  
**Status**: [Open/In Progress/Fixed/Closed]

---

## Test Automation Notes

For future automation, consider:
- Cypress for E2E testing
- Jest for unit testing
- React Testing Library for component testing
- Firebase Emulator for testing without affecting production data

---

*Last Updated: [Current Date]*
*Version: 1.0* 