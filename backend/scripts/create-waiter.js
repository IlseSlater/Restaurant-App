/**
 * One-off: create a waiter user with PIN for a company so staff can log in.
 * Usage: node scripts/create-waiter.js <companyId> [name] [pin]
 * Example: node scripts/create-waiter.js cmlergk3o0000f2hbfz8jrmyk waiter 1234
 * Defaults: name=waiter, pin=1234
 */

const path = require('path');
const fs = require('fs');
// Load .env from backend root (no extra dependency)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const companyId = process.argv[2];
  const name = (process.argv[3] || 'waiter').trim();
  const pin = process.argv[4] || '1234';

  if (!companyId) {
    console.error('Usage: node scripts/create-waiter.js <companyId> [name] [pin]');
    console.error('Example: node scripts/create-waiter.js cmlergk3o0000f2hbfz8jrmyk waiter 1234');
    process.exit(1);
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    console.error('Company not found:', companyId);
    process.exit(1);
  }

  const email = `waiter-${companyId}@staff.local`;
  const existing = await prisma.user.findFirst({
    where: { companyId, name, role: 'WAITER' },
  });
  if (existing) {
    console.log('Waiter already exists for this company:', existing.name, '(id:', existing.id + ')');
    console.log('To set a new PIN, update the user in Prisma Studio or use the admin UI.');
    process.exit(0);
  }

  const hashedPin = await bcrypt.hash(pin, 10);
  const user = await prisma.user.create({
    data: {
      companyId,
      email,
      name,
      role: 'WAITER',
      pin: hashedPin,
      password: await bcrypt.hash('change-me', 10),
      phone: '',
      isActive: true,
    },
  });

  console.log('Created waiter user:');
  console.log('  Company:', company.name);
  console.log('  Name:', user.name);
  console.log('  PIN:', pin, '(use this to log in)');
  console.log('  Id:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
