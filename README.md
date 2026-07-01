# Student Attendance Management System

A full-stack web app for teachers to mark and track student attendance, generate
attendance reports/percentages, and let students view their own attendance.

**Stack:** Node.js, Express, MySQL, HTML/CSS/JavaScript (vanilla)

---

## Features

- Staff login (JWT-based auth, bcrypt password hashing)
- Student login
- Subject-wise attendance marking (Present/Absent) by staff
- Auto-generated attendance reports with percentage per student, per subject
- Student self-service view of their own attendance across all subjects
- Attendance below 75% highlighted in reports

---

## Project Structure

```
attendance-system/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/auth.js    # JWT verification + role guard
│   ├── routes/
│   │   ├── auth.js           # staff/student register & login
│   │   ├── students.js       # student listing/profile
│   │   └── attendance.js     # subjects, marking, reports
│   ├── schema.sql            # database schema (+ sample subjects)
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html            # login page (staff/student tabs)
    ├── dashboard.html        # staff dashboard
    ├── mark-attendance.html  # staff marks attendance
    ├── reports.html          # staff views percentage reports
    ├── student.html          # student's own attendance view
    ├── css/style.css
    └── js/api.js             # shared fetch/auth helper
```

---

## Setup

### 1. Prerequisites
- Node.js (v18+ recommended)
- MySQL Server running locally or remotely

### 2. Create the database

```bash
mysql -u root -p < backend/schema.sql
```

This creates the `attendance_system` database with `staff`, `students`, `subjects`,
and `attendance` tables, plus a few sample subjects.

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your MySQL credentials and a JWT secret:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_system
JWT_SECRET=some_long_random_string
```

### 4. Install dependencies & run

```bash
cd backend
npm install
npm start
```

The server starts on `http://localhost:5000` and also serves the frontend
(the `frontend/` folder), so you can open `http://localhost:5000` directly
in your browser — no separate frontend server needed.

For auto-restart during development:
```bash
npm run dev
```

### 5. Create your first accounts

The schema does not insert a real staff/student login you can use out of the
box (passwords must be bcrypt-hashed by the app). Register accounts via the API:

```bash
# Create a staff account
curl -X POST http://localhost:5000/api/auth/staff/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Mr. Anand Kumar","email":"anand@college.edu","password":"staff123"}'

# Create a student account
curl -X POST http://localhost:5000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{"roll_no":"CSE2023045","name":"Test Student","password":"student123","class":"CSE-A"}'
```

Then log in from `http://localhost:5000` using either tab on the login page.

---

## API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/staff/register` | Public | Create a staff account |
| POST | `/api/auth/staff/login` | Public | Staff login → JWT |
| POST | `/api/auth/student/register` | Public | Create a student account |
| POST | `/api/auth/student/login` | Public | Student login → JWT |
| GET | `/api/attendance/subjects` | Authenticated | List subjects |
| GET | `/api/attendance/mark?subject_id=&date=` | Staff | Fetch/prefill attendance sheet |
| POST | `/api/attendance/mark` | Staff | Save attendance for a subject/date |
| GET | `/api/attendance/report/:subject_id` | Staff | Percentage report for a subject |
| GET | `/api/attendance/student/:student_id` | Staff or self | A student's attendance across all subjects |
| GET | `/api/students` | Staff | List all students |
| GET | `/api/students/:id` | Staff or self | Single student profile |

All protected routes require an `Authorization: Bearer <token>` header.

---

## Notes for extending this project

- Add a "Manage Subjects" page for staff to create/edit subjects from the UI
- Add password reset / forgot password flow
- Add pagination for large student lists
- Export reports to PDF/Excel
- Add an admin role to manage staff accounts
