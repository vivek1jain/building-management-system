# Testing the Email System

## Prerequisites
- ✅ Cloud Functions deployed
- ✅ Email credentials configured
- ✅ Supplier emails updated to admin@sidesix.co.uk

## Test Steps

### 1. Update Supplier Emails
1. Go to your app and find the TestFirebase component
2. Click "Update All Emails to admin@sidesix.co.uk"
3. Verify all suppliers now show admin@sidesix.co.uk

### 2. Request Quotes
1. Navigate to any ticket (or create a new one)
2. Click "Request Quote" button
3. Select one or more suppliers
4. Click "Request Quotes" in the modal
5. You should see a success notification

### 3. Check Email Status
1. Look at the EmailNotification component in the ticket sidebar
2. You should see email status for each supplier
3. Status should show "pending" initially, then "sent" if emails are working

### 4. Monitor Functions Logs
```bash
firebase functions:log
```
Look for:
- `sendQuoteRequestEmail` function execution
- Email sending success/failure messages
- Any error messages

### 5. Check Your Email
- Check admin@sidesix.co.uk inbox
- Look for emails with subject: "Quote Request - Ticket #[ID] - [Title]"
- Verify email content includes ticket details and instructions

## Expected Email Format

**Subject**: `Quote Request - Ticket #[ID] - [Title]`

**Content**:
- Professional HTML email with Building Management System branding
- Ticket details (ID, title, description, location, urgency)
- Action required section with 7-day expiration
- Step-by-step instructions for submitting quotes
- Professional styling and footer

## Troubleshooting

### If Emails Don't Send:
1. Check Firebase Functions logs for errors
2. Verify email credentials are set correctly
3. Ensure Gmail app password is valid
4. Check if 2FA is enabled on the Gmail account

### If Functions Don't Trigger:
1. Verify functions are deployed: `firebase functions:list`
2. Check Firestore rules allow quote creation
3. Ensure quote documents are being created in the correct collection

### If Email Status Doesn't Update:
1. Check EmailNotification component is working
2. Verify emailLogs collection is being updated
3. Check browser console for any errors

## Success Indicators

✅ **Email System Working**:
- Functions logs show successful email sending
- admin@sidesix.co.uk receives professional quote request emails
- EmailNotification component shows "sent" status
- No errors in Firebase Functions logs

✅ **Complete Workflow**:
- Quote requests create records in Firestore
- Cloud Functions automatically trigger
- Emails are sent to suppliers
- Email status is tracked and displayed
- Ticket status updates to "Quote Requested" 