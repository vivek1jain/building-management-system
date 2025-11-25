# Building Management System - User Guide

**For**: Managers, Admins, and Residents  
**Version**: 1.0  
**Last Updated**: November 2025

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [For Admins & Managers](#for-admins--managers)
3. [For Residents](#for-residents)
4. [Common Tasks](#common-tasks)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Getting Started

### First Time Login

1. **Receiving Your Invitation**
   - You'll receive an email with an invitation link
   - Click the link to create your account
   - Set your password (minimum 8 characters)
   - Complete your profile information

2. **Logging In**
   - Go to the application URL
   - Enter your email and password
   - Click "Sign In"

3. **Understanding Your View**
   - Your dashboard shows information based on your role
   - **Admins** see all buildings and full management features
   - **Managers** see assigned buildings and operational features
   - **Residents** see personal information and building updates

---

## For Admins & Managers

### Dashboard Overview

When you log in, you'll see:
- **Tickets**: Current maintenance requests and their status
- **Finances**: Service charges, expenses, and building finances
- **Reports**: Occupancy rates and property statistics
- **Events**: Upcoming building events
- **Recent Activity**: Latest ticket updates

### Managing Users

**Location**: Settings → Users tab

#### Inviting New Users

1. Click "Invite User" button
2. Enter user details:
   - Email address
   - Name
   - Role (Admin, Manager, Resident, or Supplier)
   - Phone number (optional)
   - Select building(s) they should access

3. **For Residents**:
   - Enter their flat number
   - Select status: Owner or Tenant
   - Add any additional notes

4. **For Suppliers**:
   - Enter company name
   - System will create supplier profile automatically

5. Click "Send Invitation"
6. User receives email with invitation link
7. They create their account and are automatically assigned to selected building(s)

#### Managing Existing Users

- **View User**: Click on any user to see their details
- **Edit User**: Admins can change roles and status
- **Deactivate User**: Admins can deactivate accounts (doesn't delete data)
- **Delete User**: Admins only - permanently removes user

#### User Roles Explained

| Role | What They Can Do |
|------|------------------|
| **Admin** | Full system access, manage all buildings, change user roles |
| **Manager** | Manage assigned buildings, handle tickets, finances, and users |
| **Resident** | View own tickets, payments, and profile; create tickets |
| **Supplier** | View assigned tickets, update status, no building access |

### Managing Buildings

**Location**: Settings → Buildings tab

#### Adding a New Building

1. Click "Add Building" button
2. Enter building details:
   - Building name
   - Address
   - Number of units
   - Contact information
3. Click "Save"

#### Editing Building Details

1. Click on building name
2. Update information
3. Save changes

### Managing Flats

**Location**: Building Data → Flats tab

#### Adding Flats

1. Click "Add Flat"
2. Enter flat details:
   - Flat number
   - Floor and block (if applicable)
   - Bedrooms and bathrooms
   - Area (square feet)
   - Ground rent and frequency
   - Service charge and frequency
3. Save

#### Assigning Residents to Flats

1. Go to Building Data → People tab
2. Click "Add Person" or edit existing person
3. Select their flat from dropdown
4. Choose status: Owner or Tenant
5. Add move-in date and emergency contact
6. Save

### Ticketing System

**Location**: Ticketing page

#### Creating a Ticket

1. Click "+ New Ticket" button
2. Fill in ticket details:
   - Title (brief description)
   - Category (Plumbing, Electrical, etc.)
   - Priority (Low, Medium, High, Critical)
   - Location (flat number if applicable)
   - Detailed description
   - Photos (optional)
3. Click "Create Ticket"

#### Managing Tickets

**Ticket Workflow**:
1. **Triage**: Initial review needed
2. **Open**: Acknowledged, awaiting action
3. **Quoted**: Waiting for supplier quotes
4. **Approved**: Quote approved, ready to schedule
5. **Scheduled**: Work appointment set
6. **In Progress**: Work underway
7. **Complete**: Work finished

**Actions You Can Take**:
- **Assign Supplier**: Select contractor from list
- **Request Quote**: Ask supplier for price estimate
- **Approve Quote**: Authorize work to proceed
- **Schedule Work**: Set appointment date/time
- **Add Comments**: Communicate with team
- **Upload Photos**: Document before/after
- **Close Ticket**: Mark as complete

### Financial Management

**Location**: Finances page

#### Overview

View building financial health:
- **Service Charges**: Collected vs demanded
- **Expenses**: Spending by category
- **Invoices**: Vendor bills status
- **Net Position**: Overall financial position

#### Creating Service Charge Demands

1. Go to Finances → Service Charges tab
2. Click "Create Demand"
3. Select:
   - Financial year
   - Period (Q1, Q2, Q3, Q4)
   - Billing date
4. System calculates charges per flat based on:
   - Flat area (sq ft)
   - Service charge rate per sq ft
   - Frequency setting
5. Review and confirm
6. Charges appear in residents' accounts

#### Recording Expenses

1. Go to Finances → Expenses tab
2. Click "Add Expense"
3. Enter:
   - Description
   - Amount
   - Category
   - Date
   - Supplier (if applicable)
4. Attach receipt/invoice (optional)
5. Save

#### Managing Resident Accounts

1. Go to Finances → Resident Accounts
2. View each flat's account:
   - Current balance (positive = owed, negative = credit)
   - Payment history
   - Service charge demands
   - Credits applied
3. Record payments manually
4. Apply credits to balances

### Events Management

**Location**: Events page

#### Creating an Event

1. Click "Create Event"
2. Enter details:
   - Event name
   - Date and time
   - Location
   - Description
   - Visibility (Public or Residents Only)
3. Enable RSVP if needed
4. Save

#### Managing RSVPs

- View attendee list
- Track confirmed attendees
- Send reminders (future feature)

### Reports

**Location**: Reports page

View analytics and insights:
- **Occupancy Rate**: Percentage of occupied flats
- **Ticket Trends**: Response times and completion rates
- **Financial Summary**: Income vs expenses over time
- **Service Charge Collection**: Payment compliance

---

## For Residents

### Your Dashboard

When you log in, you'll see:
- **My Tickets**: Your maintenance requests
- **Events**: Upcoming building events
- **Recent Activity**: Latest updates on your tickets

### My Payments

**Location**: My Payments (in navigation)

View your account status:
- **Current Balance**: Amount owed or credit on account
- **Available Credit**: Prepayments/overpayments
- **Total Paid**: Lifetime payment history
- **Account Information**: Your flat details

#### Understanding Your Balance

- **Positive balance** (red): You owe service charges
- **Zero balance** (green): Account up to date
- **Negative balance** (credit): You have prepaid/overpaid

#### Payment Due Notice

If you have outstanding charges:
1. Contact building management for payment instructions
2. Always include your flat number as payment reference
3. Payments typically take 2-3 business days to reflect

### My Profile

**Location**: My Profile (in navigation)

View your information:
- **Personal Info**: Name, email, phone
- **Status**: Owner or Tenant
- **Flat Details**: Number, floor, bedrooms, size
- **Move-In Date**: When you moved in
- **Emergency Contact**: Backup contact person

**To Update Your Information**:
Contact building management - they'll update your profile

### Creating a Ticket

**Location**: Ticketing page

#### Reporting a Maintenance Issue

1. Click "+ New Ticket"
2. Describe the problem:
   - Clear, specific title
   - Select category (Plumbing, Electrical, etc.)
   - Choose priority:
     - **Low**: Can wait, non-urgent
     - **Medium**: Needs attention soon
     - **High**: Important, needs quick response
     - **Critical**: Emergency (water leak, no heat, etc.)
3. Add details:
   - What's wrong?
   - Where is it located?
   - When did it start?
4. Attach photos if helpful
5. Click "Create Ticket"

#### What Happens Next

1. Management reviews your ticket
2. They may assign a supplier/contractor
3. You'll see status updates:
   - **Scheduled**: Appointment set (date/time shown)
   - **In Progress**: Work underway
   - **Complete**: Work finished
4. You can add comments to communicate with management

#### What You Can See

- Ticket title and description
- Current status and progress
- Scheduled appointment (if set)
- Comments and updates
- Resolution notes when complete

#### What You Cannot See

- Pricing and quote details
- Supplier selection process
- Internal management notes
- Invoice information

### Viewing Events

**Location**: Events page

- See all upcoming building events
- View event details (date, time, location)
- RSVP if enabled
- Add to your calendar

**You Cannot**:
- Create or edit events
- Delete events
- These actions are manager-only

---

## Common Tasks

### Changing Your Password

1. Log out
2. Click "Forgot Password" on login page
3. Enter your email
4. Check email for reset link
5. Create new password

### Updating Your Email

Contact building management - email changes require admin action for security

### Getting Help

- **Technical Issues**: Contact your building management
- **Account Questions**: Building management can assist
- **Payment Queries**: Speak with management about your account

---

## Troubleshooting

### I Can't Log In

**Solutions**:
1. Check you're using correct email
2. Verify password (case-sensitive)
3. Try "Forgot Password" to reset
4. Clear browser cache and cookies
5. Try different browser
6. Contact management if still stuck

### I Don't See My Building

**For Residents**:
- You only see your assigned building
- Contact management if building assignment is incorrect

**For Managers**:
- You see only buildings you're assigned to
- Contact admin to add building access

### My Balance Looks Wrong

1. Check payment reference used (should be your flat number)
2. Payments take 2-3 days to process
3. Contact management with payment details

### I Can't See a Feature

**This is normal** - different roles see different features:

- **Admins**: See everything
- **Managers**: See operational features
- **Residents**: See personal information only

If you believe you should have access, contact management

### Ticket Not Updating

- Refresh the page
- Check Recent Activity feed
- Management will update ticket when status changes
- Some delays are normal during work scheduling

---

## FAQ

### General Questions

**Q: How often are service charges billed?**  
A: Typically quarterly (every 3 months), but check with your building

**Q: Can I pay service charges in advance?**  
A: Yes, any overpayment becomes credit on your account

**Q: How long does maintenance take?**  
A: Varies by issue - critical issues prioritized, others scheduled based on urgency

**Q: Can I request a specific tradesperson?**  
A: Management assigns suppliers based on availability and expertise

### For Residents

**Q: How do I report an emergency?**  
A: Create a ticket with "Critical" priority, or call building emergency number if after hours

**Q: Can I see other residents' information?**  
A: No, you only see your own profile for privacy

**Q: How do I pay my service charges?**  
A: Contact management for bank details and payment instructions

**Q: Can I sublet my flat?**  
A: Check your lease agreement and contact management

### For Managers

**Q: How do I give someone access to additional buildings?**  
A: Settings → Users → Edit user → Update building assignments

**Q: Can residents see financial details?**  
A: No, residents only see their own account balance, not building finances

**Q: How do I remove someone's access?**  
A: Settings → Users → Deactivate or Delete user (Admins only)

**Q: Can I create custom ticket categories?**  
A: This requires development work - contact system administrator

---

## Need More Help?

### Contact Information

- **Building Management**: Contact your property manager
- **Technical Support**: Refer to developer/admin
- **Account Issues**: Building management handles all account matters

### Providing Feedback

Your feedback helps improve the system. Share suggestions with building management.

---

**Document Version**: 1.0  
**Last Updated**: November 2025
