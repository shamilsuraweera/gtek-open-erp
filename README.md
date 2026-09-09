# G-TEK Open ERP

A robust, full-stack enterprise resource planning (ERP) foundation built with modern technologies. **G-TEK Open ERP** is designed with strict separation of concerns, ensuring high scalability, secure cross-origin communication, and seamless database integration.

---

## 🏗️ System Architecture & Technology Stack

- **Frontend:** React (running on Port `3001`)
- **Backend:** NestJS (running on Port `3000`)
- **Database:** Microsoft SQL Server
- **Architecture:** Decoupled Client-Server REST API pattern with strict modular organization.

```
gtek-open-erp/
├── client/          # React Frontend application
│   ├── src/
│   │   ├── App.js   # Health check UI & system overview
│   │   └── ...
│   └── package.json
├── server/          # NestJS Backend application
│   ├── src/
│   │   ├── main.ts  # CORS configuration & 0.0.0.0 binding
│   │   ├── app.controller.ts
│   │   └── ...
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Microsoft SQL Server instance running locally or accessible via network

### 1. Backend Setup (NestJS)
Navigate to the server directory, install dependencies, and configure your environment.

```bash
cd server
npm install
```

Configure your database credentials in your environment variables (`.env`), then start the development server:

```bash
npm run start:dev
```
*The backend will run on `http://localhost:3000` (and bind to `0.0.0.0` for local network access).*

### 2. Frontend Setup (React)
Navigate to the client directory, install dependencies, and start the application.

```bash
cd client
npm install
npm start
```
*The frontend will run on `http://localhost:3001`.*

---

## 🔌 API Endpoints & Health Checks

- **`GET /`** — Backend root connectivity check.
- **`GET /db-test`** — Verifies active connection to the SQL Server database and returns test query results.

---

## 🔒 CORS & Network Configuration

The NestJS backend enforces strict CORS policies allowing communication exclusively from authorized client origins:
- `http://localhost:3001`
- `http://127.0.0.1:3001`
- `http://192.168.8.197:3001` (LAN access)

---

## 📋 Development Roadmap

- [x] **Phase 1 (Foundation):** Repository structure, React frontend setup, and NestJS server initialization.
- [x] **Phase 2 (Connectivity):** CORS configuration, port alignment, and database health check integration (`/db-test`).
- [ ] **Phase 3 (Authentication):** JWT-based login, role-based access control (RBAC), and user CRUD endpoints.
- [ ] **Phase 4 (Dashboard & UI):** React dashboard layout with Tailwind CSS / Material UI integration.
- [ ] **Phase 5 (Core ERP Modules):** Inventory, order management, and centralized API service layer.

---

## 👥 Contributors & Roles

- **Shamil Suraweera** — Developer (Frontend/Backend Integration, CORS Resolution, Project Architecture)
- **Backend Support** — NestJS Module Configuration & Database Entities
- **Frontend Support** — React UI Components & Dashboard Layouts