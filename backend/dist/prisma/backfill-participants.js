"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const sessions = await prisma.customerSession.findMany({
        include: {
            _count: { select: { participants: true } },
            orders: { select: { id: true } },
        },
    });
    const withoutParticipants = sessions.filter((s) => s._count.participants === 0);
    if (withoutParticipants.length === 0) {
        console.log('No sessions without participants. Nothing to backfill.');
        return;
    }
    console.log(`Found ${withoutParticipants.length} session(s) without participants. Backfilling...`);
    for (const session of withoutParticipants) {
        const participant = await prisma.participant.create({
            data: {
                customerSessionId: session.id,
                displayName: session.customerName,
                isCreator: true,
            },
        });
        if (session.orders.length > 0) {
            await prisma.customerOrder.updateMany({
                where: { customerSessionId: session.id },
                data: { participantId: participant.id },
            });
        }
        console.log(`  Session ${session.id.slice(0, 8)}... → Participant "${participant.displayName}" (${participant.id.slice(0, 8)}...), ${session.orders.length} order(s) linked.`);
    }
    console.log('Backfill complete.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill-participants.js.map