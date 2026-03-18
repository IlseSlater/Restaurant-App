import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STAFF_PIN = '0627';
const STAFF_ROLES = [
  { name: 'waiter', role: 'WAITER' as const },
  { name: 'bar', role: 'BAR_STAFF' as const },
  { name: 'kitchen', role: 'KITCHEN_STAFF' as const },
  { name: 'admin', role: 'ADMIN' as const },
  { name: 'manager', role: 'MANAGER' as const },
];

async function main() {
  console.log('Starting database seeding...');

  // Create companies by unique slug; omit id so Prisma uses @default(uuid()) like the app
  const defaultCompany = await prisma.company.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Restaurant',
      slug: 'default',
      logo: null,
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      address: '123 Main Street, City',
      phone: '+27123456789',
      email: 'info@defaultrestaurant.com',
      website: 'https://defaultrestaurant.com',
      timezone: 'UTC',
      currency: 'ZAR',
      isActive: true,
    },
  });

  console.log('Default company created:', defaultCompany.id, defaultCompany.name);

  const additionalCompanyData = [
    { name: 'Bella Vista Italian', slug: 'bella-vista', logo: null, primaryColor: '#d32f2f', secondaryColor: '#ffeb3b', address: '456 Italian Way, Little Italy', phone: '+27123456790', email: 'info@bellavista.com', website: 'https://bellavista.com', timezone: 'UTC', currency: 'ZAR', isActive: true },
    { name: 'Sushi Zen', slug: 'sushi-zen', logo: null, primaryColor: '#4caf50', secondaryColor: '#ff9800', address: '789 Zen Street, Downtown', phone: '+27123456791', email: 'info@sushizen.com', website: 'https://sushizen.com', timezone: 'UTC', currency: 'ZAR', isActive: true },
    { name: 'Burger Palace', slug: 'burger-palace', logo: null, primaryColor: '#ff5722', secondaryColor: '#2196f3', address: '321 Burger Lane, Food Court', phone: '+27123456792', email: 'info@burgerpalace.com', website: 'https://burgerpalace.com', timezone: 'UTC', currency: 'ZAR', isActive: true },
    { name: 'Café Mocha', slug: 'cafe-mocha', logo: null, primaryColor: '#795548', secondaryColor: '#ffc107', address: '654 Coffee Street, Arts District', phone: '+27123456793', email: 'info@cafemocha.com', website: 'https://cafemocha.com', timezone: 'UTC', currency: 'ZAR', isActive: true },
  ];

  const otherCompanies: { id: string; name: string; slug: string }[] = [];
  for (const data of additionalCompanyData) {
    const company = await prisma.company.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
    otherCompanies.push(company);
    console.log(`Created company: ${company.id} ${company.name}`);
  }

  type CompanyRef = { id: string; name?: string };
  const allCompanies: CompanyRef[] = [defaultCompany, ...otherCompanies];
  const hashedPin = await bcrypt.hash(STAFF_PIN, 10);

  // Sample menu items: same set for each seeded company (idempotent: replace existing seed menu)
  const SAMPLE_MENU_ITEMS: Array<{
    name: string;
    description: string | null;
    price: number;
    category: string;
    preparationTime?: number;
    isShareable?: boolean;
    maxClaimants?: number;
  }> = [
    { name: 'Caesar Salad', description: 'Crisp romaine, parmesan, croutons, Caesar dressing', price: 89, category: 'Starters', preparationTime: 8 },
    { name: 'Soup of the Day', description: 'Chef\'s daily selection with fresh bread', price: 65, category: 'Starters', preparationTime: 5 },
    { name: 'Garlic Bread', description: 'Toasted ciabatta with herb butter and garlic', price: 45, category: 'Starters', preparationTime: 5 },
    { name: 'Bruschetta', description: 'Tomato, basil, olive oil on grilled sourdough', price: 72, category: 'Starters', preparationTime: 6 },
    { name: 'Grilled Chicken', description: 'Half chicken, lemon herb, seasonal vegetables, fries', price: 165, category: 'Mains', preparationTime: 20 },
    { name: 'Beef Burger', description: '200g patty, lettuce, tomato, pickles, house sauce, fries', price: 145, category: 'Mains', preparationTime: 15 },
    { name: 'Fish & Chips', description: 'Beer-battered hake, chunky chips, tartar sauce', price: 155, category: 'Mains', preparationTime: 18 },
    { name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil, olive oil', price: 125, category: 'Mains', preparationTime: 12, isShareable: true, maxClaimants: 4 },
    { name: 'Vegetable Pasta', description: 'Seasonal vegetables, garlic, olive oil, parmesan', price: 115, category: 'Mains', preparationTime: 14 },
    { name: 'Chocolate Brownie', description: 'Warm brownie, vanilla ice cream, chocolate sauce', price: 68, category: 'Desserts', preparationTime: 5 },
    { name: 'Ice Cream', description: 'Two scoops: vanilla, chocolate, or strawberry', price: 45, category: 'Desserts', preparationTime: 3 },
    { name: 'New York Cheesecake', description: 'Cream cheese, biscuit base, berry compote', price: 75, category: 'Desserts', preparationTime: 5 },
    { name: 'House Wine', description: 'Glass of red or white', price: 55, category: 'Drinks', preparationTime: 2 },
    { name: 'Craft Beer', description: 'Draft lager or ale', price: 58, category: 'Drinks', preparationTime: 2 },
    { name: 'Fresh Juice', description: 'Orange, apple, or tropical', price: 42, category: 'Drinks', preparationTime: 3 },
    { name: 'Espresso', description: 'Single or double', price: 35, category: 'Drinks', preparationTime: 2 },
    { name: 'Still Water', description: '500ml bottled', price: 25, category: 'Drinks', preparationTime: 1 },
  ];

  for (const company of allCompanies) {
    const companyId = company.id;
    const slug = 'slug' in company ? (company as { slug?: string }).slug : 'default';

    for (const { name, role } of STAFF_ROLES) {
      const email = `staff-${name}-${companyId}@seed.local`;
      await prisma.user.upsert({
        where: { email },
        update: { pin: hashedPin, role, isActive: true },
        create: {
          companyId,
          email,
          name,
          role,
          pin: hashedPin,
          password: await bcrypt.hash('change-me', 10),
          phone: '',
          isActive: true,
        },
      });
    }
    const companyName = company.name ?? companyId;
    console.log(`Created staff users (PIN ${STAFF_PIN}) for ${companyName}`);

    for (let num = 1; num <= 8; num++) {
      const qrCode = `SEED-${companyId}-T${num}`;
      await prisma.table.upsert({
        where: { qrCode },
        update: {},
        create: {
          companyId,
          number: num,
          qrCode,
          status: 'AVAILABLE',
        },
      });
    }
    console.log(`Created 8 tables for ${companyName}`);
  }

  // Seed sample menu items per company (only when company has no items yet — idempotent)
  for (const company of allCompanies) {
    const existingCount = await prisma.menuItem.count({
      where: { companyId: company.id },
    });
    if (existingCount > 0) {
      const companyName = company.name ?? company.id;
      console.log(`Skipping menu seed for ${companyName} (already has ${existingCount} items)`);
      continue;
    }
    for (const item of SAMPLE_MENU_ITEMS) {
      await prisma.menuItem.create({
        data: {
          companyId: company.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          isAvailable: true,
          preparationTime: item.preparationTime ?? null,
          isShareable: item.isShareable ?? false,
          maxClaimants: item.maxClaimants ?? null,
        },
      });
    }
    const companyName = company.name ?? company.id;
    console.log(`Created ${SAMPLE_MENU_ITEMS.length} menu items for ${companyName}`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
