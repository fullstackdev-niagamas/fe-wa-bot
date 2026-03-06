# 📱 WhatsApp Bot Admin Panel (fe-wa-bot)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![Lucide](https://img.shields.io/badge/Lucide_Icons-FF7E33?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)

A modern, responsive dashboard interface for managing your WhatsApp automation bot. Built with **React 19** and **Vite**, this admin panel allows you to manage billing reminders, promotional broadcasts, group tracking, and call recordings with ease.

---

## ✨ Features

- **🗓️ Billing Reminders**: 
  - Single entry form for quick notifications.
  - **Bulk Upload**: Process multiple billing reminders via spreadsheet (CSV/XLSX).
- **📢 Promotional Broadcasts**:
  - Send marketing messages to multiple contacts.
  - **Bulk Upload**: Broadcast promos from spreadsheet files.
  - **🛡️ Anti-Ban System**: Built-in random delays (15-20s) between messages to mimic human behavior.
- **👥 Group Management & Tracking**:
  - Live list of available WhatsApp groups.
  - Toggle message tracking for specific groups to log interactions.
- **🎙️ Call Recordings**:
  - Dedicated interface to upload call recordings with associated metadata (Phone number, Contact name, Notes).
- **⚙️ Session Monitoring**:
  - Real-time status of your WAHA (WhatsApp HTTP API) sessions.
- **📱 Responsive Design**:
  - Optimized for both desktop and mobile devices with a sleek, dark-themed UI.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Functional Components & Hooks)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **API Communication**: Axios
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics

---

## 🚦 Prerequisites

- **Node.js**: v18.0 or higher
- **Backend Service**: Requires [be-wa-bot](../be-wa-bot/README.md) to be running.
- **WAHA**: A running instance of WhatsApp HTTP API.

---

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd fe-wa-bot
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory (refer to `.env.example`):
    ```bash
    touch .env
    ```

    **Required Environment Variables:**
    ```env
    VITE_API_BASE_URL=http://localhost:3001/api
    VITE_API_KEY=your_secret_api_key
    VITE_WAHA_URL=http://localhost:3000/api
    ```

4.  **Launch Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or your Vite default port).

---

## 🏗️ Building for Production

To create an optimized production build:
```bash
npm run build
```
The output will be generated in the `dist/` directory, ready to be served by any static web server.

---

## 📁 Source Overview

- `src/App.jsx`: Main application logic, state management, and routing (tab-based).
- `src/App.css`: Modern UI styles including animations and responsive layout.
- `src/main.jsx`: Application entry point.

---

## 📝 License

This project is licensed under the **MIT License**.

---

Developed with ❤️ by Niagamas Lestari Gemilang.
