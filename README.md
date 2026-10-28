# 🛡️ BugBounty for College
> **"Spot It. Verify It. Fix It."**

A complete, production-grade college campus issue reporting and resolution platform built on the modern MERN stack.

---

## 🚀 Key Highlights & Architectural Features

1. **Role-Based Workflows**:
   - **Student**: Submit issues, upload evidence, verify fellow student reports (1 vote/user, anti-abuse protected), dispute repairs, and earn reputation points.
   - **Maintenance Staff**: Access assigned work orders, view priority and SLA targets, update progress (`Fixing`), and upload resolution notes and photographic proof.
   - **Administrator**: Moderate review queue, prioritize issues, assign personnel, merge duplicates, configure dynamic categories and SLA hours, and manage user accounts.

2. **Issue Lifecycle**:
   `Reported` ➔ `Verified` ➔ `Assigned` ➔ `Fixing` ➔ `Resolved`  
   *(With comprehensive audit trail logging and support for `Reopened`, `Rejected`, and `Duplicate`)*.

3. **Anti-Abuse & Duplicate Prevention**:
   - Atomic database voting constraint preventing multiple votes or self-verification.
   - Live duplicate detection in reporting form based on title keywords, category, and building.
   - Community consensus threshold triggering automatic verification.

4. **Real-time Notifications**:
   - In-app notification bell with Socket.io push updates for status changes, assignments, and discussions.

5. **Security & Resilience**:
   - `bcrypt` password hashing with salted rounds.
   - JWT authentication with secure HTTP-only cookies and Bearer token fallback.
   - Helmet security headers, CORS origin protection, express-rate-limiting.
   - Cloudinary integration with graceful local disk fallback when external credentials are not supplied.

---

## 🛠️ Technology Stack

- **Frontend**: React.js 19, Vite, Tailwind CSS v4, Lucide React icons, Axios, Recharts, Socket.IO Client.
- **Backend**: Node.js, Express.js, MongoDB with Mongoose, Socket.IO, Multer, Cloudinary, Zod, Helmet, Morgan, Cookie-Parser.
- **Testing**: Supertest, Mocha, Chai.

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or MongoDB Atlas connection string)

### 2. Environment Configuration

#### Server (`server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/bugbounty_college
JWT_SECRET=super_secret_bugbounty_jwt_key_2026_dev_college_safe
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary credentials (local storage used automatically if left blank)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

#### Client (`client/.env`):
```env
VITE_API_URL=/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Installation
```bash
# In server directory:
cd server
npm install

# In client directory:
cd ../client
npm install
```

### 4. Seed Realistic Campus Demo Data
```bash
cd server
npm run seed
```

### 5. Running the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Scope & Responsibilities |
|---|---|---|---|
| **Administrator** | `admin@campus.edu` | `Password@123` | Dean of Infrastructure, assignments, category SLAs, moderation |
| **Maintenance Staff** | `staff.electrical@campus.edu` | `Password@123` | Electrical department head, work order execution |
| **Maintenance Staff** | `staff.civil@campus.edu` | `Password@123` | Civil & Estate maintenance, work order execution |
| **Student** | `aditi.student@campus.edu` | `Password@123` | CS student, report creator, community verifier (35 pts) |
| **Student** | `karthik.student@campus.edu` | `Password@123` | ECE student, community verifier (20 pts) |

*(A 1-click test account selector is also available on the Login screen for instant testing)*.

---

## 🧪 Automated Testing
Run the automated integration test suite:
```bash
cd server
npm test
```
All 13 test suites verify:
- Health check endpoints
- User registration and password hashing validation
- Role-based route authorization
- Issue submission and schema validation
- Duplicate voting prevention and vote toggling
- Administrator review & maintenance staff assignment
- Staff work order resolution with photographic evidence
- Student dispute and reopening workflow

---

## 🌐 API Endpoints Reference (`/api/v1`)

### Authentication
- `POST /api/v1/auth/register` - Create student account (first user bootstraps as admin)
- `POST /api/v1/auth/login` - Authenticate user & issue JWT
- `POST /api/v1/auth/logout` - Clear session cookie
- `GET  /api/v1/auth/me` - Fetch authenticated user profile

### Reports
- `GET    /api/v1/reports` - List issues (filters: status, category, priority, building, pagination)
- `POST   /api/v1/reports` - Submit report with multipart image attachments
- `GET    /api/v1/reports/:id` - Fetch single issue details, voting status, and audit trail
- `GET    /api/v1/reports/check-duplicates` - Live keyword duplicate search
- `POST   /api/v1/reports/:id/verify` - Confirm or flag report
- `POST   /api/v1/reports/:id/review` - Admin approve/reject
- `POST   /api/v1/reports/:id/assign` - Admin assign maintenance personnel & SLA
- `POST   /api/v1/reports/:id/status` - Staff update progress & upload resolution evidence
- `POST   /api/v1/reports/:id/reopen` - Reopen resolved issue with dispute justification
- `POST   /api/v1/reports/:id/merge` - Admin merge duplicate reports

### Dashboards & Notifications
- `GET /api/v1/dashboard/public` - Public statistics, category & building analytics
- `GET /api/v1/dashboard/student` - Student submissions, votes, reputation summary
- `GET /api/v1/dashboard/staff` - Staff assigned work orders, overdue tasks
- `GET /api/v1/dashboard/admin` - Admin moderation queues, staff workload matrix
- `GET /api/v1/notifications` - Fetch user notifications
- `PATCH /api/v1/notifications/:id/read` - Mark notification as read
