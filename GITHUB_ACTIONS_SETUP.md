# GitHub Actions Setup Guide

## Required Secrets

To use the TDD workflow (`.github/workflows/tdd-workflow.yml`), you need to configure the following secrets in your GitHub repository:

### 1. FIREBASE_SERVICE_ACCOUNT

This secret is required for deploying to Firebase Hosting. To set it up:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `FIREBASE_SERVICE_ACCOUNT`
5. Value: Your Firebase service account JSON (as a single line)

#### How to get the Firebase service account JSON:

1. Go to Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Click "Generate new private key"
4. Download the JSON file
5. Copy the entire JSON content and paste it as the secret value

### 2. Optional: GITHUB_TOKEN

This is automatically provided by GitHub, but you can override it if needed.

## Workflow Features

The TDD workflow includes:

- **Quick Tests**: Fast regression tests (2 minutes)
- **Baseline Tests**: Comprehensive test suite (10 minutes)
- **Cross-Browser Tests**: Chrome, Firefox, Edge
- **Performance Tests**: Load time and performance metrics
- **Accessibility Tests**: WCAG compliance checks
- **Security Tests**: Basic security validations
- **Code Quality**: Linting and TypeScript checks
- **Test Summary**: Automated reporting and PR comments
- **Deployment**: Automatic deployment to Firebase on main branch

## Local Testing

Before pushing to GitHub, you can test locally:

```bash
# Run quick regression tests
npm run test:quick

# Run full baseline tests
npm run test:baseline

# Run with specific browser
npm run test:chrome

# Run performance tests
npm run test:performance
```

## Troubleshooting

### Secret Access Issues

If you see "Context access might be invalid" warnings:

1. Ensure the secret is properly configured in GitHub
2. Check that the secret name matches exactly (case-sensitive)
3. Verify the secret value is valid JSON for Firebase service account

### Firebase Deployment Issues

1. Ensure your Firebase project ID matches in the workflow
2. Verify the service account has proper permissions
3. Check that Firebase CLI is properly configured

## Security Notes

- Never commit the Firebase service account JSON to your repository
- Use repository secrets for all sensitive data
- Regularly rotate service account keys
- Limit service account permissions to minimum required 