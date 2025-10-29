# Project Title

This project is designed to ...

## Backend: Prisma-based data access

The authentication controllers were refactored to use Prisma Client instead of raw SQL/pg.

Key changes:

- Added `service/prisma/prisma.service.ts` to provide PrismaClient via NestJS DI.
- Updated `controllers/signup.controller.ts` and `controllers/signin.controller.ts` to use Prisma queries.
- Registered `PrismaService` in `src/app.module.ts` providers.

How to build/run (from `Backend/`):

```powershell
npm run build
npm run start:dev
```

## Prisma schema is in `Backend/prisma/schema.prisma`. Ensure `DATABASE_URL` is set in `.env`.
