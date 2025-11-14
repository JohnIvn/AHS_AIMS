## AHS IAWS — Information and Appointment Website for Amparo High School

This repository contains a React + Vite frontend and a NestJS + Prisma backend for managing staff sign-up/sign-in, admin profile, password changes, appointment decisions, and Google Sheets integration for form responses. Email notifications are sent via SMTP.

## Features

- Staff authentication: sign up, sign in, forgot/reset password with email codes
- Real-time availability checks for email and phone during sign up and profile edits
- Admin profile: view/update first/last name and contact number
- Change password with validation and confirmation email
- Appointment decisions: accept/deny and notify via email; bulk check of existing requests
- Google Sheets: read responses and list sheet tabs using a service account
- Optional Electron entry point for desktop packaging

## Tech stack

- Frontend: React 19 + Vite, optional Electron for desktop
- Backend: NestJS 11, Prisma ORM, PostgreSQL, Nodemailer (SMTP)
- Tooling: ESLint, Vite dev proxy to backend

## Project structure

```
Backend/
  controllers/         # NestJS controllers (auth, profile, google-forms, appointments)
  service/             # Email, Prisma, Google services
  prisma/              # Prisma schema and migrations
  src/                 # App bootstrap (Nest app.module.ts, main.ts)
  package.json         # Scripts and deps for backend

Frontend/
  src/                 # React app (Auth, Admin, Home)
  electron/            # Electron main + preload (optional)
  vite.config.js       # Vite config with /api proxy to backend
  package.json         # Scripts and deps for frontend
```

## Repository directory list

Full repo tree (key files only):

```
LICENSE
README.md

Backend/
  eslint.config.mjs              
  nest-cli.json
  package.json
  prisma.config.ts
  tsconfig.build.json
  tsconfig.json

  controllers/
    appointments.controller.ts
    forgot-password.controller.ts
    google-forms.controller.ts
    profile.controller.ts
    signin.controller.ts
    signup.controller.ts

  prisma/
    schema.prisma
    migrations/
      migration_lock.toml
      20251024075301_init/
        migration.sql
      20251024083420_appointment/
        migration.sql
      20251027130945_verification_code/
        migration.sql
      20251029053457_appoinment_modified/
        migration.sql

  service/
    database/
      database.service.ts
    email/
      email.service.ts
      email.utils.ts
    google/
      google-forms.service.ts
    prisma/
      prisma.service.ts

  src/
    app.module.ts
    main.ts

  test/
    e2e/
    spec/
      appointments.controller.spec.ts
      forgot-password.controller.spec.ts
      google-forms.controller.spec.ts
      profile.controller.spec.ts
      signin.controller.spec.ts
      signup.controller.spec.ts

Frontend/
  eslint.config.js
  index.html
  package.json
  vite.config.js

  electron/
    main.js
    preload.js
    scripts/

  public/

  src/
    App.css
    App.jsx
    index.css
    main.jsx
    assets/
    components/
      Admin/
        Appointments.jsx
        Profile.jsx
        Stats.jsx
      Auth/
        ForgotPassword.jsx
        SignIn.jsx
        SignUpStaff.jsx
      Home/
        Home.jsx
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- SMTP account for sending emails (e.g., Gmail with App Password)
- Google Cloud service account JSON key for Sheets API (place `key.json` in `Backend/`)

## Environment variables (Backend/.env)

Set these in `Backend/.env` (or your environment):

```
# Server
PORT=3000
JWT_SECRET=change_me_in_production

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public

# Email (SMTP)
MAIL_USER=your_smtp_username
MAIL_PASS=your_smtp_password

# Google Sheets
SHEET_ID=your_google_sheet_id
RANGE='Sheet1!A1:Z'
```

Notes:

- The backend looks for a Google service account key file at one of: `Backend/key.json`, `backend/key.json`, project root `key.json`, or `Backend/service/google/../../../key.json` relative to runtime. Place your service account JSON at `Backend/key.json` for simplicity.
- Vite proxies frontend calls from `/api/*` to `http://localhost:3000/*` and strips the `/api` prefix. When calling the backend directly (e.g., via Postman), omit `/api`.

## Setup and run

Backend

```powershell
cd Backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Frontend

```powershell
cd Frontend
npm install
npm run dev
```

Optional Electron dev

```powershell
cd Frontend
npm run electron:dev
```

Default dev URLs:

- Backend: http://localhost:3000
- Frontend: http://localhost:5173 (proxied API via `/api`)

## API overview

Unless specified, all endpoints are relative to the backend root (e.g., `http://localhost:3000`). When calling from the frontend, prefix with `/api` which is removed by the Vite proxy.

Auth (`/auth`)

- POST `/auth/signin` — Sign in
  - Body: `{ email: string, password: string }`
  - Returns: `{ success, token, user }`
- POST `/auth/signupst` — Staff sign up with email verification
  - Body includes: `first_name`, `last_name`, `contact_number` (`09XXXXXXXXX`), `email`, `password`, `verificationCode`
- POST `/auth/check-email-staff` — Check if email is available
  - Body: `{ email: string }`
- POST `/auth/check-phone-staff` — Check if phone is available
  - Body: `{ contact_number: string }`
- POST `/auth/send-verification-staff` — Send verification code to email
  - Body: `{ email: string }`
- POST `/auth/forgot-password` — Request reset code
  - Body: `{ email: string }`
- POST `/auth/reset-password` — Reset password with code
  - Body: `{ email: string, code: string, newPassword: string }`

Profile (`/profile`) — requires `Authorization: Bearer <token>`

- GET `/profile/me` — Get current user profile
- PUT `/profile` — Update `first_name`, `last_name`, `contact_number`
- POST `/profile/change-password` — Change password
  - Body: `{ current_password: string, new_password: string }`

Appointments (`/appointments`)

- POST `/appointments/decision` — Accept/Deny an appointment request and notify via email
  - Body: `{ firstName?, lastName?, email, contactNumber?, reason?, status: 'accepted' | 'denied' }`
- POST `/appointments/check` — Bulk check if emails already have a decided status
  - Body: `{ emails: string[] }`

Google Forms (`/google-forms`)

- GET `/google-forms/responses` — Returns responses using `SHEET_ID` and `RANGE` from env
- GET `/google-forms/sheets` — Lists sheet tabs for `SHEET_ID`
- GET `/google-forms/test` — Connectivity test with helpful error messages
- GET `/google-forms/config` — Shows which env vars are set

## Database models (Prisma)

- `staff_account` — staff profiles and credentials
- `appoinment_details` — appointment status by email (typo in table name maintained in schema)
- `verification_code` — time-bound codes for email verification and password reset

## Troubleshooting

- Cannot reach API from frontend: ensure backend runs on port `3000` and Vite proxy in `Frontend/vite.config.js` points to it; call endpoints via `/api/*` from the browser.
- Email not sending: verify `MAIL_USER`/`MAIL_PASS`; for Gmail, use an App Password; check provider SMTP host/port if you change from Gmail.
- Database errors: confirm `DATABASE_URL` and run `npx prisma migrate deploy`.
- Google Sheets errors: ensure `Backend/key.json` exists and `SHEET_ID`/`RANGE` are valid; see `/google-forms/test` and `/google-forms/config` for diagnostics.

## Key scripts

Backend (`Backend/package.json`)

- `start:dev` — run Nest in watch mode
- `build` — compile NestJS

Frontend (`Frontend/package.json`)

- `dev` — run Vite dev server
- `build` — Vite production build
- `preview` — preview production build
- `electron:dev` — run Electron alongside Vite dev server

## License

This project is currently unlicensed/private. The `Backend/package.json` declares `UNLICENSED`, and the top-level `LICENSE` file is a placeholder. If you intend to open source this project, add a valid license text to `LICENSE` and update package metadata accordingly.
