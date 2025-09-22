# Aarogya Sahayak - Health Worker Connect Platform

A comprehensive healthcare communication platform that connects patients with ASHA workers and community health professionals. Built with Next.js, MongoDB, and Socket.io for real-time communication.

## 🚀 Features

### 🏥 **Core Healthcare Features**
- **Direct Messaging**: Real-time chat between patients and health workers
- **Appointment Booking**: Schedule consultations with health professionals
- **Emergency Support**: Priority access for urgent medical situations
- **Notification System**: Real-time updates and reminders

### 👥 **User Management**
- **Role-based Authentication**: Separate access for patients and health workers
- **User Profiles**: Detailed profiles with medical history and specializations
- **Worker-Patient Assignments**: Manage healthcare provider relationships

### 💬 **Communication Tools**
- **Real-time Chat**: Instant messaging with typing indicators
- **Message History**: Complete conversation records
- **File Sharing**: Support for medical documents (UI ready)
- **Audio/Video Calls**: Interface ready for WebRTC integration

### 📅 **Appointment Management**
- **Flexible Scheduling**: Book appointments at convenient times
- **Approval Workflow**: Workers can approve/reject requests
- **Status Tracking**: Monitor appointment progress
- **Reminder System**: Automated notifications

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with credential provider
- **Real-time**: Socket.io for live communication
- **Styling**: Tailwind CSS with responsive design

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/Ayush8905/Aarogya-Sahayak.git
cd Aarogya-Sahayak
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# NextAuth Configuration
NEXTAUTH_SECRET=your_super_secret_key
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NODE_ENV=development
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🏗️ Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── appointments/   # Appointment management
│   │   ├── messages/       # Messaging system
│   │   ├── notifications/  # Notification handling
│   │   └── users/          # User management
│   ├── auth/
│   │   ├── signin/         # Sign in page
│   │   └── signup/         # Registration page
│   ├── patient/
│   │   ├── dashboard/      # Patient dashboard
│   │   └── book-appointment/ # Appointment booking
│   ├── worker/
│   │   └── dashboard/      # Health worker dashboard
│   ├── chat/[userId]/      # Chat interface
│   └── layout.js           # Root layout
├── models/
│   ├── User.js             # User schema
│   ├── Message.js          # Message schema
│   ├── Appointment.js      # Appointment schema
│   └── Notification.js     # Notification schema
├── context/
│   └── SocketContext.js    # Socket.io context
├── lib/
│   └── mongodb.js          # Database connection
└── pages/api/
    └── socket.js           # Socket.io server
```

## 🚀 Developer

**Ayush Bhagwatkar**
- GitHub: [@Ayush8905](https://github.com/Ayush8905)

---

**Made with ❤️ for better healthcare accessibility**
