/**
 * Seed data for Social Dining backend tests.
 * Creates: 1 company, 1 table, menu items (shareable + not), 1 session, 3 participants, 1 order with shareable item.
 * Writes seed-output.json with IDs for cURL tests.
 */
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(__dirname, '..', '.env');
const envPathCwd = path.join(process.cwd(), '.env');
const envToLoad = fs.existsSync(envPath) ? envPath : fs.existsSync(envPathCwd) ? envPathCwd : null;
if (envToLoad) {
  const content = fs.readFileSync(envToLoad, 'utf8');
  content.split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0 && !line.trimStart().startsWith('#')) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) process.env[key] = val;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = '00000000-0000-0000-0000-000000000000';
const TABLE_QR = 'TABLE-SOCIAL-TEST-001';

async function main() {
  console.log('Seeding Social Dining test data...');

  const company = await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      name: 'Default Restaurant',
      slug: 'default',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      timezone: 'UTC',
      currency: 'ZAR',
      isActive: true,
    },
  });

  const table = await prisma.table.upsert({
    where: { qrCode: TABLE_QR },
    update: { companyId: company.id, number: 5, status: 'AVAILABLE' },
    create: {
      companyId: company.id,
      number: 5,
      qrCode: TABLE_QR,
      status: 'AVAILABLE',
    },
  });

  const menuItems = await Promise.all([
    prisma.menuItem.upsert({
      where: { id: 'menu-shareable-nachos' },
      update: { isShareable: true, maxClaimants: 4 },
      create: {
        id: 'menu-shareable-nachos',
        companyId: company.id,
        name: 'Nachos to Share',
        description: 'Shareable',
        price: 99.99,
        category: 'starters',
        isShareable: true,
        maxClaimants: 4,
        isAvailable: true,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-shareable-pizza' },
      update: { isShareable: true, maxClaimants: 4 },
      create: {
        id: 'menu-shareable-pizza',
        companyId: company.id,
        name: 'Pizza Margherita',
        description: 'Shareable',
        price: 150,
        category: 'mains',
        isShareable: true,
        maxClaimants: 4,
        isAvailable: true,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-burger' },
      update: {},
      create: {
        id: 'menu-burger',
        companyId: company.id,
        name: 'Classic Burger',
        description: 'Not shareable',
        price: 85,
        category: 'mains',
        isShareable: false,
        isAvailable: true,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-coffee' },
      update: {},
      create: {
        id: 'menu-coffee',
        companyId: company.id,
        name: 'Espresso',
        description: 'Not shareable',
        price: 25,
        category: 'beverages',
        isShareable: false,
        isAvailable: true,
      },
    }),
  ]);

  const existingSession = await prisma.customerSession.findFirst({
    where: { tableId: table.id, isActive: true },
    include: { participants: true },
  });

  let sessionId: string;
  let participantIds: string[];
  let creatorId: string;

  if (existingSession) {
    sessionId = existingSession.id;
    participantIds = existingSession.participants.map((p: { id: string }) => p.id);
    creatorId = existingSession.participants.find((p: { isCreator: boolean }) => p.isCreator)?.id ?? participantIds[0];
    console.log('Using existing session:', sessionId, 'participants:', participantIds.length);
  } else {
    const session = await prisma.customerSession.create({
      data: {
        companyId: company.id,
        tableId: table.id,
        customerName: 'Alice',
        isActive: true,
        dietaryPreferences: [],
        allergies: [],
      },
    });
    sessionId = session.id;

    const creator = await prisma.participant.create({
      data: {
        customerSessionId: sessionId,
        displayName: 'Alice',
        isCreator: true,
      },
    });
    creatorId = creator.id;

    const p2 = await prisma.participant.create({
      data: {
        customerSessionId: sessionId,
        displayName: 'Blue Bear',
        isCreator: false,
      },
    });
    const p3 = await prisma.participant.create({
      data: {
        customerSessionId: sessionId,
        displayName: 'Green Goat',
        isCreator: false,
      },
    });
    participantIds = [creatorId, p2.id, p3.id];
    console.log('Created session', sessionId, 'participants', participantIds);
  }

  const shareableMenuItem = menuItems[0];
  const orderExisting = await prisma.customerOrder.findFirst({
    where: { customerSessionId: sessionId },
    include: { items: { where: { isShareable: true } } },
  });

  let orderId: string;
  let orderItemIdShareable: string;

  if (orderExisting && orderExisting.items.length > 0) {
    orderId = orderExisting.id;
    orderItemIdShareable = orderExisting.items[0].id;
    console.log('Using existing order', orderId, 'shareable item', orderItemIdShareable);
  } else {
    const order = await prisma.customerOrder.create({
      data: {
        companyId: company.id,
        customerSessionId: sessionId,
        participantId: creatorId,
        tableId: table.id,
        subtotal: 99.99,
        serviceFee: 15,
        serviceFeePercentage: 15,
        total: 114.99,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: {
            menuItemId: shareableMenuItem.id,
            quantity: 1,
            price: 99.99,
            status: 'PENDING',
            isShareable: true,
            maxClaimants: 4,
          },
        },
      },
      include: { items: true },
    });
    orderId = order.id;
    const shareableItem = order.items.find((i: { isShareable: boolean }) => i.isShareable);
    if (!shareableItem) throw new Error('No shareable item created');
    orderItemIdShareable = shareableItem.id;

    await prisma.itemClaim.create({
      data: {
        participantId: creatorId,
        orderItemId: orderItemIdShareable,
        percentage: 10000,
      },
    });
    console.log('Created order', orderId, 'shareable item', orderItemIdShareable);
  }

  const output = {
    companyId: company.id,
    tableId: table.id,
    tableQr: TABLE_QR,
    tableNumber: table.number,
    sessionId,
    participantIds,
    creatorId,
    menuItemIds: {
      shareableNachos: menuItems[0].id,
      shareablePizza: menuItems[1].id,
      burger: menuItems[2].id,
      coffee: menuItems[3].id,
    },
    orderId,
    orderItemIdShareable,
    baseUrl: 'http://localhost:3000',
  };

  const outPath = path.join(__dirname, 'seed-output.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('Wrote', outPath);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
