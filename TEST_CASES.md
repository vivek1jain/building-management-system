# Building Management System - Test Cases

## Test Environment Setup
- **URL**: http://localhost:3003/
- **Browser**: Chrome/Firefox/Safari
- **Test Data**: Sample data available via "Add Sample Data" buttons

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

## 6. Events Management Tests

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