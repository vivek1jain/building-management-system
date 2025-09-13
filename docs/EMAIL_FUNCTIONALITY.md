# Email Functionality for Quote Requests

## Overview

When you request quotes from suppliers, the system now includes email notification functionality to inform suppliers about new quote requests.

## How It Works

### 1. Quote Request Process
When you click "Request Quotes" and select suppliers:

1. **Quote Request Created**: A quote request record is created in Firestore
2. **Email Generated**: The system generates a professional email template
3. **Email Logged**: Email details are logged to the `emailLogs` collection
4. **Status Updated**: Ticket status changes to "Quote Requested"

### 2. Email Template Format

The email sent to suppliers includes:

**Subject**: `Quote Request - Ticket #[ID] - [Title]`

**Content**:
- **Header**: Building Management System branding
- **Ticket Details**: ID, title, description, location, urgency, requester
- **Action Required**: Clear instructions and expiration date (7 days)
- **How to Submit**: Step-by-step instructions for submitting quotes
- **Footer**: Automated message disclaimer

### 3. Email Status Tracking

The system tracks email status in the `emailLogs` collection:

- **pending**: Email is queued for sending
- **sent**: Email was successfully sent
- **failed**: Email sending failed

### 4. Email Notification Component

The `EmailNotification` component shows:
- Email status for each supplier
- Timestamp of when emails were sent
- Visual indicators (checkmark, clock, alert icons)

## Implementation Options

### Option 1: Firebase Cloud Functions (Recommended for Production)

The `functions/` directory contains Cloud Functions that:
- Automatically trigger when quote requests are created
- Send actual emails using Nodemailer
- Update email status in Firestore

**Setup Required**:
1. Deploy Cloud Functions: `firebase deploy --only functions`
2. Configure email credentials in Firebase Functions config
3. Set up email service (Gmail, SendGrid, etc.)

### Option 2: Frontend Email Service (Development/Testing)

The `emailService.ts` provides:
- Email template generation
- Email logging for tracking
- Development simulation

**Current Status**: Logs emails to Firestore but doesn't send actual emails

## Email Template Example

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Quote Request - Building Management System</h2>
  
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Ticket Details</h3>
    <p><strong>Ticket ID:</strong> TICKET-001</p>
    <p><strong>Title:</strong> HVAC Repair - Office Building</p>
    <p><strong>Description:</strong> Air conditioning unit not cooling properly...</p>
    <p><strong>Location:</strong> 123 Main St, Suite 200</p>
    <p><strong>Urgency:</strong> High</p>
    <p><strong>Requested By:</strong> John Smith</p>
  </div>

  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Action Required</h3>
    <p>Please review this ticket and submit your quote within 7 days.</p>
    <p><strong>Quote Request Expires:</strong> 12/15/2024</p>
  </div>

  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">How to Submit Your Quote</h3>
    <ol>
      <li>Log into the Building Management System</li>
      <li>Navigate to the Quotes section</li>
      <li>Find this ticket (ID: TICKET-001)</li>
      <li>Click "Submit Quote" and provide your pricing and terms</li>
    </ol>
  </div>
</div>
```

## Configuration

### Environment Variables (for Cloud Functions)

```bash
# Email service configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Firebase Functions config
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

### Email Service Options

1. **Gmail**: Use Gmail SMTP with app passwords
2. **SendGrid**: Professional email service with better deliverability
3. **AWS SES**: Amazon's email service
4. **Mailgun**: Transactional email service

## Testing

### Development Testing
1. Request quotes from suppliers
2. Check browser console for email logs
3. Verify email logs in Firestore
4. Check EmailNotification component for status

### Production Testing
1. Deploy Cloud Functions
2. Configure email credentials
3. Test with real supplier emails
4. Monitor email delivery and bounce rates

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Cloud Functions logs and email credentials
2. **Email status not updating**: Verify Firestore rules allow email log updates
3. **Template not rendering**: Check HTML formatting and special characters

### Debug Steps

1. Check Firebase Functions logs: `firebase functions:log`
2. Verify email credentials are set correctly
3. Test email service connectivity
4. Check Firestore permissions for email logs

## Future Enhancements

1. **Email Templates**: Add more template options and customization
2. **Email Tracking**: Track email opens and clicks
3. **Reminder Emails**: Send follow-up emails for expired requests
4. **Bulk Email**: Send to multiple suppliers in one request
5. **Email Preferences**: Allow suppliers to set email preferences 