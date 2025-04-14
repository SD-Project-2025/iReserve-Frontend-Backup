# CMSP Frontend Development Guide

This guide provides instructions for developing and testing the CMSP frontend application without a backend.

## Running in Development Mode

In development mode, the application uses mock data and authentication to allow you to test all features without a backend.

1. Create a `.env` file in the root directory:
   \`\`\`
   VITE_API_URL=http://localhost:5000/api/v1
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and navigate to `http://localhost:5173`

## Testing Different User Types

The application supports three types of users:
- Resident (default)
- Staff
- Admin (Staff with admin privileges)

To test different user types, open the browser console and use the following utility functions:

\`\`\`javascript
// Import the utility
import { setTestUserType } from './utils/devUtils'

// Set user type to resident
setTestUserType('resident')

// Set user type to staff
setTestUserType('staff')

// Set user type to admin
setTestUserType('admin')

// Reset development settings
import { resetDevSettings } from './utils/devUtils'
resetDevSettings()
\`\`\`

## Mock Data

The application uses mock data for:
- Facilities
- Bookings
- Events
- Maintenance reports
- Notifications
- Users

You can modify the mock data in `src/services/api.ts` to test different scenarios.

## Authentication

In development mode, the application uses mock authentication. When you click "Sign in with Google", it will automatically log you in with a mock user account.

## API Requests

All API requests are intercepted in development mode and return mock data. This allows you to test all features without a backend.

## Building for Production

When building for production, make sure you have a real backend API available:

\`\`\`bash
npm run build
\`\`\`

The production build will use the real API endpoints and authentication.
