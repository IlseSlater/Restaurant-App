-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'WAITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "qrCode" TEXT NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "waiterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_sessions" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "dietaryPreferences" TEXT[],
    "allergies" TEXT[],
    "sessionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL,
    "customerSessionId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "serviceFeePercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_order_items" (
    "id" TEXT NOT NULL,
    "customerOrderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specialInstructions" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiter_calls" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerSessionId" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "waiter_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_sessions" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "sessionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tableStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "table_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tables_number_key" ON "tables"("number");

-- CreateIndex
CREATE UNIQUE INDEX "tables_qrCode_key" ON "tables"("qrCode");

-- CreateIndex
CREATE INDEX "customer_sessions_tableId_idx" ON "customer_sessions"("tableId");

-- CreateIndex
CREATE INDEX "customer_sessions_isActive_idx" ON "customer_sessions"("isActive");

-- CreateIndex
CREATE INDEX "customer_orders_customerSessionId_idx" ON "customer_orders"("customerSessionId");

-- CreateIndex
CREATE INDEX "customer_orders_tableId_idx" ON "customer_orders"("tableId");

-- CreateIndex
CREATE INDEX "customer_orders_status_idx" ON "customer_orders"("status");

-- CreateIndex
CREATE INDEX "customer_order_items_customerOrderId_idx" ON "customer_order_items"("customerOrderId");

-- CreateIndex
CREATE INDEX "customer_order_items_menuItemId_idx" ON "customer_order_items"("menuItemId");

-- CreateIndex
CREATE INDEX "waiter_calls_tableId_idx" ON "waiter_calls"("tableId");

-- CreateIndex
CREATE INDEX "waiter_calls_status_idx" ON "waiter_calls"("status");

-- CreateIndex
CREATE UNIQUE INDEX "table_sessions_tableId_key" ON "table_sessions"("tableId");

-- CreateIndex
CREATE INDEX "table_sessions_tableId_idx" ON "table_sessions"("tableId");

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "customer_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "customer_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
