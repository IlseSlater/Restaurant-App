-- AlterTable
ALTER TABLE "customer_order_items" ADD COLUMN     "isShareable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxClaimants" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "isShareable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxClaimants" INTEGER;
