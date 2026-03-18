-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'KITCHEN_STAFF';
ALTER TYPE "UserRole" ADD VALUE 'BAR_STAFF';
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'SYSTEM_ADMIN';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- DropIndex
DROP INDEX "customer_sessions_companyId_idx";

-- DropIndex
DROP INDEX "customer_sessions_isActive_idx";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "locationRadius" INTEGER DEFAULT 100,
ADD COLUMN     "longitude" DECIMAL(11,8);

-- AlterTable
ALTER TABLE "customer_sessions" ADD COLUMN     "billPaidAt" TIMESTAMP(3),
ADD COLUMN     "billPaidBy" TEXT,
ADD COLUMN     "expectedLocation" JSONB,
ADD COLUMN     "expiryReason" TEXT,
ADD COLUMN     "scanLocation" JSONB,
ADD COLUMN     "sessionEnd" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "password" TEXT,
ADD COLUMN     "pin" TEXT,
ALTER COLUMN "companyId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "customer_sessions_companyId_isActive_idx" ON "customer_sessions"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "customer_sessions_phoneNumber_isActive_idx" ON "customer_sessions"("phoneNumber", "isActive");

-- CreateIndex
CREATE INDEX "users_companyId_role_idx" ON "users"("companyId", "role");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
