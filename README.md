## AHS AIMS — (Frontend + Backend)

Streamlined appointment administration with a modern React frontend and a NestJS + Prisma backend. Includes staff sign up/sign in, real‑time field validations, admin dashboard and appointment management, and profile management with secure password change and email notifications.

## Features

- Admin dashboard with appointment stats and recent activity
- Appointment management: list, filter, accept/deny
- Staff authentication: sign up, sign in, forgot/reset password
- Real-time availability checks for email and phone during sign up and profile edits
- Admin profile: view/update first/last name and contact number
- Change password with validation, strength feedback (Weak/Fair/Good/Strong), and confirmation email
- Email notifications via SMTP (Nodemailer)
- Electron entry point for desktop packaging (optional dev)

## Tech stack

- Frontend: React + Vite, CSS modules (simple utility classes), Electron (optional dev)
- Backend: NestJS, Prisma ORM, PostgreSQL, Nodemailer for email
- Tooling: ESLint, Vite dev proxy for API

## Project structure

```
Backend/
	controllers/         # NestJS controllers (auth, profile, google forms)
	service/             # Email, Prisma, Google services
	prisma/              # Prisma schema and migrations
	src/                 # App bootstrap (Nest app.module.ts, main.ts)
	package.json         # Scripts and deps for backend

Frontend/
	src/                 # React app
		components/        # Auth, Admin, Home components
	electron/            # Electron main + preload (optional)
	vite.config.js       # Vite config with /api proxy to backend
	package.json         # Scripts and deps for frontend
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+ running and reachable
- SMTP account for sending emails (can be Gmail with an app password or another provider)

## Backend setup

1. Install dependencies

```powershell
cd Backend
npm install
```

2. Configure environment

Create a `.env` (or set environment variables via your process manager) with at least:

```
# Backend Port
PORT=''

# Connect to Supabase via connection pooling
DATABASE_URL=""

# Sheet Data
SHEET_ID=""
RANGE=""

# Google SMTP
MAIL_USER=''
MAIL_PASS=''
```

3. Generate and run Prisma migrations

```powershell
npx prisma generate
npx prisma migrate deploy
```

4. Run the backend (dev)

```powershell
npm run start:dev
```

The backend will listen on http://localhost:3000.

## Frontend setup

1. Install dependencies

```powershell
cd Frontend
npm install
```

2. Dev server

```powershell
npm run dev
```

Vite serves the app at http://localhost:5173 and proxies API requests to http://localhost:3000 via `/api`.

Optional: Electron dev

```powershell
npm run electron:dev
```

## Key scripts

Backend (`Backend/package.json`):

- `start:dev` — run Nest in watch mode
- `build` — compile NestJS

Frontend (`Frontend/package.json`):

- `dev` — run Vite dev server
- `build` — Vite production build
- `preview` — preview production build
- `electron:dev` — run Electron with the Vite dev server

## API overview

Base URL: `/api`

Auth

- `POST /auth/signin`
- `POST /auth/signupst` — staff sign up
- `POST /auth/check-email-staff` — availability check
- `POST /auth/check-phone-staff` — availability check
- `POST /auth/send-verification-staff` — email verification code
- `POST /auth/forgot-password` — request reset code
- `POST /auth/reset-password` — perform password reset

Profile (requires Bearer token in Authorization header)

- `GET /profile/me` — current user profile
- `PUT /profile` — update first/last name and contact number
- `POST /profile/change-password` — change password (sends confirmation email)

Appointments (frontend currently uses local storage mock service; backend endpoints can be added later)

## Frontend features in detail

- Sign Up
  - Validations: names required, PH mobile format `09XXXXXXXXX`, email format, password min 8 with letters and numbers, confirmation match
  - Real-time availability checks for email and contact number
  - Password strength indicator: Weak / Fair / Good / Strong
- Sign In
  - Show/Hide password toggle
- Forgot/Reset Password
  - Request reset code, then reset with code and new password
- Admin Profile
  - Edit first/last name and contact number with real-time phone availability
  - Change password (with strength feedback and email confirmation)
- Admin Appointments
  - List, filter, accept/deny; mock persisted via localStorage for now

## Troubleshooting

- Frontend cannot reach backend
  - Ensure backend is running on http://localhost:3000
  - Confirm Vite proxy is configured in `Frontend/vite.config.js` to forward `/api`
- Email not sending
  - Verify SMTP credentials and provider settings in backend env
  - Check that less-secure app access or app passwords are used if on Gmail
- Database errors
  - Confirm `DATABASE_URL` and that migrations are deployed

## Security notes

- Use a long random `JWT_SECRET`
- Do not commit `.env` or secrets
- Enforce HTTPS and secure cookies in production

## License

This project is licensed under the terms of the MIT License. See `LICENSE` for details.
