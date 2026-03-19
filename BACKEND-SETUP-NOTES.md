## Backend setup & recovery notes

These are the key steps we used to get the backend compiling, migrate the DB, and seed data.

### 1. Install backend dependencies

From the repo root:

```bash
cd backend
npm install
```

### 2. Fix `nest` not recognized

The error:

- `'nest' is not recognized as an internal or external command`

is fixed by the same `npm install` in `backend`, which installs `@nestjs/cli` and adds the `nest` binary to `node_modules/.bin`.

### 3. Fix Prisma TypeScript errors

Errors like:

- `PrismaClientKnownRequestError` does not exist on type `typeof Prisma`
- `Namespace ... has no exported member 'OrderStatus' / 'TableStatus' / 'UserRole'`
- `Module '"@prisma/client"' has no exported member 'InventoryMovementType' / 'InventoryAlertType'`

were caused by a stale Prisma Client. Regenerate it from the backend schema:

```bash
cd backend
npx prisma generate --schema prisma/schema.prisma
```

### 4. Run full Prisma maintenance chain

Use the workspace root path (`C:\Social-Development\Restaurant-App`), not `C:\Restaurant-App`.

From the root, run:

```bash
cmd.exe /d /s /c ^
  "cd /d C:\Social-Development\Restaurant-App\backend && ^
   npm ls prisma @prisma/client --depth=0 && ^
   npx prisma -v && ^
   npx prisma generate && ^
   npx prisma migrate deploy && ^
   npx prisma db seed"
```

Notes:

- If `npx prisma generate` fails with `EPERM: operation not permitted, unlink ... query_engine-windows.dll.node`, stop the running Nest/Node process that is locking the DLL (for example via Task Manager or `taskkill /PID <pid> /F`), then re-run the command.
- `npx prisma migrate deploy` applies all migrations to the `restaurant_app` Postgres database.
- `npx prisma db seed` runs `ts-node prisma/seed.ts` and creates:
  - Default companies
  - Tables
  - Menu items
  - Staff users (PIN `0627` for seeded staff)

### 5. Start the backend

For a normal dev session:

```bash
cd backend
npm run start:dev
```

Backend URLs:

- API base: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api`

