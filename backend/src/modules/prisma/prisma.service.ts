import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService extends the generated PrismaClient so that all Prisma models
 * (user, table, menuItem, order, customerOrder, customerOrderItem, itemClaim,
 * participant, customerSession, payment, etc.) and methods (findUnique,
 * findMany, create, update, delete, $transaction) are available.
 *
 * Ensures atomic Join/Leave claim logic via $transaction and resolves
 * ItemClaim, CustomerOrderItem.findUnique, and participant access.
 *
 * Requires: DATABASE_URL in .env and migrations applied (e.g. npx prisma migrate dev).
 *
 * If migrating from the previous in-memory mock: other modules that used
 * mock-only APIs (e.g. prisma.menu) must be updated to use the real model
 * names (e.g. prisma.menuItem) and to include relations (e.g. include: { items: true })
 * where the code expects nested data. For testing with a mock, implement a
 * separate MockPrismaService that provides $transaction(callback) to preserve
 * atomicity of Join/Leave.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
