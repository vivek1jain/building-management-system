# Building Management System

A comprehensive building management software with a complete ticket workflow system, built with React, TypeScript, Vite, Tailwind CSS, and Firebase.

## 🚀 Features

### Core Functionality
- **Authentication System**: Secure login/registration with role-based access
- **Ticket Management**: Complete workflow from creation to resolution
- **Supplier Management**: Vendor database and quote management
- **Event Scheduling**: Calendar-based scheduling with supplier coordination
- **Real-time Notifications**: Instant updates and status changes
- **Dashboard Analytics**: Overview of system metrics and KPIs

### User Roles
- **Manager**: Full system access, can manage all tickets and users
- **Requester**: Can create and track tickets, view assigned work
- **Supplier**: Can view assigned tickets, provide quotes, schedule work

### Technical Features
- **Modern UI**: Apple-style design with Tailwind CSS
- **Real-time Updates**: Firebase Firestore for live data synchronization
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Type Safety**: Full TypeScript implementation
- **Testing**: Comprehensive Cypress end-to-end tests

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI, Framer Motion
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Testing**: Cypress E2E Testing
- **State Management**: React Context API
- **Routing**: React Router v6

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd building-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password, Anonymous)
   - Set up Firestore Database
   - Update `src/firebase/config.ts` with your Firebase config

4. **Deploy Firebase rules and indexes**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication:
   - Email/Password
   - Anonymous (for testing)
4. Set up Firestore Database
5. Update `src/firebase/config.ts` with your project credentials

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Usage

### Demo Users
The system includes demo user creation for testing:
- **Manager**: `manager@building.com` / `password123`
- **Supplier**: `supplier@building.com` / `password123`
- **Requester**: `requester@building.com` / `password123`

### Workflow
1. **Login** with demo credentials or create new account
2. **Create Tickets** for maintenance requests
3. **Assign Suppliers** to handle the work
4. **Schedule Events** for on-site work
5. **Track Progress** through the dashboard
6. **Receive Notifications** for updates

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm run test

# Open Cypress UI
npm run test:open

# Run specific test file
npm run test:e2e
```

### Test Coverage
- **Authentication**: Login, registration, role-based access
- **Ticket Management**: CRUD operations, status updates
- **Supplier Management**: Vendor operations, quote handling
- **Scheduling**: Event creation, date/time coordination
- **Navigation**: Route protection, sidebar functionality

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout and navigation
│   ├── Notifications/  # Notification system
│   ├── Quotes/         # Quote management
│   └── Scheduling/     # Event scheduling
├── contexts/           # React Context providers
├── firebase/           # Firebase configuration
├── pages/              # Main application pages
├── services/           # API and business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

cypress/
├── e2e/               # End-to-end tests
├── support/           # Test utilities and commands
└── screenshots/       # Test failure screenshots
```

## 🔒 Security

### Firestore Rules
- Role-based access control
- User data protection
- Secure ticket and event management
- Supplier data isolation

### Authentication
- Secure login/registration
- Session management
- Role-based permissions
- Protected routes

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase deploy
```

### Environment Setup
1. Configure Firebase project
2. Set environment variables
3. Deploy Firestore rules and indexes
4. Build and deploy application

## 📊 Performance

- **Fast Loading**: Vite for rapid development and optimized builds
- **Real-time Updates**: Firebase Firestore for live data
- **Optimized Bundles**: Tree shaking and code splitting
- **Responsive Design**: Mobile-first approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [Firebase Setup Guide](FIREBASE_SETUP.md)
- Review [Test Cases](TEST_CASES.md)
- Open an issue in the repository

## 🎯 Roadmap

- [ ] Advanced reporting and analytics
- [ ] Mobile app development
- [ ] Integration with external systems
- [ ] Advanced scheduling features
- [ ] Multi-tenant support
- [ ] API documentation
- [ ] Performance monitoring
- [ ] Advanced user management

---

**Built with ❤️ using React, TypeScript, and Firebase** 