# Email Setup Guide for Cloud Functions

## Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

## Step 2: Generate App Password

1. Go to Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" → "2-Step Verification"
3. Scroll down and click "App passwords"
4. Select "Mail" as the app and "Other" as the device
5. Click "Generate"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

## Step 3: Set Firebase Functions Config

Run these commands in your terminal:

```bash
# Set the email user (already done)
firebase functions:config:set email.user="admin@sidesix.co.uk"

# Set the app password (replace YOUR_APP_PASSWORD with the generated password)
firebase functions:config:set email.password="YOUR_APP_PASSWORD"

# Deploy the functions to apply the config
firebase deploy --only functions
```

## Step 4: Test the Email System

1. Go to your app and navigate to a ticket
2. Click "Request Quote" and select suppliers
3. Check the EmailNotification component in the sidebar
4. Monitor Firebase Functions logs: `firebase functions:log`

## Alternative: Use Environment Variables

If you prefer to use environment variables instead of Firebase config:

1. Create a `.env` file in the `functions` directory:
```
EMAIL_USER=admin@sidesix.co.uk
EMAIL_PASSWORD=YOUR_APP_PASSWORD
```

2. Deploy with environment variables:
```bash
firebase deploy --only functions
```

## Troubleshooting

### Common Issues:

1. **Authentication failed**: Make sure you're using an app password, not your regular Gmail password
2. **Functions not triggering**: Check that the functions are deployed and the config is set correctly
3. **Emails not sending**: Check Firebase Functions logs for errors

### Check Functions Logs:
```bash
firebase functions:log
```

### View Current Config:
```bash
firebase functions:config:get
```

## Security Notes

- Never commit app passwords to version control
- Use Firebase Functions config or environment variables for sensitive data
- App passwords are more secure than regular passwords for automated systems 