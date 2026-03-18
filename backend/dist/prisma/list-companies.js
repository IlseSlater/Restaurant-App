"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
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
            if (key)
                process.env[key] = val;
        }
    });
}
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const DASHBOARD_GUID = '11111111-1111-1111-1111-111111111111';
async function main() {
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, slug: true, isActive: true },
    });
    console.log('Companies in database:', companies.length);
    console.log(JSON.stringify(companies, null, 2));
    const found = companies.find((c) => c.id === DASHBOARD_GUID);
    console.log('\nDashboard GUID', DASHBOARD_GUID, 'exists?', !!found);
    if (companies.length > 0 && !found) {
        console.log('\nFirst company id (use this for staff login URL):', companies[0].id);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=list-companies.js.map