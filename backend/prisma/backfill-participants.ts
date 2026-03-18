/**
 * Backfill Participant records for legacy CustomerSessions.
 * Ensures every CustomerSession has at least one Participant (isCreator: true)
 * and sets participantId on their CustomerOrders so GET session/orders don't return empty participant arrays.
 *
 * Run once before or after deploying the Join/Scan API:
 *   cd backend && npx ts-node prisma/backfill-participants.ts
 * Or: npm run db:backfill-participants
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    console.log(
      `  Session ${session.id.slice(0, 8)}... → Participant "${participant.displayName}" (${participant.id.slice(0, 8)}...), ${session.orders.length} order(s) linked.`
    );
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
