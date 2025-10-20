Overview
Design a backend data model and API endpoints for a building management application. The system should enable a building manager to:

Configure and raise monthly maintenance demands (invoices) for residents, based on per square foot rates.
Choose whether invoices are combined per resident or per unit, and whether to show a detailed breakdown or just a total.
Set payment due dates and configure email reminders (number and timing).
Configure penalty rules (flat fee, percentage, or both) for late payments, and display penalty calculations on invoices.
Manually record payment receipts, including payment date, mode, reference/transaction number, and notes.
Track all building income (charges, penalties, other inflows) and expenditures (maintenance, salaries, utilities, etc.), with categorization and tagging.
Resident-facing features are out of scope for this version.
Data Model Requirements
Entities
Resident
id
name
email
units (list of Unit IDs)
Unit
id
resident_id
area_sqft
address/identifier
Invoice
id
unit_id (or resident_id if combined)
period (month/year)
breakdown (list of charge items, optional)
total_amount
due_date
status (pending, paid, overdue)
penalty_config (flat, percent, both; amount/percent; grace period)
reminders_config (list of days relative to due date)
penalty_applied (amount, calculation details)
Payment
id
invoice_id
payment_date
payment_mode (cash, cheque, bank transfer, etc.)
reference_number
notes
Income
id
date
amount
source (e.g., building charges, penalty, other)
description
related_invoice_id (optional)
Expenditure
id
date
amount
category (e.g., proactive maintenance, reactive maintenance, salary, utility, other)
description
tag (proactive/reactive for maintenance)
supporting_document_url (optional)
API/Functionality Requirements
Demand/Invoice Creation
Allow manager to select:
Per-unit or per-resident invoicing
Detailed breakdown or total only
Generate invoices for all residents/units for a given period, using per sq. ft. rates and unit areas.
Allow manager to set due date and configure reminders and penalty rules.
Reminders
Send email reminders to residents based on configured schedule (number and timing of reminders).
Store reminder configuration per invoice batch.
Payment Tracking
Manager can manually mark invoice as paid.
Must record payment date, mode, reference/transaction number, and notes.
Penalty Management
Apply penalty if payment is late, based on configured rules (flat, percent, or both).
Show penalty calculation and amount on invoice/statement.
Income Tracking
Automatically record income from payments and penalties.
Allow manager to manually add other income entries (e.g., interest, miscellaneous receipts).
Each income entry should have date, amount, source, description, and optional related invoice.
Expenditure Tracking
Allow manager to record all expenses, with:
Date, amount, category (proactive/reactive maintenance, salary, utility, other), description, and optional supporting document.
Tag maintenance expenses as proactive or reactive.
Support reporting and filtering by category, tag, and date range.
Configuration
All options (invoice grouping, breakdown, reminders, penalty) must be configurable by the manager at the time of demand creation.
Out of Scope
Resident logins and dashboards
Automated payment processing
SMS reminders (for now)
Prompt for Cursor:
Generate the backend data model (using TypeScript interfaces or Prisma schema), and REST API endpoints to support the above requirements. Focus on flexibility and configurability for the building manager. Include example data for each entity.

