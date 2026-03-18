/*
  Warnings:

  - A unique constraint covering the columns `[companyId,number]` on the table `tables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `customer_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `customer_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `tables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `waiter_calls` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tables_number_key";

-- AlterTable
ALTER TABLE "customer_orders" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "customer_sessions" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "preparationTime" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "waiter_calls" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "customer_orders_companyId_idx" ON "customer_orders"("companyId");

-- CreateIndex
CREATE INDEX "customer_sessions_companyId_idx" ON "customer_sessions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tables_companyId_number_key" ON "tables"("companyId", "number");

-- CreateIndex
CREATE INDEX "waiter_calls_companyId_idx" ON "waiter_calls"("companyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
