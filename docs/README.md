# 📚 Building Management System - Documentation Index

## Quick Links

- 🚀 **[README](../README.md)** - Project overview, quick start
- 👨‍💻 **[Developer Guide](DEVELOPER_GUIDE.md)** - Complete setup, architecture, deployment
- 👤 **[User Guide](USER_GUIDE.md)** - End-user instructions

---

## Documentation Structure

### Core Documentation (Start Here)

#### [README.md](../README.md)
- Project overview and features
- Quick 5-minute setup
- Tech stack summary
- Development commands

#### [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) 
**Complete technical guide covering:**
- System architecture and directory structure
- Firebase setup (Auth, Firestore, Storage, App Check)
- Environment configuration
- Core features and workflows
- Permissions and access control
- Data management and Firestore structure
- Testing strategies
- Deployment (Vercel, Firebase, CI/CD)
- Troubleshooting

#### [USER_GUIDE.md](USER_GUIDE.md)
**End-user manual for:**
- Role-specific workflows (Admin, Manager, Resident, Supplier)
- Feature tutorials (Tickets, Finances, Events)
- Common tasks and how-tos

---

### Reference Documentation

#### [ERROR_CODES.md](ERROR_CODES.md)
Complete error code reference with:
- Error categories (AUTH, DB, STORAGE, PERMISSION, etc.)
- Error codes and messages
- Troubleshooting steps
- User-friendly explanations

#### [SECURITY.md](SECURITY.md)
Security policies and guidelines:
- Vulnerability reporting
- Supported versions
- Security best practices

---

### Setup & Configuration Guides

**All setup instructions consolidated in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**:

- **Firebase Setup** → Setup & Configuration section
  - Project creation, Auth, Firestore, Storage, App Check
  
- **Email Configuration** → Deployment → Email Configuration
  - Gmail/SendGrid setup, templates, Cloud Functions
  
- **CI/CD** → Deployment → CI/CD with GitHub Actions
  - Automated testing, deployment workflows
  
- **Vercel** → Deployment → Vercel Deployment
  - Environment variables, domain setup
  
- **Monitoring** → Deployment → Monitoring & Observability
  - Sentry, Firebase Performance, error tracking

---

### Testing Documentation

#### [TEST_CASES.md](TEST_CASES.md)
Comprehensive test suite documentation:
- Test scenarios and coverage
- E2E test cases
- Authentication tests
- Feature-specific tests

#### [TEST_IDS_REFERENCE.md](TEST_IDS_REFERENCE.md)
Test ID reference for Cypress tests:
- Component test IDs
- Testing best practices

---


---

## Getting Started

### For New Developers
1. Read [README.md](../README.md) for project overview
2. Follow [DEVELOPER_GUIDE.md → Setup & Configuration](DEVELOPER_GUIDE.md#setup--configuration)
3. Review [Core Features](DEVELOPER_GUIDE.md#core-features)
4. Check [Testing](DEVELOPER_GUIDE.md#testing) section

### For End Users
1. Start with [USER_GUIDE.md](USER_GUIDE.md)
2. Find your role-specific section
3. Follow feature tutorials

### For Deployment
1. See [DEVELOPER_GUIDE.md → Deployment](DEVELOPER_GUIDE.md#deployment)
2. All deployment options covered: Firebase, Vercel, CI/CD, Email, Monitoring

### For Troubleshooting
1. Check [DEVELOPER_GUIDE.md → Troubleshooting](DEVELOPER_GUIDE.md#troubleshooting)
2. Review [ERROR_CODES.md](ERROR_CODES.md) for error details
3. Check browser console and Firebase logs

---

## Archive

Historical documentation moved to `Archive/docs-2025-11-26/`:

**Consolidated into DEVELOPER_GUIDE:**
- FIREBASE_APP_CHECK.md, APP_CHECK_SETUP.md, FIREBASE_SETUP.md
- EMAIL_SETUP_GUIDE.md, EMAIL_FUNCTIONALITY.md
- GITHUB_ACTIONS_SETUP.md, VERCEL_DEPLOYMENT.md
- SENTRY_SETUP.md, STAGING_SETUP.md

**Completed work:**
- PRODUCTION_READINESS.md, ERROR_HANDLING_STATUS.md
- FIRESTORE_RULES_CLEANUP.md, SECURITY_AUDIT.md
- TECHNICAL-DEBT.md, WARP.md

---

## Contributing to Documentation

When updating documentation:
1. **Core setup/config** → Update DEVELOPER_GUIDE.md
2. **User workflows** → Update USER_GUIDE.md
3. **New errors** → Add to ERROR_CODES.md
4. **New tests** → Add to TEST_CASES.md
5. Keep this index updated

---

**Last Updated**: 2025-11-26  
**Version**: 1.0  
**Maintained by**: Development Team
