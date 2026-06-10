# Actions Not Words — Student Performance Tracker

A full-stack React + Express + Supabase app for tracking student performance across Kenya's education system (CBC & 8-4-4).

## Stack
- **Frontend**: React + Vite + React Router + Recharts
- **Backend**: Express (Node.js ESM)
- **Database & Auth**: Supabase (PostgreSQL + Google OAuth)

## Setup

### 1. Supabase Project
1. Create a project at [supabase.com](https://supabase.com)
2. Run `server/schema.sql` in Supabase SQL Editor
3. Enable Google OAuth: Authentication → Providers → Google
4. Add your site URL to Authentication → URL Configuration

### 2. Environment Variables

**server/.env**
```
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
```

**client/.env**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000
```

### 3. Seed Super Admin
After setting up Supabase Auth, create your first user and run:
```sql
INSERT INTO admins (user_id, email, name, role, status)
VALUES ('<your-user-id>', '<your-email>', 'Super Admin', 'super_admin', 'active');
```

### 4. Run

```bash
# Install dependencies
npm run install:all

# Start server (terminal 1)
npm run dev:server

# Start client (terminal 2)
npm run dev:client
```

Client: http://localhost:5173  
Server: http://localhost:5000

## Kenya Education Levels Supported
| Level | Curriculum | Classes | Grading |
|-------|-----------|---------|---------|
| ECDE | CBC | PP1, PP2 | EE/ME/AE/BE |
| Lower Primary | CBC | Grade 1–3 | EE/ME/AE/BE |
| Upper Primary | CBC | Grade 4–6 | % → EE/ME/AE/BE |
| Junior Secondary | CBC | Grade 7–9 | % → EE/ME/AE/BE |
| Secondary | 8-4-4 | Form 1–4 | KCSE A–E + points |
| Tertiary | University | Year 1–5 | First/Upper/Lower/Pass |

## Features
- Super Admin email/password login
- Admin invite via email → Google OAuth sign-in
- Add/manage partner schools with location, type, curriculum
- Add/manage students with full profile (school, level, class, sponsorship)
- Enter end-of-term exam results per subject
- Auto-calculate mean score and Kenya grade
- Track performance trends (improving/stable/declining)
- At-risk alerts for students below 50%
- School comparison reports with charts
- Student profile with grade ring and subject breakdown
- Export / print ready

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/schools | List all schools |
| POST | /api/schools | Create school |
| PUT | /api/schools/:id | Update school |
| DELETE | /api/schools/:id | Delete school |
| GET | /api/students | List students (filter: school_id, level) |
| GET | /api/students/:id | Student + results |
| POST | /api/students | Create student |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student + results |
| GET | /api/results | List results (filter: student_id, year, term) |
| POST | /api/results | Create/upsert result |
| PUT | /api/results/:id | Update result |
| DELETE | /api/results/:id | Delete result |
| GET | /api/admins | List admins (super admin only) |
| POST | /api/admins/invite | Invite admin by email |
| DELETE | /api/admins/:id | Remove admin |
| GET | /api/reports/overview | Dashboard stats |
| GET | /api/reports/schools | School performance comparison |
