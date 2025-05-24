# iReserve-Frontend
[![codecov](https://codecov.io/gh/SD-Project-2025/iReserve-Frontend-Backup/graph/badge.svg?token=dZ53gSdc1G)](https://codecov.io/gh/SD-Project-2025/iReserve-Frontend-Backup)

# iReserve-frontend  
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

### ⚙️ Environment Variables

Create a `.env` file using `.env.example` with the following variables:

```env
VITE_API_BASE_URL=https://your-backend-api.com/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Clone the repository
git clone https://github.com/SD-Project-2025/iReserve-frontend.git
cd iReserve-frontend

# Install dependencies
npm install

# Start the development server
npm run dev

