"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seeding...');
    const defaultCompany = await prisma.company.upsert({
        where: { id: '00000000-0000-0000-0000-000000000000' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000000',
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
    console.log('Default company created:', defaultCompany);
    const additionalCompanies = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Bella Vista Italian',
            slug: 'bella-vista',
            logo: null,
            primaryColor: '#d32f2f',
            secondaryColor: '#ffeb3b',
            address: '456 Italian Way, Little Italy',
            phone: '+27123456790',
            email: 'info@bellavista.com',
            website: 'https://bellavista.com',
            timezone: 'UTC',
            currency: 'ZAR',
            isActive: true,
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Sushi Zen',
            slug: 'sushi-zen',
            logo: null,
            primaryColor: '#4caf50',
            secondaryColor: '#ff9800',
            address: '789 Zen Street, Downtown',
            phone: '+27123456791',
            email: 'info@sushizen.com',
            website: 'https://sushizen.com',
            timezone: 'UTC',
            currency: 'ZAR',
            isActive: true,
        },
        {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Burger Palace',
            slug: 'burger-palace',
            logo: null,
            primaryColor: '#ff5722',
            secondaryColor: '#2196f3',
            address: '321 Burger Lane, Food Court',
            phone: '+27123456792',
            email: 'info@burgerpalace.com',
            website: 'https://burgerpalace.com',
            timezone: 'UTC',
            currency: 'ZAR',
            isActive: true,
        },
        {
            id: '44444444-4444-4444-4444-444444444444',
            name: 'Café Mocha',
            slug: 'cafe-mocha',
            logo: null,
            primaryColor: '#795548',
            secondaryColor: '#ffc107',
            address: '654 Coffee Street, Arts District',
            phone: '+27123456793',
            email: 'info@cafemocha.com',
            website: 'https://cafemocha.com',
            timezone: 'UTC',
            currency: 'ZAR',
            isActive: true,
        }
    ];
    for (const companyData of additionalCompanies) {
        await prisma.company.upsert({
            where: { id: companyData.id },
            update: {},
            create: companyData,
        });
        console.log(`Created company: ${companyData.name}`);
    }
    const updatedUsers = await prisma.user.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedUsers.count} users with default company`);
    const updatedTables = await prisma.table.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedTables.count} tables with default company`);
    const updatedMenuItems = await prisma.menuItem.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedMenuItems.count} menu items with default company`);
    const updatedOrders = await prisma.order.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedOrders.count} orders with default company`);
    const updatedCustomerSessions = await prisma.customerSession.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedCustomerSessions.count} customer sessions with default company`);
    const updatedCustomerOrders = await prisma.customerOrder.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedCustomerOrders.count} customer orders with default company`);
    const updatedWaiterCalls = await prisma.waiterCall.updateMany({
        where: { companyId: undefined },
        data: { companyId: defaultCompany.id },
    });
    console.log(`Updated ${updatedWaiterCalls.count} waiter calls with default company`);
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
//# sourceMappingURL=seed.js.map