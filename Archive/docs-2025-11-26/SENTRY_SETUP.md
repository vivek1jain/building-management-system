# Sentry Error Monitoring Setup Guide

## Overview

Sentry provides real-time error tracking and performance monitoring for production applications. This guide will help you set up Sentry for the Building Management System.

## Why Sentry?

- **Real-time Error Tracking**: Get instant notifications when errors occur in production
- **Stack Traces**: See exactly where errors happened with full context
- **User Impact**: Know how many users are affected by each error
- **Performance Monitoring**: Track slow database queries and API calls
- **Session Replay**: Watch user sessions that encountered errors
- **Free Tier**: 5,000 errors/month and 10,000 transactions/month

## Setup Steps

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io/signup/)
2. Sign up with GitHub, Google, or email
3. Create a new project:
   - Platform: **React**
   - Project Name: `building-management-system`
   - Alert frequency: **Alert me on every new issue**

### 2. Install Sentry SDK

```bash
npm install @sentry/react
```

### 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://YOUR_DSN_KEY@YOUR_SENTRY_ORG.ingest.sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_ENVIRONMENT=development
```

**Get your DSN from**: Sentry Dashboard → Settings → Projects → Your Project → Client Keys (DSN)

### 4. Enable Sentry in Code

Edit `src/utils/sentry.ts`:

1. Uncomment the import at the top:
   ```typescript
   import * as Sentry from "@sentry/react";
   ```

2. Uncomment the `Sentry.init()` block in the `initSentry()` function

3. Uncomment the Sentry calls in `captureException()`, `setUserContext()`, and `clearUserContext()`

### 5. Initialize Sentry

Sentry is already configured to initialize automatically in `src/main.tsx`. The initialization will only happen in production when a valid DSN is provided.

### 6. Production Deployment

For Vercel deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   ```
   VITE_SENTRY_DSN=https://YOUR_DSN_KEY@YOUR_SENTRY_ORG.ingest.sentry.io/YOUR_PROJECT_ID
   VITE_SENTRY_ENVIRONMENT=production
   ```
4. Redeploy your application

For other platforms (Netlify, AWS, etc.), add the same environment variables in their respective dashboards.

## Testing Sentry

### Development Testing

1. Set `VITE_SENTRY_DSN` in `.env.local`
2. Run the app: `npm run dev`
3. Check console for "Sentry initialized: development"
4. Create a test error (see below)

### Test Error Button

Add this to any page for testing:

```tsx
<button onClick={() => {
  throw new Error('Test Sentry Error - Please ignore');
}}>
  Test Error Tracking
</button>
```

### Verify in Sentry Dashboard

1. Go to [sentry.io](https://sentry.io)
2. Navigate to **Issues**
3. You should see your test error with full stack trace

## Features Enabled

### Error Tracking
- Automatic capture of unhandled errors and promise rejections
- React Error Boundary integration
- Manual error capture with `captureException()`

### Performance Monitoring
- API call tracking
- Database query performance
- Page load times
- 10% of transactions sampled in production

### Session Replay
- Watch user sessions that encountered errors
- Automatically masks sensitive data
- 10% of normal sessions, 100% of error sessions

### User Context
- Automatically tracks user ID, email, and role
- Cleared on logout for privacy

## Configuration Options

### Sample Rates

In `src/utils/sentry.ts`, you can adjust:

```typescript
tracesSampleRate: 0.1,  // 10% of transactions for performance monitoring
replaysSessionSampleRate: 0.1,  // 10% of normal sessions
replaysOnErrorSampleRate: 1.0,  // 100% of sessions with errors
```

Higher rates = more data but uses your Sentry quota faster.

### Filtering Errors

The `beforeSend` hook filters out:
- Errors from browser extensions
- Non-actionable errors

Add more filters as needed:

```typescript
beforeSend(event, hint) {
  const error = hint.originalException;
  
  // Filter specific errors
  if (error && error.message.includes('ResizeObserver')) {
    return null; // Don't send to Sentry
  }
  
  return event;
}
```

## Best Practices

### 1. Set User Context

In your auth service, after login:

```typescript
import { setUserContext } from '../utils/sentry';

// After successful login
setUserContext({
  id: user.id,
  email: user.email,
  role: user.role,
});
```

### 2. Clear Context on Logout

```typescript
import { clearUserContext } from '../utils/sentry';

// On logout
clearUserContext();
```

### 3. Manual Error Capture

For try-catch blocks where you want to log errors:

```typescript
import { captureException } from '../utils/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    operation: 'riskyOperation',
    userId: currentUser.id,
  });
  // Show user-friendly error message
}
```

### 4. Add Breadcrumbs

For better debugging context:

```typescript
import * as Sentry from '@sentry/react';

Sentry.addBreadcrumb({
  category: 'user-action',
  message: 'User clicked submit button',
  level: 'info',
});
```

## Monitoring and Alerts

### Email Alerts

Configure in Sentry Dashboard:
1. **Settings** → **Projects** → Your Project → **Alerts**
2. Create alert rules for:
   - New issues
   - Issue frequency spikes
   - Error rate increases

### Slack Integration

1. **Settings** → **Integrations** → **Slack**
2. Connect your workspace
3. Configure which alerts go to which channels

### Weekly Digest

- Automatically enabled
- Summary of errors, affected users, and performance
- Sent every Monday morning

## Cost Management

### Free Tier Limits
- 5,000 errors/month
- 10,000 transactions/month
- 50 MB attachments
- 30 days of data retention

### If You Exceed Free Tier
- Sentry will stop accepting new events
- Consider upgrading or adjusting sample rates
- Use filters to exclude non-critical errors

### Monitoring Your Usage
- Dashboard → **Stats** shows current usage
- Set up alerts at 80% of quota

## Troubleshooting

### Sentry Not Initializing

Check:
1. `VITE_SENTRY_DSN` is set correctly
2. Running in production mode (`npm run build && npm run preview`)
3. No console errors during initialization
4. DSN is valid and project exists in Sentry

### Errors Not Appearing

Check:
1. Error occurred in production (dev mode is disabled by default)
2. User has internet connection
3. Not filtered out by `beforeSend` hook
4. Haven't exceeded Sentry quota

### Source Maps Not Working

1. Enable source maps in `vite.config.ts`:
   ```typescript
   build: {
     sourcemap: true,
   }
   ```

2. Install Sentry CLI and upload source maps:
   ```bash
   npm install @sentry/vite-plugin
   ```

3. Configure in `vite.config.ts` (see Sentry docs)

## Security Considerations

### Data Privacy
- Session Replay masks all text and media by default
- Don't log sensitive data (passwords, tokens, PII)
- Use `beforeSend` to filter sensitive information

### PII Scrubbing
Sentry automatically scrubs common PII:
- Credit card numbers
- Social security numbers
- Email addresses (can be configured)

### GDPR Compliance
- Users can request data deletion
- Configure data retention policies
- Document Sentry usage in privacy policy

## Support

- **Sentry Docs**: [docs.sentry.io](https://docs.sentry.io)
- **Discord Community**: [discord.gg/sentry](https://discord.gg/sentry)
- **Support Email**: support@sentry.io (for paid plans)

## Next Steps

After setup:
1. ✅ Test error tracking with a dummy error
2. ✅ Set up user context in auth flow
3. ✅ Configure alert rules
4. ✅ Add to production deployment
5. ✅ Monitor for a week and adjust sample rates
6. ✅ Document in team runbook
