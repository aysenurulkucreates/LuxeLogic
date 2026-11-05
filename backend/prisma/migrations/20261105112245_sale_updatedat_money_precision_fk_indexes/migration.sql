/*
  Warnings:

  - You are about to alter the column `price` on the `Appointment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalPrice` on the `Sale` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- DropIndex
DROP INDEX "Appointment_tenantId_startTime_customerId_idx";

-- DropIndex
DROP INDEX "Sale_tenantId_idx";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Appointment_tenantId_startTime_customerId_staffId_idx" ON "Appointment"("tenantId", "startTime", "customerId", "staffId");

-- CreateIndex
CREATE INDEX "Sale_tenantId_productId_customerId_idx" ON "Sale"("tenantId", "productId", "customerId");
