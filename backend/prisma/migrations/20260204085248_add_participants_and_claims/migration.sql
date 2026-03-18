-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYFAST', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "InventoryAlertType" AS ENUM ('LOW_STOCK', 'OVERSTOCK', 'EXPIRING', 'CUSTOM');

-- AlterTable
ALTER TABLE "customer_orders" ADD COLUMN     "participantId" TEXT;

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "customerSessionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_claims" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT,
    "customerOrderId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "billReference" TEXT,
    "metadata" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_splits" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "customerSessionId" TEXT,
    "participantId" TEXT,
    "payerName" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "email" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "costPrice" DECIMAL(10,2),
    "sellingPrice" DECIMAL(10,2),
    "currentStock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "reorderQuantity" DECIMAL(12,3),
    "minStockLevel" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "maxStockLevel" DECIMAL(12,3),
    "isTracked" BOOLEAN NOT NULL DEFAULT true,
    "lastStockedAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "reference" TEXT,
    "unitCost" DECIMAL(10,2),
    "performedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_alerts" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "alertType" "InventoryAlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participants_customerSessionId_idx" ON "participants"("customerSessionId");

-- CreateIndex
CREATE INDEX "item_claims_orderItemId_idx" ON "item_claims"("orderItemId");

-- CreateIndex
CREATE INDEX "item_claims_participantId_idx" ON "item_claims"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "item_claims_participantId_orderItemId_key" ON "item_claims"("participantId", "orderItemId");

-- CreateIndex
CREATE INDEX "payments_companyId_idx" ON "payments"("companyId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_customerOrderId_idx" ON "payments"("customerOrderId");

-- CreateIndex
CREATE INDEX "payment_splits_paymentId_idx" ON "payment_splits"("paymentId");

-- CreateIndex
CREATE INDEX "payment_splits_customerSessionId_idx" ON "payment_splits"("customerSessionId");

-- CreateIndex
CREATE INDEX "payment_splits_participantId_idx" ON "payment_splits"("participantId");

-- CreateIndex
CREATE INDEX "suppliers_companyId_idx" ON "suppliers"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_companyId_idx" ON "inventory_items"("companyId");

-- CreateIndex
CREATE INDEX "inventory_items_supplierId_idx" ON "inventory_items"("supplierId");

-- CreateIndex
CREATE INDEX "inventory_movements_companyId_idx" ON "inventory_movements"("companyId");

-- CreateIndex
CREATE INDEX "inventory_movements_inventoryItemId_idx" ON "inventory_movements"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_alerts_inventoryItemId_idx" ON "inventory_alerts"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_alerts_companyId_idx" ON "inventory_alerts"("companyId");

-- CreateIndex
CREATE INDEX "customer_orders_participantId_idx" ON "customer_orders"("participantId");

-- CreateIndex
CREATE INDEX "customer_sessions_tableId_isActive_idx" ON "customer_sessions"("tableId", "isActive");

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "customer_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_claims" ADD CONSTRAINT "item_claims_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_claims" ADD CONSTRAINT "item_claims_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "customer_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "customer_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "customer_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_splits" ADD CONSTRAINT "payment_splits_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
