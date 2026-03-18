/**
 * Backend dev environment check. Run before start:dev.
 * - Ensures Docker is running
 * - Ensures Postgres container is up
 * - Runs prisma generate
 * - Runs prisma migrate deploy (applies pending migrations)
 * - Seeds DB only if empty (idempotent seed)
 * Exits 0 if all ok, 1 otherwise with a clear message.
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd, options = {}) {
  const opts = { cwd: ROOT, stdio: options.silent ? 'pipe' : 'inherit', ...options };
  try {
    return execSync(cmd, opts);
  } catch (e) {
    if (options.silent) return null;
    throw e;
  }
}

function checkDocker() {
  try {
    run('docker info', { silent: true });
    return true;
  } catch {
    return false;
  }
}

function checkPostgres() {
  try {
    const out = execSync('docker ps', { encoding: 'utf8', cwd: ROOT });
    // Any container exposing 5432 or name containing postgres
    return /5432|postgres/i.test(out);
  } catch {
    return false;
  }
}

async function maybeSeed() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    // DB may still be coming up right after Docker start; retry quickly.
    for (let attempt = 1; attempt <= 20; attempt++) {
      try {
        await prisma.$connect();
        break;
      } catch (e) {
        if (attempt === 20) throw e;
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const companies = await prisma.company.count().catch(() => 0);
    if (companies > 0) {
      console.log(`  Seed: skipped (companies=${companies})`);
      return;
    }

    console.log('  Seeding database (first run)...');
    run('npx prisma db seed');
    console.log('  Seed: ok');
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  console.log('Checking backend dev environment...\n');

  if (!checkDocker()) {
    console.error(
      'Docker is not running. Start Docker Desktop (or your Docker daemon) and try again.'
    );
    process.exit(1);
  }
  console.log('  Docker: ok');

  if (!checkPostgres()) {
    console.error(
      'Postgres container is not running. Start it with:\n' +
        '  docker compose -f ../docker-compose.yml up -d postgres\n' +
        'Or run the full stack:\n' +
        '  docker compose -f ../docker-compose.yml up -d'
    );
    process.exit(1);
  }
  console.log('  Postgres: ok');

  console.log('  Running prisma generate...');
  try {
    run('npx prisma generate');
  } catch (e) {
    console.error('Prisma generate failed. Fix the error above and try again.');
    process.exit(1);
  }
  console.log('  Prisma client: ok');

  console.log('  Applying migrations (prisma migrate deploy)...');
  try {
    run('npx prisma migrate deploy', { cwd: ROOT });
  } catch (e) {
    console.error(
      'Prisma migrate deploy failed. Check DATABASE_URL in .env and that the DB is reachable.'
    );
    process.exit(1);
  }
  console.log('  Migrations: ok\n');

  try {
    await maybeSeed();
  } catch (e) {
    console.error(
      'Database seed failed. Fix the error above and try again (you can also run `npm run db:seed`).'
    );
    process.exit(1);
  }

  console.log('Dev environment ready. Starting Nest...\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('Dev env check failed:', e?.message ?? e);
  process.exit(1);
});
