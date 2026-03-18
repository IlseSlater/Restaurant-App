-- AlterTable
ALTER TABLE "participants" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE INDEX "participants_customerSessionId_phoneNumber_idx" ON "participants"("customerSessionId", "phoneNumber");

-- CreateIndex
CREATE INDEX "participants_customerSessionId_deviceId_idx" ON "participants"("customerSessionId", "deviceId");
