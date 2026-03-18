-- CreateEnum
CREATE TYPE "SelectionType" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN "isBundle" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "selectionType" "SelectionType" NOT NULL DEFAULT 'SINGLE',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceAdjustment" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_modifier_groups" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "overrideRequired" BOOLEAN,
    "overrideMin" INTEGER,
    "overrideMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_item_modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_slots" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_slot_options" (
    "id" TEXT NOT NULL,
    "bundleSlotId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_slot_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" TEXT NOT NULL,
    "customerOrderItemId" TEXT NOT NULL,
    "modifierOptionId" TEXT NOT NULL,
    "modifierGroupName" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "priceAdjustment" DECIMAL(10,2) NOT NULL,
    "bundleChoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_bundle_choices" (
    "id" TEXT NOT NULL,
    "customerOrderItemId" TEXT NOT NULL,
    "bundleSlotId" TEXT NOT NULL,
    "chosenMenuItemId" TEXT NOT NULL,
    "chosenItemName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_bundle_choices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "modifier_groups_companyId_idx" ON "modifier_groups"("companyId");

-- CreateIndex
CREATE INDEX "modifier_options_modifierGroupId_idx" ON "modifier_options"("modifierGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_modifier_groups_menuItemId_modifierGroupId_key" ON "menu_item_modifier_groups"("menuItemId", "modifierGroupId");

-- CreateIndex
CREATE INDEX "menu_item_modifier_groups_menuItemId_idx" ON "menu_item_modifier_groups"("menuItemId");

-- CreateIndex
CREATE INDEX "menu_item_modifier_groups_modifierGroupId_idx" ON "menu_item_modifier_groups"("modifierGroupId");

-- CreateIndex
CREATE INDEX "bundle_slots_menuItemId_idx" ON "bundle_slots"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_slot_options_bundleSlotId_menuItemId_key" ON "bundle_slot_options"("bundleSlotId", "menuItemId");

-- CreateIndex
CREATE INDEX "bundle_slot_options_bundleSlotId_idx" ON "bundle_slot_options"("bundleSlotId");

-- CreateIndex
CREATE INDEX "bundle_slot_options_menuItemId_idx" ON "bundle_slot_options"("menuItemId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_customerOrderItemId_idx" ON "order_item_modifiers"("customerOrderItemId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_modifierOptionId_idx" ON "order_item_modifiers"("modifierOptionId");

-- CreateIndex
CREATE INDEX "order_item_modifiers_bundleChoiceId_idx" ON "order_item_modifiers"("bundleChoiceId");

-- CreateIndex
CREATE INDEX "order_item_bundle_choices_customerOrderItemId_idx" ON "order_item_bundle_choices"("customerOrderItemId");

-- CreateIndex
CREATE INDEX "order_item_bundle_choices_bundleSlotId_idx" ON "order_item_bundle_choices"("bundleSlotId");

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_modifier_groups" ADD CONSTRAINT "menu_item_modifier_groups_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_slots" ADD CONSTRAINT "bundle_slots_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_slot_options" ADD CONSTRAINT "bundle_slot_options_bundleSlotId_fkey" FOREIGN KEY ("bundleSlotId") REFERENCES "bundle_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_slot_options" ADD CONSTRAINT "bundle_slot_options_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_customerOrderItemId_fkey" FOREIGN KEY ("customerOrderItemId") REFERENCES "customer_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifierOptionId_fkey" FOREIGN KEY ("modifierOptionId") REFERENCES "modifier_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_bundleChoiceId_fkey" FOREIGN KEY ("bundleChoiceId") REFERENCES "order_item_bundle_choices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_bundle_choices" ADD CONSTRAINT "order_item_bundle_choices_customerOrderItemId_fkey" FOREIGN KEY ("customerOrderItemId") REFERENCES "customer_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_bundle_choices" ADD CONSTRAINT "order_item_bundle_choices_bundleSlotId_fkey" FOREIGN KEY ("bundleSlotId") REFERENCES "bundle_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
