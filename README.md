# iReserve-Frontend
[![codecov](https://codecov.io/gh/SD-Project-2025/iReserve-Frontend-Backup/graph/badge.svg?token=dZ53gSdc1G)](https://codecov.io/gh/SD-Project-2025/iReserve-Frontend-Backup)

**iReserve Web Application UI**

A responsive frontend application for managing community sports facilities, bookings, events, and maintenance — designed to empower residents, staff, and administrators through a seamless user experience.

---

## 🚀 Features

🌐 **Modern Web Interface:** Intuitive dashboard for booking, maintenance, and event tracking  
🔐 **Role-Based Access:**
- **Resident**: Book facilities, report maintenance, register for events  
- **Staff**: Manage bookings and maintenance reports  
- **Admin**: Full control — manage users, facilities, events, and reports  

📅 **Facility Booking:** View real-time availability and reserve time slots  
🛠️ **Maintenance Reporting:** Residents report issues, staff updates progress  
🎉 **Event Management:** Create and view events with resident registration  
📊 **Reporting Dashboard:** Usage analytics, exportable reports (CSV/PDF)  
📣 **Notification System:** In-app alerts for events, bookings, and maintenance  
☁️ **Weather Alerts (Bonus):** Notifications for weather-related disruptions  

---

## 🛠️ Tech Stack

- **Frontend Framework:** React.js + Vite
- **UI Library:** Material UI (MUI)
- **Routing:** React Router v6
- **State Management:** React Context API
- **Charts:** Chart.js / Recharts
- **PDF Export:** html2canvas, jsPDF
- **Notifications:** Toastify
- **Testing:** Jest, React Testing Library
- **CI/CD:** GitHub Actions (planned)

---

## 📦 Getting Started

### ✅ Prerequisites

- Node.js v18+
- Access to the iReserve backend API (see `iReserve-backend`)

---


##📥 Installation
# Clone the repository
git clone https://github.com/SD-Project-2025/iReserve-frontend.git
cd iReserve-frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# 📁 Project Structure
bash
Copy
Edit
src/
│
├── components/          # Shared UI components (Navbar, Sidebar, etc.)
├── pages/               # Page components by route (Dashboard, Bookings, etc.)
├── context/             # Auth and global state management
├── hooks/               # Custom React hooks
├── utils/               # Utility functions (e.g., API helpers, PDF export)
├── assets/              # Static images, logos, icons
└── App.jsx              # App root with routes

🧪 Testing
bash
Copy
Edit
# Run tests
npm test

# Run test coverage
npm run test:coverage
Aim for 80%+ coverage

Write tests for all critical features

📖 Usage
Residents can:

Browse and book facilities

Submit maintenance reports

Register for events

Staff can:

Approve/reject bookings

Manage and update maintenance reports

View event registration data

Admins can:

Manage users, assign roles

Create facilities and events

Access dashboards and download reports

📊 Report Features
Facility Usage Trends

Maintenance Reports (Open vs Closed)

Custom Report Views
→ All exportable as CSV or PDF

🚧 Coming Soon
PWA support for mobile access

Advanced filters for reports

Email + push notification integration

Dark mode UI toggle

Role management interface

📮 Contact
For any frontend-related issues or contributions, contact:
📧 Frontend Team – frontend@ireserve-system.com
🌐 Project: ireserve-frontend

### ⚙️ Environment Variables

Create a `.env` file using `.env.example` with the following variables:

```env
VITE_API_BASE_URL=https://your-backend-api.com/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id


